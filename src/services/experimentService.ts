// ================================================
// 실험 서비스 - 배정 및 이벤트 트래킹
// ================================================

import { supabase } from '../lib/supabase';
import type { ExperimentId, Variant, EventType, ExperimentEvent } from '../types/experiments';

const SESSION_KEY = 'experiment_session_id';
const EXCLUDE_KEY = 'exclude_from_experiments';

// 강제 로그 함수 (항상 출력)
const forceLog = (message: string, ...args: any[]) => {
  if (typeof window !== 'undefined') {
    window.console.log(`[Experiment] ${message}`, ...args);
  }
};

// ================================================
// 세션 ID 관리
// ================================================

/**
 * 세션 ID 생성 또는 가져오기
 */
export function getOrCreateSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_KEY);
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(SESSION_KEY, sessionId);
    forceLog('🆔 Created new session ID:', sessionId);
  } else {
    forceLog('🆔 Using existing session ID:', sessionId);
  }
  
  return sessionId;
}

// ================================================
// 실험 제외 조건
// ================================================

/**
 * 봇, 크롤러 또는 개발자를 실험에서 제외할지 확인
 */
export function shouldExcludeFromExperiment(): boolean {
  // 개발자 제외 플래그 확인
  if (localStorage.getItem(EXCLUDE_KEY) === 'true') {
    forceLog('🚫 User excluded by flag');
    return true;
  }
  
  // 봇/크롤러 감지
  const userAgent = navigator.userAgent.toLowerCase();
  const isBot = /bot|crawler|spider|crawling|googlebot|bingbot|slurp|duckduckbot/i.test(userAgent);
  
  if (isBot) {
    forceLog('🤖 Bot detected, excluding from experiment');
    return true;
  }
  
  forceLog('✅ User eligible for experiment');
  return false;
}

/**
 * 개발자를 실험에서 제외 (토글)
 */
export function toggleExcludeFromExperiments(): boolean {
  const current = localStorage.getItem(EXCLUDE_KEY) === 'true';
  const newValue = !current;
  localStorage.setItem(EXCLUDE_KEY, String(newValue));
  return newValue;
}

// ================================================
// 실험 배정
// ================================================

/**
 * 실험 배정 가져오기 또는 생성
 * 
 * @param experimentId 실험 ID
 * @returns Control 또는 Variant
 */
export async function getOrAssignExperiment(experimentId: ExperimentId): Promise<Variant> {
  forceLog('🎲 Starting experiment assignment for:', experimentId);
  
  // 실험 제외 대상인지 확인
  if (shouldExcludeFromExperiment()) {
    forceLog('⚠️ User excluded, returning control');
    return 'control'; // 기본값 반환
  }
  
  const sessionId = getOrCreateSessionId();
  forceLog('📝 Session ID:', sessionId);
  
  try {
    forceLog('🔍 Checking existing assignment from Supabase...');
    // 1. 기존 배정 확인
    const { data: existing, error: fetchError } = await supabase
      .from('experiment_assignments')
      .select('variant')
      .eq('session_id', sessionId)
      .eq('experiment_id', experimentId)
      .maybeSingle();
    
    if (fetchError) {
      forceLog('❌ Error fetching assignment:', fetchError);
      console.error('[Experiment] Error fetching assignment:', fetchError);
      return getLocalVariant(experimentId);
    }
    
    if (existing) {
      // 기존 배정 사용
      const variant = existing.variant as Variant;
      forceLog('✅ Found existing assignment:', variant);
      localStorage.setItem(`exp_${experimentId}`, variant);
      return variant;
    }
    
    // 2. 새 배정 생성 (50:50)
    const variant: Variant = Math.random() < 0.5 ? 'control' : 'variant';
    forceLog('🎯 Creating new assignment:', variant);
    
    const { error: insertError } = await supabase
      .from('experiment_assignments')
      .insert({
        session_id: sessionId,
        experiment_id: experimentId,
        variant,
      });
    
    if (insertError) {
      forceLog('❌ Error creating assignment:', insertError);
      console.error('[Experiment] Error creating assignment:', insertError);
      return getLocalVariant(experimentId);
    }
    
    // 로컬스토리지에 저장
    localStorage.setItem(`exp_${experimentId}`, variant);
    localStorage.setItem('ab_test_timestamp', new Date().toISOString());
    forceLog('💾 Saved to localStorage:', variant);
    
    return variant;
    
  } catch (error) {
    forceLog('❌ Assignment error:', error);
    console.error('[Experiment] Assignment error:', error);
    return getLocalVariant(experimentId);
  }
}

