# UserPreferences API 테스트 가이드

이 문서는 UserPreferences API 엔드포인트를 테스트하기 위한 가이드입니다.

## 사전 준비

1. **서버 실행**
   ```bash
   cd server
   npm run dev
   # 또는
   npm start
   ```

2. **인증 확인**
   - API는 인증이 필요합니다.
   - 먼저 `/auth/dev_login` 또는 `/auth/google`로 로그인해야 합니다.
   - 브라우저에서 `http://localhost:3001/auth/dev_login` 접속 또는
   - Postman/Thunder Client에서 세션 쿠키를 사용

## 테스트 도구

- **Postman**: https://www.postman.com/
- **Thunder Client**: VS Code 확장 프로그램
- **curl**: 명령줄 도구

---

## 1. GET /api/user/preferences - 설정 조회

### 요청

**Method**: `GET`  
**URL**: `http://localhost:3001/api/user/preferences`  
**Headers**: 
```
Cookie: connect.sid=<세션_쿠키> (브라우저에서 자동 전송)
```

**Postman/Thunder Client 설정**:
- Auth Type: None (세션 쿠키는 자동으로 포함됨)
- 또는 직접 쿠키를 추가

### 예상 응답 (설정이 있는 경우)

**Status**: `200 OK`

```json
{
  "id": 1,
  "userId": 1,
  "latencyMs": 100,
  "visualizerMode": "waveform",
  "defaultMasterVolume": 0.7,
  "createdAt": "2024-01-19T12:00:00.000Z",
  "updatedAt": "2024-01-19T12:00:00.000Z"
}
```

### 예상 응답 (설정이 없는 경우)

**Status**: `200 OK`

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

### 비인증 요청 (401 Unauthorized)

**Status**: `401 Unauthorized`

```json
{
  "message": "Unauthorized"
}
```

---

## 2. PUT /api/user/preferences - 설정 업데이트/생성

### 요청

**Method**: `PUT`  
**URL**: `http://localhost:3001/api/user/preferences`  
**Headers**: 
```
Content-Type: application/json
Cookie: connect.sid=<세션_쿠키>
```

**Body** (JSON):
```json
{
  "latencyMs": 150,
  "visualizerMode": "spectrum",
  "defaultMasterVolume": 0.8
}
```

### 예상 응답

**Status**: `200 OK` (업데이트) 또는 `201 Created` (생성)

```json
{
  "id": 1,
  "userId": 1,
  "latencyMs": 150,
  "visualizerMode": "spectrum",
  "defaultMasterVolume": 0.8,
  "createdAt": "2024-01-19T12:00:00.000Z",
  "updatedAt": "2024-01-19T12:30:00.000Z"
}
```

### 유효성 검사 실패 (400 Bad Request)

**Status**: `400 Bad Request`

예시 1: latencyMs가 음수
```json
{
  "latencyMs": -10
}
```
응답:
```json
{
  "message": "latencyMs must be a non-negative number"
}
```

예시 2: defaultMasterVolume 범위 초과
```json
{
  "defaultMasterVolume": 1.5
}
```
응답:
```json
{
  "message": "defaultMasterVolume must be a number between 0 and 1"
}
```

---

## 3. POST /api/user/preferences - 설정 생성 (최초 1회만)

### 요청

**Method**: `POST`  
**URL**: `http://localhost:3001/api/user/preferences`  
**Headers**: 
```
Content-Type: application/json
Cookie: connect.sid=<세션_쿠키>
```

**Body** (JSON):
```json
{
  "latencyMs": 120,
  "visualizerMode": "bars",
  "defaultMasterVolume": 0.75
}
```

### 예상 응답 (생성 성공)

**Status**: `201 Created`

```json
{
  "id": 1,
  "userId": 1,
  "latencyMs": 120,
  "visualizerMode": "bars",
  "defaultMasterVolume": 0.75,
  "createdAt": "2024-01-19T12:00:00.000Z",
  "updatedAt": "2024-01-19T12:00:00.000Z"
}
```

### 중복 생성 시도 (409 Conflict)

**Status**: `409 Conflict`

```json
{
  "message": "Preferences already exist. Use PUT to update.",
  "preferences": {
    "id": 1,
    "userId": 1,
    ...
  }
}
```

---

## 테스트 시나리오

### 시나리오 1: 처음 사용자 설정 생성

1. 로그인 (`/auth/dev_login`)
2. `GET /api/user/preferences` - 기본값 반환 확인
3. `POST /api/user/preferences` - 설정 생성
4. `GET /api/user/preferences` - 생성된 설정 확인

### 시나리오 2: 설정 업데이트

1. 로그인
2. `PUT /api/user/preferences` - 설정 업데이트
3. `GET /api/user/preferences` - 업데이트된 설정 확인

### 시나리오 3: 설정이 없는 상태에서 PUT 사용

1. 로그인 (새 사용자 또는 설정 삭제 후)
2. `PUT /api/user/preferences` - 자동 생성 확인
3. `GET /api/user/preferences` - 생성된 설정 확인

### 시나리오 4: 인증 없이 접근

1. 세션 없이 `GET /api/user/preferences` 요청
2. `401 Unauthorized` 응답 확인

### 시나리오 5: 유효성 검사

1. 로그인
2. `PUT /api/user/preferences` - 잘못된 값 전송
3. `400 Bad Request` 응답 확인

---

## curl 예시

### 로그인 (dev_login)

```bash
curl -c cookies.txt -b cookies.txt http://localhost:3001/auth/dev_login
```

### GET 요청

```bash
curl -b cookies.txt http://localhost:3001/api/user/preferences
```

### PUT 요청

```bash
curl -X PUT -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"latencyMs": 150, "visualizerMode": "spectrum", "defaultMasterVolume": 0.8}' \
  http://localhost:3001/api/user/preferences
```

### POST 요청

```bash
curl -X POST -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"latencyMs": 120, "visualizerMode": "bars", "defaultMasterVolume": 0.75}' \
  http://localhost:3001/api/user/preferences
```

---

## 체크리스트

- [ ] 서버가 정상적으로 실행됨
- [ ] GET 엔드포인트가 정상 동작 (설정 있음)
- [ ] GET 엔드포인트가 정상 동작 (설정 없음 - 기본값 반환)
- [ ] PUT 엔드포인트가 정상 동작 (업데이트)
- [ ] PUT 엔드포인트가 정상 동작 (생성)
- [ ] POST 엔드포인트가 정상 동작 (생성)
- [ ] POST 엔드포인트 중복 방지 확인 (409)
- [ ] 인증 미들웨어 동작 확인 (401)
- [ ] 입력 유효성 검사 동작 확인 (400)
- [ ] DB에 데이터가 정상적으로 저장됨

---

## 문제 해결

### 401 Unauthorized 오류
- 로그인이 되어 있는지 확인
- 브라우저 개발자 도구에서 쿠키 확인
- Postman/Thunder Client에서 세션 쿠키 포함 여부 확인

### 500 Server Error
- 서버 로그 확인
- 데이터베이스 연결 확인
- UserPreferences 테이블이 생성되었는지 확인

### 테이블이 생성되지 않음
- 서버를 재시작하면 Sequelize가 자동으로 테이블 생성
- 또는 `db.sequelize.sync()` 수동 실행
