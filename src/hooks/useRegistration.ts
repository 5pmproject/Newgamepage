/**
 * Registration Hooks
 * 사전등록 관련 커스텀 훅
 */

import { useState, useCallback, useEffect } from 'react'
import {
  createUser,
  checkEmailExists,
  checkNicknameExists,
  getRegistrationStats,
  subscribeToRegistrationStats,
} from '../services/registration'
import { useAsync, useSubscription, useDebounce } from './useSupabase'
import type { CreateUserRequest } from '../types/api'
import type { User, RegistrationStats } from '../types/models'

/**
 * 사전등록 Hook
 */
export function useRegistration() {
  const {
    data: user,
    error,
    isLoading,
    isSuccess,
    execute,
    reset,
  } = useAsync<User, [CreateUserRequest]>(createUser)

  const register = useCallback(
    async (userData: CreateUserRequest) => {
      return execute(userData)
    },
    [execute]
  )

  return {
    user,
    error,
    isLoading,
    isSuccess,
    register,
    reset,
  }
}

/**
 * 이메일 중복 확인 Hook
 * Debounced
 */
export function useEmailValidation(email: string, delay = 500) {
  const debouncedEmail = useDebounce(email, delay)
  const [isChecking, setIsChecking] = useState(false)
  const [exists, setExists] = useState(false)
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    const validateEmail = async () => {
      if (!debouncedEmail) {
        setExists(false)
        setIsValid(false)
        return
      }

      // 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(debouncedEmail)) {
        setIsValid(false)
        setExists(false)
        return
      }

      setIsValid(true)
      setIsChecking(true)

      const response = await checkEmailExists(debouncedEmail)

      if (response.success && response.data) {
        setExists(response.data.exists)
      }

      setIsChecking(false)
    }

    validateEmail()
  }, [debouncedEmail])

  return {
    isChecking,
    exists,
    isValid,
    isAvailable: isValid && !exists,
  }
}

/**
 * 닉네임 중복 확인 Hook
 * Debounced
 */
export function useNicknameValidation(nickname: string, delay = 500) {
  const debouncedNickname = useDebounce(nickname, delay)
  const [isChecking, setIsChecking] = useState(false)
  const [exists, setExists] = useState(false)
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    const validateNickname = async () => {
      if (!debouncedNickname) {
        setExists(false)
        setIsValid(false)
        return
      }

      // 닉네임 형식 검증
      if (debouncedNickname.length < 2 || debouncedNickname.length > 50) {
        setIsValid(false)
        setExists(false)
        return
      }

      setIsValid(true)
      setIsChecking(true)

      const response = await checkNicknameExists(debouncedNickname)

      if (response.success && response.data) {
        setExists(response.data.exists)
      }

      setIsChecking(false)
    }

    validateNickname()
  }, [debouncedNickname])

  return {
    isChecking,
    exists,
    isValid,
    isAvailable: isValid && !exists,
  }
}

/**
 * 전체 등록 통계 Hook
 * 실시간 업데이트 포함
 */
export function useRegistrationStats(options?: { realtime?: boolean }) {
  const { realtime = true } = options || {}
  const [stats, setStats] = useState<RegistrationStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // 초기 로드
  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true)
      const response = await getRegistrationStats()

      if (response.success && response.data) {
        setStats(response.data)
        setError(null)
      } else {
        setError(new Error(response.error?.message || 'Failed to load stats'))
      }

      setIsLoading(false)
    }

    loadStats()
  }, [])

  // 실시간 구독
  useSubscription(
    'registration-stats',
    () =>
      subscribeToRegistrationStats(
        (update) => {
          setStats((prev) => ({
            ...prev!,
            totalUsers: update.totalUsers,
          }))
        },
        (err) => setError(err)
      ),
    [],
    { enabled: realtime && !!stats }
  )

  const refresh = useCallback(async () => {
    const response = await getRegistrationStats()
    if (response.success && response.data) {
      setStats(response.data)
    }
  }, [])

  return {
    stats,
    isLoading,
    error,
    refresh,
  }
}

