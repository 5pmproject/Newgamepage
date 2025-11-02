// ================================================
// API Request/Response Types
// ================================================

import { 
  ApiResponse, 
  Playstyle, 
  Language,
  RegistrationFormData
} from './database'
import { 
  User, 
  ReferralStats, 
  UserReward, 
  RecentReferral,
  RegistrationStats,
  RewardTier,
  NextTierProgress,
  LeaderboardEntry
} from './models'

// ================================================
// Registration API
// ================================================

export interface CreateUserRequest {
  email: string
  nickname: string
  phone?: string
  playstyle?: Playstyle
  referredByCode?: string
  language?: Language
}

export type CreateUserResponse = ApiResponse<User>

export interface CheckEmailExistsRequest {
  email: string
}

export type CheckEmailExistsResponse = ApiResponse<{
  exists: boolean
}>

export interface CheckNicknameExistsRequest {
  nickname: string
}

export type CheckNicknameExistsResponse = ApiResponse<{
  exists: boolean
}>

// ================================================
// Referral API
// ================================================

export interface ValidateReferralCodeRequest {
  code: string
}

export type ValidateReferralCodeResponse = ApiResponse<{
  valid: boolean
  referrerNickname?: string
  referrerId?: string
}>

export interface GetReferralStatsRequest {
  userId: string
}

export type GetReferralStatsResponse = ApiResponse<{
  stats: ReferralStats
  recentReferrals: RecentReferral[]
}>

export interface GetReferralNetworkRequest {
  userId: string
  depth?: number
}

export type GetReferralNetworkResponse = ApiResponse<{
  nodes: Array<{
    userId: string
    nickname: string
    referralCode: string
    level: number
    parentId: string | null
  }>
}>

// ================================================
// Rewards API
// ================================================

export interface GetRewardTiersRequest {
  language?: Language
}

export type GetRewardTiersResponse = ApiResponse<RewardTier[]>

export interface GetUserRewardsRequest {
  userId: string
}

export type GetUserRewardsResponse = ApiResponse<UserReward[]>

export interface ClaimRewardRequest {
  rewardId: string
  userId: string
}

export type ClaimRewardResponse = ApiResponse<{
  success: boolean
  reward: UserReward
}>

export interface GetNextTierProgressRequest {
  userId: string
}

export type GetNextTierProgressResponse = ApiResponse<NextTierProgress | null>

// ================================================
// Stats API
// ================================================

export type GetRegistrationStatsResponse = ApiResponse<RegistrationStats>

export interface GetLeaderboardRequest {
  limit?: number
}

export type GetLeaderboardResponse = ApiResponse<LeaderboardEntry[]>

// ================================================
// User API
// ================================================

export interface GetUserByIdRequest {
  userId: string
}

export type GetUserByIdResponse = ApiResponse<User>

export interface GetUserByReferralCodeRequest {
  code: string
}

export type GetUserByReferralCodeResponse = ApiResponse<User>

export interface UpdateUserRequest {
  userId: string
  updates: {
    nickname?: string
    phone?: string
    playstyle?: Playstyle
    language?: Language
  }
}

export type UpdateUserResponse = ApiResponse<User>

// ================================================
// Realtime Subscription Types
// ================================================

export interface RealtimeStatsUpdate {
  totalUsers: number
  cumulativeRegistrations: number
  dailyRegistrations: number
}

export interface RealtimeReferralUpdate {
  userId: string
  newReferral: RecentReferral
  updatedStats: ReferralStats
}

export type RealtimeCallback<T> = (data: T) => void

export interface SubscriptionOptions {
  onError?: (error: Error) => void
  onConnect?: () => void
  onDisconnect?: () => void
}
