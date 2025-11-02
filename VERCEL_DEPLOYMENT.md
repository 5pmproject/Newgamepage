# 🚀 Vercel 배포 가이드

**프로젝트**: Realm of Shadows - 사전 예약 랜딩 페이지  
**최종 업데이트**: 2025년 11월 2일

---

## 📋 사전 준비사항

### 1. Supabase 프로젝트 생성 ✅
```bash
1. https://app.supabase.com 접속
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - Name: realm-of-shadows
   - Database Password: (안전한 비밀번호 생성)
   - Region: Northeast Asia (Seoul) - 한국 사용자 대상
4. "Create new project" 클릭 (약 2분 소요)
```

### 2. Supabase 환경 변수 확인 ✅
```bash
1. Supabase Dashboard → Your Project
2. Settings → API
3. 다음 정보 복사:
   - Project URL (VITE_SUPABASE_URL)
   - anon public (VITE_SUPABASE_ANON_KEY)
```

⚠️ **중요**: `service_role` 키는 절대 사용하지 마세요! (서버 전용)

### 3. 데이터베이스 스키마 적용 ✅
```bash
1. Supabase Dashboard → SQL Editor
2. 프로젝트의 database-schema.sql 파일 내용 복사
3. SQL Editor에 붙여넣기
4. "Run" 클릭
5. "Success" 메시지 확인
```

---

## 🔧 로컬 테스트 (선택사항)

배포 전 로컬에서 테스트하려면:

```bash
# 1. 환경 변수 파일 생성
cp .env.local.example .env.local

# 2. .env.local 파일 편집 (VS Code 등)
# VITE_SUPABASE_URL=https://xxxxx.supabase.co
# VITE_SUPABASE_ANON_KEY=xxxxx
# VITE_ENV=development

# 3. 개발 서버 실행
npm run dev

# 4. 브라우저에서 http://localhost:3000 접속

# 5. 프로덕션 빌드 테스트
npm run build
npm run preview
```

---

## 🚀 Vercel 배포 (3가지 방법)

### 방법 1: GitHub 연동 (권장) ⭐

가장 간단하고 자동 배포가 가능합니다.

#### Step 1: GitHub에 푸시
```bash
# 이미 완료된 상태라면 skip
git add .
git commit -m "chore: Vercel 배포 준비 완료"
git push origin main
```

#### Step 2: Vercel에서 Import
```bash
1. https://vercel.com 접속 및 로그인 (GitHub 계정 사용 권장)
2. "Add New..." → "Project" 클릭
3. GitHub 저장소 import:
   - Repository: 5pmproject/Newgamepage 선택
   - "Import" 클릭
```

#### Step 3: 프로젝트 설정
```bash
Framework Preset: Vite
Build Command: npm run build
Output Directory: build
Install Command: npm install
```

#### Step 4: 환경 변수 설정 ⚠️ 필수
```bash
Environment Variables 섹션에서 추가:

Name: VITE_SUPABASE_URL
Value: https://xxxxx.supabase.co
Environment: Production, Preview, Development (모두 체크)

Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGci... (your anon key)
Environment: Production, Preview, Development (모두 체크)

Name: VITE_ENV
Value: production
Environment: Production (만 체크)
```

#### Step 5: 배포 시작
```bash
"Deploy" 버튼 클릭
→ 배포 진행 (약 2-3분)
→ "Visit" 버튼으로 사이트 확인
```

---

### 방법 2: Vercel CLI

터미널에서 직접 배포하는 방법입니다.

```bash
# 1. Vercel CLI 설치
npm install -g vercel

# 2. Vercel 로그인
vercel login

# 3. 프로젝트 초기화
vercel

# 질문에 답변:
# ? Set up and deploy "~/Project/example"? Y
# ? Which scope? (Your account)
# ? Link to existing project? N
# ? What's your project's name? realm-of-shadows
# ? In which directory is your code located? ./
# ? Want to override the settings? N

# 4. 환경 변수 설정
vercel env add VITE_SUPABASE_URL
# 입력: https://xxxxx.supabase.co
# 환경 선택: Production, Preview, Development (모두 선택)

vercel env add VITE_SUPABASE_ANON_KEY
# 입력: your-anon-key
# 환경 선택: Production, Preview, Development (모두 선택)

vercel env add VITE_ENV
# 입력: production
# 환경 선택: Production (만 선택)

# 5. 프로덕션 배포
vercel --prod
```

---

### 방법 3: Vercel Dashboard에서 Git 없이 배포

로컬 파일을 직접 업로드하는 방법입니다.

```bash
# 1. 프로젝트 빌드
npm run build

# 2. Vercel Dashboard
# https://vercel.com/new

# 3. "Deploy" 탭에서 "build" 폴더 드래그 앤 드롭

# 4. 환경 변수 설정 (위와 동일)

# ⚠️ 주의: 이 방법은 자동 배포가 안 됩니다
```

