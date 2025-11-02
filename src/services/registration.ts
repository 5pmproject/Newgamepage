/**
 * Registration Service
 * 사용자 사전등록 관련 API
 */

import { supabase } from '../lib/supabase'
import { handleSupabaseError, logError, safeAsync } from '../lib/errorHandler'
import {
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
  createApiError,
  RegistrationFormSchema,
  Language
} from '../types/database'
import { dbUserToUser } from '../types/models'
import type {
  CreateUserRequest,
  CreateUserResponse,
  CheckEmailExistsResponse,
  CheckNicknameExistsResponse,
  GetRegistrationStatsResponse,
} from '../types/api'

/**
 * 이메일 중복 확인
 */
export async function checkEmailExists(
  email: string
): Promise<CheckEmailExistsResponse> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (error) {
      return createErrorResponse(handleSupabaseError(error))
    }

    return createSuccessResponse({ exists: !!data })
  } catch (error) {
    logError(error, 'checkEmailExists', { email })
    return createErrorResponse(createApiError(ERROR_CODES.UNKNOWN_ERROR))
  }
}

/**
 * 닉네임 중복 확인
 */
export async function checkNicknameExists(
  nickname: string
): Promise<CheckNicknameExistsResponse> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('nickname', nickname)
      .maybeSingle()

    if (error) {
      return createErrorResponse(handleSupabaseError(error))
    }

    return createSuccessResponse({ exists: !!data })
  } catch (error) {
    logError(error, 'checkNicknameExists', { nickname })
    return createErrorResponse(createApiError(ERROR_CODES.UNKNOWN_ERROR))
  }
}

/**
 * 추천인 코드 유효성 확인
 */
export async function validateReferralCode(code: string, language: Language = 'ko') {
  try {
    if (!code || code.length < 6) {
      return {
        valid: false,
        referrerNickname: undefined,
        referrerId: undefined
      }
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, nickname')
      .eq('referral_code', code.toUpperCase())
      .maybeSingle()

    if (error) {
      logError(error, 'validateReferralCode', { code })
      return {
        valid: false,
        referrerNickname: undefined,
        referrerId: undefined
      }
    }

    return {
      valid: !!data,
      referrerNickname: data?.nickname,
      referrerId: data?.id,
    }
  } catch (error) {
    logError(error, 'validateReferralCode', { code })
    return {
      valid: false,
      referrerNickname: undefined,
      referrerId: undefined
    }
  }
}

/**
 * 사용자 사전등록
 */
export async function createUser(
  userData: CreateUserRequest,
  language: Language = 'ko'
): Promise<CreateUserResponse> {
  try {
    // 1. 폼 데이터 검증 (Zod)
    const validationResult = RegistrationFormSchema.safeParse(userData)
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]
      return createErrorResponse({
        code: ERROR_CODES.VALIDATION_FAILED,
        message: firstError.message,
        field: firstError.path[0]?.toString(),
        details: validationResult.error.errors
      })
    }

    // 2. 이메일 중복 확인
    const emailCheck = await checkEmailExists(userData.email)
    if (emailCheck.data?.exists) {
      return createErrorResponse(
        createApiError(ERROR_CODES.EMAIL_DUPLICATE, {
          field: 'email'
        })
      )
    }

    // 3. 닉네임 중복 확인
    const nicknameCheck = await checkNicknameExists(userData.nickname)
    if (nicknameCheck.data?.exists) {
      return createErrorResponse(
        createApiError(ERROR_CODES.NICKNAME_DUPLICATE, {
          field: 'nickname'
        })
      )
    }

    // 4. 추천인 코드 검증 (있는 경우)
    let referrerId: string | undefined
    if (userData.referredByCode) {
      const referralCheck = await validateReferralCode(
        userData.referredByCode,
        language
      )
      
      if (!referralCheck.valid) {
        return createErrorResponse(
          createApiError(ERROR_CODES.INVALID_REFERRAL_CODE, {
            field: 'referredByCode'
          })
        )
      }

      referrerId = referralCheck.referrerId
    }

    // 5. 사용자 생성
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email: userData.email.toLowerCase(),
          nickname: userData.nickname,
          phone: userData.phone || null,
          playstyle: userData.playstyle || null,
          referred_by: referrerId || null,
          language: userData.language || 'ko',
        },
      ])
      .select()
      .single()

    if (error) {
      logError(error, 'createUser', { userData })
      return createErrorResponse(handleSupabaseError(error, language))
    }

    // 6. 추천 관계 생성 (referred_by가 있는 경우)
    if (referrerId && data.id) {
      const { error: referralError } = await supabase
        .from('referrals')
        .insert([
          {
            referrer_id: referrerId,
            referee_id: data.id,
          },
        ])

      if (referralError) {
        // 추천 관계 생성 실패해도 사용자 가입은 성공으로 처리
        logError(referralError, 'createUser:referral', {
          referrerId,
          refereeId: data.id
        })
      } else {
        // 보상 잠금 해제 체크
        try {
          await supabase.rpc('check_and_unlock_rewards', {
            user_uuid: referrerId
          })
        } catch (rewardError) {
          // 보상 잠금 해제 실패해도 무시
          logError(rewardError, 'createUser:unlockRewards', { referrerId })
        }
      }
    }

    // 7. Materialized View 갱신 (비동기로 처리)
    supabase.rpc('refresh_referral_stats').then().catch((err) => {
      logError(err, 'createUser:refreshStats')
    })

    // 8. 응답 데이터 변환
    const user = dbUserToUser(data)

    return createSuccessResponse(user)
  } catch (error) {
    logError(error, 'createUser', { userData })
    return createErrorResponse(
      createApiError(ERROR_CODES.SERVER_ERROR, {
        details: error
      })
    )
  }
}

