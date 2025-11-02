# 🔥 HOTFIX: Auth Trigger 권한 문제 해결

## 🐛 **문제 상황**

- **증상**: 회원가입 시 `auth.users` 테이블에만 데이터 저장, `public.users` 테이블 비어있음
- **원인**: `supabase_auth_admin` 역할의 `public` 스키마 접근 권한 부족
- **영향**: 사용자 프로필, 추천 시스템, 보상 티어 등 모든 기능 작동 불가

---

## ✅ **해결 방법**

### 🚀 **실행 방법 (3단계)**

#### **1단계: SQL 복사**

`supabase/migrations/001_initial_schema.sql` 파일 전체를 복사하세요.

```bash
# 파일 위치
C:\Project\example\supabase\migrations\001_initial_schema.sql
```

#### **2단계: Supabase에 붙여넣기**

1. **Supabase Dashboard** 접속: https://supabase.com/dashboard
2. 프로젝트 선택: `evkentcvdtpzznmwacqn`
3. 좌측 메뉴 → **SQL Editor** 클릭
4. **"New Query"** 버튼 클릭
5. 복사한 SQL 전체 붙여넣기
6. **"Run"** 버튼 클릭 ⚡

#### **3단계: 결과 확인**

성공 시 아래 메시지가 표시됩니다:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Hotfix Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 Next Steps:
  1. Go to your app: http://localhost:5173
  2. Sign up with a new test user
  3. Check logs: Dashboard → Database → Logs

🔍 Look for these log messages:
  [TRIGGER] Started for email: ...
  [TRIGGER] ✓ Referral code: SHADOWXXXXXXXX
  [TRIGGER] ✓ User profile created
  [TRIGGER] ✅ Complete!

📊 Verify data:
  SELECT email, referral_code FROM public.users ORDER BY created_at DESC LIMIT 3;
```

---

## 🧪 **테스트 (프론트엔드)**

### 회원가입 테스트

```typescript
// ReservationForm.tsx에서 테스트
{
  nickname: "테스트유저",
  email: "testuser@gmail.com",  // ⚠️ 실제 이메일 사용 권장
  password: "Test1234!",
  phone: "010-1234-5678",
  playstyle: "warrior",
  referralCode: "",  // 빈 값으로 테스트
  language: "ko"
}
```

### **예상 결과**

#### ✅ **성공 시:**

```
1. 브라우저: "✅ 등록 완료!" 메시지 표시
2. 추천 코드 생성: SHADOW12AB34CD
3. Supabase Logs에 [TRIGGER] 메시지들 표시
4. public.users 테이블에 데이터 저장 확인
```

#### ❌ **실패 시:**

```
"Database error saving new user" 메시지 표시
→ Supabase Dashboard → Database → Logs 확인 필요
```

---

## 🔍 **로그 확인 방법**

### 1️⃣ **Postgres Logs 접근**

```
Supabase Dashboard 
  → Database (좌측 메뉴)
  → Logs (탭)
  → Postgres Logs (선택)
```

### 2️⃣ **검색 필터 사용**

검색창에 입력:
```
[TRIGGER]
```

### 3️⃣ **성공 로그 예시**

```
2025-11-02 10:30:15 [TRIGGER] Started for email: test@example.com
2025-11-02 10:30:15 [TRIGGER] ✓ Referral code: SHADOW12AB34CD
2025-11-02 10:30:15 [TRIGGER] ✓ Valid referrer found
2025-11-02 10:30:15 [TRIGGER] ✓ User profile created - ID: 550e8400-...
2025-11-02 10:30:15 [TRIGGER] ✅ Complete!
```

### 4️⃣ **에러 로그 예시**

```
2025-11-02 10:30:15 [TRIGGER] Started for email: test@example.com
2025-11-02 10:30:15 [TRIGGER] ✗ Code generation failed: permission denied
2025-11-02 10:30:15 [TRIGGER] 💥 ROLLBACK: permission denied for table users
```

---

## 📊 **데이터 확인 쿼리**

### SQL Editor에서 실행:

```sql
-- 최근 생성된 사용자 확인
SELECT 
    email,
    nickname,
    referral_code,
    referred_by,
    created_at
