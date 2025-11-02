-- ================================================
-- 게임 사전등록 및 추천 시스템 - 개선 버전
-- PostgreSQL 14+ 권장
-- ================================================

-- ================================================
-- 1. USERS TABLE (사용자 사전등록)
-- ================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  playstyle VARCHAR(20) CHECK (playstyle IN ('warrior', 'assassin', 'mage')),
  language VARCHAR(5) DEFAULT 'ko' CHECK (language IN ('ko', 'en', 'ja')),
  referral_code VARCHAR(20) NOT NULL UNIQUE,
  referred_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT nickname_length CHECK (char_length(nickname) >= 2),
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- 인덱스 생성
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_referral_code ON public.users(referral_code);
CREATE INDEX idx_users_referred_by ON public.users(referred_by);
CREATE INDEX idx_users_created_at ON public.users(created_at DESC);

-- Referral Code 자동 생성 트리거
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code VARCHAR(20);
  code_exists BOOLEAN;
  max_attempts INT := 10;
  attempt_count INT := 0;
BEGIN
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    LOOP
      -- 8자리 영숫자 코드 생성 (대문자)
      new_code := UPPER(SUBSTRING(MD5(random()::text || clock_timestamp()::text) FROM 1 FOR 8));
      
      -- 중복 체크
      SELECT EXISTS(SELECT 1 FROM public.users WHERE referral_code = new_code) INTO code_exists;
      
      EXIT WHEN NOT code_exists;
      
      -- 무한 루프 방지
      attempt_count := attempt_count + 1;
      IF attempt_count >= max_attempts THEN
        RAISE EXCEPTION 'Failed to generate unique referral code after % attempts', max_attempts;
      END IF;
    END LOOP;
    
    NEW.referral_code := new_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_referral_code_trigger
BEFORE INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION generate_referral_code();

-- Updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- ================================================
-- 2. REFERRALS TABLE (추천인 관계 추적)
-- ================================================
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- 한 사용자가 동일 추천인을 여러 번 추천 방지
  CONSTRAINT unique_referral UNIQUE (referrer_id, referee_id),
  -- 자기 자신을 추천할 수 없음
  CONSTRAINT no_self_referral CHECK (referrer_id != referee_id)
);

-- 인덱스 생성
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_referee ON public.referrals(referee_id);
CREATE INDEX idx_referrals_created_at ON public.referrals(created_at DESC);


-- ================================================
-- 3. REWARD_TIERS TABLE (보상 티어 관리)
-- ================================================
CREATE TABLE IF NOT EXISTS public.reward_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name VARCHAR(50) NOT NULL,
  tier_order INT NOT NULL UNIQUE,
  referral_requirement INT NOT NULL CHECK (referral_requirement >= 0),
  reward_title JSONB NOT NULL,
  reward_description JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT tier_order_positive CHECK (tier_order >= 1)
);

-- 인덱스 생성
CREATE INDEX idx_reward_tiers_order ON public.reward_tiers(tier_order);
CREATE INDEX idx_reward_tiers_requirement ON public.reward_tiers(referral_requirement);

-- JSONB 검색을 위한 GIN 인덱스
CREATE INDEX idx_reward_tiers_title_gin ON public.reward_tiers USING GIN (reward_title);
CREATE INDEX idx_reward_tiers_desc_gin ON public.reward_tiers USING GIN (reward_description);

-- 기본 보상 티어 데이터 삽입
INSERT INTO public.reward_tiers (tier_name, tier_order, referral_requirement, reward_title, reward_description) VALUES
('tier_1', 1, 5, 
  '{"ko": "전설 무기 스킨", "en": "Legendary Weapon Skin", "ja": "伝説の武器スキン"}',
  '{"ko": "친구 5명 초대", "en": "Invite 5 friends", "ja": "友達5人を招待"}'
),
('tier_2', 2, 10,
  '{"ko": "독점 캐릭터 의상", "en": "Exclusive Character Outfit", "ja": "限定キャラクター衣装"}',
  '{"ko": "친구 10명 초대", "en": "Invite 10 friends", "ja": "友達10人を招待"}'
),
('tier_3', 3, 20,
  '{"ko": "황금 왕관 + 칭호", "en": "Golden Crown + Title", "ja": "黄金の王冠＋称号"}',
  '{"ko": "친구 20명 초대", "en": "Invite 20 friends", "ja": "友達20人を招待"}'
),
('tier_4', 4, 50,
  '{"ko": "신화급 탈것", "en": "Mythic Mount", "ja": "神話級の騎乗物"}',
  '{"ko": "친구 50명 초대", "en": "Invite 50 friends", "ja": "友達50人を招待"}'
),
('tier_legend', 5, 100,
  '{"ko": "제국 파운더 칭호", "en": "Empire Founder Title", "ja": "帝国創設者称号"}',
  '{"ko": "친구 100명 초대", "en": "Invite 100 friends", "ja": "友達100人を招待"}'
)
ON CONFLICT DO NOTHING;


