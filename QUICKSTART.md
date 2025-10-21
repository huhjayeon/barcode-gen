# 빠른 시작 가이드

## 1분 만에 시작하기

### 1. 설치

```bash
git clone https://github.com/your-username/barcode-gen.git
cd barcode-gen
npm install
```

### 2. 실행

```bash
npm run dev
```

### 3. 접속

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

### 4. 바코드 생성

1. **바코드 번호 입력**: `8801234567890`
2. **심볼로지 선택**: `EAN-13`
3. **"Make Barcode" 클릭**
4. **미리보기 확인**
5. **"Download .ai" 클릭** → Illustrator에서 열기

## 주요 명령어

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 실행
npm start

# 린트 체크
npm run lint
```

## 폰트 설정 (선택)

OCR-B 10 BT 폰트를 사용하려면:

1. `OCRB10BT.ttf` 파일 다운로드
2. `/public/fonts/ocrb/` 폴더에 배치
3. 서버 재시작

> 폰트가 없어도 정상 작동합니다 (폴백 폰트 사용)

## 배포

### Vercel (클릭 한 번으로 배포)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/barcode-gen)

또는

1. GitHub에 푸시
2. [Vercel](https://vercel.com)에서 Import
3. 자동 배포 완료

## 트러블슈팅

### 포트 이미 사용 중

```bash
# 포트 변경
PORT=3001 npm run dev
```

### 빌드 실패

```bash
# 캐시 삭제
rm -rf .next node_modules
npm install
npm run build
```

### 폰트 안 보임

- `/public/fonts/ocrb/OCRB10BT.ttf` 파일 확인
- 브라우저 캐시 삭제
- 서버 재시작

## 다음 단계

- [README.md](./README.md): 전체 문서
- [DEPLOYMENT.md](./DEPLOYMENT.md): 배포 가이드
- [docs/TESTING.md](./docs/TESTING.md): 테스트 가이드
- [CONTRIBUTING.md](./CONTRIBUTING.md): 기여 가이드

## 도움말

- 이슈: [GitHub Issues](https://github.com/your-username/barcode-gen/issues)
- 문의: your-email@example.com

---

**즐겁게 사용하세요!** 🎉

