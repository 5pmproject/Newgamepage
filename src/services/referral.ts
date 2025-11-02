/**
 * Referral Service
 * 추천인 시스템 관련 API
 */

import { supabase } from '../lib/supabase'
import { handleSupabaseError, logError, safeAsync } from '../lib/errorHandler'
import {
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
  createApiError,
  Language
} from '../types/database'
import { dbStatsToReferralStats, RecentReferral } from '../types/models'
import type {
  GetReferralStatsResponse,
  GetReferralNetworkResponse,
  ValidateReferralCodeResponse,
} from '../types/api'

/**
 * 추천인 코드 유효성 검증
 */
export async function validateReferralCode(
  code: string,
  language: Language = 'ko'
): Promise<ValidateReferralCodeResponse> {
  try {
    if (!code || code.length < 6) {
      return createSuccessResponse({
        valid: false,
        referrerNickname: undefined,
        referrerId: undefined,
      })
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, nickname')
      .eq('referral_code', code.toUpperCase())
      .maybeSingle()

    if (error) {
      logError(error, 'validateReferralCode', { code })
      return createErrorResponse(handleSupabaseError(error, language))
    }

    return createSuccessResponse({
      valid: !!data,
      referrerNickname: data?.nickname,
      referrerId: data?.id,
    })
  } catch (error) {
    logError(error, 'validateReferralCode', { code })
    return createErrorResponse(createApiError(ERROR_CODES.UNKNOWN_ERROR))
  }
}

/**
 * 사용자 추천인 통계 조회
 */
export async function getReferralStats(
  userId: string,
  language: Language = 'ko'
): Promise<GetReferralStatsResponse> {
  try {
    // 1. Materialized View에서 통계 조회
    const { data: statsData, error: statsError } = await supabase
      .from('user_referral_stats_mv')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (statsError) {
      logError(statsError, 'getReferralStats:stats', { userId })
      return createErrorResponse(handleSupabaseError(statsError, language))
    }

    // 사용자가 없거나 추천인이 없는 경우 기본값 반환
    const stats = statsData
      ? dbStatsToReferralStats(statsData)
      : {
          userId,
          nickname: '',
          email: '',
          referralCode: '',
          directReferrals: 0,
          indirectReferrals: 0,
          totalPopulation: 0,
          lastUpdated: new Date(),
        }

    // 2. 최근 추천인 목록 조회 (함수 사용)
    const { data: recentData, error: recentError } = await supabase
      .rpc('get_recent_referrals', {
        user_uuid: userId,
        limit_count: 10,
      })

    if (recentError) {
      logError(recentError, 'getReferralStats:recent', { userId })
      // 최근 추천인 조회 실패해도 통계는 반환
      return createSuccessResponse({
        stats,
        recentReferrals: [],
      })
    }

    // 3. 데이터 변환
    const recentReferrals: RecentReferral[] = (recentData || []).map((item) => ({
      id: item.referee_id,
      nickname: item.nickname,
      email: item.email,
      createdAt: new Date(item.created_at),
      referralCount: Number(item.referral_count),
    }))

    return createSuccessResponse({
      stats,
      recentReferrals,
    })
  } catch (error) {
    logError(error, 'getReferralStats', { userId })
    return createErrorResponse(
      createApiError(ERROR_CODES.SERVER_ERROR, {
        details: error,
      })
    )
  }
}

/**
 * 추천인 네트워크 트리 조회 (계층 구조)
 */
export async function getReferralNetwork(
  userId: string,
  depth = 3,
  language: Language = 'ko'
): Promise<GetReferralNetworkResponse> {
  try {
    // Recursive CTE를 사용한 네트워크 조회 (스키마에 함수가 없으므로 직접 구현)
    const { data, error } = await supabase
      .from('referrals')
      .select(`
        id,
        referee_id,
        referrer_id,
        referee:users!referrals_referee_id_fkey(
          id,
          nickname,
          referral_code
        )
      `)
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      logError(error, 'getReferralNetwork', { userId, depth })
      return createErrorResponse(handleSupabaseError(error, language))
    }

    // 네트워크 노드 변환
    const nodes = (data || []).map((item) => ({
      userId: item.referee.id,
      nickname: item.referee.nickname,
      referralCode: item.referee.referral_code,
      level: 1,
      parentId: userId,
    }))

    return createSuccessResponse({ nodes })
  } catch (error) {
    logError(error, 'getReferralNetwork', { userId, depth })
    return createErrorResponse(createApiError(ERROR_CODES.SERVER_ERROR))
  }
}

/**
 * 추천인 리더보드 조회
 */
export async function getReferralLeaderboard(
  limit = 100,
  language: Language = 'ko'
) {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .limit(limit)

    if (error) {
      logError(error, 'getReferralLeaderboard', { limit })
      return createErrorResponse(handleSupabaseError(error, language))
    }

    const leaderboard = (data || []).map((item) => ({
      rank: item.rank,
      nickname: item.nickname,
      referralCode: item.referral_code,
      directReferrals: item.direct_referrals,
      totalPopulation: item.total_population,
    }))

    return createSuccessResponse(leaderboard)
  } catch (error) {
    logError(error, 'getReferralLeaderboard', { limit })
    return createErrorResponse(createApiError(ERROR_CODES.SERVER_ERROR))
  }
}

