/**
 * Referral Hooks
 * 추천인 시스템 관련 커스텀 훅
 */

import { useState, useCallback, useEffect } from 'react'
import {
  getReferralStats,
  getReferralLeaderboard,
  subscribeToReferralUpdates,
} from '../services/referral'
import { useAsync, useSubscription } from './useSupabase'
import type { ReferralStats, RecentReferral, LeaderboardEntry } from '../types/models'

/**
 * 추천인 통계 Hook
 * 실시간 업데이트 포함
 */
export function useReferralStats(userId: string, options?: { realtime?: boolean }) {
  const { realtime = true } = options || {}
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [recentReferrals, setRecentReferrals] = useState<RecentReferral[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // 초기 로드
  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true)
      const response = await getReferralStats(userId)

      if (response.success && response.data) {
        setStats(response.data.stats)
        setRecentReferrals(response.data.recentReferrals)
        setError(null)
      } else {
        setError(new Error(response.error?.message || 'Failed to load stats'))
      }

      setIsLoading(false)
    }

    if (userId) {
      loadStats()
    }
  }, [userId])

  // 실시간 구독
  useSubscription(
    `referral-stats-${userId}`,
    () =>
      subscribeToReferralUpdates(
        userId,
        (update) => {
          setStats((prev) =>
            prev
              ? {
                  ...prev,
                  directReferrals: update.newReferralCount,
                }
              : null
          )
        },
        {
          onError: (err) => setError(err),
        }
      ),
    [userId],
    { enabled: realtime && !!userId && !!stats }
  )

  const refresh = useCallback(async () => {
    if (!userId) return

    const response = await getReferralStats(userId)
    if (response.success && response.data) {
      setStats(response.data.stats)
      setRecentReferrals(response.data.recentReferrals)
    }
  }, [userId])

  return {
    stats,
    recentReferrals,
    isLoading,
    error,
    refresh,
  }
}

/**
 * 리더보드 Hook
 */
export function useLeaderboard(limit = 100) {
  const {
    data: leaderboard,
    error,
    isLoading,
    execute: loadLeaderboard,
  } = useAsync<LeaderboardEntry[], []>(
    useCallback(() => getReferralLeaderboard(limit), [limit])
  )

  useEffect(() => {
    loadLeaderboard()
  }, [loadLeaderboard])

  const refresh = useCallback(() => {
    loadLeaderboard()
  }, [loadLeaderboard])

  return {
    leaderboard: leaderboard || [],
    isLoading,
    error,
    refresh,
  }
}