---

## ✅ 배포 후 확인 사항

### 1. 기본 작동 확인
```bash
✓ 페이지 로드 성공
✓ 네비게이션 작동
✓ 언어 전환 (한/영/일)
✓ 스크롤 애니메이션
✓ 반응형 디자인 (모바일/태블릿/데스크톱)
```

### 2. Supabase 연동 확인
```bash
✓ 사전 예약 폼 제출 (콘솔 에러 없음)
✓ Supabase Dashboard → Table Editor → users 테이블에 데이터 확인
✓ 추천인 코드 생성 확인
✓ 실시간 통계 업데이트 확인
```

### 3. 환경 변수 확인
Vercel Dashboard에서:
```bash
Settings → Environment Variables
✓ VITE_SUPABASE_URL 설정됨
✓ VITE_SUPABASE_ANON_KEY 설정됨
✓ VITE_ENV=production (Production만)
```

### 4. 성능 측정
```bash
# Lighthouse 점수 확인
1. Chrome DevTools 열기 (F12)
2. Lighthouse 탭
3. "Analyze page load" 클릭

목표 점수:
✓ Performance: 90+
✓ Accessibility: 95+
✓ Best Practices: 90+
✓ SEO: 95+
```

### 5. SEO 확인
```bash
✓ 메타 태그 확인 (View Page Source)
✓ Open Graph 이미지 (소셜 미디어 공유 테스트)
✓ robots.txt 접근 (https://your-site.vercel.app/robots.txt)
✓ manifest.json 접근 (https://your-site.vercel.app/manifest.json)
```

---

## 🔄 자동 배포 설정 (GitHub 연동 시)

GitHub에 푸시하면 자동으로 배포됩니다:

```bash
# 1. 코드 수정
# 2. Git commit & push
git add .
git commit -m "feat: 새 기능 추가"
git push origin main

# 3. Vercel이 자동으로 감지하고 배포 시작
# 4. Vercel Dashboard에서 배포 진행 상황 확인
# 5. 배포 완료 시 자동으로 URL 업데이트

# Preview 배포 (다른 브랜치)
git checkout -b feature/new-feature
git push origin feature/new-feature
# → Vercel이 미리보기 URL 자동 생성
```

---

## 🌐 커스텀 도메인 설정

### Step 1: 도메인 구입
```bash
# 도메인 구입처 (예시)
- GoDaddy (https://godaddy.com)
- Namecheap (https://namecheap.com)
- 가비아 (https://gabia.com) - 한국
- 후이즈 (https://whois.co.kr) - 한국

# 추천 도메인
- realmofshadows.com
- realm-of-shadows.com
- rosgame.com
```

### Step 2: Vercel에 도메인 추가
```bash
1. Vercel Dashboard → Your Project
2. Settings → Domains
3. "Add" 버튼 클릭
4. 도메인 입력: realmofshadows.com
5. "Add" 클릭
```

### Step 3: DNS 설정
```bash
# Vercel이 제공하는 DNS 레코드를 도메인 제공업체에 추가:

Type: CNAME
Name: www
Value: cname.vercel-dns.com

Type: A
Name: @
Value: 76.76.21.21
```

### Step 4: SSL 인증서
```bash
# Vercel이 자동으로 SSL 인증서 발급 (Let's Encrypt)
# 약 5-10분 소요
# HTTPS 자동 적용
```

---

## 📊 성능 최적화 결과

### 번들 크기 비교
```
이전:
- Main bundle: 246.64 kB (gzip: 78.66 kB)

개선 후:
- React vendor: 141.72 kB (gzip: 45.48 kB)
- Radix UI: 33.36 kB (gzip: 11.75 kB)
- UI utils: 35.75 kB (gzip: 11.06 kB)
- Main bundle: 211.20 kB (gzip: 67.95 kB)

총 감소: 35.44 kB (14% 개선) ✅
```

### 최적화 적용 사항
```
✅ 코드 스플리팅 (5개 청크)
✅ Tree shaking
✅ Minification (esbuild)
✅ CSS 분리
✅ Gzip 압축
✅ 브라우저 캐싱 (31536000초 = 1년)
✅ 보안 헤더 (CSP, X-Frame-Options 등)
```

---

## 🐛 문제 해결 (Troubleshooting)

### 1. 빌드 실패
```bash
# 에러: "Module not found"
→ 해결: npm install 실행

# 에러: "Environment variable not found"
→ 해결: Vercel 환경 변수 재확인

# 에러: "Build exceeded time limit"
→ 해결: Vercel에 문의 (무료 플랜은 45분 제한)
```

