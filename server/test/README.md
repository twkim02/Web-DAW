# 테스트 파일

이 폴더에는 모델 및 API 엔드포인트에 대한 테스트 파일들이 포함되어 있습니다.

## 파일 목록

### UserPreferences
- `userPreference.test.js`: UserPreference 모델 로드, 테이블 생성, 관계 설정 등을 테스트하는 Node.js 스크립트
- `api-test-guide.md`: UserPreferences API 엔드포인트를 수동으로 테스트하기 위한 가이드

### Posts
- `post.test.js`: Post 모델 로드, 테이블 생성, 관계 설정 등을 테스트하는 Node.js 스크립트
- `posts-api-test-guide.md`: Posts API 엔드포인트를 수동으로 테스트하기 위한 가이드

## 빠른 시작

### 1. 모델 테스트 실행

**UserPreferences 모델 테스트**:
```bash
cd server
npm run test:model
```

**Posts 모델 테스트**:
```bash
cd server
npm run test:post
```

또는 직접 실행:

```bash
cd server
node test/userPreference.test.js
node test/post.test.js
```

### 2. API 테스트

API 테스트는 서버가 실행 중일 때 진행합니다.

```bash
# 서버 실행 (다른 터미널에서)
npm run dev

# 그 다음 각 가이드 문서의 지침을 따르세요
# - UserPreferences: api-test-guide.md
# - Posts: posts-api-test-guide.md
```

## 테스트 항목

### UserPreferences 모델 테스트 (`userPreference.test.js`)

- ✅ 모델 로드 확인
- ✅ 테이블 생성 확인
- ✅ 관계 설정 확인

### UserPreferences API 테스트 (`api-test-guide.md`)

- GET `/api/user/preferences` - 설정 조회
- PUT `/api/user/preferences` - 설정 업데이트/생성
- POST `/api/user/preferences` - 설정 생성
- 인증 미들웨어 동작
- 입력 유효성 검사

### Posts 모델 테스트 (`post.test.js`)

- ✅ 모델 로드 확인
- ✅ 테이블 생성 확인
- ✅ 관계 설정 확인 (User, Preset)
- ✅ 기본값 확인 (likeCount, downloadCount, isPublished)

### Posts API 테스트 (`posts-api-test-guide.md`)

- GET `/api/posts` - 게시글 목록 (페이징, 정렬)
- GET `/api/posts/:id` - 게시글 상세
- GET `/api/posts/user/my-posts` - 내 게시글 목록
- POST `/api/posts` - 게시글 작성
- PUT `/api/posts/:id` - 게시글 수정
- DELETE `/api/posts/:id` - 게시글 삭제
- POST `/api/posts/:id/like` - 좋아요
- POST `/api/posts/:id/download` - 다운로드
- POST `/api/posts/:id/publish` - 공개/비공개 전환
- 권한 검증 (소유자만 수정/삭제)
- 1:1 관계 검증 (중복 방지)

## 참고

- 모델 테스트는 서버 실행 없이도 실행 가능합니다 (DB 연결 필요)
- API 테스트는 서버가 실행 중이어야 합니다
- 인증이 필요한 API는 로그인 후 테스트해야 합니다 (`/auth/dev_login` 사용 가능)
