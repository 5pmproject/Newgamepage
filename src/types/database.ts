// ================================================
// Supabase Database Types (자동 생성 권장)
// ================================================
// 
// 이 파일은 Supabase CLI로 자동 생성하는 것을 강력히 권장합니다.
// 
// 설정 방법:
// 1. package.json에 스크립트 추가:
//    "types:generate": "supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts"
// 
// 2. 실행:
//    npm run types:generate
// 
// 공식 문서: https://supabase.com/docs/guides/api/rest/generating-types
//

import { z } from 'zod';

// ================================================
// Constants (Enum 대체)
// ================================================

export const PLAYSTYLES = ['warrior', 'assassin', 'mage'] as const;
export type Playstyle = typeof PLAYSTYLES[number];

export const LANGUAGES = ['ko', 'en', 'ja'] as const;
export type Language = typeof LANGUAGES[number];

// ================================================
// Base Types
// ================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type RewardTranslation = {
  ko: string
  en: string
  ja: string
}

// ================================================
// Database Schema
// ================================================

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          nickname: string
          email: string
          phone: string | null
          playstyle: Playstyle | null
          language: Language
          referral_code: string
          referred_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nickname: string
          email: string
          phone?: string | null
          playstyle?: Playstyle | null
          language?: Language
          referral_code?: string
          referred_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nickname?: string
          email?: string
          phone?: string | null
          playstyle?: Playstyle | null
          language?: Language
          referral_code?: string
          referred_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      referrals: {
        Row: {
          id: string
          referrer_id: string
          referee_id: string
          created_at: string
        }
        Insert: {
          id?: string
          referrer_id: string
          referee_id: string
          created_at?: string
        }
        Update: {
          id?: string
          referrer_id?: string
          referee_id?: string
          created_at?: string
        }
      }
      reward_tiers: {
        Row: {
          id: string
          tier_name: string
          tier_order: number
          referral_requirement: number
          reward_title: RewardTranslation
          reward_description: RewardTranslation
          created_at: string
        }
        Insert: {
          id?: string
          tier_name: string
          tier_order: number
          referral_requirement: number
          reward_title: RewardTranslation
          reward_description: RewardTranslation
          created_at?: string
        }
        Update: {
          id?: string
          tier_name?: string
          tier_order?: number
          referral_requirement?: number
          reward_title?: RewardTranslation
          reward_description?: RewardTranslation
          created_at?: string
        }
      }
      user_rewards: {
        Row: {
          id: string
          user_id: string
          tier_id: string
          unlocked_at: string
          claimed: boolean
          claimed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          tier_id: string
          unlocked_at?: string
          claimed?: boolean
          claimed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          tier_id?: string
          unlocked_at?: string
          claimed?: boolean
          claimed_at?: string | null
        }
      }
      registration_stats: {
        Row: {
          id: string
          stat_date: string
          daily_registrations: number
          cumulative_registrations: number
          target_milestone: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          stat_date?: string
          daily_registrations?: number
          cumulative_registrations?: number
          target_milestone?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          stat_date?: string
          daily_registrations?: number
          cumulative_registrations?: number
          target_milestone?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      user_referral_stats_mv: {
        Row: {
          id: string
          nickname: string
          email: string
          referral_code: string
          direct_referrals: number
          indirect_referrals: number
          total_population: number
          last_updated: string
        }
        Insert: never  // Materialized View는 Insert 불가능
        Update: never  // Materialized View는 Update 불가능
      }
      user_current_tier: {
        Row: {
          user_id: string
          nickname: string
          direct_referrals: number
          tier_name: string
          tier_order: number
          reward_title: RewardTranslation
          reward_description: RewardTranslation
          referral_requirement: number
          referrals_to_next_tier: number
        }
        Insert: never  // View는 Insert 불가능
        Update: never  // View는 Update 불가능
      }
      leaderboard: {
        Row: {
          nickname: string
          referral_code: string
          direct_referrals: number
          total_population: number
          rank: number
        }
        Insert: never
        Update: never
      }
    }
    Functions: {
      get_recent_referrals: {
        Args: {
          user_uuid: string
          limit_count?: number
        }
        Returns: Array<{
          referee_id: string
          nickname: string
          email: string
          created_at: string
          referral_count: number
        }>
      }
      get_user_by_referral_code: {
        Args: {
          code: string
        }
        Returns: Array<{
          id: string
          nickname: string
          email: string
        }>
      }
      check_and_unlock_rewards: {
        Args: {
          user_uuid: string
        }
        Returns: void
      }
      get_global_stats: {
        Args: Record<string, never>
        Returns: Array<{
          total_users: number
          total_referrals: number
          today_registrations: number
          target_milestone: number
          completion_percentage: number
        }>
      }
      refresh_referral_stats: {
        Args: Record<string, never>
        Returns: void
      }
    }
  }
}

// ================================================
// Helper Types
// ================================================

