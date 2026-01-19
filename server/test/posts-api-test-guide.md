# Posts API 테스트 가이드

이 문서는 Posts API 엔드포인트를 테스트하기 위한 가이드입니다.

## 사전 준비

1. **서버 실행**
   ```bash
   cd server
   npm run dev
   # 또는
   npm start
   ```

2. **인증 확인**
   - 대부분의 API는 인증이 필요합니다.
   - 먼저 `/auth/dev_login` 또는 `/auth/google`로 로그인해야 합니다.
   - 브라우저에서 `http://localhost:3001/auth/dev_login` 접속 또는
   - Postman/Thunder Client에서 세션 쿠키를 사용

3. **테스트 데이터 준비**
   - 최소 1개 이상의 Preset이 필요합니다 (게시글 작성 시)
   - 여러 사용자 계정이 있으면 권한 테스트에 유용합니다

## 테스트 도구

- **Postman**: https://www.postman.com/
- **Thunder Client**: VS Code 확장 프로그램
- **curl**: 명령줄 도구

---

## 1. GET /api/posts - 게시글 목록 조회

### 요청

**Method**: `GET`  
**URL**: `http://localhost:3001/api/posts`  
**Query Parameters** (선택사항):
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 10)
- `sort`: 정렬 방식 (`popular` 또는 `created`, 기본값: `created`)

**예시**:
```
GET /api/posts?page=1&limit=10&sort=popular
GET /api/posts?page=2&limit=5&sort=created
```

### 예상 응답

**Status**: `200 OK`

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

**참고**: 공개된 게시글(`isPublished: true`)만 반환됩니다.

---

## 2. GET /api/posts/:id - 게시글 상세 조회

### 요청

**Method**: `GET`  
**URL**: `http://localhost:3001/api/posts/1`

### 예상 응답

**Status**: `200 OK`

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
        "keyChar": "Z",
        "mode": "one-shot",
        "volume": 0.7,
        "type": "sample",
        "Asset": {
          "id": 1,
          "filename": "sample.mp3",
          "originalName": "sample.mp3"
        }
      }
    ]
  }
}
```

### 게시글을 찾을 수 없는 경우

**Status**: `404 Not Found`

```json
{
  "message": "Post not found"
}
```

**참고**: 비공개 게시글(`isPublished: false`)은 조회할 수 없습니다.

---

## 3. GET /api/posts/user/my-posts - 내 게시글 목록

### 요청

**Method**: `GET`  
**URL**: `http://localhost:3001/api/posts/user/my-posts`  
**Headers**: 
```
Cookie: connect.sid=<세션_쿠키>
```

**Query Parameters** (선택사항):
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 10)

### 예상 응답

**Status**: `200 OK`

```json
{
  "posts": [
    {
      "id": 1,
      "title": "My Post",
      "isPublished": true,
      "likeCount": 5,
      "downloadCount": 2,
      "Preset": {
        "id": 1,
        "title": "My Preset",
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

**참고**: 공개/비공개 모두 조회됩니다.

### 비인증 요청 (401 Unauthorized)

**Status**: `401 Unauthorized`

```json
{
  "message": "Unauthorized"
}
```

---

## 4. POST /api/posts - 게시글 작성

### 요청

**Method**: `POST`  
**URL**: `http://localhost:3001/api/posts`  
**Headers**: 
```
Content-Type: application/json
Cookie: connect.sid=<세션_쿠키>
```

**Body** (JSON):
```json
{
  "presetId": 1,
  "title": "My Awesome Preset",
  "description": "This is a great preset!",
  "isPublished": true
}
```

### 예상 응답 (생성 성공)

**Status**: `201 Created`

```json
{
  "id": 1,
  "userId": 1,
  "presetId": 1,
  "title": "My Awesome Preset",
  "description": "This is a great preset!",
  "likeCount": 0,
  "downloadCount": 0,
  "isPublished": true,
  "createdAt": "2024-01-19T12:00:00.000Z",
  "updatedAt": "2024-01-19T12:00:00.000Z",
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

### 유효성 검사 실패 (400 Bad Request)

**Status**: `400 Bad Request`

예시: 필수 필드 누락
```json
{
  "title": "My Post"
  // presetId 누락
}
```
응답:
```json
{
  "message": "presetId and title are required"
}
```

### 프리셋을 찾을 수 없는 경우 (404 Not Found)

**Status**: `404 Not Found`

```json
{
  "message": "Preset not found or you do not have permission"
}
```

### 중복 게시글 (409 Conflict)

**Status**: `409 Conflict`

```json
{
  "message": "A post already exists for this preset",
  "post": { ...existing post... }
}
```

**참고**: 한 프리셋당 하나의 게시글만 가능합니다 (1:1 관계).

---

## 5. PUT /api/posts/:id - 게시글 수정

### 요청

**Method**: `PUT`  
**URL**: `http://localhost:3001/api/posts/1`  
**Headers**: 
```
Content-Type: application/json
Cookie: connect.sid=<세션_쿠키>
```

