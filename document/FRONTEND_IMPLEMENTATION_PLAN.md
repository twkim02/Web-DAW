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
- [x] `react-router-dom` 설치
- [x] Router 설정 완료
- [x] `/community` 라우트 추가

### Phase 2: API 함수
- [x] `userPreferences.js` 생성
- [x] `posts.js` 생성
- [ ] 모든 API 함수 테스트

### Phase 3: 설정 UI
- [x] `useUserPreferences` 훅 생성
- [x] `SettingsModal` 컴포넌트 생성
- [x] `App.jsx`에 설정 로드 로직 추가

### Phase 4: 프리셋 공유
- [x] `PresetManagerModal`에 공유 버튼 추가
- [x] `SharePresetModal` 컴포넌트 생성
- [x] 공유 로직 구현

### Phase 5: 게시판
- [x] `Community.jsx` 메인 페이지
- [x] `PostList.jsx` 목록
- [x] `PostCard.jsx` 카드
- [x] `PostDetail.jsx` 상세
- [x] `PostCreate.jsx` 작성

---

## 🧪 구현 검증 방법

이 섹션은 구현된 기능들이 제대로 작동하는지 확인하는 상세한 테스트 방법을 제공합니다.

### 전제 조건

1. **서버 실행**
   ```bash
   cd server
   npm start
   ```
   - 서버가 `http://localhost:3001`에서 실행되어야 합니다.

2. **클라이언트 실행**
   ```bash
   cd client
   npm run dev
   ```
   - 클라이언트가 `http://localhost:5173`에서 실행되어야 합니다.

3. **데이터베이스 준비**
   - MySQL이 실행 중이어야 합니다.
   - 필요한 테이블이 생성되어 있어야 합니다 (Sequelize sync).

4. **로그인**
   - 테스트를 위해 로그인이 필요합니다.
   - `http://localhost:3001/auth/dev_login` 또는 Google OAuth로 로그인합니다.

---

### Phase 1: 라우팅 검증

#### 1.1 React Router 설치 확인

**방법**:
```bash
cd client
npm list react-router-dom
```

**예상 결과**: `react-router-dom@x.x.x` 버전이 표시되어야 합니다.

#### 1.2 라우팅 동작 확인

**테스트 시나리오**:

1. **메인 페이지 접근**
   - 브라우저에서 `http://localhost:5173/` 접속
   - **확인**: Launchpad와 Sidebars가 정상적으로 표시되어야 합니다.

2. **게시판 페이지 접근**
   - 브라우저에서 `http://localhost:5173/community` 접속
   - **확인**: 게시판 페이지가 표시되어야 합니다.

3. **헤더 링크 테스트**
   - 메인 페이지에서 헤더의 "💬 Community" 버튼 클릭
   - **확인**: 게시판 페이지로 이동해야 합니다.

4. **뒤로 가기 테스트**
   - 게시판에서 브라우저 뒤로 가기 버튼 클릭
   - **확인**: 메인 페이지로 돌아가야 합니다.

**예상 결과**: 모든 라우팅이 정상적으로 작동해야 합니다.

---

### Phase 2: API 함수 검증

#### 2.1 UserPreferences API 함수 테스트

**브라우저 콘솔에서 테스트**:

```javascript
// 1. getUserPreferences 테스트
import { getUserPreferences } from './api/userPreferences';
const prefs = await getUserPreferences();
console.log('User Preferences:', prefs);
// 예상: { latencyMs: 100, visualizerMode: null, defaultMasterVolume: 0.7, ... }

// 2. updateUserPreferences 테스트
import { updateUserPreferences } from './api/userPreferences';
const updated = await updateUserPreferences({
  latencyMs: 150,
  visualizerMode: 'waveform',
  defaultMasterVolume: 0.8
});
console.log('Updated Preferences:', updated);
// 예상: 업데이트된 설정 객체 반환
```

