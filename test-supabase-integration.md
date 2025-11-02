# 🧪 Supabase 연동 기능 테스트 가이드

## 📋 테스트 체크리스트

### ✅ 사전 준비
- [x] 개발 서버 실행 (`npm run dev`)
- [ ] Supabase SQL 스크립트 실행 완료
- [ ] 브라우저 http://localhost:5173 접속 확인
- [ ] 브라우저 개발자 도구 (F12) 열기

---

## 🧪 **테스트 시나리오**

---

### 📝 **Test 1: 회원가입 (핵심 기능)**

#### 목적
- Auth 트리거가 정상 작동하는지 확인
- public.users에 데이터 자동 생성 확인
- 추천 코드 자동 생성 확인

#### 실행 방법

1. **브라우저**: http://localhost:5173
2. **"사전등록하기"** 버튼 클릭
3. **Step 1 - 기본 정보 입력**:
   ```
   닉네임: TestUser001
   이메일: test001@gmail.com  (실제 이메일 사용!)
   비밀번호: Test1234!
   ```

4. **Step 2 - 플레이스타일 선택**: `전사` 선택

5. **Step 3 - 추천 코드**: 비워두고 진행

6. **"사전예약하기"** 버튼 클릭

#### 예상 결과 ✅

**브라우저 화면**:
```
✅ 등록 완료!
🎁 추천 코드: SHADOW12AB34CD
```

**F12 Console**:
```javascript
// 에러 없음
```

**F12 Network 탭**:
```
POST /auth/v1/signup → Status: 200 OK
GET /rest/v1/users → Status: 200 OK
```

#### 검증 쿼리 (Supabase SQL Editor)

```sql
-- 1. auth.users 확인
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'test001@gmail.com';

-- 2. public.users 확인 (핵심!)
SELECT id, email, nickname, referral_code, created_at
FROM public.users 
WHERE email = 'test001@gmail.com';

-- 3. 두 테이블의 ID가 동일한지 확인
SELECT 
    au.email AS auth_email,
    pu.email AS public_email,
    au.id = pu.id AS ids_match,
    pu.referral_code
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'test001@gmail.com';
```

**예상 결과**:
- `ids_match`: `true`
- `referral_code`: `SHADOWXXXXXXXX` (8자리)

#### 트러블슈팅

**실패 Case 1**: public.users 비어있음
```
원인: SQL 스크립트 미실행
해결: Supabase SQL Editor에서 001_initial_schema.sql 실행
```

**실패 Case 2**: 400 Bad Request
```
원인: 비밀번호 형식 오류
해결: Test1234! (대소문자+숫자 필수)
```

**실패 Case 3**: Email already registered
```
원인: 이미 사용된 이메일
해결: 다른 이메일 사용 (test002@gmail.com)
```

---

### 🔗 **Test 2: 추천 시스템**

#### 목적
- 추천 코드 검증 기능 확인
- 추천 관계 자동 생성 확인
- 보상 티어 자동 업데이트 확인

#### 실행 방법

**Phase 1: 추천인 회원가입**
1. Test 1 완료 → 추천 코드 복사: `SHADOW12AB34CD`

**Phase 2: 피추천인 회원가입**
2. **새 시크릿 창**으로 http://localhost:5173 접속
3. **"사전등록하기"** 버튼 클릭
4. 정보 입력:
   ```
   닉네임: TestUser002
   이메일: test002@gmail.com
   비밀번호: Test1234!
   플레이스타일: 암살자
   추천 코드: SHADOW12AB34CD  ⭐ (Test 1의 코드)
   ```
5. 회원가입 완료

#### 예상 결과 ✅

**추천인 (TestUser001)**:
- 보상 티어: 0 → 1 자동 업그레이드

**피추천인 (TestUser002)**:
- `referred_by`: TestUser001의 ID

#### 검증 쿼리

```sql
-- 1. 추천 관계 확인
SELECT 
    u1.nickname AS referrer,
    u1.referral_code,
    u2.nickname AS referred,
    u2.referred_by,
    u1.id = u2.referred_by AS relationship_valid
FROM public.users u1
JOIN public.users u2 ON u1.id = u2.referred_by
WHERE u1.email = 'test001@gmail.com';

-- 2. referrals 테이블 확인
SELECT 
    r.id,
    u1.nickname AS referrer,
    u2.nickname AS referred,
    r.created_at
FROM public.referrals r
JOIN public.users u1 ON r.user_id = u1.id
JOIN public.users u2 ON r.referred_user_id = u2.id
WHERE u1.email = 'test001@gmail.com';

-- 3. 보상 티어 확인
SELECT 
    nickname,
    email,
    reward_tier,
    (SELECT COUNT(*) FROM public.users WHERE referred_by = u.id) AS referral_count
FROM public.users u
WHERE email = 'test001@gmail.com';
```

**예상 결과**:
- `relationship_valid`: `true`
- `reward_tier`: `1`
- `referral_count`: `1`

---

### 📊 **Test 3: 추천 통계 조회**

#### 목적
- `get_user_referral_stats()` 함수 작동 확인
- 재귀 쿼리 성능 확인

