# 프로젝트 명세서 (PROJECT_SPEC.md)

## 프로젝트 개요

**YEEZY LOOP STATION**은 웹 기반의 디지털 오디오 워크스테이션(Web DAW) 프로젝트입니다. React와 Vite로 구축된 프론트엔드와 Express.js 기반의 백엔드로 구성된 풀스택 애플리케이션으로, 온라인에서 음악 제작과 루핑이 가능한 런치패드 인터페이스를 제공합니다.

---

## 1. 디렉토리 구조 (Tree Structure)

```
Web-DAW/
├── client/                          # 프론트엔드 애플리케이션 (React + Vite)
│   ├── public/                      # 정적 파일
│   │   └── vite.svg
│   ├── src/                         # 소스 코드
│   │   ├── api/                     # API 클라이언트 모듈
│   │   │   ├── auth.js             # 인증 관련 API
│   │   │   ├── client.js           # Axios 인스턴스 설정
│   │   │   ├── presets.js          # 프리셋 관리 API
│   │   │   └── upload.js           # 파일 업로드 API
│   │   ├── audio/                   # 오디오 엔진 및 처리 모듈
│   │   │   ├── AudioEngine.js      # Tone.js 기반 오디오 엔진
│   │   │   ├── InstrumentManager.js # 악기 관리 및 생성
│   │   │   ├── Sampler.js          # 샘플러 관리
│   │   │   ├── Sequencer.js        # 시퀀서 로직
│   │   │   └── instruments/        # 악기 프리셋 및 정의
│   │   │       ├── Drums.js        # 드럼 킷 정의
│   │   │       ├── Piano.js        # 피아노 악기 정의
│   │   │       ├── Samplers.js     # 샘플러 프리셋
│   │   │       └── Synths.js       # 신서사이저 프리셋
│   │   ├── components/              # React 컴포넌트
│   │   │   ├── Audio/              # 오디오 효과 및 라이브러리 컴포넌트
│   │   │   │   ├── FXControls.jsx  # 오디오 효과 컨트롤
│   │   │   │   ├── FileLibrary.jsx # 파일 업로드 및 관리 라이브러리
│   │   │   │   ├── InstrumentLibrary.jsx # 악기 선택 라이브러리
│   │   │   │   ├── RecordingLibrary.jsx # 녹음 파일 관리 라이브러리
│   │   │   │   └── SynthLibrary.jsx # 신서사이저 라이브러리
│   │   │   ├── Instruments/        # 가상 악기 인터페이스
│   │   │   │   ├── VirtualDrums.jsx # 가상 드럼 패드
│   │   │   │   └── VirtualPiano.jsx # 가상 피아노 키보드
│   │   │   ├── Launchpad/          # 런치패드 관련 컴포넌트
│   │   │   │   ├── Grid.jsx        # 패드 그리드 레이아웃
│   │   │   │   ├── Grid.module.css
│   │   │   │   ├── Pad.jsx         # 개별 패드 컴포넌트
│   │   │   │   ├── Pad.module.css
│   │   │   │   ├── SubButton.jsx   # 서브 버튼 컴포넌트
│   │   │   │   └── SubButton.module.css
│   │   │   ├── Mixer/              # 믹서 관련 컴포넌트
│   │   │   │   ├── TrackList.jsx   # 트랙 리스트 컴포넌트
│   │   │   │   └── TrackList.module.css
│   │   │   ├── Sequencer/          # 시퀀서 컨트롤 컴포넌트
│   │   │   │   ├── SequencerControls.jsx
│   │   │   │   └── SequencerControls.module.css
│   │   │   ├── Layout/             # 레이아웃 컴포넌트
│   │   │   │   ├── LeftSidebar.jsx # 왼쪽 사이드바 (믹서 등)
│   │   │   │   ├── LeftSidebar.module.css
│   │   │   │   ├── RightSidebar.jsx # 오른쪽 사이드바 (컨트롤 등)
│   │   │   │   └── RightSidebar.module.css
│   │   │   ├── Settings/           # 설정 관련 컴포넌트
│   │   │   │   ├── PadSettingsModal.jsx  # 패드 설정 모달
│   │   │   │   └── PadSettingsModal.module.css
│   │   │   ├── Synth/              # 신서사이저 컨트롤
│   │   │   │   ├── SynthControls.jsx
│   │   │   │   └── SynthControls.module.css
│   │   │   ├── Transport/          # 트랜스포트 컨트롤
│   │   │   │   ├── TransportControls.jsx
│   │   │   │   └── TransportControls.module.css
│   │   │   └── Visualizer/         # 비주얼라이저 컴포넌트
│   │   │       ├── BackgroundVisualizer.jsx  # 배경 비주얼라이저 래퍼
│   │   │       └── ThreeVisualizer.jsx       # Three.js 기반 3D 비주얼라이저
│   │   ├── hooks/                   # 커스텀 React Hooks
│   │   │   ├── useKeyboardMap.js   # 키보드 매핑 훅
│   │   │   └── usePadTrigger.js    # 패드 트리거 훅
│   │   ├── store/                   # 상태 관리 (Zustand)
│   │   │   └── useStore.js         # 전역 상태 스토어
│   │   ├── App.jsx                  # 메인 앱 컴포넌트
│   │   ├── App.css                  # 앱 스타일
│   │   ├── main.jsx                 # 진입점 (Entry Point)
│   │   └── index.css                # 전역 스타일
│   ├── index.html                   # HTML 템플릿
│   ├── vite.config.js               # Vite 설정 파일
│   ├── eslint.config.js             # ESLint 설정
│   └── package.json                 # 클라이언트 의존성
│
├── server/                           # 백엔드 서버 (Express.js)
│   ├── config/                       # 설정 파일
│   │   └── config.js                # Sequelize 데이터베이스 설정 (MySQL)
│   ├── middleware/                   # Express 미들웨어
│   │   └── upload.js                # Multer 파일 업로드 미들웨어
│   ├── models/                       # Sequelize ORM 모델
│   │   ├── index.js                 # 모델 초기화 및 연관관계 설정
│   │   ├── user.js                  # 사용자 모델
│   │   ├── preset.js                # 프리셋 모델
│   │   ├── keyMapping.js            # 키 매핑 모델
│   │   ├── asset.js                 # 업로드된 파일(에셋) 모델
│   │   ├── userPreference.js        # 사용자 설정 모델
│   │   └── post.js                  # 게시글 모델
│   ├── routes/                       # API 라우트 핸들러
│   │   ├── auth.js                  # 인증 라우트 (Google OAuth)
│   │   ├── upload.js                # 파일 업로드 라우트
│   │   ├── presets.js               # 프리셋 CRUD 라우트
│   │   ├── userPreferences.js      # 사용자 설정 API 라우트
│   │   └── posts.js                 # 게시글 API 라우트
│   ├── test/                         # 테스트 파일
│   │   ├── userPreference.test.js   # UserPreference 모델 테스트
│   │   ├── post.test.js              # Post 모델 테스트
│   │   ├── api-test-guide.md        # UserPreferences API 테스트 가이드
│   │   ├── posts-api-test-guide.md  # Posts API 테스트 가이드
│   │   ├── dummy_data.sql           # 테스트용 더미 데이터 SQL
│   │   └── README.md                # 테스트 디렉토리 설명
│   ├── uploads/                      # 업로드된 파일 저장소
│   ├── database.sqlite               # SQLite 데이터베이스 파일 (로컬 개발용, 선택사항)
│   ├── init.sql                      # MySQL 초기화 SQL (Docker 사용 시)
│   ├── Dockerfile                    # 서버 Docker 이미지 빌드 파일
│   ├── server.js                     # 서버 진입점 (Entry Point)
│   └── package.json                  # 서버 의존성
│
├── client/                           # 프론트엔드 (위에 상세 구조 참조)
│   └── Dockerfile                    # 클라이언트 Docker 이미지 빌드 파일
│
├── docker-compose.yml                # Docker Compose 설정 (MySQL, 서버, 클라이언트) [기본 실행 방법]
├── .dockerignore                     # Docker 빌드 시 무시할 파일 목록
├── document/                         # 프로젝트 문서 디렉토리
│   ├── PROJECT_SPEC.md              # 프로젝트 명세서 (이 문서)
│   ├── DB_SCHEMA.md                 # 데이터베이스 스키마 (DBML 형식)
│   ├── API_DOCUMENTATION.md         # API 문서 (프론트엔드 팀용)
│   ├── CURRENT_CODE_STRUCTURE.md    # 현재 코드베이스 구조 분석
│   ├── HIGH_FI_ROADMAP.md           # High-Fi 로드맵
│   ├── README_DOCKER.md             # Docker 실행 가이드
│   ├── DOCKER_TROUBLESHOOTING.md    # Docker 트러블슈팅 가이드
│   └── legacy/                      # 완료된 작업 문서 (참고용)
│       ├── SCHEMA_REFACTORING_PLAN.md
│       ├── PHASE3_FIELD_ADDITION_DECISION.md
│       ├── PHASE4_EXECUTION_PLAN.md
│       ├── PHASE4_COMPLETION_SUMMARY.md
│       ├── NEW_TABLES_IMPLEMENTATION_PLAN.md
│       └── DOCUMENT_UPDATE_SUMMARY.md
├── package.json                      # 루트 package.json (Monorepo 설정)
├── start_app.bat                     # Windows 실행 스크립트 (로컬 실행용)
└── .gitignore                        # Git 무시 파일 목록
```