**확인 사항**:
- [ ] `getUserPreferences()`가 설정 객체를 반환하는가?
- [ ] 설정이 없을 때 기본값을 반환하는가?
- [ ] `updateUserPreferences()`가 설정을 업데이트하는가?
- [ ] 에러가 발생하면 적절히 처리되는가?

#### 2.2 Posts API 함수 테스트

**브라우저 콘솔에서 테스트**:

```javascript
// 1. getPosts 테스트
import { getPosts } from './api/posts';
const data = await getPosts({ page: 1, limit: 10, sort: 'created' });
console.log('Posts:', data);
// 예상: { posts: [...], total: number, page: 1, limit: 10, totalPages: number }

// 2. getPost 테스트 (게시글이 있는 경우)
import { getPost } from './api/posts';
const post = await getPost(1); // 존재하는 게시글 ID
console.log('Post:', post);
// 예상: 게시글 상세 객체 반환

// 3. createPost 테스트 (로그인 필요)
import { createPost } from './api/posts';
const newPost = await createPost({
  presetId: 1, // 존재하는 프리셋 ID
  title: 'Test Post',
  description: 'Test Description',
  isPublished: true
});
console.log('Created Post:', newPost);
// 예상: 생성된 게시글 객체 반환
```

**확인 사항**:
- [ ] `getPosts()`가 게시글 목록을 반환하는가?
- [ ] 페이지네이션이 작동하는가?
- [ ] 정렬 옵션이 작동하는가?
- [ ] `getPost()`가 게시글 상세를 반환하는가?
- [ ] `createPost()`가 게시글을 생성하는가?
- [ ] 에러가 발생하면 적절히 처리되는가?

---

### Phase 3: 설정 UI 검증

#### 3.1 설정 모달 열기

**테스트 시나리오**:

1. **설정 버튼 확인**
   - 메인 페이지에서 헤더 확인
   - **확인**: "⚙️ Settings" 버튼이 표시되어야 합니다.

2. **설정 모달 열기**
   - "⚙️ Settings" 버튼 클릭
   - **확인**: 설정 모달이 열려야 합니다.

3. **모달 내용 확인**
   - 모달에 다음 필드가 표시되어야 합니다:
     - [ ] 오디오 레이턴시 (ms) 입력 필드
     - [ ] 비주얼라이저 모드 드롭다운
     - [ ] 기본 마스터 볼륨 슬라이더
     - [ ] 취소 버튼
     - [ ] 저장 버튼

#### 3.2 설정 로드 확인

**테스트 시나리오**:

1. **로그인 후 설정 자동 로드**
   - 로그인 상태에서 페이지 새로고침
   - 브라우저 개발자 도구 콘솔 확인
   - **확인**: 설정 로드 관련 로그가 없어야 합니다 (에러가 없는 경우).

2. **설정 모달에서 값 확인**
   - 설정 모달 열기
   - **확인**: 저장된 설정 값이 폼에 표시되어야 합니다.
   - 설정이 없으면 기본값이 표시되어야 합니다.

#### 3.3 설정 저장 확인

**테스트 시나리오**:

1. **설정 값 변경**
   - 레이턴시: `100` → `150`
   - 비주얼라이저 모드: `waveform` 선택
   - 기본 마스터 볼륨: `0.7` → `0.8`

2. **저장 버튼 클릭**
   - "저장" 버튼 클릭
   - **확인**: "설정이 저장되었습니다." 알림이 표시되어야 합니다.

3. **저장 확인**
   - 모달 닫기
   - 다시 설정 모달 열기
   - **확인**: 변경한 값이 그대로 유지되어야 합니다.

4. **서버 확인** (선택사항)
   - MySQL에서 `UserPreferences` 테이블 확인
   - 또는 API로 다시 조회하여 확인

**확인 사항**:
- [ ] 설정 모달이 정상적으로 열리는가?
- [ ] 설정 값이 로드되는가?
- [ ] 설정을 저장할 수 있는가?
- [ ] 저장 후 값이 유지되는가?
- [ ] 에러가 발생하면 적절히 처리되는가?

