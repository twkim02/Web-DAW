# Docker 실행 가이드

## 사전 준비

### Windows에서 Docker Desktop 설치

**중요**: WSL 환경 **안에서** 실행할 필요는 없습니다. Windows PowerShell이나 CMD에서 직접 실행할 수 있습니다.

1. **Docker Desktop 설치**
   - [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/) 다운로드
   - 설치 완료 후 Docker Desktop 실행
   - 설치 시 "Use WSL 2 instead of Hyper-V" 옵션 선택 (권장, 자동으로 설정될 수 있음)

2. **WSL 2 백엔드 (자동 설치 가능)**
   - Docker Desktop이 WSL 2를 자동으로 설치하거나 사용하도록 설정할 수 있습니다
   - WSL 2가 없으면 Docker Desktop 설치 과정에서 자동으로 설치됩니다
   - 또는 수동 설치:
     ```powershell
     # PowerShell 관리자 권한으로 실행 (필요한 경우만)
     wsl --install
     ```

3. **설치 확인 (Windows PowerShell 또는 CMD에서)**
   ```powershell
   # Docker 버전 확인
   docker --version
   # 예상 출력: Docker version 24.x.x

   # Docker Compose 버전 확인
   docker compose version
   # 예상 출력: Docker Compose version v2.x.x

   # Docker Desktop이 실행 중인지 확인
   docker ps
   ```

## Docker Compose로 실행

**실행 위치**: Windows PowerShell 또는 CMD에서 루트 디렉토리로 이동 후 실행합니다.

```powershell
# 프로젝트 루트 디렉토리로 이동
cd C:\Users\TWKIM\Desktop\Web-DAW

# Docker Compose 실행
docker compose up -d
```

### 1. 환경 변수 설정

루트 디렉토리에 `.env` 파일 생성 (선택사항, 기본값 사용 가능):

```env
# .env 파일
PORT=3001
SESSION_SECRET=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
CALLBACK_URL=http://localhost:3001/auth/google/callback

# MySQL 설정
DB_USERNAME=webdaw_user
DB_PASSWORD=webdaw_password
DB_NAME=web_daw
DB_HOST=mysql
DB_PORT=3306
DB_ROOT_PASSWORD=rootpassword
```

### 2. 모든 서비스 실행

```powershell
# 루트 디렉토리에서
docker compose up -d

# 또는 로그와 함께 실행 (포그라운드)
docker compose up
```

### 3. 서비스 확인

```powershell
# 실행 중인 컨테이너 확인
docker compose ps

# 또는
docker ps

# 로그 확인
docker compose logs -f

# 특정 서비스 로그만 확인
docker compose logs -f server
docker compose logs -f client
docker compose logs -f mysql
```

### 4. 서비스 접속

- **클라이언트**: http://localhost:5173
- **서버 API**: http://localhost:3001
- **MySQL**: localhost:3306

### 5. 서비스 중지

```powershell
# 서비스 중지 (컨테이너 유지)
docker compose stop

# 서비스 중지 및 컨테이너 제거
docker compose down

# 볼륨까지 삭제 (데이터베이스 데이터도 삭제됨)
docker compose down -v
```

## 개별 서비스 실행

### MySQL만 실행

```powershell
docker compose up -d mysql
```

로컬에서 서버와 클라이언트는 `npm start`로 실행:

```powershell
npm start
```

## 트러블슈팅

### 1. `docker compose` 명령어를 찾을 수 없음

**문제**: `docker compose` 명령어가 인식되지 않음

**해결 방법**:
- Docker Desktop이 최신 버전인지 확인
- Docker Desktop 재시작
- 구버전 Docker Compose를 사용하는 경우 `docker-compose` (하이픈 포함) 사용

### 2. WSL 2 관련 오류

**문제**: "WSL 2 installation is incomplete" 오류

**해결 방법**:
```powershell
# PowerShell 관리자 권한으로 실행
wsl --update
wsl --set-default-version 2
```

### 3. 포트 충돌

**문제**: 포트가 이미 사용 중임 (3001, 5173, 3306)

**해결 방법**:
- 다른 애플리케이션에서 사용 중인 포트 확인
- `docker-compose.yml`에서 포트 번호 변경
- 또는 사용 중인 서비스 중지

### 4. MySQL 연결 오류

**문제**: 서버가 MySQL에 연결할 수 없음

**해결 방법**:
- MySQL 컨테이너가 실행 중인지 확인: `docker compose ps`
- MySQL 컨테이너 로그 확인: `docker compose logs mysql`
- 환경 변수 `DB_HOST=mysql` 확인 (Docker 환경에서는 서비스 이름 사용)

### 5. 컨테이너 재빌드

코드 변경 후 컨테이너를 재빌드하려면:

```powershell
# 이미지 재빌드 및 컨테이너 재시작
docker compose up -d --build

# 특정 서비스만 재빌드
docker compose up -d --build server
```

## 데이터베이스 백업 및 복원

### 백업

```powershell
# MySQL 데이터베이스 덤프
docker compose exec mysql mysqldump -u root -p${DB_ROOT_PASSWORD:-rootpassword} web_daw > backup.sql
```

### 복원

```powershell
# MySQL 데이터베이스 복원
docker compose exec -T mysql mysql -u root -p${DB_ROOT_PASSWORD:-rootpassword} web_daw < backup.sql
```

## 추가 정보

- Docker Desktop 설정에서 리소스 할당량 조정 가능 (메모리, CPU 등)
- `docker-compose.yml` 파일에서 서비스 설정 수정 가능
- 볼륨 데이터는 `docker volume ls`로 확인 가능