---

## 2. 디렉토리별 설명

### 2.1 루트 디렉토리 (`/`)

프로젝트의 최상위 디렉토리로, **Monorepo 구조**를 사용합니다. `workspaces`를 통해 `client`와 `server`를 하나의 저장소에서 관리하며, 루트의 `package.json`에서 두 프로젝트를 동시에 실행할 수 있는 스크립트를 제공합니다.

- **`start_app.bat`**: Windows 환경에서 애플리케이션을 쉽게 실행하기 위한 배치 스크립트. 의존성 설치 후 클라이언트와 서버를 동시에 실행합니다.

### 2.2 클라이언트 (`client/`)

**역할**: 사용자 인터페이스와 오디오 처리 로직을 담당하는 프론트엔드 애플리케이션

- **`src/api/`**: 백엔드 API와 통신하는 클라이언트 모듈 모음
  - `client.js`: Axios 인스턴스 설정 및 기본 요청 인터셉터
  - `auth.js`: Google OAuth 인증 API 호출
  - `presets.js`: 프리셋 저장/로드 API 호출
  - `upload.js`: 파일 업로드 API 호출

- **`src/audio/`**: 웹 오디오 API 및 Tone.js 기반 오디오 엔진
  - `AudioEngine.js`: Tone.js 컨텍스트 초기화 및 오디오 엔진 관리
  - `InstrumentManager.js`: 악기 인스턴스 생성 및 관리 (샘플러, 신스, 드럼 등)
  - `Sampler.js`: 샘플 파일 로딩 및 재생 관리
  - `Sequencer.js`: 시퀀서 로직 및 BPM 관리
  - `instruments/`: 악기 프리셋 및 정의
    - `Drums.js`: 드럼 킷 정의 및 노트 매핑
    - `Piano.js`: 피아노 악기 정의
    - `Samplers.js`: 샘플러 프리셋 설정
    - `Synths.js`: 신서사이저 프리셋 설정

- **`src/components/`**: React UI 컴포넌트
  - `Audio/`: 오디오 효과 및 라이브러리 관리 컴포넌트
    - `FXControls.jsx`: 오디오 효과(리버브, 딜레이 등) 컨트롤
    - `FileLibrary.jsx`: 업로드된 파일 관리 및 브라우징 (이름 변경, 삭제, 선택)
    - `InstrumentLibrary.jsx`: 악기 선택 및 라이브러리 관리
    - `RecordingLibrary.jsx`: 녹음된 파일 관리 및 재생
    - `SynthLibrary.jsx`: 신서사이저 프리셋 관리 및 선택
  - `Instruments/`: 가상 악기 인터페이스
    - `VirtualDrums.jsx`: 가상 드럼 패드 (드럼 킷 선택 및 연주)
    - `VirtualPiano.jsx`: 가상 피아노 키보드 (연주, 녹음, 업로드)
  - `Launchpad/`: 16개 패드 그리드와 개별 패드 컴포넌트
  - `Layout/`: 레이아웃 구조 컴포넌트
    - `LeftSidebar.jsx`: 왼쪽 사이드바 (믹서 트랙 리스트)
    - `RightSidebar.jsx`: 오른쪽 사이드바 (Transport, Sequencer, Synth 컨트롤)
  - `Mixer/`: 트랙 리스트 및 볼륨/패닝 컨트롤
  - `Sequencer/`: 시퀀서 재생/정지/녹음 컨트롤
  - `Transport/`: BPM, 재생/정지 등 트랜스포트 컨트롤
  - `Synth/`: 신서사이저 파라미터 조절 컨트롤
  - `Settings/`: 패드별 샘플 설정 모달
  - `Visualizer/`: 오디오 비주얼라이저 컴포넌트
    - `BackgroundVisualizer.jsx`: 배경 비주얼라이저 래퍼 컴포넌트
    - `ThreeVisualizer.jsx`: Three.js 및 React Three Fiber 기반 3D 비주얼라이저

