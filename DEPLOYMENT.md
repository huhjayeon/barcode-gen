# 배포 가이드

## Vercel 배포 (권장)

### 1단계: GitHub 저장소 생성

```bash
git init
git add .
git commit -m "Initial commit: Barcode Generator"
git remote add origin https://github.com/your-username/barcode-gen.git
git push -u origin main
```

### 2단계: Vercel 배포

1. [Vercel](https://vercel.com)에 로그인
2. "New Project" 클릭
3. GitHub 저장소 연결
4. 프로젝트 설정:
   - Framework Preset: **Next.js** (자동 감지)
   - Root Directory: `./`
   - Build Command: `npm run build` (기본값)
   - Output Directory: `.next` (기본값)
   - Install Command: `npm install` (기본값)

5. "Deploy" 클릭

### 3단계: 환경 변수 (필요 시)

현재 이 프로젝트는 환경 변수가 필요하지 않습니다.

### 4단계: 도메인 설정 (선택)

1. Vercel 프로젝트 > Settings > Domains
2. 커스텀 도메인 추가
3. DNS 레코드 설정 (A 또는 CNAME)

## Netlify 배포

### 1단계: GitHub 저장소 생성

위와 동일

### 2단계: Netlify 배포

1. [Netlify](https://netlify.com)에 로그인
2. "New site from Git" 클릭
3. GitHub 저장소 선택
4. 빌드 설정:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: 18 이상

5. "Deploy site" 클릭

### 주의사항

- Netlify는 Next.js의 일부 서버리스 기능에 제한이 있을 수 있습니다.
- Vercel 배포를 권장합니다.

## 자체 호스팅 (VPS/AWS/GCP)

### Docker 사용

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### PM2 사용

```bash
npm install -g pm2
npm run build
pm2 start npm --name "barcode-gen" -- start
pm2 save
pm2 startup
```

## 성능 최적화

### 1. Lighthouse 점수 확인

```bash
npm install -g lighthouse
lighthouse https://your-domain.com --view
```

목표:
- Performance: 95+
- Accessibility: 90+
- Best Practices: 100
- SEO: 100

### 2. 캐싱 설정

Vercel은 자동으로 최적화된 캐싱을 제공합니다.

### 3. CDN 설정

Vercel Edge Network가 자동으로 활성화됩니다.

## 모니터링

### Vercel Analytics (무료)

1. Vercel 대시보드 > Analytics 탭
2. 방문자 통계, 성능 메트릭 확인

### Sentry 통합 (선택)

```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

## 트러블슈팅

### 빌드 실패

```bash
# 로컬에서 빌드 테스트
npm run build

# 의존성 재설치
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 서버리스 함수 타임아웃

Vercel 무료 플랜: 10초 제한
- 큰 바코드 생성 시 타임아웃 발생 가능
- Pro 플랜으로 업그레이드하거나 최적화 필요

### 폰트 미표시

- `/public/fonts/ocrb/OCRB10BT.ttf` 파일 확인
- 폰트 라이선스 확인
- 폴백 폰트 사용 확인

## 보안 체크리스트

- [x] 환경변수에 민감 정보 없음
- [x] HTTPS 사용 (Vercel 자동 제공)
- [x] 입력값 검증 (zod 사용)
- [x] SQL 인젝션 방지 (DB 미사용)
- [x] XSS 방지 (React 기본 보호)

## 백업

### Git 백업

```bash
git remote add backup https://gitlab.com/your-username/barcode-gen.git
git push backup main
```

### Vercel 프로젝트 설정 백업

Vercel > Settings > General > Download Project Settings

---

배포 완료 후 README.md의 데모 URL을 업데이트하세요!