---

### Phase 4: 프리셋 공유 검증

#### 4.1 공유 버튼 확인

**테스트 시나리오**:

1. **Preset Manager 열기**
   - 헤더의 "📂 Presets" 버튼 클릭
   - **확인**: Preset Manager 모달이 열려야 합니다.

2. **공유 버튼 확인**
   - 각 프리셋 항목 확인
   - **확인**: "Load", "Share", "Delete" 버튼이 표시되어야 합니다.

#### 4.2 프리셋 공유 모달 확인

**테스트 시나리오**:

1. **공유 모달 열기**
   - 프리셋의 "Share" 버튼 클릭
   - **확인**: SharePresetModal이 열려야 합니다.

2. **모달 내용 확인**
   - 모달에 다음 필드가 표시되어야 합니다:
     - [ ] 제목 입력 필드 (프리셋 제목이 기본값)
     - [ ] 설명 입력 필드 (textarea)
     - [ ] 공개 게시 체크박스
     - [ ] 취소 버튼
     - [ ] 게시 버튼

#### 4.3 게시글 생성 확인

**테스트 시나리오**:

1. **게시글 작성**
   - 제목: "My Awesome Preset"
   - 설명: "This is a test preset"
   - 공개 게시: 체크
   - "게시" 버튼 클릭

2. **성공 확인**
   - **확인**: "게시글이 생성되었습니다!" 알림이 표시되어야 합니다.
   - 모달이 닫혀야 합니다.

3. **게시판에서 확인**
   - 게시판 페이지(`/community`)로 이동
   - **확인**: 방금 생성한 게시글이 목록에 표시되어야 합니다.

4. **중복 게시 테스트**
   - 같은 프리셋으로 다시 공유 시도
   - **확인**: "A post already exists for this preset" 에러 메시지가 표시되어야 합니다.

**확인 사항**:
- [ ] 공유 버튼이 표시되는가?
- [ ] 공유 모달이 정상적으로 열리는가?
- [ ] 게시글이 생성되는가?
- [ ] 중복 게시가 방지되는가?
- [ ] 에러가 발생하면 적절히 처리되는가?

---

### Phase 5: 게시판 UI 검증

#### 5.1 게시판 메인 페이지 확인

**테스트 시나리오**:

1. **게시판 접근**
   - `http://localhost:5173/community` 접속
   - **확인**: 게시판 페이지가 표시되어야 합니다.

2. **헤더 확인**
   - "💬 Community" 제목이 표시되어야 합니다.
   - 로그인 상태면 "✏️ 작성하기" 버튼이 표시되어야 합니다.

#### 5.2 게시글 목록 확인

**테스트 시나리오**:

1. **게시글 목록 표시**
   - 게시판 페이지 접속
   - **확인**: 게시글 카드들이 표시되어야 합니다.

2. **정렬 옵션 테스트**
   - "정렬" 드롭다운에서 "최신순" 선택
   - **확인**: 최신 게시글이 먼저 표시되어야 합니다.
   - "인기순" 선택
   - **확인**: 좋아요 수가 많은 게시글이 먼저 표시되어야 합니다.

3. **페이지네이션 테스트**
   - 게시글이 10개 이상인 경우
   - **확인**: 페이지네이션 버튼이 표시되어야 합니다.
   - "다음" 버튼 클릭
   - **확인**: 다음 페이지로 이동해야 합니다.

4. **게시글 카드 내용 확인**
   - 각 카드에 다음 정보가 표시되어야 합니다:
     - [ ] 제목
     - [ ] 설명 (100자 이상이면 잘림)
     - [ ] 작성자 닉네임
     - [ ] 좋아요 수
     - [ ] 다운로드 수
     - [ ] 작성 날짜

#### 5.3 게시글 상세 확인

**테스트 시나리오**:

1. **상세 페이지 접근**
   - 게시글 카드 클릭
   - **확인**: 게시글 상세 페이지로 이동해야 합니다.

