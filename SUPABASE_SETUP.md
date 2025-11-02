# Supabase 백엔드 통합 가이드

## 📋 목차
1. [초기 설정](#초기-설정)
2. [데이터베이스 스키마 생성](#데이터베이스-스키마-생성)
3. [환경 변수 설정](#환경-변수-설정)
4. [API 사용법](#api-사용법)
5. [React Hooks 사용법](#react-hooks-사용법)
6. [트러블슈팅](#트러블슈팅)

---

## 🚀 초기 설정

### 1. Supabase 프로젝트 생성
1. https://supabase.com 접속
2. "New Project" 클릭
3. 프로젝트 정보 입력
4. Region: `Northeast Asia (ap-northeast-1)` 선택

### 2. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일 생성:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ENV=development
```

---

## 🗄️ 데이터베이스 스키마 생성

### Supabase SQL Editor에서 실행

1. Supabase Dashboard → SQL Editor
2. `database-schema.sql` 파일 내용 복사
3. "Run" 클릭하여 실행

### 주요 테이블

```sql
users                   -- 사용자 정보
referrals              -- 추천인 관계
reward_tiers           -- 보상 티어
user_rewards           -- 사용자 보상
registration_stats     -- 등록 통계
```

### Materialized View

```sql
user_referral_stats_mv  -- 추천인 통계 (성능 최적화)
user_current_tier       -- 현재 티어 정보
leaderboard            -- 리더보드
```

---

## 📝 API 사용법

### Registration API

```typescript
import { createUser, getRegistrationStats } from '@/services/registration'

// 사용자 등록
const response = await createUser({
  email: 'user@example.com',
  nickname: 'Player123',
  playstyle: 'warrior',
  language: 'ko',
  referredByCode: 'ABC123', // 선택사항
})

if (response.success) {
  console.log('User registered:', response.data)
  console.log('Referral code:', response.data.referralCode)
} else {
  console.error('Error:', response.error?.message)
}

// 전체 통계 조회
const statsResponse = await getRegistrationStats()
console.log('Total users:', statsResponse.data?.totalUsers)
```

### Referral API

```typescript
import { getReferralStats, validateReferralCode } from '@/services/referral'

// 추천인 통계 조회
const response = await getReferralStats(userId)

if (response.success) {
  console.log('Direct referrals:', response.data.stats.directReferrals)
  console.log('Recent referrals:', response.data.recentReferrals)
}

// 추천 코드 검증
const validation = await validateReferralCode('ABC123')
if (validation.data?.valid) {
  console.log('Valid code from:', validation.data.referrerNickname)
}
```

### Rewards API

```typescript
import { getUserRewards, claimReward } from '@/services/rewards'

// 사용자 보상 조회
const response = await getUserRewards(userId)

if (response.success) {
  response.data?.forEach((reward) => {
    console.log('Tier:', reward.tier?.tierName)
    console.log('Claimed:', reward.claimed)
  })
}

// 보상 수령
const claimResponse = await claimReward(rewardId, userId)
```

---

## 🎣 React Hooks 사용법

### 사전등록 Hook

```tsx
import { useRegistration } from '@/hooks/useRegistration'

function RegistrationForm() {
  const { register, isLoading, error, user } = useRegistration()

  const handleSubmit = async (data) => {
    await register({
      email: data.email,
      nickname: data.nickname,
      language: 'ko',
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* 폼 필드 */}
      {isLoading && <Spinner />}
      {error && <ErrorMessage>{error.message}</ErrorMessage>}
      {user && <Success>등록 완료! 코드: {user.referralCode}</Success>}
    </form>
  )
}
```

### 실시간 통계 Hook

```tsx
import { useRegistrationStats } from '@/hooks/useRegistration'

function StatsDisplay() {
  const { stats, isLoading } = useRegistrationStats({ realtime: true })

  if (isLoading) return <Spinner />

  return (
    <div>
      <h2>현재 {stats?.totalUsers.toLocaleString()}명 등록</h2>
      <Progress value={(stats?.totalUsers / 500000) * 100} />
    </div>
  )
}
```

### 추천인 시스템 Hook

```tsx
import { useReferralStats } from '@/hooks/useReferral'

function ReferralDashboard({ userId }) {
  const { stats, recentReferrals, refresh } = useReferralStats(userId, {
    realtime: true,
  })

  return (
    <div>
      <h2>직접 추천: {stats?.directReferrals}명</h2>
      <h3>총 네트워크: {stats?.totalPopulation}명</h3>
      
      <button onClick={refresh}>새로고침</button>
      
      <ul>
        {recentReferrals.map((ref) => (
          <li key={ref.id}>{ref.nickname}</li>
        ))}
      </ul>
    </div>
  )
}
```

### 보상 시스템 Hook

```tsx
import { useUserRewards, useNextTierProgress } from '@/hooks/useRewards'
import { toast } from 'sonner'

function RewardsPanel({ userId }) {
  const { rewards } = useUserRewards(userId, {
    realtime: true,
    onNewReward: (reward) => {
      toast.success(`🎉 ${reward.rewardTitle.ko} 획득!`)
    },
  })

  const { progress } = useNextTierProgress(userId)

  return (
    <div>
      <h2>획득한 보상</h2>
      {rewards.map((reward) => (
        <RewardCard key={reward.id} reward={reward} />
      ))}

      {progress && (
        <div>
          <h3>다음 보상까지</h3>
          <Progress value={progress.percentage} />
          <p>{progress.remaining}명 남음</p>
        </div>
      )}
    </div>
  )
}
```

### 이메일/닉네임 검증 Hook

```tsx
import { useEmailValidation, useNicknameValidation } from '@/hooks/useRegistration'

function RegistrationForm() {
  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')

  const emailValidation = useEmailValidation(email)
  const nicknameValidation = useNicknameValidation(nickname)

  return (
    <div>
      <Input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {emailValidation.isChecking && <Spinner />}
      {emailValidation.exists && <Error>이미 사용 중</Error>}
      {emailValidation.isAvailable && <Success>사용 가능</Success>}

      <Input
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />
      {nicknameValidation.isChecking && <Spinner />}
      {nicknameValidation.exists && <Error>이미 사용 중</Error>}
      {nicknameValidation.isAvailable && <Success>사용 가능</Success>}
    </div>
  )
}
```

---

## 🔒 보안 고려사항

### ✅ 구현된 보안 기능

1. **Row Level Security (RLS)**
   - 모든 테이블에 RLS 활성화
   - 사용자는 자신의 데이터만 수정 가능

2. **입력 검증**
   - Zod 스키마로 런타임 검증
   - PostgreSQL CHECK 제약조건
   - 이메일/닉네임 형식 검증

3. **에러 처리**
   - 구조화된 에러 타입
   - 사용자 친화적인 에러 메시지
   - 상세 로깅 (개발 환경)

4. **리소스 관리**
   - 자동 구독 정리
   - 메모리 누수 방지
   - Abort Controller로 요청 취소

### ⚠️ 주의사항

```typescript
// ❌ Bad: 환경 변수 노출
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY)

// ✅ Good: 환경 변수는 서버에서만 사용
const apiUrl = import.meta.env.VITE_SUPABASE_URL

// ❌ Bad: 직접 SQL 실행
supabase.rpc('execute_sql', { query: userInput })

// ✅ Good: 타입 안전한 API 사용
await createUser(validatedData)
```

---

## 🐛 트러블슈팅

### 1. "Supabase 환경 변수가 설정되지 않았습니다"

**해결:**
```bash
# .env.local 파일 확인
cat .env.local

# 서버 재시작
npm run dev
```

### 2. "PGRST116: No rows returned"

**원인:** 데이터가 존재하지 않음

**해결:**
```typescript
// maybeSingle() 사용
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .maybeSingle() // null 반환, 에러 X
```

### 3. Materialized View 업데이트 안됨

**해결:**
```sql
-- SQL Editor에서 수동 갱신
SELECT refresh_referral_stats();
```

```typescript
// 또는 API 호출
import { refreshReferralStats } from '@/services/referral'
await refreshReferralStats()
```

### 4. 실시간 구독 작동 안함

**확인 사항:**
1. Supabase Dashboard → Database → Replication 확인
2. 테이블의 `realtime` 설정 활성화
3. 구독 cleanup이 제대로 되는지 확인

```typescript
useEffect(() => {
  const cleanup = subscribeToStats(callback)
  
  // cleanup 반드시 반환
  return cleanup
}, [])
```

### 5. 타입 에러

**해결:**
```bash
# TypeScript 타입 재생성
npm run types:generate

# 또는 수동으로 database.ts 업데이트
```

---

## 📊 성능 최적화

### Materialized View 갱신 전략

```typescript
// 1. 실시간 갱신 (부하 높음)
// trigger_refresh_stats 활성화

// 2. 주기적 갱신 (권장)
useInterval(() => {
  refreshReferralStats()
}, 60000) // 1분마다

// 3. 온디맨드 갱신
<button onClick={refreshReferralStats}>
  새로고침
</button>
```

### 쿼리 최적화

```typescript
// ❌ Bad: N+1 쿼리
for (const user of users) {
  const stats = await getReferralStats(user.id)
}

// ✅ Good: JOIN 사용
const { data } = await supabase
  .from('users')
  .select(`
    *,
    stats:user_referral_stats_mv(*)
  `)
```

---

## 📚 추가 리소스

- [Supabase 공식 문서](https://supabase.com/docs)
- [PostgreSQL 공식 문서](https://www.postgresql.org/docs/)
- [React Query + Supabase](https://supabase.com/docs/guides/getting-started/tutorials/with-react)

---

## 🎯 다음 단계

1. ✅ Supabase 초기 설정 완료
2. ✅ 데이터베이스 스키마 생성
3. ✅ API 서비스 레이어 구현
4. ⏭️ 기존 컴포넌트에 통합
5. ⏭️ 에러 처리 및 로딩 상태 추가
6. ⏭️ 실시간 기능 테스트

---

**작성일:** 2025-11-02  
**버전:** 1.0.0  
**프로젝트:** Realm of Shadows Pre-registration