export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type Referral = Database['public']['Tables']['referrals']['Row']
export type ReferralInsert = Database['public']['Tables']['referrals']['Insert']

export type RewardTier = Database['public']['Tables']['reward_tiers']['Row']
export type UserReward = Database['public']['Tables']['user_rewards']['Row']

export type UserReferralStats = Database['public']['Views']['user_referral_stats_mv']['Row']
export type UserCurrentTier = Database['public']['Views']['user_current_tier']['Row']
export type LeaderboardEntry = Database['public']['Views']['leaderboard']['Row']

export type RegistrationStats = Database['public']['Tables']['registration_stats']['Row']

// ================================================
// API Error & Response Types
// ================================================

/**
 * 구조화된 에러 타입
 * 에러 코드별로 다른 처리가 가능하도록 설계
 */
export interface ApiError {
  code: string;           // 'EMAIL_DUPLICATE', 'NETWORK_ERROR', 'VALIDATION_FAILED' 등
  message: string;        // 사용자에게 표시할 메시지
  details?: unknown;      // 추가 상세 정보 (선택적)
  field?: string;         // 에러가 발생한 필드명 (폼 검증 시 유용)
}

/**
 * 표준 API 응답 타입
 */
export interface ApiResponse<T> {
  data: T | null
  error: ApiError | null
  success: boolean
}

/**
 * 페이지네이션 응답 타입
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    total: number
    page: number
    pageSize: number
    hasNext: boolean
  }
}

// ================================================
// Form Data Types
// ================================================

export interface RegistrationFormData {
  nickname: string
  email: string
  phone?: string
  playstyle?: Playstyle
  referredByCode?: string
  language: Language
}

export interface ReferralSystemData {
  user: User
  stats: UserReferralStats
  recentReferrals: Array<{
    nickname: string
    email: string
    created_at: string
    referral_count: number
  }>
  currentTier: UserCurrentTier | null
  allTiers: RewardTier[]
  unlockedRewards: UserReward[]
}

// ================================================
// Zod Schemas (런타임 검증 + 타입 추론)
// ================================================

/**
 * 회원가입 폼 스키마
 * React Hook Form과 함께 사용
 */
export const RegistrationFormSchema = z.object({
  nickname: z.string()
    .min(2, '닉네임은 최소 2자 이상이어야 합니다')
    .max(50, '닉네임은 최대 50자까지 가능합니다')
    .regex(/^[a-zA-Z0-9가-힣_-]+$/, '닉네임은 영문, 숫자, 한글, _, - 만 사용 가능합니다'),
  
  email: z.string()
    .email('올바른 이메일 형식이 아닙니다')
    .toLowerCase(),
  
  phone: z.string()
    .regex(/^[0-9-+() ]+$/, '올바른 전화번호 형식이 아닙니다')
    .optional()
    .or(z.literal('')),
  
  playstyle: z.enum(PLAYSTYLES, {
    errorMap: () => ({ message: '플레이 스타일을 선택해주세요' })
  }).optional(),
  
  referredByCode: z.string()
    .regex(/^[A-Z0-9]{6,12}$/, '올바른 추천 코드 형식이 아닙니다')
    .optional()
    .or(z.literal('')),
  
  language: z.enum(LANGUAGES).default('ko')
});

// Zod 스키마에서 타입 추론
export type RegistrationFormInput = z.infer<typeof RegistrationFormSchema>;

/**
 * API 에러 스키마
 */
export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
  field: z.string().optional()
});

/**
 * API 응답 스키마 생성 함수
 */
export const createApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => {
  return z.object({
    data: dataSchema.nullable(),
    error: ApiErrorSchema.nullable(),
    success: z.boolean()
  });
};

// ================================================
// Type Guards (타입 가드)
// ================================================

/**
 * Language 타입 가드
 * @example
 * if (isValidLanguage(userInput)) {
 *   // userInput은 이제 Language 타입으로 추론됨
 * }
 */
export function isValidLanguage(value: unknown): value is Language {
  return typeof value === 'string' && LANGUAGES.includes(value as Language);
}

/**
 * Playstyle 타입 가드
 */
export function isValidPlaystyle(value: unknown): value is Playstyle {
  return typeof value === 'string' && PLAYSTYLES.includes(value as Playstyle);
}

/**
 * ApiError 타입 가드
 * @example
 * try {
 *   // API 호출
 * } catch (error) {
 *   if (isApiError(error)) {
 *     console.log(error.code, error.message);
 *   }
 * }
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    typeof (error as ApiError).code === 'string' &&
    typeof (error as ApiError).message === 'string'
  );
}

/**
 * User 객체 검증 (기본 필수 필드만 체크)
 */
export function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'nickname' in value &&
    'email' in value &&
    'referral_code' in value
  );
}

// ================================================
// Utility Types
// ================================================

/**
 * 테이블의 모든 필수 필드를 추출
 */
export type RequiredFields<T> = {
  [K in keyof T as T[K] extends Required<T>[K] ? K : never]: T[K]
}

