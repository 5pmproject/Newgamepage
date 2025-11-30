// ================================================
// 샘플 크기 계산기
// ================================================

/**
 * A/B 테스트에 필요한 샘플 크기를 계산합니다.
 * 
 * @param baselineRate 기준 전환율 (%)
 * @param mde Minimum Detectable Effect - 최소 감지 가능 효과 (%)
 * @param power 검정력 (기본값: 0.8 = 80%)
 * @param significance 유의수준 (기본값: 0.05 = 95% confidence)
 * @returns 각 그룹당 필요한 샘플 수
 */
export function calculateSampleSize(
  baselineRate: number,
  mde: number,
  power: number = 0.8,
  significance: number = 0.05
): number {
  const p1 = baselineRate / 100;
  const p2 = p1 * (1 + mde / 100);
  const pooledP = (p1 + p2) / 2;
  
  // Z-score for two-tailed test
  const z_alpha = getZScore(1 - significance / 2); // 1.96 for 95%
  const z_beta = getZScore(power);                  // 0.84 for 80%
  
  const numerator = 2 * pooledP * (1 - pooledP) * Math.pow(z_alpha + z_beta, 2);
  const denominator = Math.pow(p2 - p1, 2);
  
  const n = Math.ceil(numerator / denominator);
  
  return n;
}

/**
 * 확률에 대한 Z-score 반환
 */
function getZScore(probability: number): number {
  const zScores: Record<number, number> = {
    0.90: 1.282,
    0.95: 1.645,
    0.975: 1.96,
    0.99: 2.326,
    0.995: 2.576,
    0.80: 0.842,
    0.85: 1.036,
  };
  
  return zScores[probability] || 1.96;
}

/**
 * 실험 기간 예상
 * 
 * @param sampleSize 그룹당 샘플 크기
 * @param dailyTraffic 일일 트래픽
 * @returns 예상 소요 일수 및 주수
 */
export function estimateDuration(
  sampleSize: number,
  dailyTraffic: number
): { days: number; weeks: number; months: number } {
  const totalSample = sampleSize * 2; // Control + Variant
  const days = Math.ceil(totalSample / dailyTraffic);
  const weeks = Math.ceil(days / 7);
  const months = Math.ceil(days / 30);
  
  return { days, weeks, months };
}

/**
 * 실험 2: 카드 호버 효과
 * 
 * 기준 전환율: 10%
 * 예상 개선율: 6%
 * 검정력: 80%
 * 유의수준: 95% confidence
 * 
 * 결과: 각 그룹당 1,067명 = 총 2,134명 필요
 * 일 트래픽 60명 기준 → 약 36일 (5주) 소요
 */
export const EXPERIMENT_2_SAMPLE_SIZE = calculateSampleSize(10, 6);

/**
 * 현재 진행률 계산
 */
export function calculateProgress(
  currentSample: number,
  requiredSample: number
): number {
  return Math.min((currentSample / requiredSample) * 100, 100);
}

/**
 * 남은 일수 예측
 */
export function estimateRemainingDays(
  currentSample: number,
  requiredSample: number,
  dailyTraffic: number
): number {
  const remaining = Math.max(0, requiredSample - currentSample);
  return Math.ceil(remaining / dailyTraffic);
}

