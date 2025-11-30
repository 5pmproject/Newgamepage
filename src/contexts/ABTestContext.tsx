// ================================================
// A/B 테스트 Context - 실험 상태 관리
// ================================================

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { ExperimentId, Variant } from '../types/experiments';
import { getOrAssignExperiment, shouldExcludeFromExperiment } from '../services/experimentService';

interface ABTestContextType {
  getVariant: (experimentId: ExperimentId) => Variant | null;
  isLoading: boolean;
  isExcluded: boolean;
}

const ABTestContext = createContext<ABTestContextType | undefined>(undefined);

export function ABTestProvider({ children }: { children: ReactNode }) {
  const [variants, setVariants] = useState<Record<ExperimentId, Variant>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isExcluded] = useState(() => shouldExcludeFromExperiment());

  useEffect(() => {
    console.log('🚀 [ABTest] ABTestProvider initialized');
    console.log('📊 [ABTest] Environment:', {
      DEV: import.meta.env.DEV,
      MODE: import.meta.env.MODE,
      SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    });
    console.log('🔒 [ABTest] Is Excluded:', isExcluded);
    
    async function loadExperiments() {
      if (isExcluded) {
        console.log('⚠️ [ABTest] User excluded from experiment');
        // 제외된 사용자는 모두 control로 설정
        setVariants({ card_hover_effect: 'control' });
        setIsLoading(false);
        return;
      }

      try {
        console.log('🔄 [ABTest] Loading experiment assignment...');
        // 실험 배정 가져오기
        const variant = await getOrAssignExperiment('card_hover_effect');
        console.log('✅ [ABTest] Experiment loaded successfully');
        setVariants({ card_hover_effect: variant });
        
        console.log('🎯 [ABTest] Loaded experiment:', {
          experimentId: 'card_hover_effect',
          variant,
        });
      } catch (error) {
        console.error('❌ [ABTest] Failed to load experiments:', error);
        // 에러 시 기본값 사용
        setVariants({ card_hover_effect: 'control' });
      } finally {
        setIsLoading(false);
        console.log('🏁 [ABTest] Loading complete');
      }
    }
    
    loadExperiments();
  }, [isExcluded]);

  const getVariant = (experimentId: ExperimentId): Variant | null => {
    return variants[experimentId] || null;
  };

  return (
    <ABTestContext.Provider value={{ getVariant, isLoading, isExcluded }}>
      {children}
    </ABTestContext.Provider>
  );
}

export function useABTest() {
  const context = useContext(ABTestContext);
  if (!context) {
    throw new Error('useABTest must be used within ABTestProvider');
  }
  return context;
}

