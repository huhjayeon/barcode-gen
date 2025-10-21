# Free Barcode Generator (.AI)

Adobe Illustrator에서 열 수 있는 벡터 바코드 파일(.ai)을 생성하는 무료 웹 애플리케이션입니다.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## 🎯 주요 기능

- **다양한 바코드 심볼로지 지원**
  - EAN-13 (자동 체크디지트 계산)
  - EAN-8 (자동 체크디지트 계산)
  - UPC-A (자동 체크디지트 계산)
  - Code128
  - Code39

- **벡터 파일 생성**
  - Adobe Illustrator에서 열 수 있는 .ai 파일 (PDF 벡터 기반)
  - SVG 파일 다운로드도 지원
  - 확대해도 깨지지 않는 완벽한 벡터 품질

- **실시간 미리보기**
  - 브라우저에서 즉시 바코드 미리보기
  - 입력값 유효성 검증
  - 사용자 친화적인 오류 메시지

- **전문적인 타이포그래피**
  - OCR-B 10 BT 폰트 적용
  - Letter-spacing -25 (시각 기준 -0.025em)
  - 폰트 미존재 시 폴백 지원

## 🚀 빠른 시작

### 사전 요구사항

- Node.js 18 이상
- npm 또는 yarn

### 설치

```bash
# 저장소 클론
git clone https://github.com/your-username/barcode-gen.git
cd barcode-gen

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 📦 빌드 및 배포

### 로컬 빌드

```bash
npm run build
npm start
```

### Vercel 배포 (권장)

1. GitHub 저장소에 푸시
2. [Vercel](https://vercel.com)에 로그인
3. "Import Project" 클릭
4. 저장소 선택 후 자동 배포

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/barcode-gen)

### Netlify 배포

1. GitHub 저장소에 푸시
2. [Netlify](https://netlify.com)에 로그인
3. "New site from Git" 클릭
4. 빌드 설정:
   - Build command: `npm run build`
   - Publish directory: `.next`

## 🎨 사용 방법

1. **바코드 번호 입력**: 숫자 또는 문자 입력 (심볼로지별 규칙 준수)
2. **심볼로지 선택**: 드롭다운에서 원하는 바코드 타입 선택
3. **여백 설정**: Quiet Zone 값 조정 (기본 10px)
4. **"Make Barcode" 클릭**: 바코드 미리보기 생성
5. **다운로드**: "Download .ai" 또는 "Download .svg" 클릭

### 입력 예시

- **EAN-13**: `880123456789` (12자리) → 자동으로 체크디지트 추가
- **Code128**: `ABC123` (영문+숫자 혼합 가능)
- **Code39**: `HELLO123` (대문자+숫자만)
- **EAN-8**: `1234567` (7자리) → 자동으로 체크디지트 추가
- **UPC-A**: `12345678901` (11자리) → 자동으로 체크디지트 추가

## 🔧 기술 스택

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Barcode 생성**: bwip-js
- **PDF 생성**: pdfkit + svg-to-pdfkit
- **입력 검증**: zod
- **배포**: Vercel (서버리스)

## 📁 프로젝트 구조

```
barcode-gen/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── preview/route.ts         # SVG 미리보기 API
│   │   │   ├── download-svg/route.ts    # SVG 다운로드 API
│   │   │   └── download-ai/route.ts     # AI 파일 다운로드 API
│   │   ├── layout.tsx                   # 루트 레이아웃
│   │   ├── page.tsx                     # 메인 페이지
│   │   └── globals.css                  # 글로벌 스타일
│   └── lib/
│       ├── barcode-utils.ts             # 바코드 유틸리티
│       └── validation.ts                # 입력 검증 스키마
├── public/
│   └── fonts/
│       └── ocrb/
│           └── OCRB10BT.ttf            # OCR-B 폰트 (사용자 제공)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## 🔤 OCR-B 폰트 설정

### 폰트 배치

1. OCR-B 10 BT 폰트 파일(`OCRB10BT.ttf`)을 라이선스에 따라 구매/다운로드
2. `/public/fonts/ocrb/` 폴더에 배치
3. 서버 재시작

### 폰트가 없는 경우

폰트 파일이 없어도 애플리케이션은 정상 작동합니다. 다만 다음 폴백 폰트가 사용됩니다:
- OCR B (시스템 폰트)
- OCRB (시스템 폰트)
- monospace (기본 폰트)

.ai 파일 다운로드 시 폰트가 없으면 `X-Font-Notice` 헤더에 경고가 포함됩니다.

## 🧪 테스트 케이스

### EAN-13 체크디지트 자동 계산

```
입력: 880123456789 (12자리)
출력: 8801234567897 (13자리, 체크디지트 7 추가)
```

### Code128 영문+숫자

```
입력: Hello123
출력: 정상 생성
```

### Code39 대문자 전용

```
입력: PRODUCT-123
출력: 정상 생성
```

## 📋 심볼로지별 입력 규칙

| 심볼로지 | 입력 규칙 | 자동 체크디지트 |
|---------|----------|----------------|
| EAN-13  | 12-13자리 숫자 | ✅ (12자리 입력 시) |
| EAN-8   | 7-8자리 숫자 | ✅ (7자리 입력 시) |
| UPC-A   | 11-12자리 숫자 | ✅ (11자리 입력 시) |
| Code128 | 영문+숫자 (최대 80자) | ❌ |
| Code39  | 대문자+숫자+특수문자 | ❌ |

## 🎯 성능 목표

- Lighthouse Score: 95/90/100/100 (Performance/Accessibility/Best Practices/SEO)
- 서버리스 환경 최적화
- 빠른 응답 시간 (< 1초)

## 📄 라이선스

MIT License

## 🙏 크레딧

- **bwip-js**: Barcode Writer in Pure JavaScript
- **pdfkit**: PDF 생성 라이브러리
- **svg-to-pdfkit**: SVG를 PDF로 변환

**면책 조항**: 이 프로젝트는 원본 사이트와 무관한 독립 프로젝트입니다.

## 🐛 문제 보고

이슈가 발견되면 [GitHub Issues](https://github.com/your-username/barcode-gen/issues)에 보고해주세요.

## 🤝 기여

Pull Request는 언제나 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 문의

프로젝트 링크: [https://github.com/your-username/barcode-gen](https://github.com/your-username/barcode-gen)

---

Made with ❤️ by Nature