FROM public.users 
ORDER BY created_at DESC 
LIMIT 5;
```

**예상 결과:**

| email | nickname | referral_code | referred_by | created_at |
|-------|----------|---------------|-------------|------------|
| test@example.com | 테스트유저 | SHADOW12AB34CD | NULL | 2025-11-02 10:30:15 |

---

## ⚠️ **문제 발생 시 해결**

### 🔴 **Case 1: 여전히 public.users 비어있음**

**원인**: 권한이 제대로 적용되지 않음

**해결**:

```sql
-- 권한 재확인
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'supabase_auth_admin'
  AND table_schema = 'public';
```

**결과가 비어있으면**: SQL 스크립트를 다시 실행하세요.

---

### 🟡 **Case 2: 로그에 [TRIGGER] 메시지 없음**

**원인**: 트리거가 실행되지 않음

**해결**:

```sql
-- 트리거 재확인
SELECT * FROM information_schema.triggers 
WHERE trigger_schema = 'auth' 
AND event_object_table = 'users';
```

**결과가 비어있으면**: SQL 스크립트를 다시 실행하세요.

---

### 🟢 **Case 3: Permission Denied 에러**

**원인**: 특정 함수나 테이블에 대한 권한 누락

**해결**:

```sql
-- 강제 권한 재부여
GRANT ALL ON ALL TABLES IN SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO supabase_auth_admin;
```

---

## 📞 **여전히 문제 발생 시**

아래 쿼리 결과를 수집하여 공유해주세요:

```sql
-- 디버깅 정보 수집
SELECT 
    'Trigger Exists' as check_name,
    EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_schema = 'auth' 
        AND trigger_name = 'on_auth_user_created'
    )::text as result

UNION ALL

SELECT 
    'Permission Granted',
    EXISTS (
        SELECT 1 FROM information_schema.role_table_grants 
        WHERE grantee = 'supabase_auth_admin' 
        AND table_name = 'users'
    )::text

UNION ALL

SELECT 
    'Function Exists',
    EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'handle_new_auth_user'
    )::text

UNION ALL

SELECT 
    'Latest User Count',
    COUNT(*)::text 
FROM public.users 
WHERE created_at > NOW() - INTERVAL '1 hour';
```

---

## ✅ **완료 체크리스트**

```
□ SQL 실행 완료 ("✅ Hotfix Complete!" 메시지 확인)
□ 프론트엔드에서 테스트 회원가입 실행
□ Postgres Logs에서 [TRIGGER] 메시지 확인
□ public.users 테이블에 데이터 확인
□ 추천 코드 생성 확인 (SHADOWXXXXXXXX)
□ auth.users와 public.users ID 일치 확인
```

---

## 🔧 **기술 상세**

### 핵심 변경사항

#### 1️⃣ **권한 부여 (GRANT)**

```sql
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON TABLE public.users TO supabase_auth_admin;
GRANT ALL ON TABLE public.referrals TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.generate_referral_code() TO supabase_auth_admin;
```

**설명**: `supabase_auth_admin` 역할이 `public` 스키마의 모든 리소스에 접근 가능하도록 설정

---

#### 2️⃣ **search_path 설정**

```sql
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
...
SET search_path = ''  -- ⭐ 중요!
```

**설명**: 
- Supabase 공식 권장 패턴
- 명시적 스키마 참조 강제 (`public.users`, `public.generate_referral_code()`)
- SQL Injection 공격 방지

---

#### 3️⃣ **SECURITY DEFINER**

```sql
SECURITY DEFINER
```

**설명**: 함수를 소유자(postgres) 권한으로 실행하여 RLS 우회

---

#### 4️⃣ **상세 로깅**

```sql
RAISE NOTICE '[TRIGGER] Started for email: %', NEW.email;
RAISE NOTICE '[TRIGGER] ✓ Referral code: %', new_referral_code;
```

**설명**: 각 단계별 로그 출력으로 디버깅 용이

---

## 📚 **참고 자료**

- [Supabase 공식 문서 - Managing User Data](https://supabase.com/docs/guides/auth/managing-user-data)
- [PostgreSQL SECURITY DEFINER](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## 🎉 **완료!**

이제 회원가입이 정상적으로 작동합니다! 

**다음 단계**: 
1. 테스트 회원가입 진행
2. 추천 시스템 테스트
3. 보상 티어 자동 업데이트 확인

**문제 발생 시**: 위의 트러블슈팅 가이드를 참고하세요! 🚀

