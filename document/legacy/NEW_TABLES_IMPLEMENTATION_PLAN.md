# 새로운 테이블 구현 계획

UserPreferences와 Posts 테이블 백엔드 구현 단계별 계획

**작성일**: 2024-01-XX  
**대상**: HIGH_FI_ROADMAP.md의 1.2 새로운 테이블 구현

---

## 📋 작업 단계 개요

### Phase 1: UserPreferences 테이블 구현
1. 모델 생성 및 관계 설정
2. API 엔드포인트 구현
3. 라우트 등록 및 테스트

### Phase 2: Posts 테이블 구현
1. 모델 생성 및 관계 설정
2. API 엔드포인트 구현
3. 라우트 등록 및 테스트

---

## 🔧 Phase 1: UserPreferences 테이블 구현

### 1.1 모델 생성 (`server/models/userPreference.js`)

**작업 내용**:
- Sequelize 모델 정의
- 필드 정의 (DB_SCHEMA.md 기준):
  - `id` (PK, AUTO_INCREMENT)
  - `userId` (FK, UNIQUE, NOT NULL)
  - `latencyMs` (INTEGER, DEFAULT 100)
  - `visualizerMode` (STRING, NULL 허용)
  - `defaultMasterVolume` (FLOAT, DEFAULT 0.7)
  - `createdAt`, `updatedAt` (자동)

**관계 설정**:
- `belongsTo` User (1:1 관계)
- User 모델에 `hasOne` UserPreference 추가 필요

**예상 시간**: 15분

---

### 1.2 User 모델 업데이트

**작업 내용**:
- `server/models/user.js`의 `associate` 함수에 `hasOne` 관계 추가
- UserPreference와의 1:1 관계 설정

**예상 시간**: 5분

---

### 1.3 API 엔드포인트 구현 (`server/routes/userPreferences.js`)

**엔드포인트 설계**:

```
GET    /api/user/preferences      # 사용자 설정 조회 (인증 필요)
PUT    /api/user/preferences      # 사용자 설정 업데이트 (인증 필요)
POST   /api/user/preferences      # 사용자 설정 생성 (인증 필요, 최초 1회)
```

**구현 세부사항**:
- `isAuthenticated` 미들웨어 사용
- GET: UserPreference를 userId로 조회, 없으면 기본값 반환
- PUT: 기존 설정 업데이트, 없으면 생성
- POST: 새 설정 생성 (중복 체크)

**요청/응답 예시**:
```javascript
// GET /api/user/preferences
Response: {
  id: 1,
  userId: 1,
  latencyMs: 100,
  visualizerMode: 'waveform',
  defaultMasterVolume: 0.7,
  createdAt: '...',
  updatedAt: '...'
}

// PUT /api/user/preferences
Request: {
  latencyMs: 150,
  visualizerMode: 'spectrum',
  defaultMasterVolume: 0.8
}
Response: { ...updated preferences }
```

**예상 시간**: 30분

---

### 1.4 라우트 등록 (`server/server.js`)

**작업 내용**:
- `userPreferencesRoutes` require
- `app.use('/api/user/preferences', userPreferencesRoutes)` 추가

**예상 시간**: 5분

---

### 1.5 테스트 및 검증

**테스트 항목**:
- [ ] 모델이 정상적으로 로드되는지 확인
- [ ] DB 테이블이 생성되는지 확인 (서버 재시작)
- [ ] GET 엔드포인트 동작 확인 (Postman/Thunder Client)
- [ ] PUT 엔드포인트 동작 확인
- [ ] POST 엔드포인트 동작 확인
- [ ] 인증 미들웨어 동작 확인 (비로그인 시 401)
- [ ] User와의 관계 정상 동작 확인

**예상 시간**: 20분

**Phase 1 총 예상 시간**: 약 75분

---

## 🔧 Phase 2: Posts 테이블 구현

### 2.1 모델 생성 (`server/models/post.js`)

**작업 내용**:
- Sequelize 모델 정의
- 필드 정의 (DB_SCHEMA.md 기준):
  - `id` (PK, AUTO_INCREMENT)
  - `userId` (FK, NOT NULL)
  - `presetId` (FK, UNIQUE, NOT NULL)
  - `title` (STRING, NOT NULL)
  - `description` (TEXT, NULL 허용)
  - `likeCount` (INTEGER, DEFAULT 0)
  - `downloadCount` (INTEGER, DEFAULT 0)
  - `isPublished` (BOOLEAN, DEFAULT true)
  - `createdAt`, `updatedAt` (자동)

**관계 설정**:
- `belongsTo` User (N:1 관계)
- `belongsTo` Preset (1:1 관계)
- User 모델에 `hasMany` Posts 추가
- Preset 모델에 `hasOne` Post 추가 필요

**예상 시간**: 15분

---

### 2.2 User 및 Preset 모델 업데이트

**작업 내용**:
- `server/models/user.js`: `hasMany` Posts 관계 추가
- `server/models/preset.js`: `hasOne` Post 관계 추가

**예상 시간**: 5분

---

### 2.3 API 엔드포인트 구현 (`server/routes/posts.js`)

**엔드포인트 설계**:

