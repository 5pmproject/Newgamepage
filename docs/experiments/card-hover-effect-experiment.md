# A/B 테스트 실험 기획서: 캐릭터 카드 Hover 효과

**실험 ID**: `card_hover_effect`  
**작성일**: 2025-11-30  
**상태**: 🟢 Active  
**담당자**: Product Team

---

## 📋 목차

1. [실험 개요](#실험-개요)
2. [배경 및 문제 정의](#배경-및-문제-정의)
3. [가설](#가설)
4. [실험 설계](#실험-설계)
5. [성공 지표](#성공-지표)
6. [샘플 크기 및 실험 기간](#샘플-크기-및-실험-기간)
7. [기술 구현](#기술-구현)
8. [리스크 및 대응방안](#리스크-및-대응방안)
9. [의사결정 기준](#의사결정-기준)
10. [참고자료](#참고자료)

---

## 🎯 실험 개요

### 목적
Realm of Shadows 사전예약 랜딩페이지의 **캐릭터 섹션 카드**에 시각적 인터랙션 효과를 추가하여 사용자 참여도와 클릭률을 향상시킨다.

### 실험 대상
- **페이지**: 사전예약 랜딩페이지 (Pre-registration Landing Page)
- **섹션**: Characters Section (`#characters`)
- **요소**: 캐릭터 카드 3개 (Dark Knight, Shadow Assassin, Flame Mage)

### 비즈니스 목표
- 캐릭터 카드 클릭률 개선
- 사용자 인게이지먼트 증가
- 궁극적으로 사전예약 전환율 향상

---

## 📊 배경 및 문제 정의

### 현재 상황
- **캐릭터 카드 클릭률**: 10%
- **사용자 피드백**: 카드가 클릭 가능한지 명확하지 않다는 의견
- **섹션 체류 시간**: 평균 8초 (개선 필요)

### 문제점
1. **낮은 어포던스 (Affordance)**: 카드가 클릭 가능한 요소임을 시각적으로 전달하지 못함
2. **인터랙션 부족**: 정적인 디자인으로 사용자 참여 유도 부족
3. **주목도 부족**: 다크 판타지 테마에 맞는 시각적 임팩트 미흡

### 기대 효과
- 시각적 피드백 강화로 클릭률 15% 상대 개선 목표 (10% → 11.5%)
- 사용자 경험 개선 및 브랜드 몰입도 향상

---

## 💡 가설

### 주 가설
> **"캐릭터 카드에 hover 시 확대 효과와 골드 그림자를 추가하면, 카드가 클릭 가능한 요소임을 명확히 전달하여 클릭률이 15% 이상 향상될 것이다."**

### 근거
1. **심리적 어포던스**: 확대 및 부상 효과는 "클릭 가능"이라는 시각적 신호 제공
2. **시각적 위계**: 골드 그림자는 다크 판타지 테마와 조화를 이루며 고급스러운 느낌 전달
3. **업계 사례**: 게임 랜딩페이지에서 hover 효과는 클릭률 10-20% 개선 효과 입증됨
4. **사용자 행동**: 마우스 커서 이동 중 시각적 변화는 주목도를 높이고 탐색 행동 유도

### 대안 가설
- **Null Hypothesis (귀무가설)**: Hover 효과는 클릭률에 유의미한 영향을 미치지 않는다.

---

## 🔬 실험 설계

### A/B 테스트 구성

| 항목 | Control (A) | Variant (B) |
|------|-------------|-------------|
| **설명** | 현재 상태 (효과 없음) | 강화된 hover 효과 |
| **트래픽 배분** | 50% | 50% |
| **Hover 효과** | ❌ 없음 | ✅ 있음 |

### Variant (B) 상세 스펙

#### 시각적 효과
```
1. Transform 효과
   - scale: 110% (1.1배 확대)
   - translateY: -8px (위로 튀어나오는 느김)
   - duration: 300ms (부드러운 애니메이션)

2. Shadow 효과
   - 커스텀 골드 그림자: 0 20px 50px rgba(212, 175, 55, 0.4)
   - 브랜드 컬러(#D4AF37) 활용

3. Border 효과
   - 기본: #2A2A2A (다크 그레이)
   - Hover: #D4AF37 (로얄 골드)
```

#### 디자인 원칙
- ✅ 다크 판타지 테마 일관성 유지
- ✅ 골드 컬러 (#D4AF37) 브랜드 아이덴티티 강화
- ✅ 부드러운 애니메이션 (300ms)으로 고급스러움 전달
- ✅ 접근성 준수 (키보드 내비게이션 유지)

### 트래픽 배분 전략
- **전체 트래픽**: 100% 참여
- **Control vs Variant**: 50:50 랜덤 배정
- **세션 기반 고정**: 동일 세션에서 일관된 경험 제공
- **제외 대상**: 봇, 크롤러, 개발자 (exclude flag 설정 시)

---

## 📈 성공 지표

### Primary Metric (주요 지표)
| 지표 | 정의 | 현재 | 목표 | 측정 방법 |
|------|------|------|------|-----------|
| **Card Click Rate** | (카드 클릭 세션 수 / 섹션 뷰 세션 수) × 100 | 10.0% | 11.5%+ | `card_click` / `section_view` |

### Secondary Metrics (보조 지표)
| 지표 | 정의 | 목적 |
|------|------|------|
| **Hover Rate** | 카드 hover 발생 비율 | Variant 그룹의 인터랙션 측정 |
| **Time to Click** | 섹션 진입부터 클릭까지 시간 | 의사결정 속도 측정 |
| **Multiple Clicks** | 2개 이상 카드 클릭한 세션 비율 | 탐색 행동 증가 측정 |

### Guardrail Metrics (가드레일 지표)
| 지표 | 임계값 | 목적 |
|------|--------|------|
| **Page Load Time** | +200ms 이하 | 성능 저하 방지 |
| **Bounce Rate** | +5%p 이하 | UX 악화 방지 |
| **Error Rate** | +1%p 이하 | 기술적 안정성 확보 |

---

## 🕐 샘플 크기 및 실험 기간

### 통계적 검정력 계산

**입력 변수**:
- Baseline Conversion Rate (p1): 10.0%
- Expected Improvement: 15% (상대적)
- Minimum Detectable Effect (MDE): 1.5%p (절대적)
- Significance Level (α): 5% (0.05)
- Statistical Power (1-β): 80% (0.80)

**계산 결과**:
```
최소 샘플 크기 (각 그룹): 2,134 세션
총 샘플 크기 (양쪽): 4,268 세션
```

### 예상 실험 기간

**가정**:
- 일평균 방문자 수: 500명
- 캐릭터 섹션 도달률: 80%
- 일평균 섹션 뷰: 400 세션

**계산**:
```
4,268 세션 ÷ 400 세션/일 = 약 11일

안전 마진 포함: 14일 (2주)
```

### 실험 일정
- **시작일**: 2025-11-30
- **종료일**: 2025-12-14 (예정)
- **중간 점검**: 2025-12-07 (1주차)
- **최종 분석**: 2025-12-15

---

## 🛠 기술 구현

### 아키텍처

```
┌─────────────────────────────────────────────┐
│         ABTestContext (Provider)            │
│  - 실험 배정 관리                             │
│  - Variant 제공                              │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│      CharactersSection Component            │
│  - getVariant('card_hover_effect')          │
│  - Conditional Styling                      │
│  - Event Tracking                           │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│       Experiment Service                    │
│  - getOrAssignExperiment()                  │
│  - trackExperimentEvent()                   │
│  - Supabase Integration                     │
└─────────────────────────────────────────────┘
```

### 주요 컴포넌트

#### 1. 실험 배정 (ABTestContext)
- **위치**: `src/contexts/ABTestContext.tsx`
- **기능**: 세션별 50:50 랜덤 배정, localStorage + Supabase 동기화
- **제외 로직**: 봇/크롤러 자동 감지

#### 2. UI 렌더링 (CharactersSection)
- **위치**: `src/components/CharactersSection.tsx`
- **기능**: Variant별 조건부 스타일 적용
- **주요 함수**:
  - `getCardStyles()`: Transform 효과
  - `getCardContainerStyles()`: Shadow/Border 효과

#### 3. 이벤트 트래킹 (experimentService)
- **위치**: `src/services/experimentService.ts`
- **트래킹 이벤트**:
  - `section_view`: Intersection Observer (30% 가시성)
  - `card_hover`: onMouseEnter (Variant만, 배치 전송)
  - `card_click`: onClick (전환 이벤트)

### 데이터베이스 스키마

#### experiment_assignments
```sql
- session_id (TEXT, PK)
- experiment_id (TEXT, PK)
- variant (TEXT) -- 'control' | 'variant'
- assigned_at (TIMESTAMP)
```

#### experiment_events
```sql
- id (UUID, PK)
- session_id (TEXT)
- experiment_id (TEXT)
- variant (TEXT)
- event_type (TEXT) -- 'section_view' | 'card_hover' | 'card_click'
- event_data (JSONB) -- { character_index, character_name, language }
- created_at (TIMESTAMP)
```

### 모니터링 도구

#### ExperimentMonitor (개발 환경)
- **위치**: `src/components/ExperimentMonitor.tsx`
- **기능**:
  - 실시간 배정 확인
  - 이벤트 트래킹 로그
  - Variant 강제 전환
  - 통계 대시보드

---

## ⚠️ 리스크 및 대응방안

### 기술적 리스크

| 리스크 | 영향도 | 대응방안 |
|--------|--------|----------|
| **성능 저하** | 중 | • CSS transform (GPU 가속) 사용<br>• 애니메이션 최적화 (300ms)<br>• Guardrail 모니터링 |
| **모바일 호환성** | 중 | • 터치 디바이스에서는 hover 효과 비활성화<br>• Media query 조건 추가 검토 |
| **브라우저 호환성** | 하 | • CSS transition 표준 속성 사용<br>• Tailwind CSS 자동 prefix |
| **Supabase 장애** | 중 | • localStorage fallback 구현됨<br>• 클라이언트 랜덤 배정 유지 |

### 비즈니스 리스크

| 리스크 | 영향도 | 대응방안 |
|--------|--------|----------|
| **통계적 유의성 미달** | 중 | • 2주 후 재평가<br>• 샘플 크기 확장 고려 |
| **부정적 결과** | 하 | • Control로 즉시 롤백<br>• 디자인 개선안 재논의 |
| **계절성/외부 요인** | 중 | • 트래픽 소스 분석<br>• 요일별/시간대별 분할 분석 |

### 사용자 경험 리스크

| 리스크 | 영향도 | 대응방안 |
|--------|--------|----------|
| **과도한 애니메이션** | 하 | • 300ms 부드러운 전환<br>• 사용자 피드백 모니터링 |
| **접근성 저하** | 하 | • 키보드 내비게이션 유지<br>• Screen reader 지원 확인 |
| **모션 멀미** | 하 | • `prefers-reduced-motion` 대응 검토 |

---

## ✅ 의사결정 기준

### 실험 성공 조건

#### 1차 목표 (필수)
- ✅ **통계적 유의성**: p-value < 0.05
- ✅ **클릭률 개선**: Control 대비 +1.5%p 이상 (상대적 +15%)
- ✅ **Guardrail 안전**: 모든 가드레일 지표 임계값 내

#### 2차 목표 (선택)
- 🎯 Hover Rate 증가 (Variant)
- 🎯 Multiple Clicks 비율 증가
- 🎯 사용자 피드백 긍정적

### 의사결정 시나리오

#### 시나리오 1: 명확한 승리 (Win)
**조건**:
- p-value < 0.05
- 클릭률 +1.5%p 이상
- Guardrail 모두 통과

**결정**: ✅ **Variant 100% 적용 (Ship)**

---

#### 시나리오 2: 경계선 결과 (Borderline)
**조건**:
- p-value < 0.10 (0.05 < p < 0.10)
- 클릭률 +1.0%p ~ +1.5%p

**결정**: 🔄 **실험 연장 (1주 추가)**

---

#### 시나리오 3: 실패 (Loss)
**조건**:
- p-value > 0.10
- 클릭률 개선 미미 또는 하락

**결정**: ❌ **Control 유지, 디자인 재검토**

---

#### 시나리오 4: Guardrail 위반
**조건**:
- 클릭률 개선 있으나 가드레일 지표 악화
- 예: Page Load Time +300ms, Bounce Rate +8%p

**결정**: ⚠️ **즉시 중단, 기술 최적화 후 재실험**

---

## 📚 참고자료

### 내부 문서
- [데이터베이스 스키마](../../database-schema-experiments.sql)
- [실험 설정 파일](../../src/config/experiments.ts)
- [A/B 테스트 Context](../../src/contexts/ABTestContext.tsx)
- [실험 서비스](../../src/services/experimentService.ts)

### 분석 쿼리
```sql
-- 실시간 클릭률 비교
SELECT 
  variant,
  COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'section_view') as views,
  COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'card_click') as clicks,
  ROUND(
    COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'card_click')::numeric / 
    NULLIF(COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'section_view'), 0) * 100, 
    2
  ) as click_rate
FROM experiment_events
WHERE experiment_id = 'card_hover_effect'
  AND created_at >= '2025-11-30'
GROUP BY variant;

-- 통계적 유의성 검정 (Chi-square test)
-- Supabase에서는 외부 도구 활용 권장
```

### 외부 참고자료
- [A/B Testing Best Practices](https://www.optimizely.com/optimization-glossary/ab-testing/)
- [Sample Size Calculator](https://www.evanmiller.org/ab-testing/sample-size.html)
- [CSS Transform Performance](https://web.dev/animations-guide/)

---

## 📝 변경 이력

| 날짜 | 버전 | 변경 사항 | 작성자 |
|------|------|-----------|--------|
| 2025-11-30 | 1.0 | 초안 작성 및 실험 시작 | Product Team |

---

## 승인

- [ ] Product Manager
- [ ] Engineering Lead
- [ ] Design Lead
- [ ] Data Analyst

---

**문의**: 실험 관련 질문은 `#experiments` 채널로 문의 바랍니다.

