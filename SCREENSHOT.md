# 스크린샷 가이드

README에 포함할 스크린샷을 생성하세요.

## 준비

1. 개발 서버 실행:
```bash
npm run dev
```

2. 브라우저에서 http://localhost:3000 접속

## 스크린샷 목록

### 1. 메인 화면
- 파일명: `screenshot-main.png`
- 내용: 전체 랜딩 페이지
- 해상도: 1920x1080 (Full HD)

### 2. 폼 입력 상태
- 파일명: `screenshot-form.png`
- 내용: 바코드 번호 입력 및 옵션 선택
- 예시 입력:
  - Contents: `8801234567890`
  - Symbology: `EAN-13`
  - Quiet Zone: `10`

### 3. 미리보기
- 파일명: `screenshot-preview.png`
- 내용: 바코드 생성 후 미리보기
- 캡처: SVG 렌더링 결과 포함

### 4. Illustrator에서 열기
- 파일명: `screenshot-illustrator.png`
- 내용: .ai 파일을 Illustrator에서 연 화면
- 확인 사항:
  - 벡터 형태 유지
  - OCR-B 폰트 적용 (또는 폴백)
  - 레이어 구조

## 스크린샷 저장 위치

```
/docs/screenshots/
├── screenshot-main.png
├── screenshot-form.png
├── screenshot-preview.png
└── screenshot-illustrator.png
```

## README 업데이트

```markdown
## 스크린샷

### 메인 화면
![메인 화면](./docs/screenshots/screenshot-main.png)

### 바코드 미리보기
![미리보기](./docs/screenshots/screenshot-preview.png)

### Illustrator에서 열기
![Illustrator](./docs/screenshots/screenshot-illustrator.png)
```

## 데모 GIF (선택)

애니메이션 GIF로 사용 흐름을 보여줄 수 있습니다:

1. [LICEcap](https://www.cockos.com/licecap/) 설치
2. 화면 녹화:
   - 바코드 번호 입력
   - "Make Barcode" 클릭
   - 미리보기 확인
   - "Download .ai" 클릭
3. `demo.gif`로 저장

```markdown
## 데모

![데모](./docs/screenshots/demo.gif)
```

---

스크린샷을 추가한 후 README.md를 업데이트하세요!