/**
 * 사용자 ID로 조회
 */
export async function getUserById(userId: string, language: Language = 'ko') {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      return createErrorResponse(handleSupabaseError(error, language))
    }

    return createSuccessResponse(dbUserToUser(data))
  } catch (error) {
    logError(error, 'getUserById', { userId })
    return createErrorResponse(createApiError(ERROR_CODES.UNKNOWN_ERROR))
  }
}

/**
 * 추천인 코드로 사용자 조회
 */
export async function getUserByReferralCode(code: string, language: Language = 'ko') {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('referral_code', code.toUpperCase())
      .single()

    if (error) {
      return createErrorResponse(handleSupabaseError(error, language))
    }

    return createSuccessResponse(dbUserToUser(data))
  } catch (error) {
    logError(error, 'getUserByReferralCode', { code })
    return createErrorResponse(createApiError(ERROR_CODES.NOT_FOUND))
  }
}

/**
 * 전체 등록 통계 조회
 */
export async function getRegistrationStats(): Promise<GetRegistrationStatsResponse> {
  try {
    // get_global_stats 함수 호출
    const { data, error } = await supabase
      .rpc('get_global_stats')
      .single()

    if (error) {
      logError(error, 'getRegistrationStats')
      return createErrorResponse(handleSupabaseError(error))
    }

    return createSuccessResponse({
      totalUsers: Number(data.total_users),
      totalReferrals: Number(data.total_referrals),
      todayRegistrations: data.today_registrations,
      targetMilestone: data.target_milestone,
      completionPercentage: Number(data.completion_percentage),
    })
  } catch (error) {
    logError(error, 'getRegistrationStats')
    return createErrorResponse(createApiError(ERROR_CODES.SERVER_ERROR))
  }
}

/**
 * 실시간 등록자 수 구독
 * @returns Unsubscribe 함수
 */
export function subscribeToRegistrationStats(
  callback: (stats: { totalUsers: number; cumulativeRegistrations: number }) => void,
  onError?: (error: Error) => void
) {
  const channel = supabase
    .channel('registration-stats')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'registration_stats',
      },
      (payload) => {
        try {
          if (payload.new && typeof payload.new === 'object') {
            const newData = payload.new as any
            callback({
              totalUsers: newData.cumulative_registrations || 0,
              cumulativeRegistrations: newData.cumulative_registrations || 0,
            })
          }
        } catch (error) {
          logError(error, 'subscribeToRegistrationStats:callback')
          onError?.(error as Error)
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        if (import.meta.env.DEV) {
          console.log('✅ Subscribed to registration stats')
        }
      } else if (status === 'CHANNEL_ERROR') {
        const error = new Error('Failed to subscribe to registration stats')
        logError(error, 'subscribeToRegistrationStats:status')
        onError?.(error)
      }
    })

  // Unsubscribe 함수 반환
  return () => {
    supabase.removeChannel(channel)
  }
}

