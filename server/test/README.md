# UserPreferences 테스트

이 폴더에는 UserPreferences 모델 및 API 엔드포인트에 대한 테스트 파일들이 포함되어 있습니다.

## 파일 목록

- `userPreference.test.js`: 모델 로드, 테이블 생성, 관계 설정 등을 테스트하는 Node.js 스크립트
- `api-test-guide.md`: API 엔드포인트를 수동으로 테스트하기 위한 가이드 (Postman, Thunder Client, curl 사용)

## 빠른 시작

### 1. 모델 테스트 실행

```bash
cd server
npm run test:model
```

또는 직접 실행:

```bash
cd server
node test/userPreference.test.js
```

### 2. API 테스트

API 테스트는 서버가 실행 중일 때 진행합니다. 자세한 내용은 `api-test-guide.md`를 참조하세요.

```bash
# 서버 실행 (다른 터미널에서)
npm run dev

# 그 다음 api-test-guide.md의 지침을 따르세요
```

## 테스트 항목

### 모델 테스트 (`userPreference.test.js`)

- ✅ 모델 로드 확인
- ✅ 테이블 생성 확인
- ✅ 관계 설정 확인

### API 테스트 (`api-test-guide.md`)

- GET `/api/user/preferences` - 설정 조회
- PUT `/api/user/preferences` - 설정 업데이트/생성
- POST `/api/user/preferences` - 설정 생성
- 인증 미들웨어 동작
- 입력 유효성 검사

## 참고

- 모델 테스트는 서버 실행 없이도 실행 가능합니다 (DB 연결 필요)
- API 테스트는 서버가 실행 중이어야 합니다
- 인증이 필요한 API는 로그인 후 테스트해야 합니다 (`/auth/dev_login` 사용 가능)
