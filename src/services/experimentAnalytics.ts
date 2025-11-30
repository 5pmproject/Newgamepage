// ================================================
// 실험 분석 서비스
// ================================================

import { supabase } from '../lib/supabase';
import type { 
  ExperimentResult, 
  SignificanceResult, 
  SRMCheckResult,
  SegmentAnalysis 
} from '../types/experiments';

/**
 * 실험 결과 조회
 */
export async function getExperimentResults(experimentId: string): Promise<ExperimentResult[]> {
  try {
    const { data, error } = await supabase.rpc('get_experiment_results', {
      exp_id: experimentId
    });
    
    if (error) {
      console.error('[Analytics] Error fetching results:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('[Analytics] Error:', error);
    return [];
  }
}

/**
 * 통계적 유의성 계산
 */
export async function calculateSignificance(
  experimentId: string
): Promise<SignificanceResult | null> {
  try {
    // 각 variant의 클릭 및 뷰 수 가져오기
    const results = await getExperimentResults(experimentId);
    
    const control = results.find(r => r.variant === 'control');
    const variant = results.find(r => r.variant === 'variant');
    
    if (!control || !variant) {
      return null;
    }
    
    const { data, error } = await supabase.rpc('calculate_significance', {
      control_clicks: control.cardClicks,
      control_views: control.totalUsers,
      variant_clicks: variant.cardClicks,
      variant_views: variant.totalUsers,
    });
    
    if (error) {
      console.error('[Analytics] Error calculating significance:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('[Analytics] Error:', error);
    return null;
  }
}

/**
 * SRM (Sample Ratio Mismatch) 검증
 */
export async function checkSRM(experimentId: string): Promise<SRMCheckResult[]> {
  try {
    const { data, error } = await supabase.rpc('check_srm', {
      exp_id: experimentId
    });
    
    if (error) {
      console.error('[Analytics] Error checking SRM:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('[Analytics] Error:', error);
    return [];
  }
}

/**
 * 세그먼트 분석
 */
export async function analyzeSegments(experimentId: string): Promise<SegmentAnalysis[]> {
  try {
    const { data, error } = await supabase.rpc('analyze_segments', {
      exp_id: experimentId
    });
    
    if (error) {
      console.error('[Analytics] Error analyzing segments:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('[Analytics] Error:', error);
    return [];
  }
}

/**
 * 실험 진행 상황 요약
 */
export interface ExperimentSummary {
  totalSample: number;
  requiredSample: number;
  progress: number;
  control: ExperimentResult;
  variant: ExperimentResult;
  significance: SignificanceResult | null;
  srmDetected: boolean;
}

export async function getExperimentSummary(
  experimentId: string,
  requiredSample: number = 2134
): Promise<ExperimentSummary | null> {
  try {
    const [results, significance, srmResults] = await Promise.all([
      getExperimentResults(experimentId),
      calculateSignificance(experimentId),
      checkSRM(experimentId),
    ]);
    
    const control = results.find(r => r.variant === 'control');
    const variant = results.find(r => r.variant === 'variant');
    
    if (!control || !variant) {
      return null;
    }
    
    const totalSample = control.totalUsers + variant.totalUsers;
    const progress = Math.min((totalSample / requiredSample) * 100, 100);
    const srmDetected = srmResults.some(r => r.srmDetected);
    
    return {
      totalSample,
      requiredSample,
      progress,
      control,
      variant,
      significance,
      srmDetected,
    };
  } catch (error) {
    console.error('[Analytics] Error getting summary:', error);
    return null;
  }
}

