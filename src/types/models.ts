// ================================================
// Business Models (프론트엔드 전용 모델)
// ================================================

import { 
  User as DbUser, 
  Playstyle, 
  Language,
  RewardTier as DbRewardTier,
  UserReward as DbUserReward,
  UserReferralStats as DbUserReferralStats
} from './database'

/**
 * 프론트엔드용 User 모델
 * 날짜 타입을 Date 객체로 변환
 */
export interface User {
  id: string
  email: string
  nickname: string
  phone?: string
  playstyle?: Playstyle
  referralCode: string
  referredBy?: string
  language: Language
  createdAt: Date
  updatedAt: Date
}

/**
 * 추천인 통계 모델
 */
export interface ReferralStats {
  userId: string
  nickname: string
  email: string
  referralCode: string
  directReferrals: number
  indirectReferrals: number
  totalPopulation: number
  lastUpdated: Date
}

/**
 * 보상 티어 모델
 */
export interface RewardTier {
  id: string
  tierName: string
  tierOrder: number
  referralRequirement: number
  rewardTitle: {
    ko: string
    en: string
    ja: string
  }
  rewardDescription: {
    ko: string
    en: string
    ja: string
  }
  createdAt: Date
}

/**
 * 사용자 보상 모델
 */
export interface UserReward {
  id: string
  userId: string
  tierId: string
  tier?: RewardTier
  unlockedAt: Date
  claimed: boolean
  claimedAt?: Date
}

/**
 * 최근 추천인 정보
 */
export interface RecentReferral {
  id: string
  nickname: string
  email: string
  createdAt: Date
  referralCount: number
}

/**
 * 전체 등록 통계
 */
export interface RegistrationStats {
  totalUsers: number
  totalReferrals: number
  todayRegistrations: number
  targetMilestone: number
  completionPercentage: number
}

/**
 * 리더보드 엔트리
 */
export interface LeaderboardEntry {
  rank: number
  nickname: string
  referralCode: string
  directReferrals: number
  totalPopulation: number
}

/**
 * 현재 티어 정보
 */
export interface CurrentTierInfo {
  userId: string
  nickname: string
  directReferrals: number
  tierName: string
  tierOrder: number
  rewardTitle: {
    ko: string
    en: string
    ja: string
  }
  rewardDescription: {
    ko: string
    en: string
    ja: string
  }
  referralRequirement: number
  referralsToNextTier: number
}

/**
 * 다음 보상 티어 진행률
 */
export interface NextTierProgress {
  tier: RewardTier
  current: number
  required: number
  remaining: number
  percentage: number
}

// ================================================
// Conversion Helpers
// ================================================

/**
 * DB User를 Frontend User로 변환
 */
export function dbUserToUser(dbUser: DbUser): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    nickname: dbUser.nickname,
    phone: dbUser.phone || undefined,
    playstyle: dbUser.playstyle || undefined,
    referralCode: dbUser.referral_code,
    referredBy: dbUser.referred_by || undefined,
    language: dbUser.language,
    createdAt: new Date(dbUser.created_at),
    updatedAt: new Date(dbUser.updated_at),
  }
}

/**
 * DB ReferralStats를 Frontend ReferralStats로 변환
 */
export function dbStatsToReferralStats(dbStats: DbUserReferralStats): ReferralStats {
  return {
    userId: dbStats.id,
    nickname: dbStats.nickname,
    email: dbStats.email,
    referralCode: dbStats.referral_code,
    directReferrals: dbStats.direct_referrals,
    indirectReferrals: dbStats.indirect_referrals,
    totalPopulation: dbStats.total_population,
    lastUpdated: new Date(dbStats.last_updated),
  }
}

/**
 * DB RewardTier를 Frontend RewardTier로 변환
 */
export function dbTierToRewardTier(dbTier: DbRewardTier): RewardTier {
  return {
    id: dbTier.id,
    tierName: dbTier.tier_name,
    tierOrder: dbTier.tier_order,
    referralRequirement: dbTier.referral_requirement,
    rewardTitle: dbTier.reward_title,
    rewardDescription: dbTier.reward_description,
    createdAt: new Date(dbTier.created_at),
  }
}

/**
 * DB UserReward를 Frontend UserReward로 변환
 */
export function dbRewardToUserReward(
  dbReward: DbUserReward,
  tier?: DbRewardTier
): UserReward {
  return {
    id: dbReward.id,
    userId: dbReward.user_id,
    tierId: dbReward.tier_id,
    tier: tier ? dbTierToRewardTier(tier) : undefined,
    unlockedAt: new Date(dbReward.unlocked_at),
    claimed: dbReward.claimed,
    claimedAt: dbReward.claimed_at ? new Date(dbReward.claimed_at) : undefined,
  }
}
