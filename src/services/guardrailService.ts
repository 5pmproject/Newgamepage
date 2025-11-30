// ================================================
// Guardrail 서비스 - 실험 중단 조건 모니터링
// ================================================

import { supabase } from '../lib/supabase';
import type { GuardrailMetric, ExperimentHealth } from '../types/experiments';

/**
 * Guardrail Metrics 정의
 */
export const GUARDRAILS: GuardrailMetric[] = [
  {
    metric: 'bounce_rate',
    threshold: 20, // %
    direction: 'increase',
    description: '이탈률이 20% 이상 증가하면 실험 중단'
  },
  {
    metric: 'error_rate',
    threshold: 5, // %
    direction: 'increase',
    description: '에러율이 5% 이상 증가하면 실험 중단'
  },
  {
    metric: 'page_load_time',
    threshold: 100, // ms
    direction: 'increase',
    description: '페이지 로드 시간이 100ms 이상 증가하면 실험 중단'
  }
];

/**
 * Guardrail 체크
 */
export async function checkGuardrails(experimentId: string): Promise<ExperimentHealth> {
  const violations: string[] = [];
  
  try {
    // 각 Guardrail 메트릭 확인
    for (const rail of GUARDRAILS) {
      const result = await checkMetric(experimentId, rail);
      
      if (!result.passed) {
        violations.push(
          `${rail.metric}: ${result.value}% (threshold: ${rail.threshold}%)`
        );
      }
    }
    
    // 위반 발생 시 실험 일시 중지
    if (violations.length > 0) {
      await pauseExperiment(experimentId);
      console.warn(`[Guardrail] Experiment ${experimentId} paused due to violations:`, violations);
    }
    
  } catch (error) {
    console.error('[Guardrail] Check error:', error);
  }
  
  return {
    srmDetected: false, // SRM은 별도로 체크
    conversionRateAnomaly: false,
    errorRate: 0,
    violations
  };
}

/**
 * 개별 메트릭 확인
 */
async function checkMetric(
  experimentId: string,
  guardrail: GuardrailMetric
): Promise<{ passed: boolean; value: number }> {
  // TODO: 실제 메트릭 데이터 수집 로직 구현
  // 현재는 모의 데이터 반환
  
  // 예시: 이벤트 데이터에서 에러율 계산
  if (guardrail.metric === 'error_rate') {
    try {
      const { data, error } = await supabase
        .from('experiment_events')
        .select('variant, event_data')
        .eq('experiment_id', experimentId)
        .eq('event_type', 'error');
      
      if (error) {
        console.error('[Guardrail] Error fetching metric:', error);
        return { passed: true, value: 0 };
      }
      
      // 에러율 계산 로직...
      const errorCount = data?.length || 0;
      const errorRate = (errorCount / 1000) * 100; // 임시 계산
      
      const passed = guardrail.direction === 'increase' 
        ? errorRate <= guardrail.threshold 
        : errorRate >= -guardrail.threshold;
      
      return { passed, value: errorRate };
    } catch (error) {
      console.error('[Guardrail] Error:', error);
      return { passed: true, value: 0 };
    }
  }
  
  // 다른 메트릭들은 현재 통과로 처리
  return { passed: true, value: 0 };
}

/**
 * 실험 일시 중지
 */
async function pauseExperiment(experimentId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('experiment_configs')
      .update({ status: 'paused' })
      .eq('id', experimentId);
    
    if (error) {
      console.error('[Guardrail] Error pausing experiment:', error);
    }
  } catch (error) {
    console.error('[Guardrail] Error:', error);
  }
}