#### 실행 방법

**브라우저**:
1. TestUser001로 로그인 (추천인)
2. "나의 제국" 섹션 확인
3. 통계 표시 확인:
   ```
   직접 추천: 1명
   전체 인구: 1명
   보상 티어: 1단계
   ```

#### 검증 쿼리

```sql
-- get_user_referral_stats 함수 직접 호출
SELECT * FROM public.get_user_referral_stats(
    (SELECT id FROM public.users WHERE email = 'test001@gmail.com')
);
```

**예상 결과**:
```
user_id: xxx-xxx-xxx
direct_referrals: 1
total_population: 1
reward_tier: 1
referral_names: ["TestUser002"]
```

---

### 🔢 **Test 4: 전체 등록 수 조회**

#### 목적
- `get_total_registrations()` 함수 확인
- RewardsSection 실시간 카운터 확인

#### 실행 방법

**브라우저**:
1. 메인 페이지 스크롤
2. "보상 시스템" 섹션 확인
3. "현재 사전등록: X명" 표시 확인

#### 검증 쿼리

```sql
-- 전체 등록 수 조회
SELECT public.get_total_registrations();

-- 수동 카운트 (검증용)
SELECT COUNT(*) FROM public.users;
```

**두 결과가 동일해야 함**

---

### 🔐 **Test 5: 로그인 & 세션 관리**

#### 목적
- 로그인 기능 확인
- 세션 유지 확인
- AuthContext 작동 확인

#### 실행 방법

1. **로그아웃** (현재 로그인 상태라면)
2. **"로그인"** 버튼 클릭 (있다면)
3. 정보 입력:
   ```
   이메일: test001@gmail.com
   비밀번호: Test1234!
   ```
4. 로그인 성공 확인

#### 예상 결과 ✅

**F12 Console**:
```javascript
// AuthContext에서 user 객체 로드 확인
{
  user: {
    id: "xxx",
    email: "test001@gmail.com",
    nickname: "TestUser001",
    referral_code: "SHADOW12AB34CD"
  }
}
```

#### 검증

**F12 Application 탭**:
```
Local Storage → supabase.auth.token 확인
Session Storage 확인
```

---

### 🔍 **Test 6: 추천 코드 검증**

#### 목적
- `validate_referral_code_public()` 함수 확인
- 잘못된 코드 처리 확인

#### 실행 방법

**Phase 1: 유효한 코드**
1. 회원가입 화면 → 추천 코드 입력
2. `SHADOW12AB34CD` 입력 (Test 1의 코드)
3. 다음 단계 진행 → 에러 없어야 함

**Phase 2: 무효한 코드**
1. 회원가입 화면 → 추천 코드 입력
2. `SHADOWINVALID` 입력
3. 에러 메시지 확인:
   ```
   ❌ 유효하지 않은 추천 코드입니다.
   ```

#### 검증 쿼리

```sql
-- 함수 직접 호출
SELECT public.validate_referral_code_public('SHADOW12AB34CD');  -- true
SELECT public.validate_referral_code_public('SHADOWINVALID');   -- false
```

---

### 🛡️ **Test 7: Row Level Security (RLS)**

#### 목적
- RLS 정책 작동 확인
- 본인 데이터만 조회 가능 확인

#### 실행 방법

**F12 Console에서 실행**:

```javascript
// Supabase 클라이언트 가져오기
const { supabase } = window;

// 1. 본인 데이터 조회 (성공해야 함)
const { data: myData, error: myError } = await supabase
  .from('users')
  .select('*')
  .eq('email', 'test001@gmail.com');

console.log('My Data:', myData);  // ✅ 데이터 반환

// 2. 다른 사람 데이터 조회 (실패해야 함)
const { data: otherData, error: otherError } = await supabase
  .from('users')
  .select('*')
  .eq('email', 'test002@gmail.com');

console.log('Other Data:', otherData);  // ❌ 빈 배열 또는 에러
```

#### 예상 결과

- 본인 데이터: ✅ 조회 성공
- 타인 데이터: ❌ 조회 실패 (RLS 작동)

---

### 📤 **Test 8: 이메일 인증**

#### 목적
- 이메일 인증 플로우 확인
- email_verified 상태 확인

#### 실행 방법

1. 회원가입 시 입력한 이메일 확인
2. Supabase 인증 이메일 확인
3. **"Confirm your email"** 링크 클릭
4. Redirect 확인

#### 검증 쿼리

```sql
-- 이메일 인증 상태 확인
SELECT 
    email,
    email_verified,
    created_at
FROM public.users
WHERE email = 'test001@gmail.com';
```

**초기**: `email_verified: false`  
**인증 후**: `email_verified: true`

---

## 🔍 **Supabase Logs 확인**

### 로그 접근

```
Supabase Dashboard
→ Database
→ Logs
→ Postgres Logs
```

### 검색 필터

```
[TRIGGER]
```

### 예상 로그 (성공 시)

