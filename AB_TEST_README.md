# A/B 테스트 시스템 - 실험 2: 카드 호버 효과

## 📋 개요

CharactersSection의 캐릭터 카드에 hover 효과를 추가하여 클릭률 개선을 테스트하는 완전한 A/B 테스트 시스템입니다.

**실험 메타데이터**:
- 현재 전환율: 10%
- 예상 개선율: 6%
- 필요 샘플: 2,134명 (각 그룹 1,067명)
- Impact: 6 / Confidence: 6 / Ease: 8

**Control vs Variant**:
- Control: 기존 border hover만
- Variant: scale + shadow 효과 추가

---

## 🚀 시작하기

### 1. Supabase 데이터베이스 설정

`database-schema-experiments.sql` 파일을 Supabase Dashboard의 SQL Editor에서 실행하세요.

```bash
# Supabase Dashboard
# https://app.supabase.com/project/YOUR_PROJECT/sql

# SQL Editor에서 database-schema-experiments.sql 내용을 복사하여 실행
```

생성되는 테이블:
- `experiment_configs` - 실험 설정
- `experiment_assignments` - 사용자 배정
- `experiment_events` - 이벤트 트래킹

### 2. 환경 변수 확인

`.env.local` 파일에 Supabase 설정이 있는지 확인하세요:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. 개발 서버 실행

```bash
npm install
npm run dev
```

### 4. A/B 테스트 모니터 열기

- 우측 하단의 "A/B Test" 버튼 클릭
- 또는 `Ctrl + Shift + E` 단축키 사용

---

## 📊 시스템 구조

```
A/B 테스트 시스템
├── 백엔드 (Supabase)
│   ├── experiment_configs       # 실험 설정
│   ├── experiment_assignments   # 사용자 배정 (50:50)
│   └── experiment_events        # 이벤트 트래킹
│
├── 프론트엔드
│   ├── Context (ABTestContext)       # 실험 상태 관리
│   ├── Services
│   │   ├── experimentService.ts      # 배정/트래킹
│   │   ├── experimentAnalytics.ts    # 분석/통계
│   │   └── guardrailService.ts       # 안전장치
│   ├── Components
│   │   ├── CharactersSection         # 실험 대상 (UI 변경)
│   │   └── ExperimentMonitor         # 모니터링 대시보드
│   └── Utils
│       └── sampleSizeCalculator.ts   # 샘플 크기 계산
│
└── SQL 함수
    ├── get_experiment_results()      # 실험 결과 조회
    ├── calculate_significance()      # 통계적 유의성
    ├── check_srm()                   # SRM 검증
    └── analyze_segments()            # 세그먼트 분석
```

---

## 🎯 이벤트 트래킹

### 자동 트래킹되는 이벤트

1. **section_view**
   - 트리거: CharactersSection이 viewport에 30% 이상 진입
   - 데이터: `language`

2. **card_hover** (Variant만)
   - 트리거: 카드에 마우스 오버
   - 데이터: `character_index`, `character_name`, `language`
   - 배치 처리: 2초마다 일괄 전송

3. **card_click** (주요 전환 지표)
   - 트리거: 카드 클릭
   - 데이터: `character_index`, `character_name`, `language`

---

## 📈 모니터링 대시보드

### 기능

- **실시간 샘플 크기 진행률**: 목표 대비 현재 샘플 수
- **전환율 비교**: Control vs Variant
- **통계적 유의성**: Z-test 기반 p-value, confidence level
- **Lift (개선율)**: 상대적 개선 비율
- **SRM 감지**: Sample Ratio Mismatch 경고
- **Guardrail 위반**: 실험 중단 조건 모니터링
- **자동 새로고침**: 5분마다

### 사용 방법

1. 개발 서버 실행 (`npm run dev`)
2. 우측 하단 "A/B Test" 버튼 클릭 또는 `Ctrl + Shift + E`
3. 실시간 데이터 확인
4. 새로고침 버튼으로 수동 업데이트 가능

---

## 🔧 개발 도구

### 실험 제외

봇/크롤러 또는 개발자를 실험에서 제외:

```typescript
import { toggleExcludeFromExperiments } from './services/experimentService';

// 콘솔에서 실행
toggleExcludeFromExperiments();
```

### 실험 리셋

```typescript
import { resetExperiment, resetAllExperiments } from './services/experimentService';

// 특정 실험 리셋
resetExperiment('card_hover_effect');

// 모든 실험 리셋
resetAllExperiments();
```

### 로컬스토리지 키

- `experiment_session_id`: 세션 ID
- `exp_card_hover_effect`: 배정된 variant
- `exclude_from_experiments`: 실험 제외 플래그

---

## 📊 통계 분석

### 통계적 유의성 검증 (Z-test)

```sql
SELECT calculate_significance(
  control_clicks INT,
  control_views INT,
  variant_clicks INT,
  variant_views INT
);
```

반환 값:
- `lift`: 개선율 (%)
- `z_score`: Z-score 값
- `p_value`: P-value
- `confidence`: 신뢰도 (%)
- `significant`: p < 0.05 여부

### SRM (Sample Ratio Mismatch) 검증

```sql
SELECT * FROM check_srm('card_hover_effect');
```

예상 비율(50:50)과 실제 배정 비율을 비교합니다.

### 세그먼트 분석

```sql
SELECT * FROM analyze_segments('card_hover_effect');
```

언어별 전환율을 분석합니다.

---

## ⚠️ 주의사항

### GDPR / 개인정보

- 세션 ID는 익명화된 식별자 사용
- 실험 데이터 보관 기간: 90일 권장
- 사용자 동의 없이 개인정보 수집 금지

### 모바일 최적화

- 터치 디바이스에서 hover 효과는 active 상태로 대체
- `@media (hover: none)` 쿼리 활용 권장

### 접근성

- 키보드 네비게이션 시 focus 효과 유지
- ARIA 속성으로 스크린 리더 지원

---

## 🎓 실험 결과 해석

### 최소 샘플 크기 도달 전

- 데이터 수집 중
- 통계적 유의성 판단 불가
- 경향성만 참고

### 최소 샘플 크기 도달 후

#### 1. 통계적으로 유의미한 경우 (p < 0.05)

- Lift가 양수: Variant 승리 → 전체 배포
- Lift가 음수: Control 유지

#### 2. 통계적으로 유의미하지 않은 경우

- 더 많은 샘플 필요
- 또는 실험 효과가 미미함

#### 3. SRM 감지된 경우

- 배정 로직 점검 필요
- 데이터 신뢰도 낮음

#### 4. Guardrail 위반

- 실험 즉시 중지
- 원인 파악 및 수정 후 재시작

---

## 📚 추가 리소스

- [Supabase 문서](https://supabase.com/docs)
- [A/B 테스트 Best Practices](https://www.optimizely.com/optimization-glossary/ab-testing/)
- [통계적 유의성 계산기](https://www.evanmiller.org/ab-testing/sample-size.html)

---

## 🤝 기여

버그 리포트나 기능 제안은 Issues에 등록해주세요.

---

## 📄 라이선스

MIT License