### 2. Supabase 연결 오류
```bash
# 에러: "Invalid API key"
→ 해결: VITE_SUPABASE_ANON_KEY 확인 (service_role_key 아님!)

# 에러: "CORS policy error"
→ 해결: Supabase Dashboard → Authentication → URL Configuration
        Site URL에 Vercel URL 추가

# 에러: "Failed to fetch"
→ 해결: 네트워크 탭에서 실제 요청 URL 확인
        VITE_SUPABASE_URL 오타 확인
```

### 3. 환경 변수 인식 안 됨
```bash
# Vercel에서 환경 변수 변경 후:
1. Settings → Deployments
2. 최신 배포 선택
3. "Redeploy" 클릭
4. ✅ "Use existing Build Cache" 체크 해제

# 또는 CLI에서:
vercel env pull
vercel --prod --force
```

### 4. 404 에러 (페이지 새로고침 시)
```bash
# vercel.json 확인:
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}

# 이미 설정되어 있으므로 문제없음 ✅
```

### 5. 느린 로딩 속도
```bash
# Lighthouse로 문제 진단
# 이미지 최적화:
1. public/assets/ 폴더에 이미지가 있다면
2. WebP 형식으로 변환 권장
3. 적절한 크기로 리사이즈

# CDN 활용:
- Vercel의 Edge Network 자동 사용 ✅
```

---

## 📈 모니터링 및 분석

### Vercel Analytics (권장)
```bash
1. Vercel Dashboard → Your Project
2. Analytics 탭
3. "Enable Analytics" (무료: 월 2,500 페이지뷰)

제공 정보:
- 실시간 방문자 수
- 페이지별 트래픽
- 디바이스/브라우저 분석
- Core Web Vitals
```

### Google Analytics 추가 (선택)
```bash
# 1. Google Analytics 계정 생성
# https://analytics.google.com

# 2. 추적 ID 복사 (G-XXXXXXXXXX)

# 3. Vercel 환경 변수 추가
VITE_GA_TRACKING_ID=G-XXXXXXXXXX

# 4. src/main.tsx에 Google Analytics 스크립트 추가
# (필요 시 별도 가이드 참조)
```

### Sentry 에러 추적 (선택)
```bash
# 1. https://sentry.io 가입
# 2. 프로젝트 생성
# 3. DSN 복사
# 4. Vercel 환경 변수 추가
VITE_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

---

## 🎯 배포 체크리스트

배포 전:
- [x] Supabase 프로젝트 생성
- [x] 데이터베이스 스키마 적용
- [x] 환경 변수 준비
- [x] package.json 버전 고정
- [x] 로컬 빌드 테스트
- [x] vercel.json 생성
- [x] Git 커밋 & 푸시

배포 중:
- [ ] Vercel 프로젝트 생성
- [ ] 환경 변수 설정 (3개)
- [ ] 배포 시작
- [ ] 빌드 로그 확인

배포 후:
- [ ] 사이트 접속 확인
- [ ] 기능 테스트 (폼 제출 등)
- [ ] Supabase 연동 확인
- [ ] Lighthouse 점수 측정
- [ ] SEO 확인
- [ ] 모바일 테스트
- [ ] 소셜 미디어 공유 테스트

---

## 📞 지원 및 문서

### 공식 문서
- [Vercel 공식 문서](https://vercel.com/docs)
- [Vite 배포 가이드](https://vitejs.dev/guide/static-deploy.html#vercel)
- [Supabase + Vercel 통합](https://supabase.com/docs/guides/getting-started/quickstarts/vercel)

### 프로젝트 문서
- `DEPLOYMENT_CHECKLIST.md` - 전체 배포 체크리스트
- `SUPABASE_SETUP.md` - Supabase 상세 설정
- `RLS_SECURITY_GUIDE.md` - 데이터베이스 보안
- `API_DOCUMENTATION.md` - API 사용법

---

## 🎉 성공 사례

배포 완료 시 다음 정보를 기록하세요:

```
배포 정보:
- 프로덕션 URL: https://realm-of-shadows.vercel.app
- 커스텀 도메인: https://realmofshadows.com (선택)
- Vercel 프로젝트: https://vercel.com/yourname/realm-of-shadows
- Supabase 프로젝트: https://app.supabase.com/project/xxxxx

성능 지표:
- Lighthouse 점수: ___/100
- 페이지 로드 시간: ___ 초
- First Contentful Paint: ___ 초
- Time to Interactive: ___ 초

배포 일시: 2025년 11월 2일
배포자: ___________
```

---

**문서 버전**: 1.0.0  
**최종 업데이트**: 2025년 11월 2일

배포에 성공하셨나요? 🎉  
문제가 있다면 프로젝트 문서를 참조하거나 이슈를 등록하세요!

