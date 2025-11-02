/**
 * Rewards Hooks
 * 보상 시스템 관련 커스텀 훅
 */

import { useState, useCallback, useEffect } from 'react'
import {
  getRewardTiers,
  getUserRewards,
  getNextTierProgress,
  claimReward,
  subscribeToRewardUnlocks,
} from '../services/rewards'
import { useAsync, useSubscription } from './useSupabase'
import type { RewardTier, UserReward, NextTierProgress } from '../types/models'
import type { Language } from '../types/database'

/**
 * 보상 티어 목록 Hook
 */
export function useRewardTiers() {
  const {
    data: tiers,
    error,
    isLoading,
    execute: loadTiers,
  } = useAsync<RewardTier[], []>(getRewardTiers)

  useEffect(() => {
    loadTiers()
  }, [loadTiers])

  return {
    tiers: tiers || [],
    isLoading,
    error,
  }
}

/**
 * 사용자 보상 Hook
 * 실시간 잠금 해제 포함
 */
export function useUserRewards(
  userId: string,
  options?: {
    realtime?: boolean
    onNewReward?: (reward: {
      tierId: string
      tierName: string
      rewardTitle: Record<Language, string>
    }) => void
  }
) {
  const { realtime = true, onNewReward } = options || {}
  const [rewards, setRewards] = useState<UserReward[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // 초기 로드
  useEffect(() => {
    const loadRewards = async () => {
      if (!userId) return

      setIsLoading(true)
      const response = await getUserRewards(userId)

      if (response.success && response.data) {
        setRewards(response.data)
        setError(null)
      } else {
        setError(new Error(response.error?.message || 'Failed to load rewards'))
      }

      setIsLoading(false)
    }

    loadRewards()
  }, [userId])

  // 실시간 구독
  useSubscription(
    `rewards-${userId}`,
    () =>
      subscribeToRewardUnlocks(
        userId,
        (reward) => {
          onNewReward?.(reward)
          // 보상 목록 다시 로드
          getUserRewards(userId).then((response) => {
            if (response.success && response.data) {
              setRewards(response.data)
            }
          })
        },
        {
          onError: (err) => setError(err),
        }
      ),
    [userId],
    { enabled: realtime && !!userId }
  )

  const refresh = useCallback(async () => {
    if (!userId) return

    const response = await getUserRewards(userId)
    if (response.success && response.data) {
      setRewards(response.data)
    }
  }, [userId])

  return {
    rewards,
    isLoading,
    error,
    refresh,
  }
}

/**
 * 다음 티어 진행률 Hook
 */
export function useNextTierProgress(userId: string) {
  const [progress, setProgress] = useState<NextTierProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const loadProgress = async () => {
      if (!userId) return

      setIsLoading(true)
      const response = await getNextTierProgress(userId)

      if (response.success) {
        setProgress(response.data)
        setError(null)
      } else {
        setError(new Error(response.error?.message || 'Failed to load progress'))
      }

      setIsLoading(false)
    }

    loadProgress()
  }, [userId])

  const refresh = useCallback(async () => {
    if (!userId) return

    const response = await getNextTierProgress(userId)
    if (response.success) {
      setProgress(response.data)
    }
  }, [userId])

  return {
    progress,
    isLoading,
    error,
    refresh,
  }
}

/**
 * 보상 수령 Hook
 */
export function useClaimReward(userId: string) {
  const [isClaiming, setIsClaiming] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const claim = useCallback(
    async (rewardId: string) => {
      setIsClaiming(true)
      setError(null)

      const response = await claimReward(rewardId, userId)

      if (response.success) {
        setIsClaiming(false)
        return response.data
      } else {
        setError(new Error(response.error?.message || 'Failed to claim reward'))
        setIsClaiming(false)
        throw new Error(response.error?.message)
      }
    },
    [userId]
  )

  return {
    claim,
    isClaiming,
    error,
  }
}