**Body** (JSON):
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "isPublished": false
}
```

### 예상 응답

**Status**: `200 OK`

```json
{
  "id": 1,
  "title": "Updated Title",
  "description": "Updated description",
  "isPublished": false,
  ...
}
```

### 소유자가 아닌 경우 (403 Forbidden)

**Status**: `403 Forbidden`

```json
{
  "message": "Forbidden: You are not the owner of this post"
}
```

---

## 6. DELETE /api/posts/:id - 게시글 삭제

### 요청

**Method**: `DELETE`  
**URL**: `http://localhost:3001/api/posts/1`  
**Headers**: 
```
Cookie: connect.sid=<세션_쿠키>
```

### 예상 응답

**Status**: `200 OK`

```json
{
  "message": "Post deleted successfully"
}
```

### 소유자가 아닌 경우 (403 Forbidden)

**Status**: `403 Forbidden`

```json
{
  "message": "Forbidden: You are not the owner of this post"
}
```

---

## 7. POST /api/posts/:id/like - 좋아요

### 요청

**Method**: `POST`  
**URL**: `http://localhost:3001/api/posts/1/like`  
**Headers**: 
```
Cookie: connect.sid=<세션_쿠키>
```

### 예상 응답

**Status**: `200 OK`

```json
{
  "success": true,
  "likeCount": 43
}
```

**참고**: 현재는 중복 방지가 없습니다. 향후 PostLikes 테이블 추가 시 중복 방지 가능.

---

## 8. POST /api/posts/:id/download - 다운로드

### 요청

**Method**: `POST`  
**URL**: `http://localhost:3001/api/posts/1/download`  
**Headers**: 
```
Cookie: connect.sid=<세션_쿠키>
```

### 예상 응답

**Status**: `200 OK`

```json
{
  "success": true,
  "downloadCount": 16,
  "post": {
    "id": 1,
    "title": "My Awesome Preset",
    "Preset": {
      "id": 1,
      "title": "Preset Title",
      "KeyMappings": [
        {
          "keyChar": "Z",
          "Asset": {
            "filename": "sample.mp3",
            "filePath": "/uploads/sample.mp3"
          }
        }
      ]
    }
  }
}
```

**참고**: 프리셋 전체 데이터(KeyMapping, Asset 포함)가 반환되어 프론트엔드에서 바로 사용할 수 있습니다.

---

## 9. POST /api/posts/:id/publish - 공개/비공개 전환

### 요청

**Method**: `POST`  
**URL**: `http://localhost:3001/api/posts/1/publish`  
**Headers**: 
```
Cookie: connect.sid=<세션_쿠키>
```

### 예상 응답

**Status**: `200 OK`

```json
{
  "success": true,
  "isPublished": false,
  "message": "Post unpublished"
}
```

### 소유자가 아닌 경우 (403 Forbidden)

**Status**: `403 Forbidden`

```json
{
  "message": "Forbidden: You are not the owner of this post"
}
```

---

## 테스트 시나리오

### 시나리오 1: 게시글 작성 및 조회

1. 로그인 (`/auth/dev_login`)
2. Preset 생성 또는 기존 Preset 확인
3. `POST /api/posts` - 게시글 작성
4. `GET /api/posts` - 목록에서 확인
5. `GET /api/posts/:id` - 상세 조회

### 시나리오 2: 권한 테스트

1. 사용자 A로 로그인
2. `POST /api/posts` - 게시글 작성
3. 사용자 B로 로그인 (또는 로그아웃 후 다른 계정)
4. `PUT /api/posts/:id` - 수정 시도 → 403 확인
5. `DELETE /api/posts/:id` - 삭제 시도 → 403 확인

### 시나리오 3: 페이징 및 정렬