/**
 * Materialized View 수동 갱신
 * 관리자 기능 또는 주기적 갱신용
 */
export async function refreshReferralStats(language: Language = 'ko') {
  try {
    const { error } = await supabase.rpc('refresh_referral_stats')

    if (error) {
      logError(error, 'refreshReferralStats')
      return createErrorResponse(handleSupabaseError(error, language))
    }

    return createSuccessResponse({ success: true })
  } catch (error) {
    logError(error, 'refreshReferralStats')
    return createErrorResponse(createApiError(ERROR_CODES.SERVER_ERROR))
  }
}

/**
 * 실시간 추천인 업데이트 구독
 * @returns Cleanup 함수 (리소스 해제)
 */
export function subscribeToReferralUpdates(
  userId: string,
  callback: (update: {
    referrerId: string
    newReferralCount: number
  }) => void,
  options?: {
    onError?: (error: Error) => void
    onConnect?: () => void
    onDisconnect?: () => void
  }
) {
  let isSubscribed = false
  
  const channel = supabase
    .channel(`referrals:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'referrals',
        filter: `referrer_id=eq.${userId}`,
      },
      async (payload) => {
        if (!isSubscribed) return

        try {
          // 새 추천인이 추가되면 통계 갱신 후 콜백 호출
          const { data: stats } = await supabase
            .from('user_referral_stats_mv')
            .select('direct_referrals')
            .eq('id', userId)
            .single()

          callback({
            referrerId: userId,
            newReferralCount: stats?.direct_referrals || 0,
          })
        } catch (error) {
          logError(error, 'subscribeToReferralUpdates:callback', { userId })
          options?.onError?.(error as Error)
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        isSubscribed = true
        options?.onConnect?.()
        if (import.meta.env.DEV) {
          console.log(`✅ Subscribed to referral updates for user: ${userId}`)
        }
      } else if (status === 'CLOSED') {
        isSubscribed = false
        options?.onDisconnect?.()
        if (import.meta.env.DEV) {
          console.log(`🔌 Disconnected from referral updates for user: ${userId}`)
        }
      } else if (status === 'CHANNEL_ERROR') {
        isSubscribed = false
        const error = new Error(`Failed to subscribe to referral updates for user: ${userId}`)
        logError(error, 'subscribeToReferralUpdates:status')
        options?.onError?.(error)
      }
    })

  // Cleanup 함수 반환 (React useEffect cleanup과 호환)
  return () => {
    isSubscribed = false
    supabase.removeChannel(channel).catch((error) => {
      logError(error, 'subscribeToReferralUpdates:cleanup', { userId })
    })
  }
}

/**
 * 추천인 추가 (수동 추가용 - 특별한 경우에만 사용)
 * 일반적으로는 회원가입 시 자동으로 추가됨
 */
export async function addReferral(
  referrerId: string,
  refereeId: string,
  language: Language = 'ko'
) {
  try {
    // 1. 자기 자신 추천 방지
    if (referrerId === refereeId) {
      return createErrorResponse(
        createApiError(ERROR_CODES.SELF_REFERRAL_NOT_ALLOWED)
      )
    }

    // 2. 중복 추천 확인
    const { data: existing, error: checkError } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_id', referrerId)
      .eq('referee_id', refereeId)
      .maybeSingle()

    if (checkError) {
      logError(checkError, 'addReferral:check', { referrerId, refereeId })
      return createErrorResponse(handleSupabaseError(checkError, language))
    }

    if (existing) {
      return createErrorResponse(
        createApiError(ERROR_CODES.ALREADY_EXISTS, {
          message: '이미 추천 관계가 존재합니다.',
        })
      )
    }

    // 3. 추천 관계 추가
    const { data, error } = await supabase
      .from('referrals')
      .insert([
        {
          referrer_id: referrerId,
          referee_id: refereeId,
        },
      ])
      .select()
      .single()

    if (error) {
      logError(error, 'addReferral:insert', { referrerId, refereeId })
      return createErrorResponse(handleSupabaseError(error, language))
    }

    // 4. 보상 잠금 해제 체크
    try {
      await supabase.rpc('check_and_unlock_rewards', {
        user_uuid: referrerId,
      })
    } catch (rewardError) {
      // 보상 잠금 해제 실패해도 무시
      logError(rewardError, 'addReferral:unlockRewards', { referrerId })
    }

    return createSuccessResponse({
      id: data.id,
      referrerId: data.referrer_id,
      refereeId: data.referee_id,
      createdAt: new Date(data.created_at),
    })
  } catch (error) {
    logError(error, 'addReferral', { referrerId, refereeId })
    return createErrorResponse(createApiError(ERROR_CODES.SERVER_ERROR))
  }
}

