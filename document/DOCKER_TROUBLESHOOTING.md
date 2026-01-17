# Docker 트러블슈팅 가이드

## 중요 안내

**이 가이드는 프로젝트의 기본 실행 방법인 Docker Compose 사용 시 문제 해결을 위한 가이드입니다.**

프로젝트의 기본 실행 방법은 Docker Compose입니다:
- Docker Desktop 설치 및 실행
- `docker compose up -d` 명령으로 모든 서비스 실행
- MySQL, 서버, 클라이언트를 Docker 컨테이너로 관리

Docker 실행 시 문제가 발생한 경우 이 가이드를 참고하세요.

---

## 일반적인 오류 해결

### 1. "The system cannot find the file specified" - Docker Desktop 연결 오류

**오류 메시지**:
```
unable to get image 'web-daw-client': error during connect: Get "http://%2F%2F.%2Fpipe%2FdockerDesktopLinuxEngine/v1.51/images/web-daw-client/json": open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
```

**원인**: Docker Desktop이 실행되지 않았거나 완전히 시작되지 않았습니다.

**해결 방법**:

1. **Docker Desktop 실행 확인**
   ```powershell
   # PowerShell에서 Docker Desktop이 실행 중인지 확인
   Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue
   ```

2. **Docker Desktop 수동 실행**
   - Windows 시작 메뉴에서 "Docker Desktop" 검색 후 실행
   - 또는 설치 경로에서 실행: `C:\Program Files\Docker\Docker\Docker Desktop.exe`

3. **Docker Desktop 완전 시작 대기**
   - Docker Desktop 아이콘이 시스템 트레이에 나타날 때까지 대기 (1-2분 소요)
   - 아이콘이 녹색 체크 표시가 나타날 때까지 대기

4. **Docker 서비스 상태 확인**
   ```powershell
   # Docker가 정상 작동하는지 확인
   docker ps
   ```
   - 정상 작동 시: 빈 목록 또는 실행 중인 컨테이너 목록 표시
   - 오류 발생 시: Docker Desktop 재시작 필요

5. **Docker Desktop 재시작**
   - 시스템 트레이에서 Docker Desktop 아이콘 우클릭
   - "Quit Docker Desktop" 선택
   - 몇 초 대기 후 다시 실행

### 2. 환경 변수 경고 (선택사항)

**오류 메시지**:
```
The "GOOGLE_CLIENT_ID" variable is not set. Defaulting to a blank string.
The "GOOGLE_CLIENT_SECRET" variable is not set. Defaulting to a blank string.
```

**원인**: Google OAuth 관련 환경 변수가 설정되지 않았습니다.

**해결 방법**:

**방법 1: 경고 무시 (OAuth 사용 안 함)**
- OAuth 기능을 사용하지 않는 경우 경고를 무시해도 됩니다
- 로그인 기능 없이도 기본 기능 사용 가능

**방법 2: .env 파일 생성**
루트 디렉토리에 `.env` 파일 생성:

```env
# Google OAuth (선택사항)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# 기타 설정
SESSION_SECRET=your-secret-key
DB_ROOT_PASSWORD=rootpassword
```

### 3. "version" 속성 경고

**오류 메시지**:
```
the attribute `version` is obsolete, it will be ignored
```

**해결**: 이미 `docker-compose.yml`에서 제거되었습니다. 더 이상 경고가 나타나지 않습니다.

### 4. 포트가 이미 사용 중

**오류 메시지**:
```
Error: bind: address already in use
```

**해결 방법**:

```powershell
# 포트 사용 중인 프로세스 확인
netstat -ano | findstr :3001
netstat -ano | findstr :5173
netstat -ano | findstr :3306

# 프로세스 종료 (PID 확인 후)
taskkill /PID <프로세스ID> /F
```

또는 `docker-compose.yml`에서 포트 번호 변경:

```yaml
ports:
  - "3002:3001"  # 3001 대신 3002 사용
```

### 5. MySQL 연결 오류

**오류 메시지**:
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**해결 방법**:

1. MySQL 컨테이너가 실행 중인지 확인
   ```powershell
   docker compose ps
   ```

2. MySQL 컨테이너 로그 확인
   ```powershell
   docker compose logs mysql
   ```

3. MySQL 컨테이너 재시작
   ```powershell
   docker compose restart mysql
   ```

### 6. 이미지 빌드 오류

**오류 메시지**:
```
ERROR: failed to solve: process "/bin/sh -c npm ci" did not complete successfully
```

**해결 방법**:

1. Dockerfile 확인
2. 캐시 없이 재빌드
   ```powershell
   docker compose build --no-cache
   ```

3. 개별 서비스 재빌드
   ```powershell
   docker compose build --no-cache server
   docker compose build --no-cache client
   ```

## 빠른 문제 해결 체크리스트

- [ ] Docker Desktop이 실행 중인가?
  - 시스템 트레이에 Docker 아이콘이 있는지 확인
  - `docker ps` 명령이 정상 작동하는지 확인

- [ ] 필요한 포트가 사용 가능한가?
  - 3001 (서버)
  - 5173 (클라이언트)
  - 3306 (MySQL)

- [ ] 환경 변수가 필요한 경우 설정되었는가?
  - `.env` 파일 생성 여부 확인 (선택사항)

- [ ] Docker 이미지가 정상적으로 빌드되었는가?
  ```powershell
  docker images
  ```

- [ ] 컨테이너가 정상 실행 중인가?
  ```powershell
  docker compose ps
  ```

## 추가 도움말

문제가 지속되면 다음 명령으로 전체 로그 확인:

```powershell
# 모든 서비스 로그
docker compose logs

# 특정 서비스 로그
docker compose logs server
docker compose logs client
docker compose logs mysql

# 실시간 로그 확인
docker compose logs -f
```

## 완전한 재설정

모든 것을 처음부터 다시 시작하려면:

```powershell
# 모든 컨테이너 중지 및 제거
docker compose down

# 볼륨까지 삭제 (데이터베이스 데이터도 삭제됨)
docker compose down -v

# 이미지 삭제 (선택사항)
docker rmi web-daw-server web-daw-client

# 재빌드 및 실행
docker compose up -d --build
```
