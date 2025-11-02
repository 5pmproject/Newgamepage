/**
 * Lib Index
 * 유틸리티 및 설정 export
 */

// Supabase Client
export { supabase } from './supabase'

// Error Handler
export {
  handleSupabaseError,
  logError,
  safeAsync,
  createValidationError,
  combineValidationErrors,
  withRetry,
  isRateLimitError,
  isTransientError,
} from './errorHandler'

// Subscription Manager
export {
  subscriptionManager,
  createManagedSubscription,
  createManagedInterval,
  createManagedEventListener,
} from './subscriptionManager'

export type {
  SubscriptionCleanup,
  SubscriptionInfo,
} from './subscriptionManager'

// i18n (기존)
export { translations } from './i18n'
export type { Language, Translation } from './i18n'