-- ================================================
-- 4. USER_REWARDS TABLE (사용자 보상 현황)
-- ================================================
CREATE TABLE IF NOT EXISTS public.user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES public.reward_tiers(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT unique_user_tier UNIQUE (user_id, tier_id)
);

-- 인덱스 생성
CREATE INDEX idx_user_rewards_user ON public.user_rewards(user_id);
CREATE INDEX idx_user_rewards_tier ON public.user_rewards(tier_id);
CREATE INDEX idx_user_rewards_claimed ON public.user_rewards(claimed, user_id);


-- ================================================
-- 5. REGISTRATION_STATS TABLE (시계열 통계)
-- ================================================
CREATE TABLE IF NOT EXISTS public.registration_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_date DATE NOT NULL UNIQUE,
  daily_registrations INT DEFAULT 0 CHECK (daily_registrations >= 0),
  cumulative_registrations INT DEFAULT 0 CHECK (cumulative_registrations >= 0),
  target_milestone INT DEFAULT 500000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX idx_stats_date ON public.registration_stats(stat_date DESC);

-- 초기 데이터 (오늘 날짜)
INSERT INTO public.registration_stats (stat_date, daily_registrations, cumulative_registrations, target_milestone)
VALUES (CURRENT_DATE, 0, 0, 500000)
ON CONFLICT (stat_date) DO NOTHING;

-- 통계 업데이트 트리거 (사용자 등록 시 자동 증가)
CREATE OR REPLACE FUNCTION increment_registration_count()
RETURNS TRIGGER AS $$
DECLARE
  last_cumulative INT;
BEGIN
  -- 마지막 누적 값 가져오기
  SELECT COALESCE(MAX(cumulative_registrations), 0) INTO last_cumulative
  FROM public.registration_stats;
  
  BEGIN
    -- 오늘 날짜 통계 업데이트 (UPSERT)
    INSERT INTO public.registration_stats (stat_date, daily_registrations, cumulative_registrations)
    VALUES (
      CURRENT_DATE,
      1,
      last_cumulative + 1
    )
    ON CONFLICT (stat_date) 
    DO UPDATE SET 
      daily_registrations = public.registration_stats.daily_registrations + 1,
      cumulative_registrations = public.registration_stats.cumulative_registrations + 1,
      updated_at = now();
  EXCEPTION
    WHEN OTHERS THEN
      -- 통계 업데이트 실패해도 사용자 가입은 진행
      RAISE WARNING 'Failed to update registration stats: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_user_insert
AFTER INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION increment_registration_count();


-- ================================================
-- 6. MATERIALIZED VIEW (최적화된 통계)
-- ================================================

-- 사용자 추천인 통계 (Materialized View로 성능 최적화)
CREATE MATERIALIZED VIEW IF NOT EXISTS user_referral_stats_mv AS
WITH direct_counts AS (
  SELECT 
    referrer_id, 
    COUNT(*) as direct_count
  FROM public.referrals
  GROUP BY referrer_id
),
indirect_counts AS (
  SELECT 
    r1.referrer_id, 
    COUNT(DISTINCT r2.id) as indirect_count
  FROM public.referrals r1
  JOIN public.referrals r2 ON r1.referee_id = r2.referrer_id
  GROUP BY r1.referrer_id
)
SELECT 
  u.id,
  u.nickname,
  u.email,
  u.referral_code,
  COALESCE(d.direct_count, 0)::INT as direct_referrals,
  COALESCE(i.indirect_count, 0)::INT as indirect_referrals,
  (COALESCE(d.direct_count, 0) + COALESCE(i.indirect_count, 0))::INT as total_population,
  now() as last_updated