2. **상세 내용 확인**
   - 다음 정보가 표시되어야 합니다:
     - [ ] 제목
     - [ ] 설명 (전체)
     - [ ] 작성자 정보
     - [ ] 작성 날짜
     - [ ] 좋아요 수
     - [ ] 다운로드 수
     - [ ] 프리셋 정보 (제목, BPM)

3. **좋아요 기능 테스트**
   - 로그인 상태에서 "❤️ 좋아요" 버튼 클릭
   - **확인**: 좋아요 수가 증가해야 합니다.
   - 비로그인 상태에서 클릭
   - **확인**: "로그인이 필요합니다." 알림이 표시되어야 합니다.

4. **다운로드 기능 테스트**
   - 로그인 상태에서 "⬇️ 다운로드" 버튼 클릭
   - **확인**: 다운로드 수가 증가해야 합니다.
   - **참고**: 현재는 카운트만 증가하며, 실제 프리셋 로드는 추후 구현 예정입니다.

5. **작성자 권한 확인**
   - 본인이 작성한 게시글 상세 페이지 접근
   - **확인**: 다음 버튼이 표시되어야 합니다:
     - [ ] "🔒 비공개로 전환" 또는 "🔓 공개로 전환" 버튼
     - [ ] "🗑️ 삭제" 버튼
   - 다른 사람이 작성한 게시글
   - **확인**: 위 버튼들이 표시되지 않아야 합니다.

6. **삭제 기능 테스트**
   - 본인 게시글의 "🗑️ 삭제" 버튼 클릭
   - **확인**: 확인 대화상자가 표시되어야 합니다.
   - 확인 클릭
   - **확인**: 게시글이 삭제되고 목록으로 이동해야 합니다.

7. **공개/비공개 전환 테스트**
   - 본인 게시글의 "🔒 비공개로 전환" 버튼 클릭
   - **확인**: 게시글이 비공개로 전환되어야 합니다.
   - 목록에서 확인
   - **확인**: 비공개 게시글은 목록에 표시되지 않아야 합니다.

#### 5.4 게시글 작성 확인

**테스트 시나리오**:

1. **작성 페이지 접근**
   - 로그인 상태에서 "✏️ 작성하기" 버튼 클릭
   - **확인**: 게시글 작성 페이지로 이동해야 합니다.
   - 비로그인 상태에서 접근 시도
   - **확인**: "로그인이 필요합니다." 알림 후 목록으로 리다이렉트되어야 합니다.

2. **작성 폼 확인**
   - 다음 필드가 표시되어야 합니다:
     - [ ] 프리셋 선택 드롭다운
     - [ ] 제목 입력 필드
     - [ ] 설명 입력 필드 (textarea)
     - [ ] 공개 게시 체크박스
     - [ ] 취소 버튼
     - [ ] 작성 버튼

3. **프리셋 선택 확인**
   - 프리셋 드롭다운 클릭
   - **확인**: 본인이 만든 프리셋 목록이 표시되어야 합니다.
   - 프리셋 선택
   - **확인**: 선택한 프리셋이 표시되어야 합니다.

4. **게시글 작성 테스트**
   - 프리셋 선택
   - 제목 입력: "Test Post"
   - 설명 입력: "This is a test"
   - 공개 게시 체크
   - "작성" 버튼 클릭
   - **확인**: "게시글이 생성되었습니다!" 알림이 표시되어야 합니다.
   - **확인**: 게시글 상세 페이지로 이동해야 합니다.

5. **유효성 검사 테스트**
   - 프리셋을 선택하지 않고 작성 시도
   - **확인**: "프리셋을 선택해주세요." 알림이 표시되어야 합니다.
   - 제목을 입력하지 않고 작성 시도
   - **확인**: "제목을 입력해주세요." 알림이 표시되어야 합니다.

