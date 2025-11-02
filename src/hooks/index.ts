/**
 * Hooks Index
 * 모든 커스텀 훅 export
 */

// Core Hooks
export {
  useAsync,
  useSubscription,
  useDebounce,
  usePrevious,
  useIsMounted,
  useInterval,
  useLocalStorage,
} from './useSupabase'

export type { AsyncState } from './useSupabase'

// Registration Hooks
export {
  useRegistration,
  useEmailValidation,
  useNicknameValidation,
  useRegistrationStats,
} from './useRegistration'

// Realtime Stats Hook
export { useRealtimeStats } from './useRealtimeStats'

// Referral Hooks
export {
  useReferralStats,
  useLeaderboard,
} from './useReferral'

// Rewards Hooks
export {
  useRewardTiers,
  useUserRewards,
  useNextTierProgress,
  useClaimReward,
} from './useRewards'