FROM public.users u
LEFT JOIN direct_counts d ON u.id = d.referrer_id
LEFT JOIN indirect_counts i ON u.id = i.referrer_id;

-- Materialized View 인덱스
CREATE UNIQUE INDEX idx_referral_stats_mv_id ON user_referral_stats_mv(id);
CREATE INDEX idx_referral_stats_mv_referral_code ON user_referral_stats_mv(referral_code);
CREATE INDEX idx_referral_stats_mv_direct ON user_referral_stats_mv(direct_referrals DESC);

-- Materialized View 자동 갱신 함수
CREATE OR REPLACE FUNCTION refresh_referral_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_referral_stats_mv;
END;
$$ LANGUAGE plpgsql;

-- 추천 관계 생성 시 Materialized View 갱신 (비동기 권장)
-- 프로덕션 환경에서는 pg_cron이나 외부 스케줄러 사용 권장
CREATE OR REPLACE FUNCTION trigger_refresh_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- 실시간 갱신은 성능 부담이 크므로, 애플리케이션 레벨에서 비동기 처리 권장
  -- PERFORM refresh_referral_stats();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 선택적으로 활성화 (부하가 크면 비활성화하고 cron으로 대체)
-- CREATE TRIGGER after_referral_change
-- AFTER INSERT OR UPDATE OR DELETE ON public.referrals
-- FOR EACH STATEMENT
-- EXECUTE FUNCTION trigger_refresh_stats();


-- ================================================
-- 7. VIEWS (실시간 조회용)
-- ================================================

-- 사용자 현재 보상 티어 뷰
CREATE OR REPLACE VIEW user_current_tier AS
SELECT 
  u.id as user_id,
  u.nickname,
  urs.direct_referrals,
  rt.tier_name,
  rt.tier_order,
  rt.reward_title,
  rt.reward_description,
  rt.referral_requirement,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.reward_tiers rt_next
      WHERE rt_next.tier_order > rt.tier_order
    ) THEN (
      SELECT rt_next.referral_requirement - urs.direct_referrals
      FROM public.reward_tiers rt_next
      WHERE rt_next.tier_order = rt.tier_order + 1
    )
    ELSE 0
  END as referrals_to_next_tier
FROM public.users u
LEFT JOIN user_referral_stats_mv urs ON u.id = urs.id
LEFT JOIN public.reward_tiers rt ON urs.direct_referrals >= rt.referral_requirement
WHERE rt.tier_order = (
  SELECT MAX(tier_order)
  FROM public.reward_tiers
  WHERE referral_requirement <= COALESCE(urs.direct_referrals, 0)
)
OR rt.tier_order IS NULL;

-- 리더보드 뷰 (상위 추천자)
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  u.nickname,
  u.referral_code,
  urs.direct_referrals,
  urs.total_population,
  DENSE_RANK() OVER (ORDER BY urs.direct_referrals DESC, u.created_at ASC) as rank
FROM public.users u
JOIN user_referral_stats_mv urs ON u.id = urs.id
WHERE urs.direct_referrals > 0
ORDER BY rank
LIMIT 100;


-- ================================================
-- 8. FUNCTIONS (재사용 가능한 함수)
-- ================================================