/**
 * 로컬 fallback (네트워크 오류 시)
 */
function getLocalVariant(experimentId: ExperimentId): Variant {
  const stored = localStorage.getItem(`exp_${experimentId}`);
  if (stored === 'control' || stored === 'variant') {
    return stored;
  }
  
  // 새 랜덤 배정
  const variant: Variant = Math.random() < 0.5 ? 'control' : 'variant';
  localStorage.setItem(`exp_${experimentId}`, variant);
  return variant;
}

// ================================================
// 이벤트 트래킹
// ================================================

/**
 * 이벤트 트래킹 (즉시 전송)
 */
export async function trackExperimentEvent(
  experimentId: ExperimentId,
  variant: Variant,
  eventType: EventType,
  eventData?: Record<string, any>
): Promise<void> {
  if (shouldExcludeFromExperiment()) {
    return; // 제외된 사용자는 트래킹하지 않음
  }
  
  const sessionId = getOrCreateSessionId();
  
  try {
    const { error } = await supabase.from('experiment_events').insert({
      session_id: sessionId,
      experiment_id: experimentId,
      variant,
      event_type: eventType,
      event_data: eventData || {},
    });
    
    if (error) {
      console.error('[Experiment] Event tracking error:', error);
    }
  } catch (error) {
    console.error('[Experiment] Event tracking error:', error);
  }
}

// ================================================
// 배치 이벤트 트래킹 (성능 최적화)
// ================================================

let eventQueue: ExperimentEvent[] = [];
let flushTimeout: NodeJS.Timeout | null = null;

// 중복 이벤트 방지를 위한 Set
const trackedEvents = new Set<string>();

/**
 * 배치 이벤트 트래킹 (2초 후 일괄 전송)
 */
export function trackExperimentEventBatch(
  experimentId: ExperimentId,
  variant: Variant,
  eventType: EventType,
  eventData?: Record<string, any>
): void {
  if (shouldExcludeFromExperiment()) {
    return;
  }
  
  const sessionId = getOrCreateSessionId();
  
  // 중복 이벤트 키 생성 (card_hover는 중복 방지하지 않음)
  if (eventType !== 'card_hover') {
    const eventKey = `${experimentId}_${sessionId}_${eventType}_${JSON.stringify(eventData)}`;
    if (trackedEvents.has(eventKey)) {
      return; // 이미 트래킹된 이벤트
    }
    trackedEvents.add(eventKey);
  }
  
  eventQueue.push({
    experimentId,
    variant,
    eventType,
    eventData,
    sessionId,
  });
  
  if (flushTimeout) {
    clearTimeout(flushTimeout);
  }
  
  flushTimeout = setTimeout(() => {
    flushEventQueue();
  }, 2000); // 2초 후 일괄 전송
}

/**
 * 이벤트 큐 플러시
 */
async function flushEventQueue(): Promise<void> {
  if (eventQueue.length === 0) return;
  
  const events = eventQueue.map(e => ({
    session_id: e.sessionId,
    experiment_id: e.experimentId,
    variant: e.variant,
    event_type: e.eventType,
    event_data: e.eventData || {},
  }));
  
  try {
    const { error } = await supabase.from('experiment_events').insert(events);
    
    if (error) {
      console.error('[Experiment] Batch event tracking error:', error);
    } else {
      eventQueue = []; // 성공 시 큐 비우기
    }
  } catch (error) {
    console.error('[Experiment] Batch event tracking error:', error);
  }
}

// 페이지 언로드 시 남은 이벤트 즉시 전송
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (eventQueue.length > 0) {
      flushEventQueue();
    }
  });
}

// ================================================
// 실험 리셋 (개발/테스트용)
// ================================================

/**
 * 특정 실험의 로컬 배정 삭제
 */
export function resetExperiment(experimentId: ExperimentId): void {
  localStorage.removeItem(`exp_${experimentId}`);
  console.log(`[Experiment] Reset ${experimentId}`);
}

/**
 * 모든 실험 데이터 삭제
 */
export function resetAllExperiments(): void {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('exp_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log('[Experiment] Reset all experiments');
}

