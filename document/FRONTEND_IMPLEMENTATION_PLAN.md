# 프론트엔드 구현 계획 (MVP)

이 문서는 설정 UI, 프리셋 공유 UI, 게시판 UI 구현 계획을 설명합니다.

---

## 📋 구현 목표

1. **설정 UI 및 로드/저장 로직**
   - 사용자 설정 조회/수정 UI
   - 앱 시작 시 설정 자동 로드
   - 설정 변경 시 자동 저장

2. **프리셋 공유 UI**
   - 프리셋 저장 시 공유 옵션 제공
   - 공유된 프리셋을 게시판에 게시

3. **게시판 UI** (`/community` 페이지)
   - 게시글 목록 조회
   - 게시글 상세 보기
   - 게시글 작성
   - 좋아요/다운로드 기능

---

## 🏗️ 아키텍처

### 라우팅 구조

```
/ (메인 - 기존 App.jsx)
  └── Launchpad, Sidebars 등

/community (게시판)
  └── 게시글 목록
  └── 게시글 상세
  └── 게시글 작성
```

### 컴포넌트 구조

```
client/src/
├── components/
│   ├── Settings/
│   │   └── SettingsModal.jsx          # 설정 UI 모달
│   ├── Presets/
│   │   ├── PresetManagerModal.jsx     # 기존 (공유 버튼 추가)
│   │   └── SharePresetModal.jsx       # 프리셋 공유 모달 (새로 생성)
│   └── Community/
│       ├── Community.jsx               # 게시판 메인 페이지
│       ├── PostList.jsx                # 게시글 목록
│       ├── PostCard.jsx                # 게시글 카드
│       ├── PostDetail.jsx              # 게시글 상세
│       └── PostCreate.jsx              # 게시글 작성
├── api/
│   ├── userPreferences.js             # UserPreferences API 함수 (새로 생성)
│   └── posts.js                        # Posts API 함수 (새로 생성)
└── hooks/
    └── useUserPreferences.js           # 설정 로드/저장 훅 (새로 생성)
```

---

## 📝 구현 단계

### Phase 1: 라우팅 설정

**작업 내용**:
1. `react-router-dom` 설치
2. `main.jsx`에 Router 설정
3. `App.jsx`를 메인 페이지로 분리
4. `/community` 라우트 추가

**파일**:
- `client/package.json` (의존성 추가)
- `client/src/main.jsx` (Router 설정)
- `client/src/App.jsx` (기존 내용 유지)
- `client/src/pages/Community.jsx` (새로 생성)

---

### Phase 2: API 함수 생성

**작업 내용**:
1. `userPreferences.js` API 함수 생성
   - `getUserPreferences()`: 설정 조회
   - `updateUserPreferences(data)`: 설정 업데이트/생성
2. `posts.js` API 함수 생성
   - `getPosts(params)`: 게시글 목록 조회
   - `getPost(id)`: 게시글 상세 조회
   - `createPost(data)`: 게시글 작성
   - `updatePost(id, data)`: 게시글 수정
   - `deletePost(id)`: 게시글 삭제
   - `likePost(id)`: 좋아요
   - `downloadPost(id)`: 다운로드 (프리셋 데이터 반환)
   - `publishPost(id, isPublished)`: 공개/비공개 전환

**파일**:
- `client/src/api/userPreferences.js` (새로 생성)
- `client/src/api/posts.js` (새로 생성)

---

### Phase 3: 설정 UI 및 로직

**작업 내용**:
1. `useUserPreferences` 훅 생성
   - 설정 로드 (`loadPreferences`)
   - 설정 저장 (`savePreferences`)
   - 로딩/에러 상태 관리
2. `SettingsModal` 컴포넌트 생성
   - `latencyMs` 입력 (숫자)
   - `visualizerMode` 선택 (드롭다운)
   - `defaultMasterVolume` 슬라이더 (0.0 ~ 1.0)
   - 저장/취소 버튼
3. `App.jsx`에 설정 로드 로직 추가
   - 앱 시작 시 설정 자동 로드
   - 설정이 있으면 적용 (예: `defaultMasterVolume`)

**파일**:
- `client/src/hooks/useUserPreferences.js` (새로 생성)
- `client/src/components/Settings/SettingsModal.jsx` (새로 생성)
- `client/src/App.jsx` (수정)

---

### Phase 4: 프리셋 공유 UI

**작업 내용**:
1. `PresetManagerModal`에 "공유" 버튼 추가
2. `SharePresetModal` 컴포넌트 생성
   - 제목 입력
   - 설명 입력 (선택)
   - 공개/비공개 선택
   - 게시 버튼
