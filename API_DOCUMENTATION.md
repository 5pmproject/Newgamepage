# API 문서

## 📋 목차
- [Registration API](#registration-api)
- [Referral API](#referral-api)
- [Rewards API](#rewards-api)
- [타입 정의](#타입-정의)
- [에러 처리](#에러-처리)

---

## Registration API

### `createUser(userData: CreateUserRequest): Promise<CreateUserResponse>`

사용자 사전등록을 처리합니다.

**Parameters:**
```typescript
interface CreateUserRequest {
  email: string           // 이메일 (필수)
  nickname: string        // 닉네임 2-50자 (필수)
  phone?: string          // 전화번호 (선택)
  playstyle?: Playstyle   // 'warrior' | 'assassin' | 'mage'
  referredByCode?: string // 추천인 코드 (선택)
  language?: Language     // 'ko' | 'en' | 'ja'
}
```

**Returns:**
```typescript
ApiResponse<User>
```

**Example:**
```typescript
const response = await createUser({
  email: 'player@example.com',
  nickname: 'DarkKnight',
  playstyle: 'warrior',
  language: 'ko',
  referredByCode: 'ABC12345'
})

if (response.success) {
  console.log('User ID:', response.data.id)
  console.log('Referral Code:', response.data.referralCode)
} else {
  console.error(response.error?.message)
}
```

**Validation:**
- 이메일: 유효한 이메일 형식
- 닉네임: 2-50자, 영문/숫자/한글/_/-만 허용
- 전화번호: 숫자, -, +, (), 공백만 허용
- 추천인 코드: 6-12자 영문 대문자 및 숫자

**Error Codes:**
- `EMAIL_DUPLICATE`: 이미 사용 중인 이메일
- `NICKNAME_DUPLICATE`: 이미 사용 중인 닉네임
- `INVALID_REFERRAL_CODE`: 유효하지 않은 추천인 코드
- `VALIDATION_FAILED`: 입력값 검증 실패

---

### `checkEmailExists(email: string): Promise<CheckEmailExistsResponse>`

이메일 중복 확인

**Example:**
```typescript
const response = await checkEmailExists('test@example.com')
if (response.data?.exists) {
  console.log('Email already in use')
}
```

---

### `checkNicknameExists(nickname: string): Promise<CheckNicknameExistsResponse>`

닉네임 중복 확인

**Example:**
```typescript
const response = await checkNicknameExists('Player123')
if (response.data?.exists) {
  console.log('Nickname already taken')
}
```

---

### `getRegistrationStats(): Promise<GetRegistrationStatsResponse>`

전체 등록 통계 조회

**Returns:**
```typescript
ApiResponse<{
  totalUsers: number
  totalReferrals: number
  todayRegistrations: number
  targetMilestone: number
  completionPercentage: number
}>
```

**Example:**
```typescript
const response = await getRegistrationStats()
if (response.success) {
  console.log(`${response.data.totalUsers} / ${response.data.targetMilestone}`)
  console.log(`진행률: ${response.data.completionPercentage}%`)
}
```

---

### `subscribeToRegistrationStats(callback, onError): () => void`

실시간 등록 통계 구독

**Parameters:**
- `callback`: (stats: { totalUsers: number }) => void
- `onError`: (error: Error) => void (선택)

**Returns:** Cleanup 함수

**Example:**
```typescript
const unsubscribe = subscribeToRegistrationStats(
  (stats) => {
    console.log('Total users:', stats.totalUsers)
  },
  (error) => {
    console.error('Subscription error:', error)
  }
)

// 컴포넌트 언마운트 시
unsubscribe()
```

---

## Referral API

### `getReferralStats(userId: string): Promise<GetReferralStatsResponse>`

사용자의 추천인 통계 조회

**Returns:**
```typescript
ApiResponse<{
  stats: ReferralStats
  recentReferrals: RecentReferral[]
}>
```

**Example:**
```typescript
const response = await getReferralStats(userId)
if (response.success) {
  const { stats, recentReferrals } = response.data
  
  console.log('직접 추천:', stats.directReferrals)
  console.log('간접 추천:', stats.indirectReferrals)
  console.log('총 네트워크:', stats.totalPopulation)
  
  recentReferrals.forEach(ref => {
    console.log(`${ref.nickname} - ${ref.createdAt}`)
  })
}
```

---

### `validateReferralCode(code: string): Promise<ValidateReferralCodeResponse>`

추천인 코드 유효성 검증

**Returns:**
```typescript
ApiResponse<{
  valid: boolean
  referrerNickname?: string
  referrerId?: string
}>
```

**Example:**
```typescript
const response = await validateReferralCode('ABC12345')
if (response.data?.valid) {
  console.log('Valid code from:', response.data.referrerNickname)
} else {
  console.log('Invalid code')
}
```

---

### `getReferralLeaderboard(limit?: number): Promise<GetLeaderboardResponse>`

추천인 리더보드 조회

**Parameters:**
- `limit`: number (기본값: 100)

**Example:**
```typescript
const response = await getReferralLeaderboard(10)
if (response.success) {
  response.data?.forEach((entry, index) => {
    console.log(`${entry.rank}. ${entry.nickname}: ${entry.directReferrals}명`)
  })
}
```

---

### `subscribeToReferralUpdates(userId, callback, options): () => void`

실시간 추천인 업데이트 구독

**Example:**
```typescript
const unsubscribe = subscribeToReferralUpdates(
  userId,
  (update) => {
    console.log('New referral count:', update.newReferralCount)
  },
  {
    onConnect: () => console.log('Connected'),
    onError: (error) => console.error(error)
  }
)
```

---

## Rewards API

### `getRewardTiers(): Promise<GetRewardTiersResponse>`

모든 보상 티어 조회

**Returns:**
```typescript
ApiResponse<RewardTier[]>
```

**Example:**
```typescript
const response = await getRewardTiers()
if (response.success) {
  response.data?.forEach(tier => {
    console.log(`${tier.tierName}: ${tier.referralRequirement}명`)
    console.log(tier.rewardTitle.ko)
  })
}
```

---

### `getUserRewards(userId: string): Promise<GetUserRewardsResponse>`

사용자가 획득한 보상 조회

**Example:**
```typescript
const response = await getUserRewards(userId)
if (response.success) {
  response.data?.forEach(reward => {
    console.log('Tier:', reward.tier?.tierName)
    console.log('Unlocked:', reward.unlockedAt)
    console.log('Claimed:', reward.claimed)
  })
}
```

---

### `claimReward(rewardId, userId): Promise<ClaimRewardResponse>`

보상 수령 처리

**Example:**
```typescript
const response = await claimReward(rewardId, userId)
if (response.success) {
  console.log('Reward claimed successfully')
} else {
  if (response.error?.code === 'ALREADY_EXISTS') {
    console.log('Already claimed')
  }
}
```

---

### `getNextTierProgress(userId): Promise<GetNextTierProgressResponse>`

다음 보상 티어까지의 진행률 조회

**Returns:**
```typescript
ApiResponse<{
  tier: RewardTier
  current: number
  required: number
  remaining: number
  percentage: number
} | null>
```

**Example:**
```typescript
const response = await getNextTierProgress(userId)
if (response.data) {
  const { tier, current, required, percentage } = response.data
  console.log(`${tier.tierName}: ${current}/${required} (${percentage}%)`)
} else {
  console.log('Max tier reached!')
}
```

---

### `subscribeToRewardUnlocks(userId, callback, options): () => void`

실시간 보상 잠금 해제 구독

**Example:**
```typescript
const unsubscribe = subscribeToRewardUnlocks(
  userId,
  (reward) => {
    toast.success(`🎉 ${reward.rewardTitle.ko} 획득!`)
  }
)
```

---

## 타입 정의

### User
```typescript
interface User {
  id: string
  email: string
  nickname: string
  phone?: string
  playstyle?: 'warrior' | 'assassin' | 'mage'
  referralCode: string
  referredBy?: string
  language: 'ko' | 'en' | 'ja'
  createdAt: Date
  updatedAt: Date
}
```

### ReferralStats
```typescript
interface ReferralStats {
  userId: string
  nickname: string
  email: string
  referralCode: string
  directReferrals: number
  indirectReferrals: number
  totalPopulation: number
  lastUpdated: Date
}
```

### RewardTier
```typescript
interface RewardTier {
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
```

---

## 에러 처리

### ApiResponse 구조
```typescript
interface ApiResponse<T> {
  data: T | null
  error: ApiError | null
  success: boolean
}

interface ApiError {
  code: string
  message: string
  details?: unknown
  field?: string
}
```

### 에러 코드

| 코드 | 설명 |
|------|------|
| `EMAIL_DUPLICATE` | 이미 사용 중인 이메일 |
| `NICKNAME_DUPLICATE` | 이미 사용 중인 닉네임 |
| `INVALID_REFERRAL_CODE` | 유효하지 않은 추천인 코드 |
| `VALIDATION_FAILED` | 입력값 검증 실패 |
| `NOT_FOUND` | 리소스를 찾을 수 없음 |
| `ALREADY_EXISTS` | 이미 존재하는 데이터 |
| `SERVER_ERROR` | 서버 오류 |
| `NETWORK_ERROR` | 네트워크 오류 |
| `TIMEOUT` | 요청 시간 초과 |

### 에러 처리 예제
```typescript
const response = await createUser(userData)

if (!response.success) {
  switch (response.error?.code) {
    case 'EMAIL_DUPLICATE':
      toast.error('이미 사용 중인 이메일입니다')
      break
    case 'NICKNAME_DUPLICATE':
      toast.error('이미 사용 중인 닉네임입니다')
      break
    case 'INVALID_REFERRAL_CODE':
      toast.error('유효하지 않은 추천인 코드입니다')
      break
    case 'NETWORK_ERROR':
      toast.error('네트워크 연결을 확인해주세요')
      break
    default:
      toast.error(response.error?.message || '오류가 발생했습니다')
  }
}
```

---

**버전:** 1.0.0  
**최종 업데이트:** 2025-11-02