- **`src/hooks/`**: 재사용 가능한 React 커스텀 훅
  - `useKeyboardMap.js`: 키보드 입력을 패드 트리거로 매핑
  - `usePadTrigger.js`: 패드 클릭/트리거 이벤트 처리

- **`src/store/`**: Zustand 기반 전역 상태 관리
  - `useStore.js`: 앱 전역 상태 (패드 매핑, BPM, 사용자 정보, 오디오 컨텍스트 상태 등)

- **`vite.config.js`**: Vite 빌드 도구 설정 (포트 5173, React 플러그인)

### 2.3 서버 (`server/`)

**역할**: RESTful API 서버 및 데이터베이스 관리

- **`config/`**: 애플리케이션 설정
  - `config.js`: Sequelize ORM 데이터베이스 연결 설정 (MySQL)

- **`middleware/`**: Express 미들웨어 모음
  - `upload.js`: Multer를 사용한 파일 업로드 처리 (MP3 등 오디오 파일)

- **`models/`**: Sequelize ORM 데이터베이스 모델
  - `index.js`: 모델 초기화 및 모델 간 연관관계(Associations) 정의
  - `user.js`: 사용자 모델 (Google OAuth 연동)
  - `preset.js`: 프리셋 모델 (사용자가 저장한 패드 구성, `masterVolume`, `isQuantized` 필드 포함)
  - `keyMapping.js`: 키 매핑 모델 (각 패드에 할당된 샘플/모드/볼륨, `synthSettings` JSON 필드 포함)
  - `asset.js`: 업로드된 파일(에셋) 메타데이터 모델 (`isRecorded` 필드 포함)
  - `userPreference.js`: 사용자 설정 모델 (latencyMs, visualizerMode, defaultMasterVolume)
  - `post.js`: 게시글 모델 (프리셋 공유 기능, likeCount, downloadCount 포함)

- **`routes/`**: Express 라우터 모듈
  - `auth.js`: Google OAuth 인증 엔드포인트 (`/auth/google`, `/auth/google/callback`, `/auth/logout`, `/auth/user`, `/auth/dev_login`)
  - `upload.js`: 파일 업로드 엔드포인트 (`/upload`)
  - `presets.js`: 프리셋 CRUD 엔드포인트 (`/presets`)
    - GET `/presets`: 사용자의 모든 프리셋 목록 조회
    - GET `/presets/:id`: 특정 프리셋 상세 정보 및 키 매핑 조회
    - POST `/presets`: 새 프리셋 생성 (title, bpm, masterVolume, isQuantized, mappings 포함)
  - `userPreferences.js`: 사용자 설정 API 엔드포인트 (`/api/user/preferences`)
    - GET `/api/user/preferences`: 현재 사용자 설정 조회
    - PUT `/api/user/preferences`: 사용자 설정 업데이트/생성
    - POST `/api/user/preferences`: 사용자 설정 생성 (신규만)
  - `posts.js`: 게시글 API 엔드포인트 (`/api/posts`)
    - GET `/api/posts`: 공개 게시글 목록 조회 (페이지네이션, 정렬)
    - GET `/api/posts/:id`: 게시글 상세 조회
    - GET `/api/posts/user/my-posts`: 내 게시글 목록
    - POST `/api/posts`: 게시글 생성
    - PUT `/api/posts/:id`: 게시글 수정
    - DELETE `/api/posts/:id`: 게시글 삭제
    - POST `/api/posts/:id/like`: 좋아요
    - POST `/api/posts/:id/download`: 다운로드
    - POST `/api/posts/:id/publish`: 공개/비공개 전환

- **`test/`**: 테스트 파일 및 가이드
  - `userPreference.test.js`: UserPreference 모델 자동화 테스트
  - `post.test.js`: Post 모델 자동화 테스트
  - `api-test-guide.md`: UserPreferences API 수동 테스트 가이드
  - `posts-api-test-guide.md`: Posts API 수동 테스트 가이드
  - `dummy_data.sql`: 테스트용 더미 데이터 SQL 스크립트
  - `README.md`: 테스트 디렉토리 개요 및 사용법

- **`uploads/`**: 업로드된 오디오 파일 저장 디렉토리 (정적 파일 서빙)

- **`init.sql`**: MySQL 컨테이너 초기화 시 실행되는 SQL 스크립트 (선택사항)

- **`Dockerfile`**: 서버 애플리케이션의 Docker 이미지 빌드 설정

- **`server.js`**: Express 서버 진입점
  - CORS 설정 (포트 5173 허용)
  - Passport.js를 통한 Google OAuth 전략 설정
  - 세션 관리 (express-session)
  - 라우트 등록 및 데이터베이스 동기화

---

## 3. 핵심 파일 (Key Files)

### 3.1 진입점 (Entry Points)

#### `client/src/main.jsx`
- **역할**: 클라이언트 애플리케이션의 진입점
- **기능**: React 애플리케이션을 DOM에 마운트하고 `App` 컴포넌트를 렌더링

#### `server/server.js`
- **역할**: 백엔드 서버의 진입점
- **주요 기능**:
  - Express 애플리케이션 초기화
  - 미들웨어 설정 (CORS, JSON 파싱, 세션, Passport)
  - Google OAuth 2.0 전략 구성 (환경 변수 설정 시에만 활성화)
  - API 라우트 등록 (`/auth`, `/upload`, `/presets`, `/api/user/preferences`, `/api/posts`)
  - Sequelize 데이터베이스 동기화 및 서버 시작 (기본 포트: 3001)

#### `client/src/App.jsx`
- **역할**: 메인 애플리케이션 컴포넌트
- **주요 기능**:
  - 오디오 컨텍스트 초기화 및 Tone.js 시작
  - 사용자 인증 상태 관리
  - 프리셋 저장/로드 기능
  - 전역 UI 레이아웃 (런치패드, 믹서, 컨트롤)

### 3.2 설정 파일 (Configuration Files)

#### `client/vite.config.js`
- **역할**: Vite 빌드 도구 설정
- **설정 내용**:
  - React 플러그인 사용
  - 개발 서버 포트: 5173
  - 호스트: `0.0.0.0` (모든 네트워크 인터페이스에서 접근 가능)