/**
 * 테이블의 모든 선택적 필드를 추출
 */
export type OptionalFields<T> = {
  [K in keyof T as T[K] extends Required<T>[K] ? never : K]: T[K]
}

/**
 * Partial 타입이지만 특정 필드는 필수로 유지
 */
export type PartialExcept<T, K extends keyof T> = Partial<Omit<T, K>> & Pick<T, K>

// ================================================
// Error Code Constants
// ================================================

/**
 * 표준 에러 코드 정의
 * API 에러 처리 시 일관성 유지
 */
export const ERROR_CODES = {
  // 인증 관련
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  
  // 데이터 검증
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // 중복 관련
  EMAIL_DUPLICATE: 'EMAIL_DUPLICATE',
  NICKNAME_DUPLICATE: 'NICKNAME_DUPLICATE',
  
  // 리소스 관련
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  
  // 추천 시스템 관련
  INVALID_REFERRAL_CODE: 'INVALID_REFERRAL_CODE',
  SELF_REFERRAL_NOT_ALLOWED: 'SELF_REFERRAL_NOT_ALLOWED',
  REFERRAL_LIMIT_EXCEEDED: 'REFERRAL_LIMIT_EXCEEDED',
  
  // 서버/네트워크
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  TIMEOUT: 'TIMEOUT',
  
  // 기타
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

/**
 * 에러 코드별 기본 메시지 매핑
 */
export const ERROR_MESSAGES: Record<ErrorCode, RewardTranslation> = {
  UNAUTHORIZED: {
    ko: '로그인이 필요합니다',
    en: 'Login required',
    ja: 'ログインが必要です'
  },
  FORBIDDEN: {
    ko: '권한이 없습니다',
    en: 'Access forbidden',
    ja: 'アクセス権限がありません'
  },
  VALIDATION_FAILED: {
    ko: '입력값 검증에 실패했습니다',
    en: 'Validation failed',
    ja: '入力値の検証に失敗しました'
  },
  INVALID_INPUT: {
    ko: '잘못된 입력값입니다',
    en: 'Invalid input',
    ja: '無効な入力値です'
  },
  EMAIL_DUPLICATE: {
    ko: '이미 사용 중인 이메일입니다',
    en: 'Email already in use',
    ja: 'すでに使用されているメールアドレスです'
  },
  NICKNAME_DUPLICATE: {
    ko: '이미 사용 중인 닉네임입니다',
    en: 'Nickname already in use',
    ja: 'すでに使用されているニックネームです'
  },
  NOT_FOUND: {
    ko: '요청한 리소스를 찾을 수 없습니다',
    en: 'Resource not found',
    ja: 'リソースが見つかりません'
  },
  ALREADY_EXISTS: {
    ko: '이미 존재하는 데이터입니다',
    en: 'Resource already exists',
    ja: 'すでに存在するデータです'
  },
  INVALID_REFERRAL_CODE: {
    ko: '유효하지 않은 추천 코드입니다',
    en: 'Invalid referral code',
    ja: '無効な紹介コードです'
  },
  SELF_REFERRAL_NOT_ALLOWED: {
    ko: '자기 자신을 추천할 수 없습니다',
    en: 'Self-referral not allowed',
    ja: '自己紹介はできません'
  },
  REFERRAL_LIMIT_EXCEEDED: {
    ko: '추천 가능 횟수를 초과했습니다',
    en: 'Referral limit exceeded',
    ja: '紹介可能回数を超えました'
  },
  NETWORK_ERROR: {
    ko: '네트워크 오류가 발생했습니다',
    en: 'Network error occurred',
    ja: 'ネットワークエラーが発生しました'
  },
  SERVER_ERROR: {
    ko: '서버 오류가 발생했습니다',
    en: 'Server error occurred',
    ja: 'サーバーエラーが発生しました'
  },
  TIMEOUT: {
    ko: '요청 시간이 초과되었습니다',
    en: 'Request timeout',
    ja: 'リクエストタイムアウト'
  },
  UNKNOWN_ERROR: {
    ko: '알 수 없는 오류가 발생했습니다',
    en: 'Unknown error occurred',
    ja: '不明なエラーが発生しました'
  }
};

// ================================================
// Helper Functions
// ================================================

/**
 * ApiError 객체 생성 헬퍼
 * @example
 * throw createApiError('EMAIL_DUPLICATE', { field: 'email' });
 */
export function createApiError(
  code: ErrorCode,
  overrides?: Partial<Omit<ApiError, 'code'>>
): ApiError {
  return {
    code,
    message: overrides?.message || ERROR_MESSAGES[code].ko, // 기본 언어는 한국어
    ...overrides
  };
}

/**
 * ApiResponse 생성 헬퍼 (성공)
 */
export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    data,
    error: null,
    success: true
  };
}

/**
 * ApiResponse 생성 헬퍼 (실패)
 */
export function createErrorResponse(error: ApiError): ApiResponse<never> {
  return {
    data: null,
    error,
    success: false
  };
}