```
GET    /api/posts                    # 게시글 목록 조회 (공개된 것만, 페이징)
GET    /api/posts/:id                # 게시글 상세 조회 (공개된 것만)
GET    /api/posts/user/my-posts      # 내 게시글 목록 (인증 필요)
POST   /api/posts                    # 게시글 작성 (인증 필요)
PUT    /api/posts/:id                # 게시글 수정 (인증 필요, 소유자만)
DELETE /api/posts/:id                # 게시글 삭제 (인증 필요, 소유자만)
POST   /api/posts/:id/like           # 좋아요 (인증 필요, 중복 방지 필요)
POST   /api/posts/:id/download       # 다운로드 (인증 필요, downloadCount 증가)
POST   /api/posts/:id/publish        # 공개/비공개 전환 (인증 필요, 소유자만)
```

**구현 세부사항**:
- `isAuthenticated` 미들웨어 사용
- 소유자 검증 미들웨어 추가 필요
- GET 목록: 인기순(`likeCount`), 최신순(`createdAt`) 정렬 지원
- 페이징: `page`, `limit` 쿼리 파라미터
- 좋아요: 중복 체크 필요 (별도 테이블 없이 간단히 구현 시 세션/쿠키 활용)

**요청/응답 예시**:
```javascript
// GET /api/posts?page=1&limit=10&sort=popular
Response: {
  posts: [
    {
      id: 1,
      title: 'My Awesome Preset',
      description: '...',
      likeCount: 42,
      downloadCount: 15,
      isPublished: true,
      user: { id: 1, nickname: 'User1' },
      preset: { id: 1, title: 'Preset Title', bpm: 120 }
    },
    ...
  ],
  total: 100,
  page: 1,
  limit: 10
}

// POST /api/posts
Request: {
  presetId: 1,
  title: 'My Awesome Preset',
  description: 'This is a great preset!',
  isPublished: true
}
Response: { ...created post }

// POST /api/posts/:id/like
Response: { 
  success: true,
  likeCount: 43 
}
```

**예상 시간**: 60분

---

### 2.4 라우트 등록 (`server/server.js`)

**작업 내용**:
- `postRoutes` require
- `app.use('/api/posts', postRoutes)` 추가

**예상 시간**: 5분

---

### 2.5 테스트 및 검증

**테스트 항목**:
- [ ] 모델이 정상적으로 로드되는지 확인
- [ ] DB 테이블이 생성되는지 확인 (서버 재시작)
- [ ] GET 목록 엔드포인트 동작 확인 (공개 게시글만)
- [ ] GET 상세 엔드포인트 동작 확인
- [ ] POST 작성 엔드포인트 동작 확인 (인증 필요)
- [ ] PUT 수정 엔드포인트 동작 확인 (소유자만)
- [ ] DELETE 삭제 엔드포인트 동작 확인 (소유자만)
- [ ] 좋아요 엔드포인트 동작 확인
- [ ] 다운로드 엔드포인트 동작 확인 (count 증가)
- [ ] Preset과의 1:1 관계 정상 동작 확인
- [ ] 페이징 동작 확인

**예상 시간**: 30분

**Phase 2 총 예상 시간**: 약 115분

---

## 📝 추가 고려사항

### 보안
- [ ] 소유자 검증 미들웨어 구현 (`isOwner` 또는 `checkOwnership`)
- [ ] 입력 검증 (express-validator 또는 직접 구현)
- [ ] XSS 방지 (description 텍스트 필드)

### 성능
- [ ] 인덱스 확인 (DB_SCHEMA.md에 정의된 인덱스들이 자동 생성되는지)
- [ ] 페이징 최적화
- [ ] N+1 쿼리 방지 (include 옵션 활용)

### 향후 확장
- 좋아요 기능: 별도 `PostLikes` 테이블 추가 고려 (중복 방지, 사용자별 좋아요 목록)
- 댓글 기능: `PostComments` 테이블 추가
- 태그 기능: `PostTags` 테이블 추가

---

## ✅ 체크리스트

### Phase 1: UserPreferences
- [ ] 모델 파일 생성 (`userPreference.js`)
- [ ] User 모델에 관계 추가
- [ ] 라우트 파일 생성 (`userPreferences.js`)
- [ ] GET 엔드포인트 구현
- [ ] PUT 엔드포인트 구현
- [ ] POST 엔드포인트 구현
- [ ] `server.js`에 라우트 등록
- [ ] 테스트 완료

### Phase 2: Posts
- [ ] 모델 파일 생성 (`post.js`)
- [ ] User 모델에 관계 추가
- [ ] Preset 모델에 관계 추가
- [ ] 라우트 파일 생성 (`posts.js`)
- [ ] GET 목록 엔드포인트 구현
- [ ] GET 상세 엔드포인트 구현
- [ ] GET 내 게시글 엔드포인트 구현
- [ ] POST 작성 엔드포인트 구현
- [ ] PUT 수정 엔드포인트 구현
- [ ] DELETE 삭제 엔드포인트 구현
- [ ] POST 좋아요 엔드포인트 구현
- [ ] POST 다운로드 엔드포인트 구현
- [ ] POST 공개/비공개 엔드포인트 구현
- [ ] `server.js`에 라우트 등록
- [ ] 테스트 완료

---

## 🚀 시작하기

**권장 작업 순서**:
1. **Phase 1 완전히 완료** 후 Phase 2 시작
2. 각 Phase 내에서도 순서대로 진행 (모델 → 관계 → 라우트 → 등록 → 테스트)
3. 테스트는 각 Phase가 완료된 후 집중적으로 진행

**예상 총 작업 시간**: 약 3-4시간 (테스트 포함)

**다음 단계**: Phase 1.1부터 시작하세요!
