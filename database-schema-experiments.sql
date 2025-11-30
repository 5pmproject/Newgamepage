-- ================================================
-- A/B 테스트 시스템 스키마
-- Supabase PostgreSQL 14+
-- ================================================

-- ================================================
-- 1. 실험 설정 테이블 (Experiment Configs)
-- ================================================
CREATE TABLE IF NOT EXISTS public.experiment_configs (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  traffic_allocation DECIMAL(3,2) DEFAULT 1.00 CHECK (traffic_allocation >= 0 AND traffic_allocation <= 1),
  control_weight DECIMAL(3,2) DEFAULT 0.50 CHECK (control_weight >= 0 AND control_weight <= 1),
  variant_weight DECIMAL(3,2) DEFAULT 0.50 CHECK (variant_weight >= 0 AND variant_weight <= 1),
  target_metric VARCHAR(50),
  current_conversion_rate DECIMAL(5,2),
  expected_improvement DECIMAL(5,2),
  minimum_sample_size INT,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_exp_configs_status ON public.experiment_configs(status);

-- ================================================
-- 2. 실험 배정 테이블 (Experiment Assignments)
-- ================================================
CREATE TABLE IF NOT EXISTS public.experiment_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  session_id VARCHAR(100),
  experiment_id VARCHAR(50) REFERENCES public.experiment_configs(id) ON DELETE CASCADE,
  variant VARCHAR(20) NOT NULL CHECK (variant IN ('control', 'variant')),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT unique_user_experiment UNIQUE(user_id, experiment_id),
  CONSTRAINT unique_session_experiment UNIQUE(session_id, experiment_id),
  CONSTRAINT at_least_one_id CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_exp_assignments_user ON public.experiment_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_exp_assignments_session ON public.experiment_assignments(session_id);
CREATE INDEX IF NOT EXISTS idx_exp_assignments_experiment ON public.experiment_assignments(experiment_id);
CREATE INDEX IF NOT EXISTS idx_exp_assignments_variant ON public.experiment_assignments(variant);

-- ================================================
-- 3. 실험 이벤트 테이블 (Experiment Events)
-- ================================================
CREATE TABLE IF NOT EXISTS public.experiment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  session_id VARCHAR(100),
  experiment_id VARCHAR(50) REFERENCES public.experiment_configs(id) ON DELETE CASCADE,
  variant VARCHAR(20) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT at_least_one_id_events CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_exp_events_experiment ON public.experiment_events(experiment_id, event_type);
CREATE INDEX IF NOT EXISTS idx_exp_events_created ON public.experiment_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exp_events_user ON public.experiment_events(user_id);
CREATE INDEX IF NOT EXISTS idx_exp_events_session ON public.experiment_events(session_id);
CREATE INDEX IF NOT EXISTS idx_exp_events_variant ON public.experiment_events(variant);
CREATE INDEX IF NOT EXISTS idx_exp_events_session_type ON public.experiment_events(session_id, event_type);

-- ================================================
-- 4. RLS (Row Level Security) 정책
-- ================================================
ALTER TABLE public.experiment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_configs ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 실험 설정을 읽을 수 있음
CREATE POLICY "Everyone can view experiment configs"
  ON public.experiment_configs FOR SELECT
  USING (status = 'active');

-- 모든 사용자가 자신의 배정을 삽입할 수 있음
CREATE POLICY "Users can insert own assignments"
  ON public.experiment_assignments FOR INSERT
  WITH CHECK (true);

-- 모든 사용자가 자신의 배정을 조회할 수 있음
CREATE POLICY "Users can view own assignments"
  ON public.experiment_assignments FOR SELECT
  USING (true);

-- 모든 사용자가 이벤트를 삽입할 수 있음
CREATE POLICY "Users can insert events"
  ON public.experiment_events FOR INSERT
  WITH CHECK (true);

-- ================================================
-- 5. SQL 함수: 실험 결과 조회
-- ================================================
CREATE OR REPLACE FUNCTION get_experiment_results(exp_id VARCHAR)
RETURNS TABLE (
  variant VARCHAR,
  total_users BIGINT,
  section_views BIGINT,
  card_hovers BIGINT,
  card_clicks BIGINT,
  click_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.variant,
    COUNT(DISTINCT e.session_id) as total_users,
    COUNT(*) FILTER (WHERE e.event_type = 'section_view') as section_views,
    COUNT(*) FILTER (WHERE e.event_type = 'card_hover') as card_hovers,
    COUNT(*) FILTER (WHERE e.event_type = 'card_click') as card_clicks,
    ROUND(
      COUNT(*) FILTER (WHERE e.event_type = 'card_click')::NUMERIC / 
      NULLIF(COUNT(DISTINCT e.session_id), 0) * 100,
      2
    ) as click_rate
  FROM experiment_events e
  WHERE e.experiment_id = exp_id
  GROUP BY e.variant
  ORDER BY e.variant;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 6. SQL 함수: 통계적 유의성 계산 (Z-test)
-- ================================================
CREATE OR REPLACE FUNCTION calculate_significance(
  control_clicks INT, 
  control_views INT,
  variant_clicks INT, 
  variant_views INT
) RETURNS JSONB AS $$
DECLARE
  p1 NUMERIC;
  p2 NUMERIC;
  pooled_p NUMERIC;
  se NUMERIC;
  z_score NUMERIC;
  p_value NUMERIC;
  lift NUMERIC;
  confidence NUMERIC;
BEGIN
  -- 0으로 나누기 방지
  IF control_views = 0 OR variant_views = 0 THEN
    RETURN jsonb_build_object(
      'error', 'Insufficient data',
      'control_rate', 0,
      'variant_rate', 0,
      'lift', 0,
      'significant', false
    );
  END IF;

  -- 전환율 계산
  p1 := control_clicks::NUMERIC / control_views;
  p2 := variant_clicks::NUMERIC / variant_views;
  
  -- Pooled proportion
  pooled_p := (control_clicks + variant_clicks)::NUMERIC / 
              (control_views + variant_views);
  
  -- Standard Error
  se := SQRT(pooled_p * (1 - pooled_p) * 
        (1.0/control_views + 1.0/variant_views));
  
  -- Z-score
  z_score := CASE 
    WHEN se = 0 THEN 0
    ELSE (p2 - p1) / se
  END;
  
  -- P-value 근사 (양측검정)
  p_value := CASE
    WHEN ABS(z_score) > 2.576 THEN 0.01   -- 99% confidence
    WHEN ABS(z_score) > 1.96 THEN 0.05    -- 95% confidence
    WHEN ABS(z_score) > 1.645 THEN 0.10   -- 90% confidence
    ELSE 0.20
  END;
  
  -- Lift (개선율)
  lift := CASE 
    WHEN p1 = 0 THEN 0
    ELSE ROUND((p2 - p1) / p1 * 100, 2)
  END;
  
  -- Confidence level
  confidence := ROUND((1 - p_value) * 100, 1);
  
  RETURN jsonb_build_object(
    'control_rate', ROUND(p1 * 100, 2),
    'variant_rate', ROUND(p2 * 100, 2),
    'lift', lift,
    'z_score', ROUND(z_score, 3),
    'p_value', p_value,
    'confidence', confidence,
    'significant', p_value < 0.05,
    'sample_size_control', control_views,
    'sample_size_variant', variant_views
  );
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 7. SQL 함수: SRM (Sample Ratio Mismatch) 검증
-- ================================================
CREATE OR REPLACE FUNCTION check_srm(exp_id VARCHAR)
RETURNS TABLE (
  variant VARCHAR,
  actual_count BIGINT,
  expected_ratio NUMERIC,
  actual_ratio NUMERIC,
  srm_detected BOOLEAN
) AS $$
DECLARE
  total_count BIGINT;
  control_count BIGINT;
  variant_count BIGINT;
  expected_control NUMERIC := 0.50;
  expected_variant NUMERIC := 0.50;
  chi_square NUMERIC;
BEGIN
  -- 각 variant별 사용자 수 계산
  SELECT COUNT(DISTINCT session_id) INTO total_count
  FROM experiment_assignments
  WHERE experiment_id = exp_id;
  
  SELECT COUNT(DISTINCT session_id) INTO control_count
  FROM experiment_assignments
  WHERE experiment_id = exp_id AND variant = 'control';
  
  SELECT COUNT(DISTINCT session_id) INTO variant_count
  FROM experiment_assignments
  WHERE experiment_id = exp_id AND variant = 'variant';
  
  -- Chi-square 검정 (간단한 버전)
  chi_square := POWER(control_count - total_count * expected_control, 2) / (total_count * expected_control) +
                POWER(variant_count - total_count * expected_variant, 2) / (total_count * expected_variant);
  
  RETURN QUERY
  SELECT 
    'control'::VARCHAR,
    control_count,
    expected_control,
    ROUND(control_count::NUMERIC / NULLIF(total_count, 0), 3),
    chi_square > 3.841  -- p < 0.05 threshold
  UNION ALL
  SELECT 
    'variant'::VARCHAR,
    variant_count,
    expected_variant,
    ROUND(variant_count::NUMERIC / NULLIF(total_count, 0), 3),
    chi_square > 3.841;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 8. SQL 함수: 사용자 세그먼트 분석
-- ================================================
CREATE OR REPLACE FUNCTION analyze_segments(exp_id VARCHAR)
RETURNS TABLE (
  segment VARCHAR,
  variant VARCHAR,
  users BIGINT,
  conversion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH user_segments AS (
    SELECT 
      session_id,
      COALESCE(
        event_data->>'language',
        'unknown'
      ) as segment
    FROM experiment_events
    WHERE experiment_id = exp_id
      AND event_type = 'section_view'
      AND event_data->>'language' IS NOT NULL
  )
  SELECT 
    us.segment,
    e.variant,
    COUNT(DISTINCT e.session_id) as users,
    ROUND(
      COUNT(CASE WHEN e.event_type = 'card_click' THEN 1 END)::NUMERIC /
      NULLIF(COUNT(DISTINCT e.session_id), 0) * 100, 2
    ) as conversion_rate
  FROM experiment_events e
  JOIN user_segments us ON e.session_id = us.session_id
  WHERE e.experiment_id = exp_id
  GROUP BY us.segment, e.variant
  ORDER BY us.segment, e.variant;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 9. 실험 2번 초기 데이터 삽입
-- ================================================
INSERT INTO public.experiment_configs (
  id, 
  name, 
  description, 
  target_metric, 
  current_conversion_rate, 
  expected_improvement,
  minimum_sample_size,
  status
)
VALUES (
  'card_hover_effect',
  '카드 호버 효과 추가',
  'CharactersSection 카드에 hover scale + shadow 효과 추가하여 클릭률 개선',
  'card_click_rate',
  10.00,
  6.00,
  2134,  -- 각 그룹당 1067명 * 2
  'active'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  target_metric = EXCLUDED.target_metric,
  current_conversion_rate = EXCLUDED.current_conversion_rate,
  expected_improvement = EXCLUDED.expected_improvement,
  minimum_sample_size = EXCLUDED.minimum_sample_size,
  updated_at = now();

-- ================================================
-- 완료!
-- ================================================
-- 이제 Supabase Dashboard의 SQL Editor에서 이 파일을 실행하세요.
-- 또는 Supabase CLI를 사용하여 마이그레이션하세요:
-- supabase db push