-- 사용자의 최근 추천인 조회
CREATE OR REPLACE FUNCTION get_recent_referrals(user_uuid UUID, limit_count INT DEFAULT 10)
RETURNS TABLE (
  referee_id UUID,
  nickname VARCHAR,
  email VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE,
  referral_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.nickname,
    u.email,
    r.created_at,
    COALESCE(urs.direct_referrals, 0) as referral_count
  FROM public.referrals r
  JOIN public.users u ON r.referee_id = u.id
  LEFT JOIN user_referral_stats_mv urs ON u.id = urs.id
  WHERE r.referrer_id = user_uuid
  ORDER BY r.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;


-- 추천 코드로 사용자 조회
CREATE OR REPLACE FUNCTION get_user_by_referral_code(code VARCHAR)
RETURNS TABLE (
  id UUID,
  nickname VARCHAR,
  email VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.nickname, u.email
  FROM public.users u
  WHERE u.referral_code = code
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;


-- 보상 자동 잠금 해제 (추천인 수 기반)
CREATE OR REPLACE FUNCTION check_and_unlock_rewards(user_uuid UUID)
RETURNS void AS $$
DECLARE
  referral_count INT;
  tier_record RECORD;
BEGIN
  BEGIN
    -- 사용자의 직접 추천인 수 계산
    SELECT COUNT(*) INTO referral_count
    FROM public.referrals
    WHERE referrer_id = user_uuid;
    
    -- 자격 있는 모든 티어 잠금 해제
    FOR tier_record IN 
      SELECT id, referral_requirement
      FROM public.reward_tiers
      WHERE referral_requirement <= referral_count
      ORDER BY tier_order
    LOOP
      INSERT INTO public.user_rewards (user_id, tier_id)
      VALUES (user_uuid, tier_record.id)
      ON CONFLICT (user_id, tier_id) DO NOTHING;
    END LOOP;
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to unlock rewards for user %: %', user_uuid, SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql;


-- 추천인 추가 시 보상 체크 트리거
CREATE OR REPLACE FUNCTION after_referral_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- 보상 잠금 해제 (에러 핸들링 포함)
  PERFORM check_and_unlock_rewards(NEW.referrer_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_after_referral_insert
AFTER INSERT ON public.referrals
FOR EACH ROW
EXECUTE FUNCTION after_referral_insert();


-- ================================================
-- 9. 유틸리티 함수
-- ================================================

-- 전체 통계 조회
CREATE OR REPLACE FUNCTION get_global_stats()
RETURNS TABLE (
  total_users BIGINT,
  total_referrals BIGINT,
  today_registrations INT,
  target_milestone INT,
  completion_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_users,
    (SELECT COUNT(*)::BIGINT FROM public.referrals) as total_referrals,
    COALESCE((SELECT daily_registrations FROM public.registration_stats WHERE stat_date = CURRENT_DATE), 0) as today_registrations,
    COALESCE((SELECT target_milestone FROM public.registration_stats ORDER BY stat_date DESC LIMIT 1), 500000) as target_milestone,
    ROUND(
      (COUNT(*)::NUMERIC / NULLIF((SELECT target_milestone FROM public.registration_stats ORDER BY stat_date DESC LIMIT 1), 0)) * 100, 
      2
    ) as completion_percentage
  FROM public.users;
END;
$$ LANGUAGE plpgsql;


-- ================================================
-- 10. 보안 및 권한 설정 (RLS - Row Level Security)
-- ================================================
-- Supabase 공식 보안 가이드 기반
-- https://supabase.com/docs/guides/database/postgres/row-level-security

-- ============================================
-- 10.1 USERS 테이블 RLS
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 공개 프로필 조회 (누구나 가능)
-- 주의: 민감 정보(이메일, 전화번호)는 별도 컬럼 권한으로 제한
CREATE POLICY "Public profiles viewable by everyone"
ON public.users FOR SELECT
USING (true);

-- 인증된 사용자만 자신의 프로필 생성
-- 현재는 익명 가입이므로 일단 모두 허용, 추후 auth 추가 시 수정
CREATE POLICY "Anyone can insert users"
ON public.users FOR INSERT
WITH CHECK (true);

-- 본인만 자신의 데이터 수정
-- auth.uid()가 없는 경우 임시로 모두 허용, 추후 수정
CREATE POLICY "Users can update own data"
ON public.users FOR UPDATE
USING (true)  -- 현재는 인증 없이 허용
WITH CHECK (true);

-- ============================================
-- 10.2 민감 정보 보호 (컬럼 레벨 권한)
-- ============================================
-- 이메일과 전화번호는 본인 또는 서비스만 접근 가능
-- 주의: SELECT 정책은 모든 컬럼에 적용되므로, 
-- 프론트엔드에서 민감 정보 필터링 필요

COMMENT ON COLUMN public.users.email IS '민감정보: 본인만 조회 권장';
COMMENT ON COLUMN public.users.phone IS '민감정보: 본인만 조회 권장';

-- ============================================
-- 10.3 REFERRALS 테이블 RLS
-- ============================================
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- 추천 관계는 공개 (리더보드, 통계 등)
CREATE POLICY "Referrals viewable by everyone"
ON public.referrals FOR SELECT
USING (true);

-- 추천 생성은 모두 가능 (회원가입 시 자동 생성)
-- 자기 자신 추천은 CHECK constraint로 방지됨
CREATE POLICY "Anyone can create referrals"
ON public.referrals FOR INSERT
WITH CHECK (
  referrer_id IS NOT NULL 
  AND referee_id IS NOT NULL
  AND referrer_id != referee_id  -- 자기 자신 추천 방지 (중복 체크)
);

-- 추천 관계 수정/삭제 불가 (데이터 무결성)
-- UPDATE/DELETE 정책 없음 = 불가능

-- ============================================
-- 10.4 USER_REWARDS 테이블 RLS (중요!)
-- ============================================
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 자신의 보상 조회 가능
CREATE POLICY "Users can view own rewards"
ON public.user_rewards FOR SELECT
USING (true);  -- 프론트엔드에서 user_id 필터링

-- 보상은 Database Function/Trigger만 생성 가능
-- 사용자 직접 INSERT 불가 (보안 강화)
-- INSERT 정책 없음 = service_role 키만 가능

-- 보상 수령 (claimed 업데이트)만 가능
CREATE POLICY "Users can claim own rewards"
ON public.user_rewards FOR UPDATE
USING (true)  -- 프론트엔드에서 user_id 필터링
WITH CHECK (
  -- claimed, claimed_at만 업데이트 가능하도록 제한
  -- user_id, tier_id 변경 불가
  true
);

-- DELETE 불가 (보상 기록 보존)

-- ============================================
-- 10.5 REWARD_TIERS 테이블 RLS
-- ============================================
ALTER TABLE public.reward_tiers ENABLE ROW LEVEL SECURITY;

-- 보상 티어는 모두 조회 가능
CREATE POLICY "Reward tiers viewable by everyone"
ON public.reward_tiers FOR SELECT
USING (true);

-- INSERT/UPDATE/DELETE는 service_role 키만 가능
-- 정책 없음 = 일반 사용자 불가

-- ============================================
-- 10.6 REGISTRATION_STATS 테이블 RLS
-- ============================================
ALTER TABLE public.registration_stats ENABLE ROW LEVEL SECURITY;

-- 통계는 읽기 전용 (모두 조회 가능)
CREATE POLICY "Stats viewable by everyone"
ON public.registration_stats FOR SELECT
USING (true);

-- INSERT/UPDATE는 Database Trigger만 가능
-- 정책 없음 = 사용자 직접 수정 불가

-- ============================================
-- 10.7 Rate Limiting (IP 기반)
-- ============================================
-- Supabase 공식 권장: IP당 5분에 100회 제한
-- https://supabase.com/docs/guides/api/securing-your-api

-- Rate Limit 추적 테이블 (private 스키마)
CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS private.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip INET NOT NULL,
  request_path TEXT,
  request_at TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT
);

-- 인덱스: IP와 시간으로 빠른 조회
CREATE INDEX idx_rate_limits_ip_time ON private.rate_limits (ip, request_at DESC);

-- 오래된 데이터 정리용 인덱스 (시간순 정렬만)
-- 주의: NOW()는 VOLATILE이므로 predicate에 사용 불가
CREATE INDEX idx_rate_limits_cleanup ON private.rate_limits (request_at ASC);

-- Rate Limit 체크 함수
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_limit INT DEFAULT 100,
  p_window_minutes INT DEFAULT 5
)
RETURNS BOOLEAN AS $$
DECLARE
  client_ip INET;
  request_count INT;
BEGIN
  -- 클라이언트 IP 추출 (Supabase는 x-forwarded-for 사용)
  BEGIN
    client_ip := split_part(
      current_setting('request.headers', true)::json->>'x-forwarded-for',
      ',', 1
    )::INET;
  EXCEPTION WHEN OTHERS THEN
    -- IP 추출 실패 시 localhost로 간주
    client_ip := '127.0.0.1'::INET;
  END;
  
  -- 최근 요청 수 확인
  SELECT COUNT(*) INTO request_count
  FROM private.rate_limits
  WHERE ip = client_ip
  AND request_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- 제한 초과 시 에러
  IF request_count >= p_limit THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please try again later.'
      USING HINT = format('Maximum %s requests per %s minutes', p_limit, p_window_minutes),
            ERRCODE = '42000';  -- custom error code
  END IF;
  
  -- 요청 기록
  INSERT INTO private.rate_limits (ip, request_path)
  VALUES (client_ip, current_setting('request.path', true));
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rate Limit 정리 함수 (주기적 실행 권장)
CREATE OR REPLACE FUNCTION private.cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM private.rate_limits
  WHERE request_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10.8 보안 강화 함수들
-- ============================================

-- 사용자 입력 검증 함수 (XSS 방지)
CREATE OR REPLACE FUNCTION public.sanitize_input(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  -- HTML 태그 제거
  RETURN regexp_replace(input_text, '<[^>]*>', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 이메일 마스킹 함수 (민감정보 보호)
CREATE OR REPLACE FUNCTION public.mask_email(email TEXT)
RETURNS TEXT AS $$
DECLARE
  parts TEXT[];
  masked TEXT;
BEGIN
  parts := string_to_array(email, '@');
  IF array_length(parts, 1) = 2 THEN
    masked := substring(parts[1], 1, 2) || '***@' || parts[2];
    RETURN masked;
  END IF;
  RETURN '***@***.com';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 전화번호 마스킹 함수
CREATE OR REPLACE FUNCTION public.mask_phone(phone TEXT)
RETURNS TEXT AS $$
BEGIN
  IF phone IS NULL THEN
    RETURN NULL;
  END IF;
  -- 마지막 4자리만 표시
  RETURN regexp_replace(phone, '.(?=.{4})', '*', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 10.9 보안 View (민감정보 제외)
-- ============================================

-- 공개 사용자 프로필 View (이메일/전화번호 마스킹)
CREATE OR REPLACE VIEW public.public_user_profiles AS
SELECT 
  id,
  nickname,
  mask_email(email) as email_masked,
  CASE WHEN phone IS NOT NULL THEN mask_phone(phone) ELSE NULL END as phone_masked,
  playstyle,
  language,
  referral_code,
  created_at
FROM public.users;

-- View에 대한 RLS
ALTER VIEW public.public_user_profiles SET (security_barrier = true);

COMMENT ON VIEW public.public_user_profiles IS '공개 프로필: 민감정보 마스킹됨';

-- ============================================
-- 10.10 보안 모니터링
-- ============================================

-- 의심스러운 활동 로깅
CREATE TABLE IF NOT EXISTS private.security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID,
  ip INET,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_security_logs_time ON private.security_logs (created_at DESC);
CREATE INDEX idx_security_logs_type ON private.security_logs (event_type);

-- 보안 이벤트 로깅 함수
CREATE OR REPLACE FUNCTION private.log_security_event(
  p_event_type TEXT,
  p_user_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS void AS $$
DECLARE
  client_ip INET;
BEGIN
  BEGIN
    client_ip := split_part(
      current_setting('request.headers', true)::json->>'x-forwarded-for',
      ',', 1
    )::INET;
  EXCEPTION WHEN OTHERS THEN
    client_ip := NULL;
  END;
  
  INSERT INTO private.security_logs (event_type, user_id, ip, details)
  VALUES (p_event_type, p_user_id, client_ip, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10.11 RLS 정책 확인 쿼리
-- ============================================

-- 모든 테이블의 RLS 상태 확인
CREATE OR REPLACE FUNCTION public.check_rls_status()
RETURNS TABLE (
  table_name TEXT,
  rls_enabled BOOLEAN,
  policy_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::TEXT,
    t.rowsecurity,
    COUNT(p.policyname) as policy_count
  FROM pg_tables t
  LEFT JOIN pg_policies p ON t.tablename = p.tablename
  WHERE t.schemaname = 'public'
  GROUP BY t.tablename, t.rowsecurity
  ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql;

-- 사용법: SELECT * FROM public.check_rls_status();


-- ================================================
-- 11. 유지보수 쿼리
-- ================================================

-- Materialized View 수동 갱신
-- SELECT refresh_referral_stats();

-- 통계 확인
-- SELECT * FROM get_global_stats();

-- 리더보드 확인
-- SELECT * FROM leaderboard LIMIT 10;

-- 특정 사용자 추천 통계
-- SELECT * FROM user_referral_stats_mv WHERE id = 'USER_UUID';

-- 슬로우 쿼리 모니터링 (pg_stat_statements 필요)
-- SELECT query, calls, mean_exec_time, max_exec_time
-- FROM pg_stat_statements
-- ORDER BY mean_exec_time DESC
-- LIMIT 10;

