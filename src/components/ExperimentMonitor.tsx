// ================================================
// 실험 모니터링 대시보드
// 실시간으로 실험 결과를 모니터링하는 개발/테스트용 컴포넌트
// ================================================

import { useState, useEffect } from 'react';
import { getExperimentSummary, type ExperimentSummary } from '../services/experimentAnalytics';
import { checkGuardrails } from '../services/guardrailService';
import { EXPERIMENT_2_SAMPLE_SIZE } from '../utils/sampleSizeCalculator';
import { X, RefreshCw, AlertTriangle, TrendingUp, Users } from 'lucide-react';

export function ExperimentMonitor() {
  const [summary, setSummary] = useState<ExperimentSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [violations, setViolations] = useState<string[]>([]);
  
  const requiredSample = EXPERIMENT_2_SAMPLE_SIZE * 2;
  
  async function loadMetrics() {
    setIsLoading(true);
    try {
      const [summaryData, guardrails] = await Promise.all([
        getExperimentSummary('card_hover_effect', requiredSample),
        checkGuardrails('card_hover_effect'),
      ]);
      
      setSummary(summaryData);
      setViolations(guardrails.violations);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('[Monitor] Failed to load metrics:', error);
    } finally {
      setIsLoading(false);
    }
  }
  
  useEffect(() => {
    if (isOpen) {
      loadMetrics();
      
      // 5분마다 자동 새로고침
      const interval = setInterval(loadMetrics, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);
  
  // Ctrl+Shift+E로 패널 토글
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm hover:bg-purple-700 transition-colors flex items-center gap-2"
        title="Open A/B Test Monitor (Ctrl+Shift+E)"
      >
        <TrendingUp className="w-4 h-4" />
        A/B Test
      </button>
    );
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-[#1A1A1A] border border-[#D4AF37]/30 rounded-lg p-6 shadow-2xl z-50 w-[500px] max-h-[80vh] overflow-y-auto">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[#D4AF37] font-bold flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          실험 모니터링
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={loadMetrics}
            disabled={isLoading}
            className="text-gray-400 hover:text-white transition-colors p-1 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white transition-colors p-1"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 mb-4">
        마지막 업데이트: {lastUpdated.toLocaleTimeString()} | Ctrl+Shift+E로 토글
      </div>
      
      {isLoading && !summary ? (
        <div className="text-center text-gray-400 py-8">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
          데이터 로딩 중...
        </div>
      ) : summary ? (
        <>
          {/* 샘플 크기 진행률 */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400 flex items-center gap-1">
                <Users className="w-4 h-4" />
                샘플 크기
              </span>
              <span className="text-white font-mono">
                {summary.totalSample.toLocaleString()} / {requiredSample.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-[#2A2A2A] rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#D4AF37] to-[#8B0000] h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(summary.progress, 100)}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1 text-right">
              {Math.round(summary.progress)}% 완료
            </div>
          </div>
          
          {/* 메트릭 카드 */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <MetricCard
              title="Control"
              users={summary.control.totalUsers}
              clickRate={summary.control.clickRate}
              clicks={summary.control.cardClicks}
            />
            <MetricCard
              title="Variant"
              users={summary.variant.totalUsers}
              clickRate={summary.variant.clickRate}
              clicks={summary.variant.cardClicks}
              highlight={summary.significance?.lift ? summary.significance.lift > 0 : false}
            />
          </div>
          
          {/* 통계적 유의성 */}
          {summary.significance && (
            <div className="bg-[#2A2A2A] p-4 rounded-lg mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-sm">Lift (개선율)</span>
                <span className={`text-lg font-bold ${
                  summary.significance.lift > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {summary.significance.lift > 0 ? '+' : ''}{summary.significance.lift.toFixed(2)}%
                </span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">신뢰도</span>
                <span className="text-white">{summary.significance.confidence}%</span>
              </div>
              
              {summary.significance.significant && (
                <div className="text-xs text-green-400 mt-2 flex items-center gap-1">
                  <span>✓</span>
                  통계적으로 유의미함 (p &lt; 0.05)
                </div>
              )}
              
              {!summary.significance.significant && summary.totalSample < requiredSample && (
                <div className="text-xs text-yellow-400 mt-2">
                  더 많은 샘플이 필요합니다 ({requiredSample - summary.totalSample}명 더)
                </div>
              )}
            </div>
          )}
          
          {/* SRM 경고 */}
          {summary.srmDetected && (
            <div className="bg-orange-900/20 border border-orange-500/50 rounded-lg p-3 mb-4">
              <div className="text-orange-400 font-semibold text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Sample Ratio Mismatch 감지
              </div>
              <div className="text-xs text-orange-300 mt-1">
                Control과 Variant의 배정 비율이 예상과 다릅니다.
              </div>
            </div>
          )}
          
          {/* Guardrail 위반 경고 */}
          {violations.length > 0 && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3">
              <div className="text-red-400 font-semibold text-sm flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4" />
                Guardrail 위반
              </div>
              {violations.map((v, i) => (
                <div key={i} className="text-xs text-red-300">{v}</div>
              ))}
            </div>
          )}
          
          {/* 상세 메트릭 */}
          <details className="mt-4">
            <summary className="text-sm text-gray-400 cursor-pointer hover:text-white">
              상세 메트릭 보기
            </summary>
            <div className="mt-2 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Control 섹션 뷰:</span>
                <span className="text-white">{summary.control.sectionViews}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Variant 섹션 뷰:</span>
                <span className="text-white">{summary.variant.sectionViews}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Variant 호버:</span>
                <span className="text-white">{summary.variant.cardHovers}</span>
              </div>
            </div>
          </details>
        </>
      ) : (
        <div className="text-center text-gray-400 py-8">
          데이터가 없습니다
        </div>
      )}
    </div>
  );
}

function MetricCard({ 
  title, 
  users, 
  clickRate,
  clicks,
  highlight = false 
}: {
  title: string;
  users: number;
  clickRate: number;
  clicks: number;
  highlight?: boolean;
}) {
  return (
    <div className={`bg-[#2A2A2A] p-3 rounded-lg ${highlight ? 'ring-2 ring-green-400/50' : ''}`}>
      <div className="text-xs text-gray-400 mb-1">{title}</div>
      <div className="text-2xl font-bold text-white mb-1">
        {clickRate.toFixed(2)}%
      </div>
      <div className="text-xs text-gray-500">
        {clicks} clicks / {users.toLocaleString()} users
      </div>
    </div>
  );
}

