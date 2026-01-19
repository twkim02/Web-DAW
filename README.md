# Web-DAW (YEEZY LOOP STATION)

웹 기반 디지털 오디오 워크스테이션(Web DAW) 프로젝트입니다. React와 Vite로 구축된 프론트엔드와 Express.js 기반의 백엔드로 구성된 풀스택 애플리케이션으로, 온라인에서 음악 제작과 루핑이 가능한 런치패드 인터페이스를 제공합니다.

## 🚀 빠른 시작

### Docker를 사용한 실행 (권장)

이 프로젝트는 **Docker Compose를 기본 실행 방법**으로 사용합니다.

1. **Docker Desktop 설치 및 실행**
   - [Docker Desktop 다운로드](https://www.docker.com/products/docker-desktop/)
   - Docker Desktop 실행 확인

2. **프로젝트 실행**
   ```bash
   docker compose up -d
   ```

3. **접속**
   - 클라이언트: http://localhost:5173
   - 서버 API: http://localhost:3001

자세한 내용은 [`document/README_DOCKER.md`](document/README_DOCKER.md)를 참조하세요.

### 로컬 실행 (선택사항)

1. **의존성 설치**
   ```bash
   npm run install:all
   ```

2. **MySQL 데이터베이스 설정**
   - MySQL 서버 실행
   - `server/.env` 파일 생성 및 데이터베이스 연결 정보 설정

3. **프로젝트 실행**
   ```bash
   npm start
   ```

자세한 내용은 [`document/PROJECT_SPEC.md`](document/PROJECT_SPEC.md)를 참조하세요.

## 📚 문서

- **[PROJECT_SPEC.md](document/PROJECT_SPEC.md)**: 프로젝트 전체 명세서
- **[API_DOCUMENTATION.md](document/API_DOCUMENTATION.md)**: API 문서 (프론트엔드 팀용)
- **[DB_SCHEMA.md](document/DB_SCHEMA.md)**: 데이터베이스 스키마 (DBML 형식)
- **[HIGH_FI_ROADMAP.md](document/HIGH_FI_ROADMAP.md)**: High-Fi 단계 달성을 위한 로드맵
- **[README_DOCKER.md](document/README_DOCKER.md)**: Docker 실행 가이드
- **[DOCKER_TROUBLESHOOTING.md](document/DOCKER_TROUBLESHOOTING.md)**: Docker 트러블슈팅 가이드

## 🛠 기술 스택

### 프론트엔드
- **React 19** - UI 프레임워크
- **Vite** - 빌드 도구
- **Tone.js** - 웹 오디오 라이브러리
- **Zustand** - 상태 관리
- **Three.js** - 3D 비주얼라이저
- **Axios** - HTTP 클라이언트

### 백엔드
- **Express.js** - 웹 프레임워크
- **Sequelize** - ORM
- **MySQL 8.0** - 데이터베이스
- **Passport.js** - 인증 (Google OAuth)
- **Multer** - 파일 업로드

### 인프라
- **Docker & Docker Compose** - 컨테이너화
- **Node.js 20+** - 런타임

## 📁 프로젝트 구조

```
Web-DAW/
├── client/          # 프론트엔드 (React + Vite)
├── server/          # 백엔드 (Express.js)
├── document/        # 프로젝트 문서
└── docker-compose.yml
```

자세한 구조는 [`document/PROJECT_SPEC.md`](document/PROJECT_SPEC.md)를 참조하세요.

## 🔧 주요 기능

- **런치패드**: 16개 패드 그리드, 샘플/신스 모드 지원
- **시퀀서**: 패턴 녹음 및 재생
- **믹서**: 트랙별 볼륨/패닝 제어
- **신서사이저**: Tone.js 기반 신스 제어
- **파일 관리**: 오디오 파일 업로드 및 관리
- **프리셋 저장/로드**: 사용자별 프리셋 관리
- **프리셋 공유**: 게시판을 통한 프리셋 공유 (Posts API)
- **사용자 설정**: 앱 전체 설정 관리 (UserPreferences API)

## 📝 라이선스

이 프로젝트는 개인 프로젝트입니다.