3. 공유 로직 구현
   - 현재 프리셋을 게시판에 게시
   - `POST /api/posts` 호출

**파일**:
- `client/src/components/Presets/PresetManagerModal.jsx` (수정)
- `client/src/components/Presets/SharePresetModal.jsx` (새로 생성)

---

### Phase 5: 게시판 UI 구현

**작업 내용**:
1. `Community.jsx` 메인 페이지
   - 라우팅 설정 (`/community`, `/community/:id`, `/community/create`)
   - 네비게이션 (목록/작성 버튼)
2. `PostList.jsx` 게시글 목록
   - 정렬 옵션 (최신순, 인기순)
   - 페이지네이션
   - `PostCard` 컴포넌트 사용
3. `PostCard.jsx` 게시글 카드
   - 제목, 작성자, 좋아요 수, 다운로드 수
   - 클릭 시 상세 페이지로 이동
4. `PostDetail.jsx` 게시글 상세
   - 제목, 설명, 작성자 정보
   - 좋아요/다운로드 버튼
   - 다운로드 시 프리셋 데이터 반환 및 적용
   - 수정/삭제 버튼 (작성자만)
5. `PostCreate.jsx` 게시글 작성
   - 프리셋 선택 (드롭다운)
   - 제목, 설명 입력
   - 공개/비공개 선택
   - 작성 버튼

**파일**:
- `client/src/pages/Community.jsx` (새로 생성)
- `client/src/components/Community/PostList.jsx` (새로 생성)
- `client/src/components/Community/PostCard.jsx` (새로 생성)
- `client/src/components/Community/PostDetail.jsx` (새로 생성)
- `client/src/components/Community/PostCreate.jsx` (새로 생성)

---

## 🎨 디자인 가이드라인 (MVP)

**원칙**: 디자인을 전혀 신경 쓰지 않은 MVP

- 기본 HTML 요소 사용 (input, button, select 등)
- 최소한의 스타일링 (인라인 스타일 또는 간단한 CSS)
- 기능 중심 구현
- 반응형 디자인 고려하지 않음
- 접근성 고려하지 않음

**예시 스타일**:
```jsx
<div style={{ padding: '20px' }}>
  <h2>게시판</h2>
  <button onClick={handleClick}>작성</button>
  <div>
    {posts.map(post => (
      <div key={post.id} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
        <h3>{post.title}</h3>
        <p>{post.description}</p>
      </div>
    ))}
  </div>
</div>
```

---

## 🔗 API 엔드포인트 요약

### UserPreferences API
- `GET /api/user/preferences` - 설정 조회
- `PUT /api/user/preferences` - 설정 업데이트/생성

### Posts API
- `GET /api/posts` - 게시글 목록 (쿼리: `page`, `limit`, `sort`)
- `GET /api/posts/:id` - 게시글 상세
- `GET /api/posts/user/my-posts` - 내 게시글 목록
- `POST /api/posts` - 게시글 작성
- `PUT /api/posts/:id` - 게시글 수정
- `DELETE /api/posts/:id` - 게시글 삭제
- `POST /api/posts/:id/like` - 좋아요
- `POST /api/posts/:id/download` - 다운로드
- `POST /api/posts/:id/publish` - 공개/비공개 전환

---

## ✅ 체크리스트

### Phase 1: 라우팅
- [ ] `react-router-dom` 설치
- [ ] Router 설정 완료
- [ ] `/community` 라우트 추가

### Phase 2: API 함수
- [ ] `userPreferences.js` 생성
- [ ] `posts.js` 생성
- [ ] 모든 API 함수 테스트

### Phase 3: 설정 UI
- [ ] `useUserPreferences` 훅 생성
- [ ] `SettingsModal` 컴포넌트 생성
- [ ] `App.jsx`에 설정 로드 로직 추가

### Phase 4: 프리셋 공유
- [ ] `PresetManagerModal`에 공유 버튼 추가
- [ ] `SharePresetModal` 컴포넌트 생성
- [ ] 공유 로직 구현

### Phase 5: 게시판
- [ ] `Community.jsx` 메인 페이지
- [ ] `PostList.jsx` 목록
- [ ] `PostCard.jsx` 카드
- [ ] `PostDetail.jsx` 상세
- [ ] `PostCreate.jsx` 작성

---

## 📚 참고 자료

- [API 문서](./API_DOCUMENTATION.md)
- [React Router 문서](https://reactrouter.com/)
- [Zustand 문서](https://zustand-demo.pmnd.rs/)

---

**작성일**: 2024-01-XX
**목표**: MVP 수준의 기능 구현 (디자인 미고려)
