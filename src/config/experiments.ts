// ================================================
// 실험 설정 - 중앙화된 관리
// ================================================

import type { ExperimentConfig } from '../types/experiments';

export const EXPERIMENTS = {
  card_hover_effect: {
    id: 'card_hover_effect' as const,
    name: '카드 호버 효과',
    description: 'Control(효과 없음) vs Variant(scale-110 + 위로 튀어나오기 + 골드 그림자) 비교',
    status: 'active' as const,
    trafficAllocation: 1.0, // 100% 트래픽
    controlWeight: 0.5,
    variantWeight: 0.5,
    targetMetric: 'card_click_rate',
    currentConversionRate: 10.0,
    expectedImprovement: 15.0, // 강화된 효과로 기대치 상향
    minimumSampleSize: 2134, // 계산된 샘플 크기
    startDate: '2025-11-30',
  },
} as const;

export type ExperimentKey = keyof typeof EXPERIMENTS;

// 실험 설정 가져오기
export function getExperimentConfig(id: ExperimentKey): typeof EXPERIMENTS[typeof id] {
  return EXPERIMENTS[id];
}

// 모든 활성 실험 가져오기
export function getActiveExperiments() {
  return Object.values(EXPERIMENTS).filter(exp => exp.status === 'active');
}