#### `server/config/config.js`
- **역할**: Sequelize 데이터베이스 연결 설정
- **데이터베이스**: MySQL 사용
  - 개발 및 프로덕션 환경 모두 MySQL 사용
  - 환경 변수:
    - `DB_USERNAME`: MySQL 사용자명 (기본값: 'root')
    - `DB_PASSWORD`: MySQL 비밀번호
    - `DB_NAME`: 데이터베이스 이름 (기본값: 'web_daw')
    - `DB_HOST`: 데이터베이스 호스트 (기본값: '127.0.0.1', Docker 환경: 'mysql')
    - `DB_PORT`: 데이터베이스 포트 (기본값: 3306)
    - `DB_LOGGING`: SQL 로깅 활성화 여부 (개발 환경에서 디버깅용)

#### `server/.env` (로컬 실행 시 필요)

- **역할**: 서버 환경 변수 관리
- **위치**: `server/` 디렉토리에 생성
- **로컬 MySQL 사용 시**:
  ```
  PORT=3001
  SESSION_SECRET=your-secret-key-here
  GOOGLE_CLIENT_ID=your-google-client-id  # 선택사항
  GOOGLE_CLIENT_SECRET=your-google-client-secret  # 선택사항
  CALLBACK_URL=http://localhost:3001/auth/google/callback
  DB_USERNAME=root
  DB_PASSWORD=your-mysql-password
  DB_NAME=web_daw
  DB_HOST=127.0.0.1
  DB_PORT=3306
  ```

**참고**: 
- Google OAuth 관련 변수는 선택사항입니다. 설정하지 않아도 기본 기능은 사용할 수 있습니다.
- 로컬 개발 환경에서는 `.env` 파일이 필수입니다.

#### `package.json` (루트)
- **역할**: Monorepo 워크스페이스 설정 및 통합 스크립트
- **주요 스크립트**:
  - `npm start`: 클라이언트와 서버를 동시에 실행
  - `npm run install:all`: 모든 디렉토리의 의존성 설치
  - `npm run dev:client`: 클라이언트만 개발 모드로 실행
  - `npm run dev:server`: 서버만 개발 모드로 실행

---

## 4. 실행 방법

### 4.1 사전 요구사항