**확인 사항**:
- [ ] 게시판 메인 페이지가 표시되는가?
- [ ] 게시글 목록이 표시되는가?
- [ ] 정렬 옵션이 작동하는가?
- [ ] 페이지네이션이 작동하는가?
- [ ] 게시글 상세 페이지가 표시되는가?
- [ ] 좋아요 기능이 작동하는가?
- [ ] 다운로드 기능이 작동하는가?
- [ ] 작성자 권한이 올바르게 체크되는가?
- [ ] 게시글 작성이 작동하는가?
- [ ] 유효성 검사가 작동하는가?

---

### 통합 테스트 시나리오

#### 전체 플로우 테스트

1. **로그인 → 설정 변경 → 프리셋 저장 → 공유 → 게시판 확인**

   **단계**:
   1. 로그인 (`/auth/dev_login` 또는 Google OAuth)
   2. 헤더의 "⚙️ Settings" 클릭
   3. 설정 변경 후 저장
   4. 프리셋 생성 (Launchpad에서 작업 후 "Save" 버튼)
   5. "📂 Presets" 클릭
   6. 프리셋의 "Share" 버튼 클릭
   7. 게시글 작성
   8. "💬 Community" 클릭
   9. 게시글 확인
   10. 게시글 클릭하여 상세 확인
   11. 좋아요/다운로드 테스트

   **예상 결과**: 모든 단계가 정상적으로 작동해야 합니다.

2. **게시판 → 다운로드 → 프리셋 로드** (추후 구현)

   **참고**: 현재는 다운로드 카운트만 증가합니다. 실제 프리셋 로드는 추후 구현 예정입니다.

---

### 에러 처리 확인

#### 일반적인 에러 시나리오

1. **네트워크 에러**
   - 서버를 중지한 상태에서 API 호출
   - **확인**: 적절한 에러 메시지가 표시되어야 합니다.

2. **인증 에러**
   - 로그아웃 상태에서 인증이 필요한 기능 사용
   - **확인**: "로그인이 필요합니다." 알림이 표시되어야 합니다.

3. **권한 에러**
   - 다른 사람의 게시글 수정/삭제 시도
   - **확인**: "Forbidden" 에러가 적절히 처리되어야 합니다.

4. **404 에러**
   - 존재하지 않는 게시글 ID 접근
   - **확인**: "게시글을 찾을 수 없습니다." 메시지가 표시되어야 합니다.

---

### 브라우저 개발자 도구 확인

#### 콘솔 에러 확인

1. **콘솔 열기**
   - F12 또는 우클릭 → 검사 → Console 탭

2. **에러 확인**
   - 빨간색 에러 메시지가 없어야 합니다.
   - 경고 메시지는 기능에 영향을 주지 않는 한 허용됩니다.

#### 네트워크 탭 확인

1. **네트워크 탭 열기**
   - F12 → Network 탭

2. **API 요청 확인**
   - 각 기능 사용 시 적절한 API 요청이 발생하는지 확인
   - 응답 상태 코드가 200 또는 201인지 확인
   - 에러 응답(400, 401, 403, 404 등)이 적절히 처리되는지 확인

---

### 데이터베이스 확인 (선택사항)

#### MySQL에서 직접 확인

```sql
-- UserPreferences 확인
SELECT * FROM UserPreferences WHERE userId = 1;

-- Posts 확인
SELECT * FROM Posts;

-- Posts와 Presets 조인 확인
SELECT p.*, pr.title as preset_title 
FROM Posts p 
LEFT JOIN Presets pr ON p.presetId = pr.id;
```

**확인 사항**:
- [ ] 설정이 데이터베이스에 저장되는가?
- [ ] 게시글이 데이터베이스에 저장되는가?
- [ ] 외래키 관계가 올바르게 설정되어 있는가?

---

## 📚 참고 자료

- [API 문서](./API_DOCUMENTATION.md)
- [React Router 문서](https://reactrouter.com/)
- [Zustand 문서](https://zustand-demo.pmnd.rs/)

---

**작성일**: 2024-01-XX
**목표**: MVP 수준의 기능 구현 (디자인 미고려)
