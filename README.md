# Web-DAW (YEEZY LOOP STATION)

웹 기반 디지털 오디오 워크스테이션(Web DAW) 프로젝트입니다. React와 Vite로 구축된 프론트엔드와 Express.js 기반의 백엔드로 구성된 풀스택 애플리케이션으로, 온라인에서 음악 제작과 루핑이 가능한 런치패드 인터페이스를 제공합니다.

## 🚀 빠른 시작

### ⚡ 원클릭 실행 (팀원용 추천)

간편하게 개발 환경을 실행하려면 프로젝트 루트에서 다음 파일을 실행하세요:
**`start_dev.bat`**

이 스크립트는 다음 작업을 자동으로 수행합니다:
1. MySQL 데이터베이스 실행 (Docker)
2. 서버/클라이언트 실행 (npm start)

---

### Docker를 사용한 실행 (전체 컨테이너)

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

Docker Compose를 사용하면 MySQL, 서버, 클라이언트가 모두 컨테이너로 실행됩니다.

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

로컬 실행 시 MySQL 서버가 별도로 실행되어 있어야 합니다.

## 📚 문서

- **[FUNCTIONAL_SPEC.md](FUNCTIONAL_SPEC.md)**: 프로젝트 기능 명세서 (상세 기능, API, 데이터베이스 스키마 포함)
- **[database_schema.dbml](database_schema.dbml)**: 데이터베이스 스키마 (DBML 형식, dbdiagram.io에서 시각화 가능)

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
│   ├── src/
│   │   ├── api/     # API 클라이언트
│   │   ├── audio/   # 오디오 엔진 (Tone.js)
│   │   ├── components/  # UI 컴포넌트
│   │   ├── pages/   # 페이지 컴포넌트
│   │   ├── store/   # Zustand 상태 관리
│   │   └── hooks/   # 커스텀 훅
├── server/          # 백엔드 (Express.js)
│   ├── routes/      # API 라우트
│   ├── models/      # Sequelize 모델
│   ├── middleware/  # 미들웨어
│   ├── config/      # 설정 파일
│   └── scripts/     # 유틸리티 스크립트
├── database_schema.dbml  # 데이터베이스 스키마
├── FUNCTIONAL_SPEC.md    # 기능 명세서
├── docker-compose.yml    # Docker Compose 설정
└── start_dev.bat        # 개발 환경 실행 스크립트
```

자세한 구조는 [FUNCTIONAL_SPEC.md](FUNCTIONAL_SPEC.md)를 참조하세요.

## 🔧 주요 기능

- **런치패드**: 64개 패드 그리드 (8x8), 샘플/신스 모드 지원
- **시퀀서**: 루프 녹음 및 재생 (6개 슬롯)
- **믹서**: 8개 트랙의 볼륨/패닝/이펙트 제어
- **신서사이저**: Tone.js 기반 신스 제어
- **이펙트**: 글로벌 이펙트 체인 (Send A/B)
- **파일 관리**: 오디오 파일 및 이미지 파일 업로드 및 관리
- **프리셋 저장/로드**: 사용자별 프리셋 관리 (패드 이미지, 색상 포함)
- **커뮤니티**: 게시판을 통한 프리셋 공유 및 포크
- **비주얼라이저**: Three.js 기반 3D 오디오 비주얼라이제이션
- **라이브 모드**: 스크린 녹화 기능
- **사용자 설정**: 앱 전체 설정 관리 (UserPreferences API)

## 📝 라이선스

이 프로젝트는 개인 프로젝트입니다.
