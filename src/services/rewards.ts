/**
 * Rewards Service
 * 보상 시스템 관련 API
 */

import { supabase } from '../lib/supabase'
import { handleSupabaseError, logError } from '../lib/errorHandler'
import {
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
  createApiError,
  Language,
} from '../types/database'
import { dbTierToRewardTier, dbRewardToUserReward, RewardTier } from '../types/models'
import type {
  GetRewardTiersResponse,
  GetUserRewardsResponse,
  ClaimRewardResponse,
  GetNextTierProgressResponse,
} from '../types/api'

/**
 * 모든 보상 티어 조회
 */
export async function getRewardTiers(
  language: Language = 'ko'
): Promise<GetRewardTiersResponse> {
  try {
    const { data, error } = await supabase
      .from('reward_tiers')
      .select('*')
      .order('tier_order', { ascending: true })

    if (error) {
      logError(error, 'getRewardTiers')
      return createErrorResponse(handleSupabaseError(error, language))
    }

    const tiers = (data || []).map(dbTierToRewardTier)

    return createSuccessResponse(tiers)
  } catch (error) {
    logError(error, 'getRewardTiers')
    return createErrorResponse(createApiError(ERROR_CODES.SERVER_ERROR))
  }
}

/**
 * 사용자 보상 조회
 */
export async function getUserRewards(
  userId: string,
  language: Language = 'ko'
): Promise<GetUserRewardsResponse> {
  try {
    const { data, error } = await supabase
      .from('user_rewards')
      .select(`
        *,
        tier:reward_tiers(*)
      `)
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false })

    if (error) {
      logError(error, 'getUserRewards', { userId })
      return createErrorResponse(handleSupabaseError(error, language))
    }

    const rewards = (data || []).map((reward) => 
      dbRewardToUserReward(reward, reward.tier)
    )

    return createSuccessResponse(rewards)
  } catch (error) {
    logError(error, 'getUserRewards', { userId })
    return createErrorResponse(createApiError(ERROR_CODES.SERVER_ERROR))
  }
}

/**
 * 보상 수령 (claimed = true 처리)
 */
export async function claimReward(
  rewardId: string,
  userId: string,
  language: Language = 'ko'
): Promise<ClaimRewardResponse> {
  try {
    // 1. 보상 소유 및 상태 확인
    const { data: reward, error: fetchError } = await supabase
      .from('user_rewards')
      .select(`
        *,
        tier:reward_tiers(*)
      `)
      .eq('id', rewardId)
      .eq('user_id', userId)
      .single()

    if (fetchError) {
      logError(fetchError, 'claimReward:fetch', { rewardId, userId })
      return createErrorResponse(handleSupabaseError(fetchError, language))
    }

    if (!reward) {
      return createErrorResponse(
        createApiError(ERROR_CODES.NOT_FOUND, {
          message: '보상을 찾을 수 없습니다.',
        })
      )
    }

    if (reward.claimed) {
      return createErrorResponse(
        createApiError(ERROR_CODES.ALREADY_EXISTS, {
          message: '이미 수령한 보상입니다.',
        })
      )
    }

    // 2. 보상 수령 처리
    const { data: updated, error: updateError } = await supabase
      .from('user_rewards')
      .update({
        claimed: true,
        claimed_at: new Date().toISOString(),
      })
      .eq('id', rewardId)
      .eq('user_id', userId)
      .select(`
        *,
        tier:reward_tiers(*)
      `)
      .single()

    if (updateError) {
      logError(updateError, 'claimReward:update', { rewardId, userId })
      return createErrorResponse(handleSupabaseError(updateError, language))
    }

    const userReward = dbRewardToUserReward(updated, updated.tier)

    return createSuccessResponse({
      success: true,
      reward: userReward,
    })
  } catch (error) {
    logError(error, 'claimReward', { rewardId, userId })
    return createErrorResponse(createApiError(ERROR_CODES.SERVER_ERROR))
  }
}

/**
 * 사용자의 다음 보상 티어 및 진행률 조회
 */
