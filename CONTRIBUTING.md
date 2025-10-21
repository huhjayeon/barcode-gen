# 기여 가이드

프로젝트에 기여해주셔서 감사합니다! 🎉

## 시작하기

### 1. 저장소 포크

GitHub에서 이 저장소를 포크하세요.

### 2. 로컬 클론

```bash
git clone https://github.com/your-username/barcode-gen.git
cd barcode-gen
```

### 3. 의존성 설치

```bash
npm install
```

### 4. 개발 서버 실행

```bash
npm run dev
```

## 개발 가이드

### 브랜치 전략

- `main`: 프로덕션 코드
- `develop`: 개발 중인 코드
- `feature/*`: 새 기능
- `bugfix/*`: 버그 수정
- `hotfix/*`: 긴급 수정

### 커밋 메시지 규칙

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅, 세미콜론 누락 등
refactor: 코드 리팩토링
test: 테스트 추가
chore: 빌드 작업, 패키지 관리
```

예시:
```bash
git commit -m "feat: Add QR code generation support"
git commit -m "fix: Fix EAN-13 check digit calculation"
```

### 코드 스타일

Prettier와 ESLint를 사용합니다:

```bash
npm run lint
```

### 테스트

```bash
# 빌드 테스트
npm run build

# 프로덕션 모드 실행
npm start
```

## Pull Request 프로세스

1. **이슈 생성**: 작업 전 이슈를 먼저 생성하세요
2. **브랜치 생성**: `feature/issue-number-description` 형식
3. **개발 및 커밋**: 작은 단위로 커밋
4. **테스트**: 로컬에서 빌드 및 테스트
5. **PR 생성**: 명확한 제목과 설명 작성
6. **리뷰 대기**: 피드백 반영

### PR 템플릿

```markdown
## 변경 사항
- 

## 관련 이슈
Fixes #

## 테스트
- [ ] 로컬 빌드 성공
- [ ] 기능 테스트 완료
- [ ] 브라우저 호환성 확인

## 스크린샷
(필요시 추가)
```

## 기여 아이디어

### 새 기능

- [ ] QR 코드 생성 지원
- [ ] 일괄 바코드 생성 (CSV 업로드)
- [ ] 바코드 색상 커스터마이징
- [ ] EPS 파일 다운로드 지원
- [ ] 바코드 히스토리 저장
- [ ] 다국어 지원 (i18n)

### 개선 사항

- [ ] 성능 최적화
- [ ] 접근성 개선
- [ ] 모바일 UX 향상
- [ ] 다크 모드 지원
- [ ] 에러 처리 강화

### 버그 수정

- GitHub Issues를 확인하세요

## 질문이나 제안

- GitHub Issues에 올려주세요
- 이메일: your-email@example.com

## 라이선스

MIT License에 따라 기여한 코드가 배포됩니다.

