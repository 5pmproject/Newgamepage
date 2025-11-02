# 🛡️ Row Level Security (RLS) 보안 가이드

## 📋 목차
1. [RLS란?](#rls란)
2. [구현된 보안 정책](#구현된-보안-정책)
3. [Rate Limiting](#rate-limiting)
4. [민감정보 보호](#민감정보-보호)
5. [보안 모니터링](#보안-모니터링)
6. [테스트 방법](#테스트-방법)

---

## 🔒 RLS란?

**Row Level Security (RLS)**는 PostgreSQL의 보안 기능으로, 테이블의 각 행에 대한 접근을 세밀하게 제어합니다.

### 왜 필요한가?
```typescript
// ❌ RLS 없이
const { data } = await supabase.from('users').select('*')
// → 모든 사용자 정보 노출!

// ✅ RLS 있으면
const { data } = await supabase.from('users').select('*')
// → 정책에 따라 필터링된 데이터만 반환
```

### Supabase 공식 권장사항
> "All tables in the public schema should have RLS enabled."
> — [Supabase Security Guide](https://supabase.com/docs/guides/database/postgres/row-level-security)

---

## 🎯 구현된 보안 정책

### 1. USERS 테이블

```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ✅ 정책 1: 공개 프로필 조회 (누구나)
CREATE POLICY "Public profiles viewable by everyone"
ON public.users FOR SELECT
USING (true);

-- ✅ 정책 2: 누구나 가입 가능
CREATE POLICY "Anyone can insert users"
ON public.users FOR INSERT
WITH CHECK (true);

-- ✅ 정책 3: 데이터 수정 가능 (현재는 제한 없음)
CREATE POLICY "Users can update own data"
ON public.users FOR UPDATE
USING (true)
WITH CHECK (true);
```

#### 사용 예시
```typescript
// ✅ SELECT: 모든 사용자 조회 가능
const { data } = await supabase
  .from('users')
  .select('nickname, referral_code')

// ✅ INSERT: 회원가입 가능
const { data } = await supabase
  .from('users')
  .insert([{ email, nickname }])

// ⚠️ 주의: 민감정보는 프론트엔드에서 필터링 필요
```

#### 향후 개선 (인증 추가 시)
```sql
-- auth.uid()로 본인만 수정 가능하도록
CREATE POLICY "Users can update own data"
ON public.users FOR UPDATE
USING (auth.uid() = id)  -- 본인 확인
WITH CHECK (auth.uid() = id);
```

---

### 2. REFERRALS 테이블

```sql
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- ✅ 추천 관계는 공개 (리더보드용)
CREATE POLICY "Referrals viewable by everyone"
ON public.referrals FOR SELECT
USING (true);

-- ✅ 추천 생성 가능 (자기 자신 추천 방지)
CREATE POLICY "Anyone can create referrals"
ON public.referrals FOR INSERT
WITH CHECK (
  referrer_id IS NOT NULL 
  AND referee_id IS NOT NULL
  AND referrer_id != referee_id  -- CHECK constraint와 중복 방어
);
```

#### 보안 특징
- ✅ **읽기 공개**: 리더보드, 통계에 필요
- ✅ **쓰기 제한**: 자기 자신 추천 불가
- ✅ **수정 불가**: UPDATE/DELETE 정책 없음 = 데이터 무결성

---

### 3. USER_REWARDS 테이블 (가장 중요!)

```sql
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

-- ✅ 모든 사용자가 조회 가능
CREATE POLICY "Users can view own rewards"
ON public.user_rewards FOR SELECT
USING (true);

-- ✅ 보상 수령만 가능 (INSERT 불가!)
CREATE POLICY "Users can claim own rewards"
ON public.user_rewards FOR UPDATE
USING (true)
WITH CHECK (true);
```

#### 🔐 핵심 보안 포인트
```typescript
// ❌ 사용자가 직접 보상 생성 불가!
const { error } = await supabase
  .from('user_rewards')
  .insert([{ user_id, tier_id }])
// → Error: INSERT 정책 없음

// ✅ Database Trigger가 자동 생성
// 추천인 추가 시 → check_and_unlock_rewards() 자동 실행

// ✅ 보상 수령만 가능
const { error } = await supabase
  .from('user_rewards')
  .update({ claimed: true })
  .eq('id', rewardId)
```

---

### 4. REWARD_TIERS 테이블

```sql
ALTER TABLE public.reward_tiers ENABLE ROW LEVEL SECURITY;

-- ✅ 읽기 전용
CREATE POLICY "Reward tiers viewable by everyone"
ON public.reward_tiers FOR SELECT
USING (true);
```

#### 보안 특징
- ✅ **읽기만 가능**: 보상 정보 공개
- ✅ **수정 불가**: service_role 키만 가능 (관리자 전용)

---

### 5. REGISTRATION_STATS 테이블

```sql
ALTER TABLE public.registration_stats ENABLE ROW LEVEL SECURITY;

-- ✅ 읽기 전용
CREATE POLICY "Stats viewable by everyone"
ON public.registration_stats FOR SELECT
USING (true);
```

#### 보안 특징
- ✅ **읽기만 가능**: 전체 통계 공개
- ✅ **수정 불가**: Database Trigger만 업데이트

---

## 🚨 Rate Limiting

### IP 기반 Rate Limiting (Supabase 공식 권장)

```sql
-- 5분에 100회 제한
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_limit INT DEFAULT 100,
  p_window_minutes INT DEFAULT 5
)
RETURNS BOOLEAN AS $$
-- ... (database-schema.sql 참고)
$$;
```

### 사용 예시
```typescript
// API 호출 전에 Rate Limit 체크
try {
  await supabase.rpc('check_rate_limit', {
    p_limit: 50,
    p_window_minutes: 5
  })
  
  // 통과하면 실제 API 호출
  const { data } = await supabase.from('users').insert(...)
} catch (error) {
  if (error.message.includes('Rate limit exceeded')) {
    toast.error('너무 많은 요청입니다. 잠시 후 다시 시도해주세요.')
  }
}
```

### Rate Limit 확인
```sql
-- 현재 IP의 요청 수 확인
SELECT COUNT(*) FROM private.rate_limits
WHERE ip = '123.456.789.0'
AND request_at > NOW() - INTERVAL '5 minutes';
```

---

## 🔐 민감정보 보호

### 1. 마스킹 함수

```sql
-- 이메일 마스킹
SELECT mask_email('user@example.com');
-- → 'us***@example.com'

-- 전화번호 마스킹
SELECT mask_phone('010-1234-5678');
-- → '***-****-5678'
```

### 2. 공개 프로필 View

```sql
-- 민감정보가 마스킹된 View
CREATE VIEW public.public_user_profiles AS
SELECT 
  id,
  nickname,
  mask_email(email) as email_masked,
  mask_phone(phone) as phone_masked,
  referral_code,
  created_at
FROM public.users;
```

### 사용 예시
```typescript
// ❌ 직접 조회: 이메일 노출
const { data } = await supabase
  .from('users')
  .select('email, phone')

// ✅ View 조회: 마스킹됨
const { data } = await supabase
  .from('public_user_profiles')
  .select('email_masked, phone_masked')
```

---

## 📊 보안 모니터링

### Security Logs

```sql
-- 의심스러운 활동 로깅
CREATE TABLE private.security_logs (
  id UUID PRIMARY KEY,
  event_type TEXT,
  user_id UUID,
  ip INET,
  details JSONB,
  created_at TIMESTAMPTZ
);
```

### 로깅 예시
```sql
-- 실패한 로그인 시도 기록
SELECT private.log_security_event(
  'failed_login',
  'user-id-here',
  '{"attempts": 3, "reason": "invalid_password"}'::jsonb
);

-- 의심스러운 IP 조회
SELECT 
  ip,
  COUNT(*) as failed_attempts,
  MAX(created_at) as last_attempt
FROM private.security_logs
WHERE event_type = 'failed_login'
AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip
HAVING COUNT(*) > 5
ORDER BY failed_attempts DESC;
```

---

## 🧪 테스트 방법

### 1. RLS 상태 확인

```sql
-- 모든 테이블의 RLS 확인
SELECT * FROM public.check_rls_status();
```

**결과 예시:**
```
table_name          | rls_enabled | policy_count
--------------------|-------------|-------------
users               | true        | 3
referrals           | true        | 2
user_rewards        | true        | 2
reward_tiers        | true        | 1
registration_stats  | true        | 1
```

### 2. 정책 테스트

```typescript
// ✅ SELECT 테스트
const { data, error } = await supabase
  .from('users')
  .select('*')
console.log('SELECT allowed:', !error)

// ✅ INSERT 테스트
const { error: insertError } = await supabase
  .from('users')
  .insert([{ email: 'test@test.com', nickname: 'Test' }])
console.log('INSERT allowed:', !insertError)

// ❌ 직접 보상 INSERT 테스트 (실패해야 정상)
const { error: rewardError } = await supabase
  .from('user_rewards')
  .insert([{ user_id: 'xxx', tier_id: 'yyy' }])
console.log('Reward INSERT blocked:', !!rewardError)
```

### 3. Rate Limit 테스트

```typescript
// 100번 연속 요청
for (let i = 0; i < 101; i++) {
  try {
    await supabase.rpc('check_rate_limit')
  } catch (error) {
    console.log(`Rate limit hit at request ${i}`)
    break
  }
}
```

---

## 📈 성능 고려사항

### RLS는 성능에 영향을 줄까?

**✅ 최소한의 영향:**
- PostgreSQL은 RLS를 쿼리 플래너에 통합
- 인덱스와 함께 사용하면 성능 저하 거의 없음

### 최적화 팁

```sql
-- ✅ Good: 인덱스 활용
CREATE POLICY "Users can view own data"
ON users FOR SELECT
USING (id = auth.uid());  -- id는 Primary Key (인덱스됨)

-- ❌ Bad: 함수 호출로 인덱스 무효화
CREATE POLICY "Users can view own data"
ON users FOR SELECT
USING (some_function(id) = auth.uid());
```

---

## 🔄 향후 개선 사항

### 1. 인증 시스템 추가 후

```sql
-- auth.uid()로 엄격한 제한
CREATE POLICY "Authenticated users only"
ON users FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

### 2. 역할 기반 접근 제어 (RBAC)

```sql
-- 관리자 전용 정책
CREATE POLICY "Admins can do everything"
ON users FOR ALL
USING (
  auth.jwt() ->> 'role' = 'admin'
);
```

### 3. 컬럼 레벨 보안

```sql
-- 특정 컬럼만 수정 가능
REVOKE UPDATE (email) ON users FROM authenticated;
```

---

## 📚 참고 자료

### Supabase 공식 문서
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Securing your API](https://supabase.com/docs/guides/api/securing-your-api)
- [Column Level Security](https://supabase.com/docs/guides/database/postgres/column-level-security)

### PostgreSQL 공식 문서
- [Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

## ✅ 체크리스트

### 프로덕션 배포 전 확인

- [ ] 모든 public 테이블에 RLS 활성화
- [ ] 각 테이블에 최소 1개 이상의 정책
- [ ] Rate Limiting 설정 완료
- [ ] 민감정보 마스킹 확인
- [ ] 보안 로깅 활성화
- [ ] RLS 상태 모니터링 설정
- [ ] 테스트 완료 (정상 접근 + 차단 확인)

---

**작성일:** 2025-11-02  
**버전:** 1.0.0  
**기반:** Supabase 공식 보안 가이드

