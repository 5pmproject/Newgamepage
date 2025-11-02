/**
 * Supabase React Hooks
 * 타입 안정성, 에러 처리, 리소스 관리를 포함한 커스텀 훅
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { ApiResponse, ApiError } from '../types/database'
import { subscriptionManager } from '../lib/subscriptionManager'
import { logError } from '../lib/errorHandler'

/**
 * 비동기 API 호출 상태
 */
export interface AsyncState<T> {
  data: T | null
  error: ApiError | null
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
}

/**
 * 비동기 API 호출 Hook
 * @example
 * const { data, error, isLoading, execute } = useAsync(getUserById)
 * useEffect(() => { execute(userId) }, [userId])
 */
export function useAsync<TData, TArgs extends any[]>(
  asyncFn: (...args: TArgs) => Promise<ApiResponse<TData>>,
  options?: {
    onSuccess?: (data: TData) => void
    onError?: (error: ApiError) => void
    immediate?: boolean
  }
) {
  const [state, setState] = useState<AsyncState<TData>>({
    data: null,
    error: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
  })

  const isMountedRef = useRef(true)
  const abortControllerRef = useRef<AbortController | null>(null)

  const execute = useCallback(
    async (...args: TArgs) => {
      // 이전 요청 취소
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()

      setState({
        data: null,
        error: null,
        isLoading: true,
        isSuccess: false,
        isError: false,
      })

      try {
        const response = await asyncFn(...args)

        if (!isMountedRef.current) return

        if (response.success && response.data) {
          setState({
            data: response.data,
            error: null,
            isLoading: false,
            isSuccess: true,
            isError: false,
          })
          options?.onSuccess?.(response.data)
        } else {
          setState({
            data: null,
            error: response.error,
            isLoading: false,
            isSuccess: false,
            isError: true,
          })
          options?.onError?.(response.error!)
        }
      } catch (error) {
        if (!isMountedRef.current) return

        logError(error, 'useAsync:execute')

        const apiError: ApiError = {
          code: 'UNKNOWN_ERROR',
          message: '알 수 없는 오류가 발생했습니다.',
          details: error,
        }

        setState({
          data: null,
          error: apiError,
          isLoading: false,
          isSuccess: false,
          isError: true,
        })
        options?.onError?.(apiError)
      }
    },
    [asyncFn, options]
  )

  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      isLoading: false,
      isSuccess: false,
      isError: false,
    })
  }, [])

  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    ...state,
    execute,
    reset,
  }
}

/**
 * 실시간 구독 Hook
 * 자동으로 cleanup 처리
 * @example
 * useSubscription(
 *   'stats',
 *   () => subscribeToRegistrationStats((data) => setStats(data)),
 *   [dependency]
 * )
 */
export function useSubscription(
  subscriptionId: string,
  subscribeFn: () => () => void,
  deps: React.DependencyList = [],
  options?: {
    enabled?: boolean
    onError?: (error: Error) => void
  }
) {
  const { enabled = true, onError } = options || {}
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!enabled) return

    const uniqueId = `${subscriptionId}-${Date.now()}`

    try {
      const cleanup = subscribeFn()
      subscriptionManager.register(uniqueId, cleanup, 'realtime', {
        subscriptionId,
      })

      setIsConnected(true)

      return () => {
        setIsConnected(false)
        subscriptionManager.unregister(uniqueId)
      }
    } catch (error) {
      logError(error, `useSubscription:${subscriptionId}`)
      onError?.(error as Error)
      setIsConnected(false)
    }
  }, [...deps, enabled])

  return { isConnected }
}

/**
 * Debounced 값 Hook
 * API 호출 최적화용
 */
export function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * 이전 값 Hook
 * 값 변경 감지용
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>()

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}

/**
 * Mounted 상태 Hook
 * 메모리 누수 방지용
 */
export function useIsMounted(): () => boolean {
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return useCallback(() => isMountedRef.current, [])
}

/**
 * Interval Hook
 * 자동 cleanup
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (delay === null) return

    const id = setInterval(() => savedCallback.current(), delay)

    subscriptionManager.register(
      `interval-${Date.now()}`,
      () => clearInterval(id),
      'interval'
    )

    return () => clearInterval(id)
  }, [delay])
}

/**
 * Local Storage Hook
 * 타입 안전한 로컬 스토리지 접근
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      logError(error, 'useLocalStorage:init', { key })
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      } catch (error) {
        logError(error, 'useLocalStorage:setValue', { key, value })
      }
    },
    [key, storedValue]
  )

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch (error) {
      logError(error, 'useLocalStorage:removeValue', { key })
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue]
}

