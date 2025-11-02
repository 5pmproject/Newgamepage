import { PostgrestError } from '@supabase/supabase-js'
import { 
  ApiError, 
  ERROR_CODES, 
  ERROR_MESSAGES, 
  createApiError,
  Language 
} from '../types/database'

/**
 * Supabase PostgrestError를 ApiError로 변환
 */
export function handleSupabaseError(
  error: PostgrestError | null,
  language: Language = 'ko'
): ApiError {
  if (!error) {
    return createApiError(ERROR_CODES.UNKNOWN_ERROR)
  }

  // PostgreSQL 에러 코드별 처리
  switch (error.code) {
    case '23505': // unique_violation
      if (error.message.includes('email')) {
        return {
          code: ERROR_CODES.EMAIL_DUPLICATE,
          message: ERROR_MESSAGES.EMAIL_DUPLICATE[language],
          field: 'email',
          details: error.details
        }
      }
      if (error.message.includes('nickname')) {
        return {
          code: ERROR_CODES.NICKNAME_DUPLICATE,
          message: ERROR_MESSAGES.NICKNAME_DUPLICATE[language],
          field: 'nickname',
          details: error.details
        }
      }
      return {
        code: ERROR_CODES.ALREADY_EXISTS,
        message: ERROR_MESSAGES.ALREADY_EXISTS[language],
        details: error.details
      }

    case '23503': // foreign_key_violation
      return {
        code: ERROR_CODES.INVALID_REFERRAL_CODE,
        message: ERROR_MESSAGES.INVALID_REFERRAL_CODE[language],
        details: error.details
      }

    case '23514': // check_violation
      if (error.message.includes('email')) {
        return {
          code: ERROR_CODES.INVALID_INPUT,
          message: '올바른 이메일 형식이 아닙니다.',
          field: 'email',
          details: error.details
        }
      }
      if (error.message.includes('nickname')) {
        return {
          code: ERROR_CODES.INVALID_INPUT,
          message: '닉네임은 2자 이상 50자 이하여야 합니다.',
          field: 'nickname',
          details: error.details
        }
      }
      return {
        code: ERROR_CODES.VALIDATION_FAILED,
        message: ERROR_MESSAGES.VALIDATION_FAILED[language],
        details: error.details
      }

    case 'PGRST116': // No rows returned
      return {
        code: ERROR_CODES.NOT_FOUND,
        message: ERROR_MESSAGES.NOT_FOUND[language],
        details: error.details
      }

    default:
      return {
        code: ERROR_CODES.SERVER_ERROR,
        message: error.message || ERROR_MESSAGES.SERVER_ERROR[language],
        details: error.details
      }
  }
}

/**
 * 에러 로깅 함수
 * 개발 환경에서는 콘솔에, 프로덕션에서는 외부 서비스로 전송
 */
export function logError(
  error: unknown,
  context?: string,
  metadata?: Record<string, unknown>
): void {
  const isDevelopment = import.meta.env.DEV

  if (isDevelopment) {
    console.group(`🔴 Error${context ? ` [${context}]` : ''}`)
    console.error('Error:', error)
    if (metadata) {
      console.table(metadata)
    }
    console.groupEnd()
  } else {
    // 프로덕션 환경: 외부 로깅 서비스로 전송
    // 예: Sentry, LogRocket, DataDog 등
    // sentry.captureException(error, { contexts: { custom: metadata } })
  }
}

/**
 * 네트워크 에러 처리
 */
export function handleNetworkError(error: unknown): ApiError {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return createApiError(ERROR_CODES.NETWORK_ERROR, {
      message: '네트워크 연결을 확인해주세요.',
      details: error.message
    })
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return createApiError(ERROR_CODES.TIMEOUT, {
      message: '요청 시간이 초과되었습니다.',
      details: error.message
    })
  }

  return createApiError(ERROR_CODES.UNKNOWN_ERROR, {
    details: error
  })
}

/**
 * try-catch 블록을 간소화하는 헬퍼 함수
 * @example
 * const [data, error] = await safeAsync(() => supabase.from('users').select())
 */
export async function safeAsync<T>(
  fn: () => Promise<T>
): Promise<[T | null, ApiError | null]> {
  try {
    const result = await fn()
    return [result, null]
  } catch (error) {
    logError(error, 'safeAsync')
    
    if (error && typeof error === 'object' && 'code' in error) {
      return [null, handleSupabaseError(error as PostgrestError)]
    }
    
    return [null, handleNetworkError(error)]
  }
}

/**
 * Validation 에러 생성 헬퍼
 */
export function createValidationError(
  field: string,
  message: string
): ApiError {
  return {
    code: ERROR_CODES.VALIDATION_FAILED,
    message,
    field,
  }
}

/**
 * 여러 validation 에러를 하나로 합치기
 */
export function combineValidationErrors(errors: ApiError[]): ApiError {
  const fields = errors.map(e => e.field).filter(Boolean).join(', ')
  const messages = errors.map(e => e.message).join(' ')

  return {
    code: ERROR_CODES.VALIDATION_FAILED,
    message: messages || '입력값 검증에 실패했습니다.',
    field: fields || undefined,
    details: errors
  }
}

/**
 * Retry 로직을 포함한 함수 실행
 * @param fn 실행할 함수
 * @param maxRetries 최대 재시도 횟수
 * @param delay 재시도 간격 (ms)
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      if (attempt < maxRetries) {
        logError(
          error,
          'withRetry',
          { attempt: attempt + 1, maxRetries, delay }
        )
        await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)))
      }
    }
  }

  throw lastError
}

/**
 * Rate limit 에러 확인
 */
export function isRateLimitError(error: ApiError): boolean {
  return (
    error.code === 'PGRST107' || // PostgrestError rate limit
    error.message.includes('rate limit') ||
    error.message.includes('too many requests')
  )
}

/**
 * 일시적 에러인지 확인 (재시도 가능 여부)
 */
export function isTransientError(error: ApiError): boolean {
  const transientCodes = [
    ERROR_CODES.NETWORK_ERROR,
    ERROR_CODES.TIMEOUT,
    ERROR_CODES.SERVER_ERROR,
  ]

  return transientCodes.includes(error.code as any) || isRateLimitError(error)
}