1. 여러 게시글 생성 (10개 이상 권장)
2. `GET /api/posts?page=1&limit=5` - 첫 페이지
3. `GET /api/posts?page=2&limit=5` - 두 번째 페이지
4. `GET /api/posts?sort=popular` - 인기순 정렬
5. `GET /api/posts?sort=created` - 최신순 정렬

### 시나리오 4: 좋아요 및 다운로드

1. `GET /api/posts/:id` - 현재 likeCount 확인
2. `POST /api/posts/:id/like` - 좋아요
3. `GET /api/posts/:id` - likeCount 증가 확인
4. `POST /api/posts/:id/download` - 다운로드
5. `GET /api/posts/:id` - downloadCount 증가 확인

### 시나리오 5: 1:1 관계 검증

1. Preset 1에 게시글 작성
2. 같은 Preset 1에 또 다른 게시글 작성 시도
3. `409 Conflict` 응답 확인

### 시나리오 6: 공개/비공개 전환

1. 게시글 작성 (`isPublished: true`)
2. `GET /api/posts` - 목록에 표시 확인
3. `POST /api/posts/:id/publish` - 비공개 전환
4. `GET /api/posts` - 목록에서 사라짐 확인
5. `GET /api/posts/user/my-posts` - 내 게시글에는 여전히 표시

---

## curl 예시

### 로그인 (dev_login)

```bash
curl -c cookies.txt -b cookies.txt http://localhost:3001/auth/dev_login
```

### GET 목록

```bash
curl -b cookies.txt "http://localhost:3001/api/posts?page=1&limit=10&sort=popular"
```

### POST 작성

```bash
curl -X POST -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"presetId": 1, "title": "My Post", "description": "Description"}' \
  http://localhost:3001/api/posts
```

### PUT 수정

```bash
curl -X PUT -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title"}' \
  http://localhost:3001/api/posts/1
```

### DELETE 삭제

```bash
curl -X DELETE -b cookies.txt http://localhost:3001/api/posts/1
```

### POST 좋아요

```bash
curl -X POST -b cookies.txt http://localhost:3001/api/posts/1/like
```

### POST 다운로드

```bash
curl -X POST -b cookies.txt http://localhost:3001/api/posts/1/download
```

### POST 공개/비공개 전환

```bash
curl -X POST -b cookies.txt http://localhost:3001/api/posts/1/publish
```

---

## 체크리스트

### 모델 테스트
- [ ] 모델이 정상적으로 로드됨
- [ ] 테이블이 생성됨
- [ ] 관계가 정상 설정됨
- [ ] 기본값이 올바르게 설정됨

### API 테스트
- [ ] GET 목록 엔드포인트 동작 (공개 게시글만)
- [ ] GET 상세 엔드포인트 동작
- [ ] GET 내 게시글 엔드포인트 동작
- [ ] POST 작성 엔드포인트 동작
- [ ] PUT 수정 엔드포인트 동작 (소유자만)
- [ ] DELETE 삭제 엔드포인트 동작 (소유자만)
- [ ] POST 좋아요 엔드포인트 동작
- [ ] POST 다운로드 엔드포인트 동작
- [ ] POST 공개/비공개 전환 동작
- [ ] 페이징 동작 확인
- [ ] 정렬 동작 확인 (인기순/최신순)
- [ ] 1:1 관계 검증 (중복 방지)
- [ ] 권한 검증 (소유자만 수정/삭제)

---

## 문제 해결

### 404 Not Found (게시글)
- 게시글이 비공개(`isPublished: false`)인지 확인
- 게시글 ID가 올바른지 확인

### 403 Forbidden
- 로그인이 되어 있는지 확인
- 게시글 소유자인지 확인

### 409 Conflict (중복 게시글)
- 같은 프리셋에 이미 게시글이 있는지 확인
- 1:1 관계이므로 한 프리셋당 하나의 게시글만 가능

### 500 Server Error
- 서버 로그 확인
- 데이터베이스 연결 확인
- Posts 테이블이 생성되었는지 확인

---

## 향후 개선 사항

1. **좋아요 중복 방지**: PostLikes 테이블 추가
2. **댓글 기능**: PostComments 테이블 추가
3. **태그 기능**: PostTags 테이블 추가
4. **검색 기능**: 제목/설명 검색
5. **필터링**: 카테고리, 태그별 필터
