# Web-DAW API 문서

이 문서는 Web-DAW 프로젝트의 RESTful API 엔드포인트를 설명합니다. 프론트엔드 개발자를 위한 참고 자료입니다.

---

## 목차

1. [기본 정보](#기본-정보)
2. [인증](#인증)
3. [UserPreferences API](#userpreferences-api)
4. [Posts API](#posts-api)
5. [에러 처리](#에러-처리)
6. [예제 코드](#예제-코드)

---

## 기본 정보

### Base URL

- **개발 환경**: `http://localhost:3001`
- **프로덕션 환경**: (배포 시 업데이트 예정)

### Content-Type

모든 요청은 `Content-Type: application/json` 헤더를 포함해야 합니다.

### CORS

서버는 `http://localhost:5173` (Vite 개발 서버)에서의 요청을 허용합니다. `credentials: true`가 설정되어 있어 쿠키 기반 인증이 가능합니다.

---

## 인증

### 인증 방식

이 API는 **세션 기반 인증**을 사용합니다. Passport.js와 `express-session`을 통해 세션 쿠키를 관리합니다.

### 로그인

#### Google OAuth 로그인

```javascript
// 브라우저에서 리다이렉트
window.location.href = 'http://localhost:3001/auth/google';
```

#### 개발용 로그인 (Dev Login)

개발 환경에서 Google OAuth 없이 로그인하려면:

```javascript
// 브라우저에서 리다이렉트
window.location.href = 'http://localhost:3001/auth/dev_login';
```

### 세션 확인

```javascript
// GET /auth/user
const response = await fetch('http://localhost:3001/auth/user', {
  credentials: 'include' // 쿠키 포함 필수
});
const user = await response.json();

if (user.id) {
  console.log('로그인됨:', user);
} else {
  console.log('로그인 안 됨');
}
```

### 로그아웃

```javascript
// GET /auth/logout
window.location.href = 'http://localhost:3001/auth/logout';
```

### 인증이 필요한 요청

인증이 필요한 API를 호출할 때는 **반드시 `credentials: 'include'` 옵션을 사용**해야 합니다:

```javascript
fetch('http://localhost:3001/api/user/preferences', {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
});
```

---

## UserPreferences API

사용자별 앱 전체 설정을 관리하는 API입니다.

### Base URL

`/api/user/preferences`

---

### 1. 사용자 설정 조회

현재 로그인한 사용자의 설정을 조회합니다. 설정이 없으면 기본값을 반환합니다.

**Endpoint**: `GET /api/user/preferences`

**인증**: 필요 ✅

**요청 예시**:

```javascript
const response = await fetch('http://localhost:3001/api/user/preferences', {
  credentials: 'include'
});
const preferences = await response.json();
```

**응답 (설정이 있는 경우)**:

```json
{
  "id": 1,
  "userId": 1,
  "latencyMs": 100,
  "visualizerMode": "spectrum",
  "defaultMasterVolume": 0.7,
  "createdAt": "2024-01-19T12:00:00.000Z",
  "updatedAt": "2024-01-19T12:00:00.000Z"
}
```

**응답 (설정이 없는 경우 - 기본값 반환)**:

```json
{
  "id": null,
  "userId": 1,
  "latencyMs": 100,
  "visualizerMode": null,
  "defaultMasterVolume": 0.7,
  "createdAt": null,
  "updatedAt": null
}
```

**에러 응답**:

- `401 Unauthorized`: 로그인하지 않음
- `500 Server Error`: 서버 오류

---

### 2. 사용자 설정 업데이트/생성

사용자 설정을 업데이트합니다. 설정이 없으면 자동으로 생성합니다.

**Endpoint**: `PUT /api/user/preferences`

**인증**: 필요 ✅

**요청 Body**:

```json
{
  "latencyMs": 150,           // 선택사항: 오디오 레이턴시 (밀리초, 0 이상)
  "visualizerMode": "waveform", // 선택사항: 비주얼라이저 모드 (문자열)
  "defaultMasterVolume": 0.8   // 선택사항: 기본 마스터 볼륨 (0.0 ~ 1.0)
}
```

**요청 예시**:

```javascript
const response = await fetch('http://localhost:3001/api/user/preferences', {
  method: 'PUT',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    latencyMs: 150,
    visualizerMode: 'waveform',
    defaultMasterVolume: 0.8
  })
});
const preferences = await response.json();
```

**응답**:

```json
{
  "id": 1,
  "userId": 1,
  "latencyMs": 150,
  "visualizerMode": "waveform",
  "defaultMasterVolume": 0.8,
  "createdAt": "2024-01-19T12:00:00.000Z",
  "updatedAt": "2024-01-19T12:05:00.000Z"
}
```

**에러 응답**:

- `400 Bad Request`: 잘못된 입력값
  ```json
  {
    "message": "latencyMs must be a non-negative number"
  }
  ```
  또는
  ```json
  {
    "message": "defaultMasterVolume must be a number between 0 and 1"
  }
  ```
- `401 Unauthorized`: 로그인하지 않음
- `500 Server Error`: 서버 오류

**필드 설명**:

- `latencyMs`: 오디오 출력 레이턴시 설정 (단위: 밀리초, 기본값: 100)
- `visualizerMode`: 사운드 비주얼라이저 디자인 타입 (예: `'waveform'`, `'spectrum'`, `'bars'`, 기본값: `null`)
- `defaultMasterVolume`: 앱 시작 시 기본 마스터 볼륨 (0.0 ~ 1.0, 기본값: 0.7)

---

### 3. 사용자 설정 생성 (신규만)

사용자 설정을 새로 생성합니다. 이미 설정이 있으면 에러를 반환합니다.

**Endpoint**: `POST /api/user/preferences`

**인증**: 필요 ✅

**요청 Body**:

```json
{
  "latencyMs": 100,           // 선택사항
  "visualizerMode": null,     // 선택사항
  "defaultMasterVolume": 0.7   // 선택사항
}
```

**요청 예시**:

```javascript
const response = await fetch('http://localhost:3001/api/user/preferences', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    latencyMs: 100,
    visualizerMode: 'spectrum',
    defaultMasterVolume: 0.7
  })
});
```

**응답 (성공)**:

```json
{
  "id": 1,
  "userId": 1,
  "latencyMs": 100,
  "visualizerMode": "spectrum",
  "defaultMasterVolume": 0.7,
  "createdAt": "2024-01-19T12:00:00.000Z",
  "updatedAt": "2024-01-19T12:00:00.000Z"
}
```

**에러 응답**:

- `409 Conflict`: 이미 설정이 존재함
  ```json
  {
    "message": "Preferences already exist. Use PUT to update.",
    "preferences": { /* 기존 설정 객체 */ }
  }
  ```
- `400 Bad Request`: 잘못된 입력값
- `401 Unauthorized`: 로그인하지 않음
- `500 Server Error`: 서버 오류

---

## Posts API

프리셋을 공유하는 게시판 기능을 제공하는 API입니다.

### Base URL

`/api/posts`

---

### 1. 게시글 목록 조회

공개된 게시글 목록을 조회합니다. 페이지네이션과 정렬을 지원합니다.

**Endpoint**: `GET /api/posts`

**인증**: 불필요 ❌

**Query Parameters**:

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| `page` | number | 1 | 페이지 번호 |
| `limit` | number | 10 | 페이지당 항목 수 |
| `sort` | string | `'created'` | 정렬 방식 (`'created'` 또는 `'popular'`) |

**요청 예시**:

```javascript
// 최신순 정렬
const response = await fetch('http://localhost:3001/api/posts?page=1&limit=10&sort=created', {
  credentials: 'include'
});

// 인기순 정렬
const response2 = await fetch('http://localhost:3001/api/posts?page=1&limit=10&sort=popular', {
  credentials: 'include'
});
```

**응답**:

```json
{
  "posts": [
    {
      "id": 1,
      "title": "My Awesome Preset",
      "description": "This is a great preset!",
      "likeCount": 42,
      "downloadCount": 15,
      "isPublished": true,
      "createdAt": "2024-01-19T12:00:00.000Z",
      "updatedAt": "2024-01-19T12:00:00.000Z",
      "userId": 1,
      "presetId": 1,
      "User": {
        "id": 1,
        "nickname": "User1",
        "email": "user1@example.com"
      },
      "Preset": {
        "id": 1,
        "title": "Preset Title",
        "bpm": 120
      }
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

**에러 응답**:

- `500 Server Error`: 서버 오류

---

### 2. 게시글 상세 조회

특정 게시글의 상세 정보를 조회합니다. 프리셋과 키 매핑 정보를 포함합니다.

**Endpoint**: `GET /api/posts/:id`

**인증**: 불필요 ❌

**URL Parameters**:

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `id` | number | 게시글 ID |

**요청 예시**:

```javascript
const response = await fetch('http://localhost:3001/api/posts/1', {
  credentials: 'include'
});
const post = await response.json();
```

**응답**:

```json
{
  "id": 1,
  "title": "My Awesome Preset",
  "description": "This is a great preset!",
  "likeCount": 42,
  "downloadCount": 15,
  "isPublished": true,
  "createdAt": "2024-01-19T12:00:00.000Z",
  "updatedAt": "2024-01-19T12:00:00.000Z",
  "userId": 1,
  "presetId": 1,
  "User": {
    "id": 1,
    "nickname": "User1",
    "email": "user1@example.com"
  },
  "Preset": {
    "id": 1,
    "title": "Preset Title",
    "bpm": 120,
    "masterVolume": 0.7,
    "isQuantized": true,
    "KeyMappings": [
      {
        "id": 1,
        "keyChar": "0",
        "mode": "one-shot",
        "volume": 0.8,
        "type": "sample",
        "note": null,
        "assetId": 1,
        "synthSettings": null,
        "Asset": {
          "id": 1,
          "filename": "audio.mp3",
          "originalName": "My Audio.mp3",
          "filePath": "/uploads/audio.mp3"
        }
      }
    ]
  }
}
```

**에러 응답**:

- `404 Not Found`: 게시글을 찾을 수 없음
  ```json
  {
    "message": "Post not found"
  }
  ```
- `500 Server Error`: 서버 오류

---

### 3. 내 게시글 목록 조회

현재 로그인한 사용자가 작성한 게시글 목록을 조회합니다. 공개/비공개 모두 포함됩니다.

**Endpoint**: `GET /api/posts/user/my-posts`

**인증**: 필요 ✅

**Query Parameters**:

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| `page` | number | 1 | 페이지 번호 |
| `limit` | number | 10 | 페이지당 항목 수 |

**요청 예시**:

```javascript
const response = await fetch('http://localhost:3001/api/posts/user/my-posts?page=1&limit=10', {
  credentials: 'include'
});
const data = await response.json();
```

**응답**:

```json
{
  "posts": [
    {
      "id": 1,
      "title": "My Post",
      "description": "Description",
      "likeCount": 5,
      "downloadCount": 2,
      "isPublished": true,
      "createdAt": "2024-01-19T12:00:00.000Z",
      "updatedAt": "2024-01-19T12:00:00.000Z",
      "userId": 1,
      "presetId": 1,
      "Preset": {
        "id": 1,
        "title": "Preset Title",
        "bpm": 120
      }
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

**에러 응답**:

- `401 Unauthorized`: 로그인하지 않음
- `500 Server Error`: 서버 오류

---

### 4. 게시글 생성

새로운 게시글을 생성합니다. 한 프리셋당 하나의 게시글만 생성할 수 있습니다.

**Endpoint**: `POST /api/posts`

**인증**: 필요 ✅

**요청 Body**:

```json
{
  "presetId": 1,                    // 필수: 프리셋 ID
  "title": "My Awesome Preset",     // 필수: 게시글 제목
  "description": "Description...",  // 선택사항: 게시글 설명
  "isPublished": true               // 선택사항: 공개 여부 (기본값: true)
}
```

**요청 예시**:

```javascript
const response = await fetch('http://localhost:3001/api/posts', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    presetId: 1,
    title: 'My Awesome Preset',
    description: 'This is a great preset!',
    isPublished: true
  })
});
const post = await response.json();
```

**응답**:

```json
{
  "id": 1,
  "title": "My Awesome Preset",
  "description": "This is a great preset!",
  "likeCount": 0,
  "downloadCount": 0,
  "isPublished": true,
  "createdAt": "2024-01-19T12:00:00.000Z",
  "updatedAt": "2024-01-19T12:00:00.000Z",
  "userId": 1,
  "presetId": 1,
  "User": {
    "id": 1,
    "nickname": "User1",
    "email": "user1@example.com"
  },
  "Preset": {
    "id": 1,
    "title": "Preset Title",
    "bpm": 120
  }
}
```

**에러 응답**:

- `400 Bad Request`: 필수 필드 누락
  ```json
  {
    "message": "presetId and title are required"
  }
  ```
- `401 Unauthorized`: 로그인하지 않음
- `404 Not Found`: 프리셋을 찾을 수 없거나 권한 없음
  ```json
  {
    "message": "Preset not found or you do not have permission"
  }
  ```
- `409 Conflict`: 해당 프리셋에 이미 게시글이 존재함
  ```json
  {
    "message": "A post already exists for this preset",
    "post": { /* 기존 게시글 객체 */ }
  }
  ```
- `500 Server Error`: 서버 오류

---

### 5. 게시글 수정

게시글을 수정합니다. 본인 게시글만 수정할 수 있습니다.

**Endpoint**: `PUT /api/posts/:id`

**인증**: 필요 ✅ (본인만)

**URL Parameters**:

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `id` | number | 게시글 ID |

**요청 Body**:

```json
{
  "title": "Updated Title",         // 선택사항: 제목
  "description": "Updated desc...", // 선택사항: 설명
  "isPublished": false              // 선택사항: 공개 여부
}
```

**요청 예시**:

```javascript
const response = await fetch('http://localhost:3001/api/posts/1', {
  method: 'PUT',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Updated Title',
    description: 'Updated description',
    isPublished: false
  })
});
const post = await response.json();
```

**응답**:

```json
{
  "id": 1,
  "title": "Updated Title",
  "description": "Updated description",
  "likeCount": 5,
  "downloadCount": 2,
  "isPublished": false,
  "createdAt": "2024-01-19T12:00:00.000Z",
  "updatedAt": "2024-01-19T12:05:00.000Z",
  "userId": 1,
  "presetId": 1,
  "User": {
    "id": 1,
    "nickname": "User1",
    "email": "user1@example.com"
  },
  "Preset": {
    "id": 1,
    "title": "Preset Title",
    "bpm": 120
  }
}
```

**에러 응답**:

- `401 Unauthorized`: 로그인하지 않음
- `403 Forbidden`: 본인 게시글이 아님
  ```json
  {
    "message": "Forbidden: You are not the owner of this post"
  }
  ```
- `404 Not Found`: 게시글을 찾을 수 없음
- `500 Server Error`: 서버 오류

---

### 6. 게시글 삭제

게시글을 삭제합니다. 본인 게시글만 삭제할 수 있습니다.

**Endpoint**: `DELETE /api/posts/:id`

**인증**: 필요 ✅ (본인만)

**URL Parameters**:

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `id` | number | 게시글 ID |

**요청 예시**:

```javascript
const response = await fetch('http://localhost:3001/api/posts/1', {
  method: 'DELETE',
  credentials: 'include'
});
const result = await response.json();
```

**응답**:

```json
{
  "message": "Post deleted successfully"
}
```

**에러 응답**:

- `401 Unauthorized`: 로그인하지 않음
- `403 Forbidden`: 본인 게시글이 아님
- `404 Not Found`: 게시글을 찾을 수 없음
- `500 Server Error`: 서버 오류

---

### 7. 게시글 좋아요

게시글에 좋아요를 추가합니다. (현재는 중복 좋아요 방지 없음)

**Endpoint**: `POST /api/posts/:id/like`

**인증**: 필요 ✅

**URL Parameters**:

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `id` | number | 게시글 ID |

**요청 예시**:

```javascript
const response = await fetch('http://localhost:3001/api/posts/1/like', {
  method: 'POST',
  credentials: 'include'
});
const result = await response.json();
```

**응답**:

```json
{
  "success": true,
  "likeCount": 43
}
```

**에러 응답**:

- `401 Unauthorized`: 로그인하지 않음
- `404 Not Found`: 게시글을 찾을 수 없음
- `500 Server Error`: 서버 오류

---

### 8. 게시글 다운로드

게시글의 프리셋 데이터를 다운로드합니다. 다운로드 횟수가 증가합니다.

**Endpoint**: `POST /api/posts/:id/download`

**인증**: 필요 ✅

**URL Parameters**:

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `id` | number | 게시글 ID |

**요청 예시**:

```javascript
const response = await fetch('http://localhost:3001/api/posts/1/download', {
  method: 'POST',
  credentials: 'include'
});
const data = await response.json();
```

**응답**:

```json
{
  "success": true,
  "downloadCount": 16,
  "post": {
    "id": 1,
    "title": "My Awesome Preset",
    "description": "Description",
    "likeCount": 42,
    "downloadCount": 16,
    "isPublished": true,
    "createdAt": "2024-01-19T12:00:00.000Z",
    "updatedAt": "2024-01-19T12:00:00.000Z",
    "userId": 1,
    "presetId": 1,
    "Preset": {
      "id": 1,
      "title": "Preset Title",
      "bpm": 120,
      "masterVolume": 0.7,
      "isQuantized": true,
      "KeyMappings": [
        {
          "id": 1,
          "keyChar": "0",
          "mode": "one-shot",
          "volume": 0.8,
          "type": "sample",
          "note": null,
          "assetId": 1,
          "synthSettings": null,
          "Asset": {
            "id": 1,
            "filename": "audio.mp3",
            "originalName": "My Audio.mp3",
            "filePath": "/uploads/audio.mp3"
          }
        }
      ]
    }
  }
}
```

**에러 응답**:

- `401 Unauthorized`: 로그인하지 않음
- `404 Not Found`: 게시글을 찾을 수 없음
- `500 Server Error`: 서버 오류

---

### 9. 게시글 공개/비공개 전환

게시글의 공개 상태를 전환합니다. 본인 게시글만 가능합니다.

**Endpoint**: `POST /api/posts/:id/publish`

**인증**: 필요 ✅ (본인만)

**URL Parameters**:

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `id` | number | 게시글 ID |

**요청 예시**:

```javascript
const response = await fetch('http://localhost:3001/api/posts/1/publish', {
  method: 'POST',
  credentials: 'include'
});
const result = await response.json();
```

**응답**:

```json
{
  "success": true,
  "isPublished": false,
  "message": "Post unpublished"
}
```

또는

```json
{
  "success": true,
  "isPublished": true,
  "message": "Post published"
}
```

**에러 응답**:

- `401 Unauthorized`: 로그인하지 않음
- `403 Forbidden`: 본인 게시글이 아님
- `404 Not Found`: 게시글을 찾을 수 없음
- `500 Server Error`: 서버 오류

---

## 에러 처리

### HTTP 상태 코드

| 코드 | 의미 | 설명 |
|------|------|------|
| `200` | OK | 요청 성공 |
| `201` | Created | 리소스 생성 성공 |
| `400` | Bad Request | 잘못된 요청 (입력값 검증 실패) |
| `401` | Unauthorized | 인증 필요 |
| `403` | Forbidden | 권한 없음 (본인 리소스 아님) |
| `404` | Not Found | 리소스를 찾을 수 없음 |
| `409` | Conflict | 리소스 충돌 (중복 생성 등) |
| `500` | Server Error | 서버 내부 오류 |

### 에러 응답 형식

모든 에러 응답은 다음 형식을 따릅니다:

```json
{
  "message": "에러 메시지"
}
```

일부 에러는 추가 정보를 포함할 수 있습니다:

```json
{
  "message": "에러 메시지",
  "preferences": { /* 관련 리소스 */ }
}
```

---

## 예제 코드

### React/TypeScript 예제

```typescript
// API 클라이언트 설정
const API_BASE_URL = 'http://localhost:3001';

// Fetch 래퍼 함수
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API 요청 실패');
  }

  return response.json();
}

// UserPreferences API 사용 예제
export const userPreferencesAPI = {
  // 설정 조회
  async getPreferences() {
    return apiRequest<UserPreference>('/api/user/preferences');
  },

  // 설정 업데이트
  async updatePreferences(data: {
    latencyMs?: number;
    visualizerMode?: string | null;
    defaultMasterVolume?: number;
  }) {
    return apiRequest<UserPreference>('/api/user/preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // 설정 생성
  async createPreferences(data: {
    latencyMs?: number;
    visualizerMode?: string | null;
    defaultMasterVolume?: number;
  }) {
    return apiRequest<UserPreference>('/api/user/preferences', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Posts API 사용 예제
export const postsAPI = {
  // 게시글 목록 조회
  async getPosts(params?: {
    page?: number;
    limit?: number;
    sort?: 'created' | 'popular';
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.sort) query.append('sort', params.sort);
    
    return apiRequest<{
      posts: Post[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/api/posts?${query.toString()}`);
  },

  // 게시글 상세 조회
  async getPost(id: number) {
    return apiRequest<Post>(`/api/posts/${id}`);
  },

  // 내 게시글 목록
  async getMyPosts(params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    
    return apiRequest<{
      posts: Post[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/api/posts/user/my-posts?${query.toString()}`);
  },

  // 게시글 생성
  async createPost(data: {
    presetId: number;
    title: string;
    description?: string;
    isPublished?: boolean;
  }) {
    return apiRequest<Post>('/api/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 게시글 수정
  async updatePost(id: number, data: {
    title?: string;
    description?: string;
    isPublished?: boolean;
  }) {
    return apiRequest<Post>(`/api/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // 게시글 삭제
  async deletePost(id: number) {
    return apiRequest<{ message: string }>(`/api/posts/${id}`, {
      method: 'DELETE',
    });
  },

  // 좋아요
  async likePost(id: number) {
    return apiRequest<{ success: boolean; likeCount: number }>(
      `/api/posts/${id}/like`,
      { method: 'POST' }
    );
  },

  // 다운로드
  async downloadPost(id: number) {
    return apiRequest<{
      success: boolean;
      downloadCount: number;
      post: Post;
    }>(`/api/posts/${id}/download`, { method: 'POST' });
  },

  // 공개/비공개 전환
  async togglePublish(id: number) {
    return apiRequest<{
      success: boolean;
      isPublished: boolean;
      message: string;
    }>(`/api/posts/${id}/publish`, { method: 'POST' });
  },
};

// 타입 정의
interface UserPreference {
  id: number | null;
  userId: number;
  latencyMs: number;
  visualizerMode: string | null;
  defaultMasterVolume: number;
  createdAt: string | null;
  updatedAt: string | null;
}

interface Post {
  id: number;
  title: string;
  description: string | null;
  likeCount: number;
  downloadCount: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  userId: number;
  presetId: number;
  User?: {
    id: number;
    nickname: string;
    email: string;
  };
  Preset?: {
    id: number;
    title: string;
    bpm: number;
    masterVolume?: number;
    isQuantized?: boolean;
    KeyMappings?: Array<{
      id: number;
      keyChar: string;
      mode: string;
      volume: number;
      type: string;
      note: string | null;
      assetId: number | null;
      synthSettings: any;
      Asset?: {
        id: number;
        filename: string;
        originalName: string;
        filePath: string;
      };
    }>;
  };
}
```

### React Hook 예제

```typescript
import { useState, useEffect } from 'react';
import { userPreferencesAPI, UserPreference } from './api';

// UserPreferences Hook
export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const data = await userPreferencesAPI.getPreferences();
      setPreferences(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (data: Partial<UserPreference>) => {
    try {
      setLoading(true);
      const updated = await userPreferencesAPI.updatePreferences(data);
      setPreferences(updated);
      setError(null);
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update preferences';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    reload: loadPreferences,
  };
}
```

---

## 참고사항

### 세션 쿠키

- 모든 인증이 필요한 요청에는 `credentials: 'include'` 옵션이 필수입니다.
- 브라우저에서 자동으로 쿠키가 전송되지만, `fetch` API를 사용할 때는 명시적으로 설정해야 합니다.

### CORS 설정

- 개발 환경에서는 `http://localhost:5173`에서의 요청만 허용됩니다.
- 프로덕션 환경에서는 배포된 프론트엔드 도메인으로 변경해야 합니다.

### 데이터베이스 관계

- **Posts ↔ Presets**: 1:1 관계 (한 프리셋당 하나의 게시글만 가능)
- **Posts ↔ Users**: N:1 관계 (한 사용자가 여러 게시글 작성 가능)
- **UserPreferences ↔ Users**: 1:1 관계 (한 사용자당 하나의 설정)

### 페이지네이션

- `page`는 1부터 시작합니다.
- `limit`는 페이지당 항목 수를 지정합니다.
- `totalPages`는 전체 페이지 수를 나타냅니다.

---

## 업데이트 이력

- **2024-01-19**: 초기 문서 작성 (UserPreferences, Posts API)

---

문의사항이나 버그 리포트는 백엔드 팀에 문의해주세요.
