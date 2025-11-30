// ================================================
// A/B 테스트 시스템 타입 정의
// ================================================

export type ExperimentId = 'card_hover_effect';
export type Variant = 'control' | 'variant';
export type EventType = 'section_view' | 'card_hover' | 'card_click';

// 실험 상태
export type ExperimentStatus = 'draft' | 'active' | 'paused' | 'completed';

// ================================================
// 실험 설정
// ================================================
export interface ExperimentConfig {
  id: ExperimentId;
  name: string;
  description: string;
  status: ExperimentStatus;
  trafficAllocation: number; // 0.0 ~ 1.0
  controlWeight: number; // 0.0 ~ 1.0
  variantWeight: number; // 0.0 ~ 1.0
  targetMetric: string;
  currentConversionRate: number; // %
  expectedImprovement: number; // %
  minimumSampleSize: number;
  startDate: string;
  endDate?: string;
}

// ================================================
// 실험 배정
// ================================================
export interface ExperimentAssignment {
  id: string;
  experimentId: ExperimentId;
  variant: Variant;
  sessionId: string;
  userId?: string;
  assignedAt: string;
}

// ================================================
// 실험 이벤트
// ================================================
export interface ExperimentEvent {
  id?: string;
  experimentId: ExperimentId;
  variant: Variant;
  eventType: EventType;
  eventData?: Record<string, any>;
  sessionId: string;
  userId?: string;
  createdAt?: string;
}

// ================================================
// 실험 결과
// ================================================
export interface ExperimentResult {
  variant: Variant;
  totalUsers: number;
  sectionViews: number;
  cardHovers: number;
  cardClicks: number;
  clickRate: number;
}

// ================================================
// 통계 분석 결과
// ================================================
export interface SignificanceResult {
  controlRate: number;
  variantRate: number;
  lift: number;
  zScore: number;
  pValue: number;
  confidence: number;
  significant: boolean;
  sampleSizeControl: number;
  sampleSizeVariant: number;
  error?: string;
}

// ================================================
// SRM (Sample Ratio Mismatch) 결과
// ================================================
export interface SRMCheckResult {
  variant: Variant;
  actualCount: number;
  expectedRatio: number;
  actualRatio: number;
  srmDetected: boolean;
}

// ================================================
// 세그먼트 분석 결과
// ================================================
export interface SegmentAnalysis {
  segment: string;
  variant: Variant;
  users: number;
  conversionRate: number;
}

// ================================================
// Guardrail Metric
// ================================================
export interface GuardrailMetric {
  metric: string;
  threshold: number;
  direction: 'increase' | 'decrease';
  description: string;
}

// ================================================
// 실험 건강 상태
// ================================================
export interface ExperimentHealth {
  srmDetected: boolean;
  conversionRateAnomaly: boolean;
  errorRate: number;
  violations: string[];
}