**기본 요구사항** (Docker 실행 - 기본 방법):
- **Docker Desktop** (Windows에서 사용 가능, 필수)
  - [Docker Desktop 다운로드](https://www.docker.com/products/docker-desktop/)
  - 설치 후 Docker Desktop 실행
  - **참고**: WSL 환경 안에서 실행할 필요 없음. Windows PowerShell/CMD에서 직접 실행 가능
  - Docker Desktop이 내부적으로 WSL 2 백엔드를 사용할 수 있음 (자동 설정)
  - Docker Compose V2가 기본적으로 포함됨 (명령어: `docker compose`)
- **Node.js** (v20 이상 권장 - Vite 요구사항, 로컬 개발 시 필요)
- **npm** 또는 **yarn** (로컬 개발 시 필요)
- **Google OAuth 2.0** 클라이언트 ID 및 Secret (Google Cloud Console에서 발급, 선택사항)

**참고**: 이 프로젝트는 **Docker Compose를 기본 실행 방법**으로 사용합니다. Docker를 통해 MySQL, 서버, 클라이언트를 모두 관리하여 개발 환경을 통일합니다.

**로컬 실행** (선택사항):
- **MySQL** 데이터베이스 서버 (v8.0 이상 권장)
  - [MySQL 다운로드](https://dev.mysql.com/downloads/mysql/)
  - 로컬에서 MySQL을 직접 관리하고 싶은 경우 사용

### 4.2 초기 설정

#### 1. Docker Desktop 설치 및 확인 (기본 방법)

**Docker Desktop 설치**:
1. [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/) 다운로드 및 설치
2. 설치 시 WSL 2 백엔드 선택 (권장, 자동으로 설정될 수 있음)
3. Docker Desktop 실행 후 정상 동작 확인

**중요**: WSL 환경 **안에서** 실행할 필요는 없습니다. Windows PowerShell이나 CMD에서 직접 실행할 수 있습니다.

**Docker 설치 확인** (Windows PowerShell 또는 CMD에서):
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

#### 2. 환경 변수 설정 (Docker 환경 - 기본 방법)

**루트 디렉토리에 `.env` 파일 생성** (선택사항, 기본값 사용 가능):

```env
# .env 파일 (루트 디렉토리)
PORT=3001
SESSION_SECRET=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
CALLBACK_URL=http://localhost:3001/auth/google/callback

# MySQL 설정 (Docker 환경)
DB_USERNAME=webdaw_user
DB_PASSWORD=webdaw_password
DB_NAME=web_daw
DB_HOST=mysql
DB_PORT=3306
DB_ROOT_PASSWORD=rootpassword
```

**참고**: 
- `.env` 파일이 없어도 `docker-compose.yml`의 기본값을 사용할 수 있습니다.
- Google OAuth는 선택사항입니다. 설정하지 않아도 기본 기능은 사용할 수 있습니다.

**Google OAuth 설정** (선택사항):
1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. OAuth 2.0 클라이언트 ID 생성
3. 승인된 리디렉션 URI에 `http://localhost:3001/auth/google/callback` 추가
4. Client ID와 Client Secret을 `.env`에 입력

#### 3. 로컬 실행 환경 설정 (선택사항)

로컬에서 실행하려는 경우에만 다음 설정이 필요합니다:

**의존성 설치**:
```bash
# 프로젝트 루트 디렉토리에서
npm run install:all

# 또는 개별 설치
npm install
npm install --prefix client
npm install --prefix server
```

**MySQL 데이터베이스 설정**:
```sql
CREATE DATABASE web_daw CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**서버 환경 변수 설정** (`server/.env` 파일):
```env
PORT=3001
SESSION_SECRET=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
CALLBACK_URL=http://localhost:3001/auth/google/callback
DB_USERNAME=root
DB_PASSWORD=your-mysql-password
DB_NAME=web_daw
DB_HOST=127.0.0.1
DB_PORT=3306
```

`server/` 디렉토리에 `.env` 파일 생성:

**Docker Compose 사용 시** (`docker-compose.yml` 파일에서 환경 변수 설정):
```env
# .env 파일 생성 (루트 디렉토리 또는 docker-compose.yml과 같은 위치)
PORT=3001
SESSION_SECRET=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
CALLBACK_URL=http://localhost:3001/auth/google/callback

# MySQL 설정 (Docker 환경)
DB_USERNAME=webdaw_user
DB_PASSWORD=webdaw_password
DB_NAME=web_daw
DB_HOST=mysql
DB_PORT=3306
DB_ROOT_PASSWORD=rootpassword
```

**로컬 MySQL 사용 시** (`server/.env` 파일):
```env
PORT=3001
SESSION_SECRET=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
CALLBACK_URL=http://localhost:3001/auth/google/callback
DB_USERNAME=root
DB_PASSWORD=your-mysql-password
DB_NAME=web_daw
DB_HOST=127.0.0.1
DB_PORT=3306
```

**Google OAuth 설정**:
1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. OAuth 2.0 클라이언트 ID 생성
3. 승인된 리디렉션 URI에 `http://localhost:3001/auth/google/callback` 추가
4. Client ID와 Client Secret을 `.env`에 입력

### 4.3 실행

#### 방법 1: Docker Compose 실행 (기본 방법 - 권장)

**전제 조건**: Docker Desktop이 설치되어 있고 실행 중이어야 합니다.

**모든 서비스를 Docker로 실행**:
```bash
# 루트 디렉토리에서
# 최신 Docker Desktop (Compose V2): docker compose 사용 (하이픈 없음)
docker compose up -d

# 로그 확인
docker compose logs -f

# 서비스 중지
docker compose down

# 볼륨까지 삭제하고 완전히 정리 (데이터도 삭제됨)
docker compose down -v

# 구버전 Docker Compose (V1)를 사용하는 경우:
# docker-compose up -d
# docker-compose logs -f
# docker-compose down
# docker-compose down -v
```

이 방법은 MySQL, 서버, 클라이언트를 모두 Docker 컨테이너로 실행합니다. **개발 환경의 표준 실행 방법**입니다.

**개별 서비스 로그 확인**:
```bash
# 특정 서비스 로그만 확인
docker compose logs -f server
docker compose logs -f client
docker compose logs -f mysql
```

**컨테이너 재빌드** (코드 변경 후):
```bash
# 이미지 재빌드 및 컨테이너 재시작
docker compose up -d --build

# 특정 서비스만 재빌드
docker compose up -d --build server
```

**하이브리드 실행** (개발 중 Hot Reload를 원하는 경우):
```bash
# MySQL만 Docker로 실행
docker compose up -d mysql

# 서버와 클라이언트는 로컬에서 실행 (Hot Reload 지원)
npm start
```

이 방법은 MySQL만 Docker로 관리하고, 개발은 로컬에서 진행할 수 있어 Hot Reload의 이점을 유지할 수 있습니다.

#### 방법 2: 로컬 실행 (선택사항)

로컬 환경에서 직접 실행하려는 경우:

**npm 스크립트 사용**:
```bash
# 루트 디렉토리에서
npm start
```

이 명령은 `concurrently`를 사용하여 클라이언트(포트 5173)와 서버(포트 3001)를 동시에 실행합니다.
**MySQL은 별도로 실행 중이어야 합니다** (로컬 MySQL 서버 또는 Docker로 MySQL만 실행).

**Windows 배치 파일 사용** (Windows 환경):
```batch
# 루트 디렉토리에서
start_app.bat
```

`start_app.bat` 파일을 더블클릭하거나 명령 프롬프트에서 실행하면 자동으로 의존성을 설치하고 애플리케이션을 시작합니다.

**개별 실행** (디버깅 시 유용):
**터미널 1 - 서버 실행**:
```bash
cd server
npm run dev  # 또는 npm start
```

**터미널 2 - 클라이언트 실행**:
```bash
cd client
npm run dev
```

이 방법은 각 서비스를 별도 터미널에서 실행하므로 로그를 분리하여 확인할 수 있어 디버깅에 유용합니다.

#### 실행 방법 선택 가이드

| 실행 방법 | 사용 시기 | 장점 | 단점 |
|---------|---------|------|------|
| **Docker Compose** (방법 1) | 기본 개발 환경 | - 환경 일관성<br>- 의존성 관리 용이<br>- MySQL 자동 설정<br>- 팀 전체 환경 통일 | - Docker 설치 필요<br>- 초기 설정 시간 |
| **로컬 실행** (방법 2) | 빠른 개발/디버깅 | - Hot Reload 지원<br>- 디버깅 용이<br>- 빠른 개발 속도 | - MySQL 설치 필요<br>- 환경 차이 발생 가능 |
| **하이브리드** | 로컬 개발 + Docker MySQL | - Hot Reload 유지<br>- MySQL 관리 간편<br>- 환경 일부 통일 | - Docker 설치 필요 |

### 4.4 접속

- **클라이언트**: http://localhost:5173
- **서버 API**: http://localhost:3001
- **MySQL**: localhost:3306 (로컬 실행 시) 또는 `mysql` (Docker 환경)

### 4.5 개발 모드 vs 프로덕션 모드

**개발 모드** (일반적인 개발 환경):
- 클라이언트: `npm run dev` (Vite HMR 활성화, 코드 변경 시 자동 리로드)
- 서버: `npm run dev` (nodemon으로 자동 재시작)

**로컬 개발 환경 체크리스트**:
- [ ] MySQL 서버가 실행 중인가?
- [ ] `server/.env` 파일이 올바르게 설정되어 있는가?
- [ ] 포트 3001, 5173이 사용 가능한가?

**프로덕션 빌드**:
```bash
# 클라이언트 빌드
cd client
npm run build

# 서버 실행
cd server
npm start
```

빌드된 클라이언트는 `client/dist/` 디렉토리에 생성됩니다.

---

## 5. 데이터베이스 스키마 (Database Schema)

### 5.1 ERD 관계도

```
┌─────────────┐         ┌──────────────────┐
│    User     │────────<│ UserPreferences  │ (1:1, 향후 구현)
└─────────────┘         └──────────────────┘
      │
      │ 1
      │
      │ N
      │
      ├──────────────────┐
      │                  │
      │ N                │ N
      │                  │
┌─────────────┐   ┌─────────────┐
│   Assets    │   │   Presets   │
└─────────────┘   └─────────────┘
      │                   │
      │ 0..1              │ 1
      │                   │
      │                   │ N
      │                   │
      │            ┌─────────────┐
      └───────────>│ KeyMappings │
                   └─────────────┘
                          │
                          │
┌─────────────┐           │
│    User     │───────────┤ (1:N)
└─────────────┘           │
      │                   │
      │ N                 │
      │                   │
┌─────────────┐           │
│    Posts    │───────────┤ (1:1, 향후 구현)
└─────────────┘           │
                          │
                    ┌─────────────┐
                    │   Presets   │
                    └─────────────┘
```

### 5.2 테이블 상세 명세

#### **User** - 사용자 정보

Google OAuth를 통해 가입한 사용자 정보를 저장하는 테이블입니다.

| **필드명** | **타입** | **제약조건** | **설명** |
| --- | --- | --- | --- |
| `id` | INT | PK, NOT NULL, AUTO_INCREMENT | 기본키 |
| `google_id` | VARCHAR(255) | UNIQUE, NULL 허용 | Google 고유 식별자 (Sequelize: `googleId`) |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | 사용자 이메일 |
| `nickname` | VARCHAR(255) | NOT NULL | 서비스 내 표시될 이름 |
| `sns_id` | VARCHAR(255) | NULL 허용 | SNS ID (레거시 또는 대체 지원, Sequelize: `snsId`) |
| `created_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 계정 생성일 (Sequelize: `createdAt`) |
| `updated_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 정보 수정일 (Sequelize: `updatedAt`) |

**관계 (Relationships)**:
- `User` 1:N `Presets` (한 사용자는 여러 프리셋 보유)
- `User` 1:N `Assets` (한 사용자는 여러 에셋 업로드)
- `User` 1:N `Posts` (한 사용자는 여러 게시글 작성, 향후 구현)
- `User` 1:1 `UserPreferences` (한 사용자는 하나의 설정 보유, 향후 구현)

**인덱스**:
- `google_id` (UNIQUE 인덱스)
- `email` (UNIQUE 인덱스)

---

#### **UserPreferences** - 사용자 전역 설정

특정 프로젝트에 귀속되지 않고, 유저가 로그인했을 때 앱 전체에 적용되는 설정을 저장합니다.

| **필드명** | **타입** | **제약조건** | **설명** |
| --- | --- | --- | --- |
| `id` | UUID / INT | PK, NOT NULL, AUTO_INCREMENT | 기본키 |
| `user_id` | UUID / INT | FK, UNIQUE, NOT NULL | 유저 외래키 (User.id 참조) |
| `latency_ms` | INTEGER | NOT NULL, DEFAULT 100 | 오디오 출력 레이턴시 설정 (단위: 밀리초) |
| `visualizer_mode` | STRING(50) | NULL 허용 | 사운드 비주얼라이저 디자인 타입 (예: 'waveform', 'spectrum', 'bars') |
| `default_master_volume` | FLOAT | NOT NULL, DEFAULT 0.7 | 앱 시작 시 기본 마스터 볼륨 (0.0 ~ 1.0) |
| `created_at` | DATETIME | NOT NULL, DEFAULT NOW() | 생성일 |
| `updated_at` | DATETIME | NOT NULL, DEFAULT NOW() | 수정일 |

**관계 (Relationships)**:
- `UserPreferences` N:1 `User` (한 설정은 한 사용자에게 귀속)

**제약조건**:
- `user_id` UNIQUE (한 사용자당 하나의 설정만 존재)
- `latency_ms` CHECK (0 이상)
- `default_master_volume` CHECK (0.0 ~ 1.0 사이)

---

#### **Assets** - 에셋 관리

사용자가 업로드한 파일이나 웹 마이크로 녹음한 파일의 정보를 관리합니다.

| **필드명** | **타입** | **제약조건** | **설명** |
| --- | --- | --- | --- |
| `id` | INT | PK, NOT NULL, AUTO_INCREMENT | 기본키 |
| `user_id` | INT | FK, NULL 허용 | 소유자 외래키 (User.id 참조, 게스트 업로드 시 NULL, Sequelize: `userId`) |
| `filename` | VARCHAR(255) | NOT NULL, UNIQUE | 서버에 저장된 파일명 (랜덤 생성, 중복 방지) |
| `original_name` | VARCHAR(255) | NOT NULL | 사용자가 올린 원래 파일명 (Sequelize: `originalName`) |
| `file_path` | VARCHAR(500) | NOT NULL | 파일 저장 경로 또는 URL (예: '/uploads/xxx.mp3', Sequelize: `filePath`) |
| `mimetype` | VARCHAR(100) | NULL 허용 | 파일 MIME 타입 (예: 'audio/mpeg', 'audio/wav') |
| `is_recorded` | BOOLEAN | NOT NULL, DEFAULT FALSE | 마이크 녹음 여부 (TRUE: 녹음 파일, FALSE: 업로드 파일, Sequelize: `isRecorded`) |
| `created_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 생성일 (Sequelize: `createdAt`) |
| `updated_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 수정일 (Sequelize: `updatedAt`) |

**관계 (Relationships)**:
- `Assets` N:1 `User` (한 에셋은 한 사용자 소유, nullable)
- `Assets` 1:N `KeyMappings` (한 에셋은 여러 패드에 할당 가능)

**참고**: `file_size` 필드는 향후 확장용으로 계획되어 있으나 현재 구현에서는 제외되어 있습니다.

**인덱스**:
- `user_id` (조회 성능 최적화)
- `file_name` (UNIQUE 인덱스)
- `created_at` (최신순 정렬 최적화)

---

#### **Presets** - 프리셋 관리

프리셋마다 반영되는 런치패드의 전역 설정을 저장합니다. (테이블명: `Presets`)

| **필드명** | **타입** | **제약조건** | **설명** |
| --- | --- | --- | --- |
| `id` | INT | PK, NOT NULL, AUTO_INCREMENT | 기본키 |
| `user_id` | INT | FK, NOT NULL | 제작자 외래키 (User.id 참조, Sequelize: `userId`) |
| `title` | VARCHAR(255) | NOT NULL, DEFAULT 'Untitled' | 프리셋 제목 |
| `bpm` | INTEGER | NOT NULL, DEFAULT 120 | 프로젝트 템포 (Beats Per Minute) |
| `master_volume` | FLOAT | NOT NULL, DEFAULT 0.7 | 전체 마스터 볼륨 (0.0 ~ 1.0, Sequelize: `masterVolume`) |
| `is_quantized` | BOOLEAN | NOT NULL, DEFAULT TRUE | 퀀타이즈 활성화 여부 (Sequelize: `isQuantized`) |
| `created_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 생성일 (Sequelize: `createdAt`) |
| `updated_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 마지막 수정일 (Sequelize: `updatedAt`) |

**관계 (Relationships)**:
- `Presets` N:1 `User` (한 프리셋은 한 사용자 소유)
- `Presets` 1:N `KeyMappings` (한 프리셋은 여러 키 매핑 보유)
- `Presets` 1:1 `Posts` (한 프리셋은 하나의 게시글에만 연결, 향후 구현)

**인덱스**:
- `user_id` (사용자별 프리셋 조회 최적화)
- `updated_at` (최신순 정렬 최적화)

---

#### **KeyMappings** - 키 매핑 (패드 설정)

하나의 프리셋은 여러 개의 키 매핑을 가집니다. 각 키 매핑은 패드 ID를 나타내며, 샘플 또는 신스 설정을 포함합니다. (테이블명: `KeyMappings`)

| **필드명** | **타입** | **제약조건** | **설명** |
| --- | --- | --- | --- |
| `id` | INT | PK, NOT NULL, AUTO_INCREMENT | 기본키 |
| `preset_id` | INT | FK, NOT NULL | 소속 프리셋 외래키 (Presets.id 참조, Sequelize: `presetId`) |
| `key_char` | VARCHAR(255) | NOT NULL | 키 문자 ('Z', '0' 등, 패드 ID로도 사용, Sequelize: `keyChar`) |
| `mode` | ENUM | NOT NULL, DEFAULT 'one-shot' | 패드 동작 모드: 'one-shot' (원샷), 'gate' (게이트), 'toggle' (토글) |
| `volume` | FLOAT | NOT NULL, DEFAULT 0 | 패드별 개별 볼륨 (0.0 ~ 1.0) |
| `type` | VARCHAR(50) | DEFAULT 'sample' | 패드 타입: 'sample' (샘플 파일) 또는 'synth' (신서사이저) |
| `note` | VARCHAR(10) | NULL 허용 | 노트 (예: 'C4') |
| `asset_id` | INT | FK, NULL 허용 | 연결된 에셋 외래키 (type='sample'일 경우, Sequelize: `assetId`) |
| `synth_settings` | JSON | NULL 허용 | 신서사이저 파라미터 (type='synth'일 경우 사용, Sequelize: `synthSettings`) |
| `created_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 생성일 (Sequelize: `createdAt`) |
| `updated_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 수정일 (Sequelize: `updatedAt`) |

**관계 (Relationships)**:
- `KeyMappings` N:1 `Presets` (한 키 매핑은 한 프리셋에 귀속)
- `KeyMappings` N:0..1 `Assets` (type='sample'일 때만 에셋 참조)

**인덱스**:
- `preset_id` (프리셋별 키 매핑 조회 최적화)
- `asset_id` (에셋별 키 매핑 조회 최적화)

**예시 `synth_settings` JSON 구조**:
```json
{
  "oscillator": {
    "type": "sine"  // 'sine', 'square', 'sawtooth', 'triangle'
  },
  "envelope": {
    "attack": 0.1,
    "decay": 0.2,
    "sustain": 0.5,
    "release": 1
  }
}
```

---

#### **Posts** - 게시판 (향후 구현)

프리셋을 게시판에 업로드할 때 생성되는 데이터입니다. 현재 코드베이스에는 구현되어 있지 않습니다.

| **필드명** | **타입** | **제약조건** | **설명** |
| --- | --- | --- | --- |
| `id` | INT | PK, NOT NULL, AUTO_INCREMENT | 기본키 |
| `user_id` | INT | FK, NOT NULL | 작성자 외래키 (User.id 참조, Sequelize: `userId`) |
| `preset_id` | INT | FK, NOT NULL, UNIQUE | 공유 대상 프리셋 외래키 (Presets.id 참조, Sequelize: `presetId`) |
| `title` | VARCHAR(255) | NOT NULL | 게시글 제목 |
| `description` | TEXT | NULL 허용 | 프로젝트 설명 또는 사용법 |
| `like_count` | INTEGER | NOT NULL, DEFAULT 0 | 좋아요 수 (인기 순 정렬용) |
| `download_count` | INTEGER | NOT NULL, DEFAULT 0 | 본인 프로젝트로 가져간 횟수 |
| `is_published` | BOOLEAN | NOT NULL, DEFAULT TRUE | 공개 여부 |
| `created_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 생성일 (Sequelize: `createdAt`) |
| `updated_at` | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 수정일 (Sequelize: `updatedAt`) |

**관계 (Relationships)**:
- `Posts` N:1 `User` (한 게시글은 한 사용자가 작성)
- `Posts` 1:1 `Presets` (한 게시글은 한 프리셋만 연결)

**제약조건**:
- `like_count` CHECK (>= 0)
- `download_count` CHECK (>= 0)
- `project_id` UNIQUE (한 프로젝트는 하나의 게시글에만 연결)

**인덱스**:
- `user_id` (작성자별 게시글 조회)
- `project_id` (UNIQUE 인덱스)
- `like_count` (인기순 정렬 최적화)
- `created_at` (최신순 정렬 최적화)
- `is_published` (공개 게시글 필터링)

---

### 5.3 현재 구현 상태

#### ✅ 완료된 구현
- `User`: `nickname` 필드 사용 중, `googleId`, `snsId` 포함, `createdAt`, `updatedAt` 자동 관리
- `Presets`: 기본 구조 존재, `masterVolume`, `isQuantized` 필드 추가 완료 (Phase 4)
- `KeyMappings`: 기본 구조 존재, `synthSettings` JSON 필드 추가 완료 (Phase 4)
- `Assets`: 기본 구조 존재, `isRecorded` 필드 추가 완료 (Phase 4)

#### ⏳ 향후 구현 예정
- `UserPreferences`: 사용자 전역 설정 테이블 (High-Fi 로드맵 2.9)
- `Posts`: 프로젝트 공유 게시판 테이블 (High-Fi 로드맵 2.8)

#### 📝 스키마 리팩토링 완료 사항 (Phase 1-4)

**결정 사항**: 코드베이스의 실제 구현을 기준으로 DB Schema 문서를 수정하는 방향으로 진행되었습니다.

1. **테이블명**: 
   - `Presets` 테이블 유지 (코드 기준)
   - `KeyMappings` 테이블 유지 (코드 기준)

2. **필드명**:
   - `nickname` 필드 유지 (코드 기준)
   - `keyChar` 필드 유지 (코드 기준)
   - Sequelize camelCase → DB snake_case 자동 변환

3. **Presets 테이블 확장** (Phase 4 완료):
   - ✅ `masterVolume` 필드 추가 (FLOAT, DEFAULT 0.7)
   - ✅ `isQuantized` 필드 추가 (BOOLEAN, DEFAULT TRUE)

4. **KeyMappings 테이블 확장** (Phase 4 완료):
   - ✅ `synthSettings` JSON 필드 추가 (NULL 허용)
   - ✅ `type`, `note` 필드 유지 (코드에 존재)
   - ✅ `mode` ENUM: `'one-shot'/'gate'/'toggle'` 유지 (코드 기준)

5. **Assets 테이블 확장** (Phase 4 완료):
   - ✅ `isRecorded` 필드 추가 (BOOLEAN, DEFAULT FALSE)
   - ⏳ `file_size` 필드는 향후 확장용 (선택적)

6. **API 업데이트** (Phase 4 완료):
   - ✅ `POST /presets`: 새 필드 처리 추가
   - ✅ `POST /upload`: `isRecorded` 필드 처리 추가

**참고**: 자세한 리팩토링 과정은 `document/SCHEMA_REFACTORING_PLAN.md`, `document/PHASE3_FIELD_ADDITION_DECISION.md`, `document/PHASE4_COMPLETION_SUMMARY.md`를 참조하세요.

---

### 5.4 데이터베이스 초기화 SQL 예시

```sql
-- 데이터베이스 생성
CREATE DATABASE web_daw CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE web_daw;

-- UserPreferences 테이블 예시 (Sequelize 자동 생성되지만 참고용)
-- 실제로는 Sequelize의 sync() 또는 마이그레이션 파일을 통해 생성됩니다.
```

**참고**: 
- 프로젝트는 Sequelize ORM을 사용하므로, `server/models/` 디렉토리의 모델 파일을 수정하고 서버 실행 시 `db.sequelize.sync()`를 통해 자동으로 테이블이 생성됩니다.
- 로컬 환경에서는 MySQL 서버가 실행 중이어야 합니다.
- Docker 환경에서는 MySQL 컨테이너가 자동으로 설정됩니다.

---

## 6. 기술 스택

### 프론트엔드
- **React 19**: UI 라이브러리
- **Vite**: 빌드 도구 및 개발 서버
- **Tone.js**: 웹 오디오 프레임워크
- **Zustand**: 경량 상태 관리 라이브러리
- **Axios**: HTTP 클라이언트
- **Three.js**: 3D 그래픽 라이브러리 (비주얼라이저)
- **@react-three/fiber**: Three.js를 React 컴포넌트로 사용
- **@react-three/drei**: Three.js 유틸리티 및 헬퍼

### 백엔드
- **Express.js**: Node.js 웹 프레임워크
- **Sequelize**: ORM (MySQL)
- **Passport.js**: 인증 미들웨어
- **Multer**: 파일 업로드 미들웨어
- **express-session**: 세션 관리

### 인프라 및 배포
- **Docker**: 컨테이너화 플랫폼
- **Docker Compose**: 다중 컨테이너 애플리케이션 관리

### 데이터베이스
- **MySQL 8.0**: 관계형 데이터베이스 (Docker 컨테이너로 실행 가능)

### 인증
- **Google OAuth 2.0**: 소셜 로그인

---

## 7. 주요 기능

1. **런치패드 인터페이스**: 16개 패드 그리드로 샘플 트리거
2. **샘플 업로드**: 오디오 파일(MP3, WEBM) 업로드 및 패드에 할당
3. **프리셋 저장/로드**: 패드 구성 및 설정을 서버에 저장 및 불러오기
4. **믹서 컨트롤**: 트랙별 볼륨 및 패닝 조절, 뮤트/솔로 기능
5. **시퀀서**: 루핑 및 패턴 재생, 녹음 기능
6. **신서사이저**: 내장 신스 컨트롤 및 프리셋 관리
7. **오디오 효과**: 리버브, 딜레이 등 FX 컨트롤
8. **파일 라이브러리**: 업로드된 파일 관리 (이름 변경, 삭제, 선택)
9. **악기 라이브러리**: 샘플러, 신스, 드럼 등 악기 선택 및 관리
10. **녹음 라이브러리**: 녹음된 파일 관리 및 재생
11. **가상 악기**: 가상 드럼 패드 및 피아노 키보드 인터페이스
12. **3D 비주얼라이저**: Three.js 기반 배경 사운드 시각화
13. **레이아웃**: 사이드바 기반 구조화된 UI (좌측: 믹서, 우측: 컨트롤)
14. **Google OAuth**: 소셜 로그인을 통한 사용자 인증

---

## 8. 참고사항

- `node_modules`, `.git`, `dist`, `uploads`(업로드된 파일) 등은 버전 관리에서 제외됩니다.
- 개발 환경에서는 `.env` 파일을 `.gitignore`에 포함하여 보안을 유지하세요.
- MySQL 데이터베이스는 서버 실행 시 Sequelize의 `sync()` 메서드를 통해 자동으로 테이블이 생성됩니다.
- **기본 실행 방법은 Docker Compose**입니다. 팀 전체의 개발 환경을 통일하기 위해 Docker를 사용합니다.
- 로컬 실행은 **선택사항**이며, 빠른 개발/디버깅이 필요한 경우에 사용할 수 있습니다.
- Docker Compose를 사용하면 MySQL 컨테이너가 자동으로 생성되고 관리됩니다.
- Docker 환경에서 MySQL 호스트는 `mysql` (서비스 이름)이며, 로컬에서는 `127.0.0.1`을 사용합니다.
- Tone.js의 오디오 컨텍스트는 브라우저의 사용자 제스처(클릭 등) 이후에만 시작할 수 있습니다.
- Windows 환경에서는 `start_app.bat` 파일을 사용하여 쉽게 애플리케이션을 시작할 수 있습니다.
- Docker를 사용하는 경우, `.dockerignore` 파일이 빌드 컨텍스트에서 불필요한 파일을 제외합니다.
- **문서 위치**: 모든 프로젝트 문서는 `document/` 폴더에 있습니다.
  - `document/PROJECT_SPEC.md`: 프로젝트 명세서 (이 문서)
  - `document/DB_SCHEMA.md`: 데이터베이스 스키마를 DBML 형식으로 정의한 문서 (dbdiagram.io에서 시각화 가능)
  - `document/CURRENT_CODE_STRUCTURE.md`: 현재 코드베이스 구조 상세 분석 문서 (Phase 1 결과)
  - `document/SCHEMA_REFACTORING_PLAN.md`: 스키마 리팩토링 작업 계획 및 진행 상황
  - `document/PHASE3_FIELD_ADDITION_DECISION.md`: 누락된 필드 추가 결정 문서
  - `document/PHASE4_COMPLETION_SUMMARY.md`: Phase 4 완료 요약
  - `document/HIGH_FI_ROADMAP.md`: High-Fi 단계 달성을 위한 작업 목록
  - `document/DOCKER_TROUBLESHOOTING.md`: Docker 실행 시 발생할 수 있는 일반적인 문제 해결 가이드
  - `document/README_DOCKER.md`: Docker를 사용한 실행 가이드 (기본 실행 방법)
  - `document/README_DOCKER.md`: Docker Compose를 사용한 실행 방법 상세 가이드