```
2025-11-02 10:30:15 [TRIGGER] Started for email: test001@gmail.com
2025-11-02 10:30:15 [TRIGGER] ✓ Referral code: SHADOW12AB34CD
2025-11-02 10:30:15 [TRIGGER] ✓ User profile created - ID: xxx
2025-11-02 10:30:15 [TRIGGER] ✅ Complete!

2025-11-02 10:32:20 [TRIGGER] Started for email: test002@gmail.com
2025-11-02 10:32:20 [TRIGGER] ✓ Referral code: SHADOW98FE76DC
2025-11-02 10:32:20 [TRIGGER] ✓ Valid referrer found
2025-11-02 10:32:20 [TRIGGER] ✓ User profile created - ID: yyy
2025-11-02 10:32:20 [TRIGGER] ✅ Complete!
```

---

## 📊 **최종 검증 쿼리**

### 전체 데이터 확인

```sql
-- 1. 전체 사용자 목록
SELECT 
    nickname,
    email,
    referral_code,
    reward_tier,
    (SELECT COUNT(*) FROM public.users WHERE referred_by = u.id) AS referrals,
    created_at
FROM public.users u
ORDER BY created_at DESC;

-- 2. 추천 네트워크
SELECT 
    u1.nickname AS referrer,
    u1.referral_code AS referrer_code,
    u1.reward_tier,
    COUNT(u2.id) AS total_referrals,
    STRING_AGG(u2.nickname, ', ') AS referred_users
FROM public.users u1
LEFT JOIN public.users u2 ON u1.id = u2.referred_by
GROUP BY u1.id, u1.nickname, u1.referral_code, u1.reward_tier
ORDER BY total_referrals DESC;

-- 3. 시스템 통계
SELECT 
    'Total Users' AS metric,
    COUNT(*)::TEXT AS value
FROM public.users

UNION ALL

SELECT 
    'Total Referrals',
    COUNT(*)::TEXT
FROM public.referrals

UNION ALL

SELECT 
    'Users with Tier 1+',
    COUNT(*)::TEXT
FROM public.users
WHERE reward_tier >= 1

UNION ALL

SELECT 
    'Average Referrals',
    ROUND(AVG(referral_count), 2)::TEXT
FROM (
    SELECT COUNT(*) AS referral_count
    FROM public.users
    GROUP BY referred_by
    HAVING referred_by IS NOT NULL
) sub;
```

---

## ✅ **최종 체크리스트**

### 기본 기능
- [ ] Test 1: 회원가입 성공
- [ ] Test 1: public.users에 데이터 저장 확인
- [ ] Test 1: 추천 코드 자동 생성 확인

### 추천 시스템
- [ ] Test 2: 추천 코드로 회원가입 성공
- [ ] Test 2: 추천 관계 자동 생성 확인
- [ ] Test 2: 보상 티어 자동 업데이트 확인
- [ ] Test 3: 추천 통계 조회 성공

### 보안 & 인증
- [ ] Test 5: 로그인 성공
- [ ] Test 7: RLS 정책 작동 확인
- [ ] Test 8: 이메일 인증 플로우 확인

### 함수 & API
- [ ] Test 4: 전체 등록 수 조회 성공
- [ ] Test 6: 추천 코드 검증 성공

### 로그 & 모니터링
- [ ] Supabase Logs에서 [TRIGGER] 메시지 확인
- [ ] 브라우저 Console에 에러 없음 확인
- [ ] Network 탭에서 API 요청 성공 확인

---

## 🚨 **알려진 이슈 & 해결**

### Issue 1: public.users 비어있음
```
원인: SQL 스크립트 미실행 또는 트리거 권한 부족
해결: 001_initial_schema.sql 재실행
```

### Issue 2: Rate Limit (429 에러)
```
원인: 같은 이메일로 여러 번 시도
해결: 5분 대기 또는 새 이메일 사용
```

### Issue 3: 추천 코드 형식 오류
```
원인: 6자리 검증 (구버전)
해결: validation.ts에서 8자리로 수정됨 확인
```

---

## 📞 **문제 발생 시**

### 디버깅 정보 수집

```sql
-- 시스템 상태 점검
SELECT 
    'Trigger Exists' AS check,
    EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created'
    )::TEXT AS result

UNION ALL

SELECT 
    'Permission Granted',
    EXISTS (
        SELECT 1 FROM information_schema.role_table_grants 
        WHERE grantee = 'supabase_auth_admin' 
        AND table_name = 'users'
    )::TEXT

UNION ALL

SELECT 
    'Function Exists',
    EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'handle_new_auth_user'
    )::TEXT

UNION ALL

SELECT 
    'Total Users',
    COUNT(*)::TEXT
FROM public.users;
```

이 결과를 공유하시면 정확한 진단이 가능합니다!

---

## 🎉 **모든 테스트 통과 시**

축하합니다! 🎊

Supabase 연동이 완벽하게 작동하고 있습니다:
- ✅ Auth 트리거 작동
- ✅ 추천 시스템 작동
- ✅ 보상 티어 자동 업데이트
- ✅ RLS 보안 작동
- ✅ 모든 함수 정상 작동

**다음 단계**: 프로덕션 배포 준비! 🚀