export async function getNextTierProgress(
  userId: string,
  language: Language = 'ko'
): Promise<GetNextTierProgressResponse> {
  try {
    // 1. 현재 추천인 수 조회
    const { data: stats, error: statsError } = await supabase
      .from('user_referral_stats_mv')
      .select('direct_referrals')
      .eq('id', userId)
      .maybeSingle()

    if (statsError) {
      logError(statsError, 'getNextTierProgress:stats', { userId })
      return createErrorResponse(handleSupabaseError(statsError, language))
    }

    const currentReferrals = stats?.direct_referrals || 0

    // 2. 이미 획득한 최고 티어 조회
    const { data: lastReward, error: rewardError } = await supabase
      .from('user_rewards')
      .select('tier:reward_tiers(tier_order)')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (rewardError && rewardError.code !== 'PGRST116') {
      logError(rewardError, 'getNextTierProgress:lastReward', { userId })
    }

    const lastTierOrder = lastReward?.tier?.tier_order || 0

    // 3. 다음 티어 조회
    const { data: nextTier, error: tierError } = await supabase
      .from('reward_tiers')
      .select('*')
      .gt('tier_order', lastTierOrder)
      .order('tier_order', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (tierError && tierError.code !== 'PGRST116') {
      logError(tierError, 'getNextTierProgress:nextTier', { userId })
      return createErrorResponse(handleSupabaseError(tierError, language))
    }

    // 4. 다음 티어가 없으면 null 반환 (최고 티어 도달)
    if (!nextTier) {
      return createSuccessResponse(null)
    }

    // 5. 진행률 계산
    const tier = dbTierToRewardTier(nextTier)
    const progress = {
      tier,
      current: currentReferrals,
      required: tier.referralRequirement,
      remaining: Math.max(0, tier.referralRequirement - currentReferrals),
      percentage: Math.min(
        100,
        Math.round((currentReferrals / tier.referralRequirement) * 100)
      ),
    }

    return createSuccessResponse(progress)
  } catch (error) {
    logError(error, 'getNextTierProgress', { userId })
    return createErrorResponse(createApiError(ERROR_CODES.SERVER_ERROR))
  }
}

/**
 * 사용자의 현재 티어 정보 조회
 */
export async function getCurrentTier(
  userId: string,
  language: Language = 'ko'
) {
  try {
    const { data, error } = await supabase
      .from('user_current_tier')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      logError(error, 'getCurrentTier', { userId })
      return createErrorResponse(handleSupabaseError(error, language))
    }

    if (!data) {
      // 티어가 없는 경우 (추천인 0명)
      return createSuccessResponse(null)
    }

    return createSuccessResponse({
      userId: data.user_id,
      nickname: data.nickname,
      directReferrals: data.direct_referrals,
      tierName: data.tier_name,
      tierOrder: data.tier_order,
      rewardTitle: data.reward_title,
      rewardDescription: data.reward_description,
      referralRequirement: data.referral_requirement,
      referralsToNextTier: data.referrals_to_next_tier,
    })
  } catch (error) {
    logError(error, 'getCurrentTier', { userId })
    return createErrorResponse(createApiError(ERROR_CODES.SERVER_ERROR))
  }
}

/**
 * 보상 자동 잠금 해제 체크 (수동 트리거용)
 * 일반적으로는 추천인 추가 시 자동으로 실행됨
 */
export async function checkAndUnlockRewards(
  userId: string,
  language: Language = 'ko'
) {
  try {
    const { error } = await supabase.rpc('check_and_unlock_rewards', {
      user_uuid: userId,
    })

    if (error) {
      logError(error, 'checkAndUnlockRewards', { userId })
      return createErrorResponse(handleSupabaseError(error, language))
    }

    // 잠금 해제된 보상 목록 조회
    const rewardsResponse = await getUserRewards(userId, language)

    if (!rewardsResponse.success) {
      return rewardsResponse
    }

    return createSuccessResponse({
      success: true,
      unlockedRewards: rewardsResponse.data || [],
    })
  } catch (error) {
    logError(error, 'checkAndUnlockRewards', { userId })
    return createErrorResponse(createApiError(ERROR_CODES.SERVER_ERROR))
  }
}

/**
 * 실시간 보상 잠금 해제 구독
 * @returns Cleanup 함수
 */
export function subscribeToRewardUnlocks(
  userId: string,
  callback: (reward: {
    tierId: string
    tierName: string
    rewardTitle: Record<Language, string>
  }) => void,
  options?: {
    onError?: (error: Error) => void
    onConnect?: () => void
    onDisconnect?: () => void
  }
) {
  let isSubscribed = false

  const channel = supabase
    .channel(`rewards:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'user_rewards',
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        if (!isSubscribed) return

        try {
          const newReward = payload.new as any

          // 티어 정보 조회
          const { data: tier } = await supabase
            .from('reward_tiers')
            .select('*')
            .eq('id', newReward.tier_id)
            .single()

          if (tier) {
            callback({
              tierId: tier.id,
              tierName: tier.tier_name,
              rewardTitle: tier.reward_title as Record<Language, string>,
            })
          }
        } catch (error) {
          logError(error, 'subscribeToRewardUnlocks:callback', { userId })
          options?.onError?.(error as Error)
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        isSubscribed = true
        options?.onConnect?.()
        if (import.meta.env.DEV) {
          console.log(`✅ Subscribed to reward unlocks for user: ${userId}`)
        }
      } else if (status === 'CLOSED') {
        isSubscribed = false
        options?.onDisconnect?.()
        if (import.meta.env.DEV) {
          console.log(`🔌 Disconnected from reward unlocks for user: ${userId}`)
        }
      } else if (status === 'CHANNEL_ERROR') {
        isSubscribed = false
        const error = new Error(`Failed to subscribe to reward unlocks for user: ${userId}`)
        logError(error, 'subscribeToRewardUnlocks:status')
        options?.onError?.(error)
      }
    })

  // Cleanup 함수 반환
  return () => {
    isSubscribed = false
    supabase.removeChannel(channel).catch((error) => {
      logError(error, 'subscribeToRewardUnlocks:cleanup', { userId })
    })
  }
}

