# SQL 에러 수정 가이드

## 🐛 에러 1: Functions in index predicate must be marked IMMUTABLE

### 에러 메시지
```
ERROR: 42P17: functions in index predicate must be marked IMMUTABLE
```

### 원인
```sql
-- ❌ 잘못된 코드
CREATE INDEX idx_rate_limits_cleanup ON private.rate_limits (request_at)
WHERE request_at < NOW() - INTERVAL '30 days';
```

**문제점:**
- `NOW()`는 **VOLATILE** 함수 (매번 다른 값 반환)
- 인덱스 predicate(WHERE 절)에는 **IMMUTABLE** 함수만 사용 가능
- IMMUTABLE = 같은 입력에 항상 같은 결과 반환하는 함수

### 해결 방법

#### ✅ 방법 1: Predicate 제거 (권장)
```sql
-- 단순히 시간순 인덱스만 생성
CREATE INDEX idx_rate_limits_cleanup ON private.rate_limits (request_at ASC);
```

**장점:**
- 에러 없음
- cleanup 함수에서 WHERE 조건으로 필터링하면 인덱스 활용 가능
- 더 단순하고 유지보수 쉬움

#### ✅ 방법 2: Partial Index 대신 Function 사용
```sql
-- cleanup 함수에서 직접 필터링
DELETE FROM private.rate_limits
WHERE request_at < NOW() - INTERVAL '30 days';
```

---

## 📊 비교표

| 방식 | Predicate with NOW() | Simple Index |
|------|---------------------|--------------|
| **에러 발생** | ❌ Yes | ✅ No |
| **성능** | ⚠️ 더 좋음 (작은 인덱스) | ✅ 충분히 빠름 |
| **유지보수** | ❌ 복잡 | ✅ 단순 |
| **권장** | ❌ | ✅ |

---

## 🔍 PostgreSQL 함수 분류

### VOLATILE (기본값)
```sql
-- 매번 다른 값 반환 가능
NOW()           -- 현재 시간
random()        -- 난수
currval()       -- 시퀀스 값
```

### STABLE
```sql
-- 같은 트랜잭션 내에서는 같은 값
CURRENT_DATE    -- 오늘 날짜 (트랜잭션 시작 시간 기준)
```

### IMMUTABLE
```sql
-- 항상 같은 입력에 같은 출력
LENGTH('test')  -- 항상 4
UPPER('hello')  -- 항상 'HELLO'
```

### 인덱스에 사용 가능한 함수
```sql
-- ✅ IMMUTABLE만 가능
CREATE INDEX idx ON table (UPPER(column));  -- OK
CREATE INDEX idx ON table (column) WHERE LENGTH(column) > 5;  -- OK

-- ❌ VOLATILE/STABLE 불가
CREATE INDEX idx ON table (column) WHERE created_at > NOW();  -- ERROR
```

---

## 🛠️ 추가 수정 사항

### Rate Limit Cleanup 최적화

원래 의도: "30일 이상 지난 데이터만 인덱스"
→ 실제로는 cleanup 함수에서 필터링하면 충분!

```sql
-- ✅ 최적화된 cleanup 함수
CREATE OR REPLACE FUNCTION private.cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  -- 인덱스 활용: request_at 순으로 정렬되어 있음
  DELETE FROM private.rate_limits
  WHERE request_at < NOW() - INTERVAL '30 days';
  
  -- 삭제된 행 수 로깅 (선택)
  RAISE NOTICE 'Deleted % old rate limit records', 
    (SELECT COUNT(*) FROM private.rate_limits 
     WHERE request_at < NOW() - INTERVAL '30 days');
END;
$$ LANGUAGE plpgsql;
```

---

## 📚 PostgreSQL 공식 문서

- [Partial Indexes](https://www.postgresql.org/docs/current/indexes-partial.html)
- [Function Volatility](https://www.postgresql.org/docs/current/xfunc-volatility.html)
- [Index Only Scans](https://www.postgresql.org/docs/current/indexes-index-only-scans.html)

---

## ✅ 최종 확인

### 1. SQL 재실행
Supabase SQL Editor에서 수정된 `database-schema.sql` 다시 실행

### 2. 인덱스 확인
```sql
-- 생성된 인덱스 확인
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'private'
ORDER BY tablename, indexname;
```

**예상 결과:**
```
indexname                   | indexdef
----------------------------|------------------------------------------
idx_rate_limits_cleanup     | CREATE INDEX ... (request_at ASC)
idx_rate_limits_ip_time     | CREATE INDEX ... (ip, request_at DESC)
```

### 3. 성능 테스트
```sql
-- cleanup 실행 시 인덱스 사용 확인
EXPLAIN ANALYZE
DELETE FROM private.rate_limits
WHERE request_at < NOW() - INTERVAL '30 days';
```

**좋은 결과 예시:**
```
Index Scan using idx_rate_limits_cleanup on rate_limits
  Filter: (request_at < (now() - '30 days'::interval))
```

---

## 🎯 핵심 교훈

### ❌ 하지 말 것
```sql
-- VOLATILE 함수를 인덱스 predicate에 사용
CREATE INDEX idx ON table (col) WHERE created_at > NOW();

-- 동적 값을 인덱스 조건에 사용
CREATE INDEX idx ON table (col) WHERE status = current_setting('app.status');
```

### ✅ 해야 할 것
```sql
-- 단순한 인덱스 생성
CREATE INDEX idx ON table (created_at);

-- 함수에서 동적 필터링
SELECT * FROM table WHERE created_at > NOW() - INTERVAL '30 days';
-- → 인덱스 자동 활용됨
```

---

**수정 완료! 이제 에러 없이 SQL 실행 가능합니다.** ✅

