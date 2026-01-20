# Web-DAW (YEEZY LOOP STATION) 기능 명세서

> 버그 탐색 및 QA를 위한 상세 기능 명세서  
> 작성일: 2024  
> 프로젝트 경로: `C:\Users\TWKIM\Desktop\Web-DAW\`

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [기술 스택](#2-기술-스택)
3. [아키텍처](#3-아키텍처)
4. [핵심 기능 상세](#4-핵심-기능-상세)
5. [API 엔드포인트](#5-api-엔드포인트)
6. [데이터베이스 스키마](#6-데이터베이스-스키마)
7. [사용자 시나리오](#7-사용자-시나리오)
8. [테스트 체크리스트](#8-테스트-체크리스트)

---

## 1. 프로젝트 개요

### 1.1 프로젝트 목적
웹 기반 디지털 오디오 워크스테이션(DAW)으로, 브라우저에서 설치 없이 음악 제작과 루핑이 가능한 런치패드 인터페이스를 제공합니다.

### 1.2 주요 특징
- **64개 패드 그리드**: 샘플/신스 할당 및 트리거
- **프리셋 시스템**: 사용자별 프로젝트 저장/로드
- **커뮤니티 공유**: 프리셋 공유 및 포크 기능
- **실시간 믹서**: 8개 트랙의 볼륨/패닝/이펙트 제어
- **시퀀서**: 루프 녹음 및 재생 (6개 슬롯)
- **비주얼라이저**: Three.js 기반 3D 오디오 비주얼라이제이션
- **라이브 모드**: 스크린 녹화 기능

### 1.3 프로젝트 구조
```
Web-DAW/
├── client/          # React 19 + Vite 프론트엔드
│   ├── src/
│   │   ├── api/     # API 클라이언트
│   │   ├── audio/   # 오디오 엔진 (Tone.js)
│   │   ├── components/  # UI 컴포넌트
│   │   ├── pages/   # 페이지 컴포넌트
│   │   ├── store/   # Zustand 상태 관리
│   │   └── hooks/   # 커스텀 훅
├── server/          # Express.js 백엔드
│   ├── routes/      # API 라우트
│   ├── models/      # Sequelize 모델
│   ├── middleware/  # 미들웨어
│   └── config/      # 설정 파일
└── docker-compose.yml
```

---

## 2. 기술 스택

### 2.1 프론트엔드
- **React 19**: UI 프레임워크
- **Vite**: 빌드 도구 및 개발 서버
- **Tone.js 15.1.22**: 웹 오디오 라이브러리
- **Zustand 5.0.10**: 상태 관리
- **Three.js 0.182.0**: 3D 그래픽 라이브러리
- **React Router DOM 7.12.0**: 라우팅
- **Axios 1.13.2**: HTTP 클라이언트

### 2.2 백엔드
- **Express.js 4.18.2**: 웹 프레임워크
- **Sequelize 6.35.2**: ORM
- **MySQL 8.0**: 데이터베이스 (SQLite 개발 모드 지원)
- **Passport.js 0.7.0**: 인증 미들웨어
- **Multer 1.4.5**: 파일 업로드
- **Multer-S3 3.0.1**: S3 업로드 지원
- **Express-Session 1.17.3**: 세션 관리

### 2.3 인프라
- **Docker & Docker Compose**: 컨테이너화
- **Node.js 20+**: 런타임 환경

---

## 3. 아키텍처

### 3.1 클라이언트 아키텍처

#### 상태 관리 (Zustand Store)
- **Transport State**: BPM, 재생 상태, 메트로놈, 루프 녹음
- **Pad Mappings**: 64개 패드의 파일/타입/볼륨/모드 정보
- **Mixer State**: 8개 트랙의 볼륨/패닝/뮤트/솔로
- **Effects State**: 글로벌 이펙트 체인 (Send A/B)
- **Preset State**: 프리셋 목록 및 선택
- **Theme State**: 테마 및 커스텀 배경
- **User State**: 로그인 사용자 정보
- **View Mode**: 런치패드 뷰 모드 (SESSION, MIXER_SELECTION, VOLUME, PAN, etc.)

#### 오디오 엔진 구조
```
AudioEngine (싱글톤)
├── Master Buss (Gain)
├── Analyser (FFT/Waveform) - 비주얼라이저용
├── 8x Channel (Volume/Pan/Mute/Solo)
├── Send A/B Inputs → Global FX Chains
├── Metronome (Idle/Synced)
└── Recording Destination (MediaStream)
```

### 3.2 서버 아키텍처

#### API 라우트 구조
- `/auth/*`: 인증 (Google OAuth, Dev Login, Session)
- `/upload/*`: 오디오 파일 업로드/다운로드 (로컬/S3)
- `/api/graphic-assets/*`: 그래픽 자산 CRUD (이미지 파일, 로컬/S3)
- `/presets/*`: 프리셋 CRUD (인증 필요)
  - `POST /presets/:id/access`: 프리셋 접근 기록
- `/api/posts/*`: 게시판 CRUD (공개/비공개)
- `/api/posts/:postId/comments/*`: 댓글 CRUD
- `/api/user/preferences/*`: 사용자 설정 (인증 필요)

#### 데이터베이스 관계
```
User
├── hasMany Preset
├── hasMany Post
├── hasMany Comment
├── hasMany PresetAccess
├── hasMany GraphicAsset
└── hasOne UserPreference

Preset
├── belongsTo User
├── hasMany KeyMapping
├── hasMany PresetAccess
└── hasMany Post (presetId or presetData snapshot)

Post
├── belongsTo User
├── belongsTo Preset (nullable - snapshot 지원)
└── hasMany Comment

Asset (오디오 파일 메타데이터)
└── referenced by KeyMapping (assetId)

GraphicAsset (이미지 파일 메타데이터)
├── belongsTo User
└── referenced by KeyMapping (graphicAssetId)

KeyMapping
├── belongsTo Preset
├── belongsTo Asset (오디오 파일)
└── belongsTo GraphicAsset (패드 이미지)

PresetAccess (프리셋 접근 추적)
├── belongsTo User (nullable - 비로그인 지원)
└── belongsTo Preset
```

---

## 4. 핵심 기능 상세

### 4.1 런치패드 그리드 (Launchpad Grid)

#### 4.1.1 레이아웃
- **8x8 그리드**: 총 64개 패드
- **상단 버튼**: Session, Mixer, L1-L6 (루프 슬롯)
- **우측 버튼**: 뷰 모드별 동적 변경
  - Session 모드: Scene Launch (►)
  - Mixer 모드: Vol, Pan, Snd A, Snd B, Stop, Mute, Solo, Clear
- **우측 상단**: 로고/라이브 모드 토글

#### 4.1.2 패드 기능
- **클릭**: 샘플/신스 트리거
- **우클릭/더블클릭**: 패드 설정 패널 열기
- **드래그**: 패드 간 파일 이동 (예정)
- **키보드 단축키**: Q-P (첫 행), A-L (두 번째 행), Z-M (세 번째 행), Space (Live Mode)

#### 4.1.3 뷰 모드
1. **SESSION**: 기본 패드 뷰 (64개 패드)
2. **NOTE**: 노트 입력 모드 (미구현)
3. **MIXER_SELECTION**: 믹서 트랙 선택
4. **VOLUME**: 볼륨 페이더 (8개 컬럼)
5. **PAN**: 패닝 페이더 (8개 컬럼)
6. **SEND_A / SEND_B**: 이펙트 Send 페이더
7. **MUTE / SOLO**: 뮤트/솔로 토글
8. **STOP**: 트랙 정지
9. **CLEAR**: 루프 슬롯 클리어

#### 4.1.4 루프 슬롯 (Loop Slots)
- **6개 슬롯**: L1-L6 (키보드 6-0, - 키로 제어)
- **상태**: empty, recording, playing, stopped
- **기능**:
  - 슬롯 클릭: 녹음 시작/정지
  - Alt + 키: 슬롯 클리어
  - Scene Launch: 슬롯 재생

### 4.2 오디오 엔진 (Audio Engine)

#### 4.2.1 초기화
- **Tone.js Context**: 사용자 제스처 후 시작 (START 버튼)
- **Latency Optimization**: lookAhead 0.05초
- **Master Buss**: 모든 채널 최종 출력
- **Analyser**: FFT/Waveform 데이터 추출 (비주얼라이저용)

#### 4.2.2 채널 구조
- **8개 채널**: 각 컬럼별 독립 믹서 채널
- **기능**:
  - Volume: 0-1 선형 게인
  - Pan: -1 (왼쪽) ~ 1 (오른쪽)
  - Mute/Solo: 트랙 제어
  - Send A/B: 글로벌 이펙트 버스로 라우팅

#### 4.2.3 이펙트 시스템
**Send A/B 글로벌 체인**:
- 지원 이펙트: Reverb, Delay, Distortion, BitCrusher, EQ3, Compressor, Flanger, Chorus, Phaser, PitchShift, Tremolo, AutoWah, Panner
- 체인 구조: Input → Effect1 → Effect2 → ... → Master
- 실시간 파라미터 변경 지원

#### 4.2.4 샘플러 (Sampler)
- **64개 인스턴스**: 패드별 독립 샘플러
- **모드**: one-shot, loop, choke (같은 그룹 내 중복 재생 방지)
- **파일 형식**: MP3, WAV, OGG
- **볼륨**: 패드별 독립 제어

#### 4.2.5 신서사이저 (Synthesizer)
- **타입**: Tone.js PolySynth
- **파라미터**:
  - Oscillator Type: sine, triangle, sawtooth, square
  - Envelope: Attack, Decay, Sustain, Release
  - Note: 패드별 노트 할당 (C4 기본)
- **가상 피아노**: 신스 패드 클릭 시 피아노 UI 표시

#### 4.2.6 메트로놈
- **두 가지 모드**:
  - **Idle**: Transport 정지 시 독립 클릭
  - **Synced**: Transport 재생 시 박자 동기화
- **음향**: 다운비트 C6, 일반비트 C5
- **볼륨**: -5dB (조정 가능)

#### 4.2.7 녹음 기능
- **MediaStreamDestination**: 오디오 출력 캡처
- **MediaRecorder**: 비디오 + 오디오 결합 녹화 (Live Mode)
- **출력**: WebM (VP8/Opus) 또는 MP4

### 4.3 프리셋 시스템 (Presets)

#### 4.3.1 프리셋 데이터 구조
```javascript
{
  title: string,
  bpm: number,
  settings: {
    mixerLevels: { vol: [8], pan: [8], sendA: [8], sendB: [8] },
    trackStates: { mute: [8], solo: [8], arm: [8] },
    effects: { sendA: [...], sendB: [...] },
    launchQuantization: string,
    currentThemeId: string,
    customBackgroundImage: string
  },
  mappings: [{
    keyChar: string,  // 패드 ID (0-63)
    mode: string,     // 'one-shot', 'loop', etc.
    volume: number,
    type: string,     // 'sample', 'synth'
    note: string,     // 'C4', etc.
    assetId: number,  // Asset ID (샘플인 경우)
    synthSettings: object,  // 신스인 경우
    graphicAssetId: number,  // GraphicAsset ID (패드 이미지)
    color: string,    // 패드 LED 색상 (hex)
    image: string     // 패드 배경 이미지 URL (레거시 지원)
  }]
}
```

#### 4.3.2 프리셋 저장
- **조건**: 로그인 필수
- **저장 항목**:
  - 활성 패드 매핑 (파일/타입/볼륨/이미지/색상)
  - BPM
  - 글로벌 설정 (믹서, 이펙트, 테마)
- **패드 이미지**: `graphicAssetId`로 GraphicAsset 참조 저장
- **API**: `POST /presets`

#### 4.3.3 프리셋 로드
- **자신의 프리셋**: `GET /presets/:id`
- **커뮤니티 프리셋**: `POST /api/posts/:id/download`
- **로드 순서**:
  1. BPM 설정
  2. 글로벌 설정 복원 (믹서, 이펙트, 테마)
  3. 패드 매핑 복원
  4. 샘플 파일 로드 (Asset URL 기반)
  5. 패드 이미지 로드 (GraphicAsset URL 기반)
- **접근 추적**: 프리셋 로드 시 `PresetAccess` 레코드 생성/업데이트

#### 4.3.4 프리셋 삭제
- **권한**: 소유자만 삭제 가능
- **연쇄 처리**:
  - 연결된 Post의 presetId를 NULL로 설정 (snapshot 보존)
  - KeyMapping 삭제
  - Preset 삭제
- **API**: `DELETE /presets/:id`

#### 4.3.5 프리셋 관리 UI
- **프리셋 라이브러리**: Library 버튼 클릭
- **탭**: All, My Presets, Saved
- **검색**: 제목 기반 필터링
- **액션**: Load, Share, Delete (소유자만)

### 4.4 커뮤니티 게시판 (Community)

#### 4.4.1 게시글 기능
- **생성**: 프리셋 공유 시 Post 생성
  - 제목, 설명, 태그, 장르 입력
  - 프리셋 스냅샷 저장 (presetData)
- **조회**: 공개 게시글만 표시 (isPublished: true)
- **정렬**: 최신순, 인기순 (likeCount)
- **필터**: 검색어, 태그, 장르

#### 4.4.2 게시글 상세
- **정보 표시**: 작성자, 좋아요 수, 다운로드 수, 조회수
- **액션**:
  - Like: 좋아요 (카운트 증가)
  - Download: 프리셋 다운로드 (워크스페이스로 이동)
  - Fork: 프리셋 포크 (자신의 라이브러리에 복사)
  - Edit/Delete: 소유자만 (비공개 포함)
- **댓글**: 게시글별 댓글 목록 및 작성

#### 4.4.3 포크 기능
- **동작**:
  1. 원본 프리셋 또는 스냅샷 데이터 복사
  2. 새 Preset 생성 (제목: "Remix of {원본제목}")
  3. KeyMapping 복사 (assetId 참조 유지)
  4. 원본 Post의 downloadCount 증가
- **API**: `POST /api/posts/:id/fork`

#### 4.4.4 게시글 페이지
- **탭**: Discover (전체 게시글), My Library (내 게시글)
- **페이지네이션**: 12개씩 표시
- **URL 파라미터**: `?tag=xxx` (태그 필터)

### 4.5 믹서 (Mixer)

#### 4.5.1 트랙 제어
- **8개 트랙**: 런치패드 컬럼별 할당
- **Volume**: 0.0 ~ 1.0 (dB 변환: -∞ ~ 0dB)
- **Pan**: -1.0 (왼쪽) ~ 1.0 (오른쪽)
- **Mute/Solo**: 트랙별 독립 제어
- **Send A/B**: 글로벌 이펙트 버스로 전송량 (0.0 ~ 1.0)

#### 4.5.2 믹서 뷰
- **VOLUME 모드**: 8개 컬럼 페이더 (0-7 세그먼트)
- **PAN 모드**: 8개 컬럼 페이더 (중앙 기준)
- **SEND_A / SEND_B 모드**: 이펙트 전송량 페이더
- **MUTE / SOLO 모드**: 토글 스위치 (컬럼 전체)

#### 4.5.3 트랙 선택
- **MIXER_SELECTION 모드**: 트랙 선택 (0-7)
- **선택된 트랙**: 하이라이트 표시

### 4.6 시퀀서 (Sequencer)

#### 4.6.1 루프 녹음
- **6개 슬롯**: L1-L6 (상단 버튼 또는 키보드 6-0, -)
- **녹음 방식**: 실시간 패드 트리거 기록
- **박자 정렬**: launchQuantization 설정에 따라 정렬
- **녹음 상태**: recording (빨간색 펄스)

#### 4.6.2 루프 재생
- **Scene Launch**: 우측 버튼 (►) 클릭 시 슬롯 재생
- **재생 상태**: playing (초록색)
- **동기화**: Transport BPM에 맞춰 재생

#### 4.6.3 루프 관리
- **클리어**: CLEAR 모드에서 컬럼 클릭 또는 Alt + 키
- **정지**: STOP 모드에서 트랙 클릭

### 4.7 파일 관리 (File Library)

#### 4.7.1 파일 업로드
- **지원 형식**: 
  - 오디오 파일 (MP3, WAV, OGG 등) → Asset 모델
  - 이미지 파일 (JPEG, PNG, GIF 등) → GraphicAsset 모델
- **스토리지**: 로컬 (uploads/, uploads/graphics/) 또는 AWS S3
- **메타데이터**: 
  - **Asset 모델** (오디오 파일):
    - originalName, filename, filePath, mimetype
    - category (sample, loop, etc.)
    - isRecorded (녹음 파일 여부)
    - storageType (local, s3)
  - **GraphicAsset 모델** (이미지 파일):
    - originalName, filename, filePath, mimetype
    - category (background, pad, icon, texture, overlay, other)
    - width, height, fileSize
    - isPublic (공개 여부)
    - storageType (local, s3)
- **API**: 
  - 오디오: `POST /upload`
  - 이미지: `POST /api/graphic-assets`

#### 4.7.2 파일 라이브러리 UI
- **카테고리별 표시**: 샘플, 루프, 녹음 파일
- **파일 목록**: 이름, 크기, 업로드 날짜
- **액션**: 
  - 패드에 할당: 드래그 앤 드롭 또는 클릭
  - 삭제: 선택 후 삭제 (배치 삭제 지원)
  - 이름 변경: `PUT /upload/rename`
- **필터링 규칙**:
  - **비로그인 상태**: 현재 로드된 preset의 asset만 표시 (presetId 쿼리 파라미터 필요)
  - **로그인 상태**: 본인이 만든 preset의 asset + 로드한 preset의 asset + 본인이 업로드한 asset

#### 4.7.3 파일 할당
- **패드 설정 패널**: 파일 선택 드롭다운
- **패드별 파일**: Asset ID 참조 (오디오)
- **패드 이미지**: GraphicAsset ID 참조 (이미지)
- **패드 색상**: LED 색상 설정 (hex)
- **오프라인 파일**: URL 직접 입력 가능

### 4.8 이펙트 라이브러리 (Effect Library)

#### 4.8.1 글로벌 이펙트
- **Send A/B 버스**: 각각 독립 이펙트 체인
- **체인 구조**: 여러 이펙트 순차 연결
- **파라미터 실시간 조정**: 각 이펙트별 파라미터 변경

#### 4.8.2 지원 이펙트
1. **Reverb**: 공간감 (decay, preDelay, mix)
2. **Delay**: 딜레이 (delayTime, feedback, mix)
3. **Distortion**: 왜곡 (distortion)
4. **BitCrusher**: 비트 크러싱 (bits)
5. **EQ3**: 3밴드 이퀄라이저 (low, mid, high)
6. **Compressor**: 압축기 (threshold, ratio, attack, release)
7. **Flanger**: 플랜저 (delayTime, depth, feedback)
8. **Chorus**: 코러스 (frequency, delayTime, depth)
9. **Phaser**: 페이저 (frequency, octaves, baseFrequency)
10. **PitchShift**: 피치 시프트 (pitch)
11. **Tremolo**: 트레몰로 (frequency, depth)
12. **AutoWah**: 오토 와우 (baseFrequency, octaves, sensitivity)
13. **Panner**: 패너 (pan)

#### 4.8.3 이펙트 UI
- **이펙트 라이브러리**: 좌측 사이드바 또는 전용 패널
- **체인 편집**: 이펙트 추가/제거/순서 변경
- **파라미터 조정**: 슬라이더/노브 UI

### 4.9 가상 악기 (Virtual Instruments)

#### 4.9.1 가상 피아노
- **트리거**: 신스 타입 패드 클릭 시 표시
- **키보드**: 88키 피아노 레이아웃
- **기능**:
  - 마우스 클릭 또는 키보드 입력
  - 노트 시각적 피드백
  - 옥타브 이동
  - 벨로시티 감지 (미구현)

#### 4.9.2 가상 드럼
- **트리거**: 드럼 타입 패드 클릭 시 표시
- **드럼 패드**: 킥, 스네어, 하이햇, 심벌 등
- **기능**: 패드 클릭 시 드럼 사운드 재생

### 4.10 테마 및 비주얼라이저

#### 4.10.1 테마 시스템
- **테마 종류**: cosmic, dark, neon, minimalist 등
- **테마 속성**:
  - primaryColor, secondaryColor
  - gridColor, textColor
  - background (CSS gradient 또는 이미지)
  - type (static, dynamic)
  - visualizerMode (default, particles, etc.)
- **커스텀 배경**: 사용자 이미지 업로드 (GraphicAsset의 category='background'로 저장)
- **패드 이미지**: 각 패드별 개별 이미지 설정 가능 (GraphicAsset의 category='pad'로 저장)

#### 4.10.2 비주얼라이저
- **3D 비주얼라이저**: Three.js 기반
- **모드**:
  - default: 기본 파티클
  - particles: 입자 효과
  - circular_wave: 원형 파동
  - bass: 저음 반응
  - rainbow: 무지개 그라데이션
  - gradient: 그라데이션
- **오디오 데이터**: AudioEngine의 Analyser에서 주파수/파형 데이터 추출
- **표시 위치**: 런치패드 그리드 배경 또는 전체 화면

### 4.11 라이브 모드 (Live Mode)

#### 4.11.1 활성화
- **토글**: 스페이스바 또는 우측 상단 로고 클릭
- **UI 변경**:
  - 좌측/우측 사이드바 숨김
  - 헤더 숨김
  - 그리드 전체 화면 확대

#### 4.11.2 녹화 기능
- **시작**: Enter 키 또는 우측 상단 로고 클릭
- **프로세스**:
  1. 전체 화면 전환
  2. 화면 캡처 (getDisplayMedia)
  3. 오디오 캡처 (AudioEngine의 MediaStream)
  4. 결합 녹화 (MediaRecorder)
- **출력**: WebM 파일 (VP8/Opus 코덱)
- **종료**: Enter 키 또는 녹화 중지

### 4.12 사용자 인증 (Authentication)

#### 4.12.1 Google OAuth
- **흐름**:
  1. `/auth/google` → Google 로그인 페이지
  2. `/auth/google/callback` → 세션 생성
  3. 클라이언트 리다이렉트 (`returnTo` 쿼리 파라미터)
- **환경 변수**: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, CALLBACK_URL

#### 4.12.2 Dev Login
- **개발용**: Google OAuth 미설정 시 사용
- **API**: `GET /auth/dev_login`
- **계정**: 고정 Dev User (googleId: 'dev_user_123')

#### 4.12.3 세션 관리
- **Express-Session**: 쿠키 기반 세션
- **세션 검증**: `GET /auth/user`
- **로그아웃**: `GET /auth/logout`

### 4.13 사용자 설정 (User Preferences)

#### 4.13.1 설정 항목
- **latencyMs**: 오디오 레이턴시 (밀리초)
- **visualizerMode**: 비주얼라이저 모드
- **defaultMasterVolume**: 기본 마스터 볼륨 (0.0 ~ 1.0)

#### 4.13.2 설정 저장
- **API**: `PUT /api/user/preferences`
- **자동 로드**: 로그인 시 프리셋과 함께 로드
- **Store 동기화**: 설정 변경 시 Zustand Store 업데이트

### 4.14 Transport 제어

#### 4.14.1 재생 제어
- **Play/Pause**: Transport 시작/일시정지
- **Stop**: Transport 정지 및 위치 초기화
- **BPM 조정**: 실시간 BPM 변경 (60-200)

#### 4.14.2 Quantization
- **설정**: none, 1m, 4n, 8n, 16n
- **동작**: 패드 트리거 시 다음 박자에 정렬

### 4.15 사이드바 (Sidebars)

#### 4.15.1 좌측 사이드바
- **컴포넌트**: 파일 라이브러리, 이펙트 라이브러리, 악기 라이브러리
- **토글**: 화살표 버튼 또는 상태 변경
- **Live Mode**: 자동 숨김

#### 4.15.2 우측 사이드바
- **컴포넌트**: 라이브러리 뷰 또는 설정 뷰
- **기본**: 닫힘 상태
- **Live Mode**: 표시 유지 (선택적)

---

## 5. API 엔드포인트

### 5.1 인증 (Auth)

#### GET /auth/google
- **설명**: Google OAuth 로그인 시작
- **쿼리**: `state` (리다이렉트 URL)
- **응답**: Google 로그인 페이지 리다이렉트

#### GET /auth/google/callback
- **설명**: Google OAuth 콜백
- **응답**: 클라이언트 리다이렉트 (`state` 기반)

#### GET /auth/dev_login
- **설명**: 개발용 로그인 (OAuth 미설정 시)
- **쿼리**: `returnTo` (리다이렉트 URL)
- **응답**: 클라이언트 리다이렉트

#### GET /auth/user
- **설명**: 현재 세션 사용자 정보 조회
- **인증**: 세션 기반
- **응답**: `{ id, email, nickname, avatarUrl }` 또는 `401 Unauthorized`

#### GET /auth/logout
- **설명**: 로그아웃
- **인증**: 세션 기반
- **응답**: `{ message: 'Logged out successfully' }`

### 5.2 파일 업로드 (Upload)

#### GET /upload
- **설명**: 오디오 파일 목록 조회
- **쿼리**: 
  - `category` (선택)
  - `presetId` (선택, 비로그인 시 필수)
- **필터링**:
  - 비로그인: 현재 로드된 preset의 asset만
  - 로그인: 본인이 만든 preset의 asset + 로드한 preset의 asset + 본인이 업로드한 asset
- **응답**: `Asset[]`

#### POST /upload
- **설명**: 파일 업로드
- **인증**: 세션 기반 (선택, 로그인 시 userId 할당)
- **Body**: `multipart/form-data`
  - `file`: 파일
  - `isRecorded`: boolean
  - `category`: string
- **응답**: `{ message, file: Asset }`

#### POST /upload/delete
- **설명**: 파일 배치 삭제
- **인증**: 세션 기반 (소유자만)
- **Body**: `{ ids: number[] }`
- **응답**: `{ message }`

#### PUT /upload/rename
- **설명**: 파일 이름 변경
- **인증**: 세션 기반 (소유자만)
- **Body**: `{ id: number, newName: string }`
- **응답**: `{ message, asset }`

### 5.2.1 그래픽 자산 (Graphic Assets)

#### GET /api/graphic-assets
- **설명**: 그래픽 자산 목록 조회
- **쿼리**: `category` (선택: background, pad, icon, texture, overlay, other)
- **필터링**:
  - 비로그인: 공개된 asset만 (isPublic: true)
  - 로그인: 본인이 업로드한 asset + 공개된 asset
- **응답**: `GraphicAsset[]`

#### GET /api/graphic-assets/:id
- **설명**: 그래픽 자산 상세 조회
- **인증**: 선택 (비공개 asset은 소유자만)
- **응답**: `GraphicAsset`

#### POST /api/graphic-assets
- **설명**: 그래픽 자산 업로드
- **인증**: 선택 (로그인 시 userId 할당)
- **Body**: `multipart/form-data`
  - `file`: 이미지 파일
  - `category`: string (background, pad, icon, texture, overlay, other)
  - `isPublic`: boolean
- **응답**: `{ message, asset: GraphicAsset }`

#### PUT /api/graphic-assets/:id
- **설명**: 그래픽 자산 수정
- **인증**: 세션 기반 (소유자만)
- **Body**: `{ category?, isPublic? }`
- **응답**: `{ message, asset }`

#### DELETE /api/graphic-assets/:id
- **설명**: 그래픽 자산 삭제
- **인증**: 세션 기반 (소유자만)
- **응답**: `{ message }`

#### POST /api/graphic-assets/delete
- **설명**: 그래픽 자산 배치 삭제
- **인증**: 세션 기반 (소유자만)
- **Body**: `{ ids: number[] }`
- **응답**: `{ message }`

### 5.3 프리셋 (Presets)

#### GET /presets
- **설명**: 사용자의 프리셋 목록 조회
- **인증**: 필수
- **응답**: `Preset[]`

#### GET /presets/:id
- **설명**: 프리셋 상세 조회 (매핑 포함)
- **인증**: 필수 (소유자만)
- **응답**: `Preset` (KeyMapping, Asset 포함)

#### POST /presets
- **설명**: 프리셋 생성
- **인증**: 필수
- **Body**:
```json
{
  "title": string,
  "bpm": number,
  "mappings": [{
    "keyChar": string,
    "mode": string,
    "volume": number,
    "type": string,
    "note": string,
    "assetId": number,
    "synthSettings": object,
    "graphicAssetId": number,
    "color": string,
    "image": string
  }],
  "settings": {
    "mixerLevels": {...},
    "trackStates": {...},
    "effects": {...},
    "launchQuantization": string,
    "currentThemeId": string,
    "customBackgroundImage": string
  },
  "masterVolume": number,
  "isQuantized": boolean
}
```
- **응답**: `Preset`

#### POST /presets/:id/access
- **설명**: 프리셋 접근 기록 (프리셋 로드 시 호출)
- **인증**: 선택 (비로그인도 가능)
- **Body**: 없음
- **응답**: `{ success: boolean, message: string }`
- **동작**: PresetAccess 레코드 생성/업데이트 (userId, presetId, sessionId, loadedAt)

#### DELETE /presets/:id
- **설명**: 프리셋 삭제
- **인증**: 필수 (소유자만)
- **연쇄 처리**: Post.presetId → NULL, KeyMapping 삭제
- **응답**: `{ message }`

### 5.4 게시글 (Posts)

#### GET /api/posts
- **설명**: 공개 게시글 목록 조회 (페이지네이션)
- **쿼리**:
  - `page`: number (기본: 1)
  - `limit`: number (기본: 10)
  - `sort`: 'created' | 'popular' (기본: 'created')
  - `search`: string
  - `tag`: string
  - `genre`: string
- **응답**: `{ posts: Post[], total: number, page: number, limit: number, totalPages: number }`

#### GET /api/posts/:id
- **설명**: 게시글 상세 조회
- **응답**: `Post` (User, Preset 포함)

#### GET /api/posts/user/my-posts
- **설명**: 내 게시글 목록 조회
- **인증**: 필수
- **쿼리**: `page`, `limit`
- **응답**: `{ posts: Post[], total: number, page: number, limit: number, totalPages: number }`

#### POST /api/posts
- **설명**: 게시글 생성
- **인증**: 필수
- **Body**:
```json
{
  "presetId": number,
  "title": string,
  "description": string,
  "isPublished": boolean,
  "tags": string[],
  "genre": string
}
```
- **응답**: `Post` (Preset 스냅샷 저장)

#### PUT /api/posts/:id
- **설명**: 게시글 수정
- **인증**: 필수 (소유자만)
- **Body**: `{ title?, description?, isPublished? }`
- **응답**: `Post`

#### DELETE /api/posts/:id
- **설명**: 게시글 삭제
- **인증**: 필수 (소유자만)
- **응답**: `{ message }`

#### POST /api/posts/:id/like
- **설명**: 게시글 좋아요
- **인증**: 필수
- **응답**: `{ success: boolean, likeCount: number }`

#### POST /api/posts/:id/download
- **설명**: 프리셋 다운로드 (공개 게시글)
- **인증**: 선택 (로그인 시 downloadCount 증가 및 PresetAccess 기록)
- **응답**: `{ success: boolean, downloadCount: number, post: Post }` (Preset 데이터 포함, KeyMapping에 GraphicAsset 포함)

#### POST /api/posts/:id/fork
- **설명**: 프리셋 포크
- **인증**: 필수
- **응답**: `{ success: boolean, message: string, newPresetId: number }`

#### POST /api/posts/:id/publish
- **설명**: 게시글 공개/비공개 토글
- **인증**: 필수 (소유자만)
- **응답**: `{ success: boolean, isPublished: boolean, message: string }`

### 5.5 댓글 (Comments)

#### GET /api/posts/:postId/comments
- **설명**: 게시글 댓글 목록 조회
- **응답**: `Comment[]` (User 포함)

#### POST /api/posts/:postId/comments
- **설명**: 댓글 작성
- **인증**: 필수
- **Body**: `{ content: string }`
- **응답**: `Comment` (User 포함)

#### DELETE /api/posts/:postId/comments/:id
- **설명**: 댓글 삭제
- **인증**: 필수 (소유자만)
- **응답**: `{ message }`

### 5.6 사용자 설정 (User Preferences)

#### GET /api/user/preferences
- **설명**: 사용자 설정 조회
- **인증**: 필수
- **응답**: `UserPreference` 또는 기본값

#### PUT /api/user/preferences
- **설명**: 사용자 설정 업데이트 (생성/수정)
- **인증**: 필수
- **Body**: `{ latencyMs?, visualizerMode?, defaultMasterVolume? }`
- **응답**: `UserPreference`

#### POST /api/user/preferences
- **설명**: 사용자 설정 생성 (없는 경우만)
- **인증**: 필수
- **Body**: `{ latencyMs?, visualizerMode?, defaultMasterVolume? }`
- **응답**: `UserPreference` 또는 `409 Conflict`

---

## 6. 데이터베이스 스키마

### 6.1 Users
```sql
id: INTEGER PRIMARY KEY
googleId: STRING UNIQUE
email: STRING
nickname: STRING
avatarUrl: STRING
createdAt: DATETIME
updatedAt: DATETIME
```

### 6.2 Presets
```sql
id: INTEGER PRIMARY KEY
userId: INTEGER FOREIGN KEY (Users.id)
title: STRING NOT NULL
bpm: INTEGER DEFAULT 120
settings: JSON  -- 글로벌 설정 (믹서, 이펙트, 테마 등)
masterVolume: FLOAT DEFAULT 0.7
isQuantized: BOOLEAN DEFAULT true
parentPresetId: INTEGER FOREIGN KEY (Presets.id) NULL
isPublic: BOOLEAN DEFAULT false
createdAt: DATETIME
updatedAt: DATETIME
```

### 6.3 KeyMappings
```sql
id: INTEGER PRIMARY KEY
presetId: INTEGER FOREIGN KEY (Presets.id)
keyChar: STRING  -- 패드 ID (0-63)
mode: STRING  -- 'one-shot', 'gate', 'toggle'
volume: FLOAT
type: STRING  -- 'sample', 'synth'
note: STRING  -- 'C4', etc.
assetId: INTEGER FOREIGN KEY (Assets.id) NULL  -- 오디오 파일
graphicAssetId: INTEGER FOREIGN KEY (GraphicAssets.id) NULL  -- 패드 이미지
color: STRING NULL  -- 패드 LED 색상 (hex)
image: TEXT NULL  -- 패드 배경 이미지 URL (레거시 지원)
synthSettings: JSON NULL
createdAt: DATETIME
updatedAt: DATETIME
```

### 6.4 Assets
```sql
id: INTEGER PRIMARY KEY
originalName: STRING
filename: STRING
filePath: STRING  -- URL (S3) or local path
mimetype: STRING
isRecorded: BOOLEAN DEFAULT false
category: STRING DEFAULT 'sample'
userId: INTEGER FOREIGN KEY (Users.id) NULL
isPublic: BOOLEAN DEFAULT true
storageType: STRING  -- 'local', 's3'
s3Key: STRING NULL
createdAt: DATETIME
updatedAt: DATETIME
```

### 6.5 Posts
```sql
id: INTEGER PRIMARY KEY
userId: INTEGER FOREIGN KEY (Users.id)
presetId: INTEGER FOREIGN KEY (Presets.id) NULL
title: STRING NOT NULL
description: TEXT NULL
likeCount: INTEGER DEFAULT 0
downloadCount: INTEGER DEFAULT 0
viewCount: INTEGER DEFAULT 0
tags: JSON  -- Array of strings
genre: STRING NULL
isPublished: BOOLEAN DEFAULT true
presetData: JSON NULL  -- 프리셋 스냅샷
createdAt: DATETIME
updatedAt: DATETIME
```

### 6.6 Comments
```sql
id: INTEGER PRIMARY KEY
postId: INTEGER FOREIGN KEY (Posts.id)
userId: INTEGER FOREIGN KEY (Users.id)
content: TEXT NOT NULL
createdAt: DATETIME
updatedAt: DATETIME
```

### 6.7 UserPreferences
```sql
id: INTEGER PRIMARY KEY
userId: INTEGER FOREIGN KEY (Users.id) UNIQUE
latencyMs: INTEGER DEFAULT 100
visualizerMode: STRING NULL
defaultMasterVolume: FLOAT DEFAULT 0.7
createdAt: DATETIME
updatedAt: DATETIME
```

### 6.8 GraphicAssets
```sql
id: INTEGER PRIMARY KEY
userId: INTEGER FOREIGN KEY (Users.id) NULL  -- NULL이면 비로그인 사용자
originalName: STRING NOT NULL
filename: STRING NOT NULL
filePath: STRING NOT NULL  -- 로컬 경로 또는 S3 URL
mimetype: STRING NULL  -- image/jpeg, image/png, image/gif, etc.
category: ENUM('background', 'icon', 'texture', 'overlay', 'pad', 'other') DEFAULT 'background'
width: INTEGER NULL  -- 이미지 너비 (픽셀)
height: INTEGER NULL  -- 이미지 높이 (픽셀)
fileSize: INTEGER NULL  -- 파일 크기 (바이트)
isPublic: BOOLEAN DEFAULT false
storageType: ENUM('local', 's3') DEFAULT 'local'
s3Key: STRING NULL  -- S3 객체 키
createdAt: DATETIME
updatedAt: DATETIME
```

### 6.9 PresetAccesses
```sql
id: INTEGER PRIMARY KEY
userId: INTEGER FOREIGN KEY (Users.id) NULL  -- NULL이면 비로그인 사용자
presetId: INTEGER FOREIGN KEY (Presets.id) NOT NULL
sessionId: STRING NULL  -- 비로그인 사용자 세션 ID
loadedAt: DATETIME NOT NULL  -- 프리셋 로드 시각
-- timestamps: false (createdAt, updatedAt 없음)
```

---

## 7. 사용자 시나리오

### 7.1 첫 사용자 플로우
1. 홈페이지 접속 (`/`)
2. "New Project" 클릭 → 워크스페이스로 이동 (`/workspace`)
3. START 버튼 클릭 → 오디오 컨텍스트 초기화
4. 파일 업로드 또는 샘플 선택
5. 패드에 파일 할당
6. 패드 클릭하여 사운드 재생
7. (선택) 로그인 후 프리셋 저장

### 7.2 프리셋 저장 및 공유
1. 워크스페이스에서 작업
2. 상단 "Save" 버튼 클릭 (로그인 필요)
3. 프리셋 이름 입력
4. 저장 완료
5. "Library" 버튼 클릭 → 프리셋 목록 확인
6. "Share" 버튼 클릭 → 게시글 작성
7. 제목, 설명, 태그, 장르 입력
8. 게시글 공개

### 7.3 커뮤니티에서 프리셋 가져오기
1. "Community" 탭 또는 메뉴 클릭 (`/community`)
2. 게시글 목록 확인 (Discover 탭)
3. 게시글 클릭 → 상세 페이지
4. "Download" 버튼 클릭 → 워크스페이스로 이동
5. 프리셋 자동 로드
6. (선택) "Fork" 버튼 클릭 → 자신의 라이브러리에 복사

### 7.4 믹서 조정
1. 상단 "Mixer" 버튼 클릭 → Mixer 모드 전환
2. 우측 사이드 버튼에서 "Vol" 클릭 → Volume 모드
3. 그리드에서 8개 컬럼 페이더로 볼륨 조정
4. "Pan" 클릭 → Pan 모드로 전환하여 패닝 조정
5. "Snd A" 클릭 → Send A 모드로 이펙트 전송량 조정

### 7.5 루프 녹음
1. 상단 "L1" 버튼 클릭 또는 키보드 "6" 키 → 슬롯 1 녹음 시작
2. 패드 클릭하여 패턴 녹음
3. 다시 "L1" 클릭 또는 "6" 키 → 녹음 정지
4. 우측 사이드 버튼 "►" 클릭 → 슬롯 1 재생
5. 여러 슬롯 녹음 후 Scene Launch로 동시 재생

### 7.6 라이브 모드 녹화
1. 스페이스바 또는 우측 상단 로고 클릭 → Live Mode 활성화
2. UI 숨김 (사이드바, 헤더)
3. Enter 키 또는 로고 클릭 → 녹화 시작
4. 전체 화면 전환 및 화면 캡처 시작
5. 음악 연주
6. Enter 키 또는 녹화 중지 → 녹화 파일 다운로드

---

## 8. 테스트 체크리스트

### 8.1 인증 관련
- [ ] Google OAuth 로그인 정상 동작
- [ ] Dev Login 정상 동작 (개발 환경)
- [ ] 세션 유지 및 만료 처리
- [ ] 로그아웃 후 세션 정리
- [ ] 미로그인 시 인증 필요한 API 401 응답
- [ ] 소유자가 아닌 경우 수정/삭제 403 응답

### 8.2 런치패드 관련
- [ ] 64개 패드 렌더링 정상
- [ ] 패드 클릭 시 샘플/신스 재생
- [ ] 패드 설정 패널 열기/닫기
- [ ] 패드에 파일 할당/제거
- [ ] 키보드 단축키 동작 (Q-P, A-L, Z-M)
- [ ] 뷰 모드 전환 (SESSION, VOLUME, PAN, etc.)
- [ ] 상단 버튼 클릭 (Session, Mixer, L1-L6)
- [ ] 우측 사이드 버튼 동작

### 8.3 오디오 엔진 관련
- [ ] 오디오 컨텍스트 초기화 (START 버튼)
- [ ] 샘플 파일 재생 (one-shot, loop 모드)
- [ ] 신스 사운드 재생
- [ ] 8개 채널 볼륨/패닝 제어
- [ ] 뮤트/솔로 동작
- [ ] Send A/B 이펙트 버스 동작
- [ ] 이펙트 체인 추가/제거
- [ ] 이펙트 파라미터 실시간 조정
- [ ] 메트로놈 동작 (Idle/Synced)
- [ ] BPM 변경 시 Transport 동기화

### 8.4 프리셋 관련
- [ ] 프리셋 저장 (로그인 필수)
  - [ ] 패드 이미지 저장 (graphicAssetId)
  - [ ] 패드 색상 저장 (color)
- [ ] 프리셋 목록 조회 (자신의 프리셋만)
- [ ] 프리셋 상세 조회 (매핑, Asset, GraphicAsset 포함)
- [ ] 프리셋 로드 (BPM, 설정, 매핑 복원)
  - [ ] 패드 이미지 복원 (GraphicAsset URL)
  - [ ] 프리셋 접근 기록 (PresetAccess)
- [ ] 프리셋 삭제 (연쇄 처리 확인)
- [ ] 프리셋 라이브러리 검색/필터링

### 8.5 커뮤니티 관련
- [ ] 게시글 목록 조회 (공개만)
- [ ] 게시글 정렬 (최신순, 인기순)
- [ ] 게시글 검색/필터 (태그, 장르)
- [ ] 게시글 상세 조회
- [ ] 게시글 생성 (프리셋 스냅샷 저장)
- [ ] 게시글 수정/삭제 (소유자만)
- [ ] 좋아요 기능
- [ ] 다운로드 기능 (downloadCount 증가)
- [ ] 포크 기능 (새 Preset 생성)
- [ ] 댓글 작성/삭제

### 8.6 파일 관리 관련
- [ ] 오디오 파일 업로드 (로컬/S3)
- [ ] 이미지 파일 업로드 (GraphicAsset, 로컬/S3)
- [ ] 파일 목록 조회 (필터링 규칙 확인)
  - [ ] 비로그인: 현재 preset의 asset만
  - [ ] 로그인: 본인 preset + 로드한 preset + 본인 업로드 asset
- [ ] 파일 삭제 (배치 삭제)
- [ ] 파일 이름 변경
- [ ] 파일을 패드에 할당 (오디오)
- [ ] 이미지를 패드에 할당 (GraphicAsset)
- [ ] 패드 색상 설정
- [ ] 업로드된 파일 재생

### 8.7 믹서 관련
- [ ] 8개 트랙 볼륨 조정 (0-1)
- [ ] 8개 트랙 패닝 조정 (-1 ~ 1)
- [ ] 트랙 뮤트/솔로 토글
- [ ] Send A/B 전송량 조정
- [ ] 믹서 뷰 모드 전환 (VOLUME, PAN, etc.)

### 8.8 시퀀서 관련
- [ ] 루프 슬롯 녹음 시작/정지 (L1-L6)
- [ ] 녹음된 루프 재생
- [ ] Scene Launch 동작
- [ ] 루프 슬롯 클리어
- [ ] 박자 정렬 (Quantization)

### 8.9 테마/비주얼라이저 관련
- [ ] 테마 변경 (cosmic, dark, neon, etc.)
- [ ] 커스텀 배경 이미지 업로드 (GraphicAsset, category='background')
- [ ] 패드 이미지 업로드 (GraphicAsset, category='pad')
- [ ] 패드 이미지 미리보기
- [ ] 비주얼라이저 모드 변경
- [ ] 비주얼라이저 표시/숨김
- [ ] 3D 비주얼라이저 오디오 반응

### 8.10 라이브 모드 관련
- [ ] Live Mode 토글 (스페이스바)
- [ ] Live Mode 시 UI 숨김
- [ ] 녹화 시작 (Enter 키)
- [ ] 전체 화면 전환
- [ ] 화면 + 오디오 캡처
- [ ] 녹화 파일 다운로드

### 8.11 Transport 제어 관련
- [ ] Play/Pause 동작
- [ ] Stop 동작 (위치 초기화)
- [ ] BPM 조정 (60-200)
- [ ] Quantization 설정

### 8.12 사용자 설정 관련
- [ ] 설정 조회 (기본값 또는 저장된 값)
- [ ] 설정 저장 (latencyMs, visualizerMode, defaultMasterVolume)
- [ ] 설정 Store 동기화

### 8.13 에러 처리
- [ ] 네트워크 오류 처리
- [ ] 파일 업로드 실패 처리
- [ ] 인증 오류 처리 (401, 403)
- [ ] 잘못된 입력 검증 (400)
- [ ] 서버 오류 처리 (500)
- [ ] ErrorBoundary 동작

### 8.14 성능
- [ ] 대량 패드 매핑 로드 성능
- [ ] 이펙트 체인 처리 성능
- [ ] 비주얼라이저 렌더링 성능
- [ ] 파일 업로드/다운로드 성능
- [ ] 메모리 누수 확인 (오디오 버퍼 정리)

### 8.15 브라우저 호환성
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] 모바일 브라우저 (제한적)

### 8.16 Docker 관련
- [ ] Docker Compose 정상 실행
- [ ] MySQL 컨테이너 정상 동작
- [ ] 서버 컨테이너 정상 동작
- [ ] 클라이언트 컨테이너 정상 동작
- [ ] 볼륨 마운트 정상 동작 (uploads/)
- [ ] 네트워크 연결 정상

---

## 9. 알려진 제약사항 및 향후 개선 사항

### 9.1 제약사항
- **브라우저 오디오 제약**: 사용자 제스처 후 오디오 컨텍스트 시작 필요
- **파일 크기 제한**: 업로드 파일 크기 제한 (서버 설정 필요)
- **동시 재생 제한**: 브라우저별 오디오 채널 제한
- **모바일 지원 제한**: 터치 제스처 및 성능 이슈

### 9.2 향후 개선 사항
- [ ] MIDI 입력 지원
- [ ] 더 많은 이펙트 추가
- [ ] 패턴 편집기 UI
- [ ] 다중 채널 오디오 출력
- [ ] 실시간 협업 기능
- [ ] 클라우드 동기화
- [ ] 모바일 앱 개발

---

## 10. 버그 리포트 템플릿

버그 발견 시 다음 정보를 포함하여 리포트:

1. **버그 제목**: 간단한 설명
2. **재현 단계**: 단계별 재현 방법
3. **예상 동작**: 정상 동작 설명
4. **실제 동작**: 실제 발생한 동작
5. **환경 정보**:
   - OS: Windows/macOS/Linux
   - 브라우저: Chrome/Firefox/Safari (버전)
   - 화면 해상도
   - 네트워크 상태
6. **스크린샷/로그**: 가능한 경우 첨부
7. **우선순위**: Critical/High/Medium/Low

---

---

## 11. 최근 변경 사항 (Changelog)

### v1.1 (2024)
- **패드 이미지 저장 기능 추가**
  - `GraphicAssets` 테이블 생성 (이미지 파일 메타데이터 저장)
  - `KeyMappings`에 `graphicAssetId`, `color`, `image` 필드 추가
  - 패드별 개별 이미지 설정 및 미리보기 지원
  - 배경 이미지도 `GraphicAsset`로 저장 (category='background')

- **프리셋 접근 추적 기능 추가**
  - `PresetAccesses` 테이블 생성
  - 프리셋 로드 시 접근 기록 (비로그인 사용자도 지원)
  - 파일 라이브러리 필터링에 활용 (로드한 preset의 asset 표시)

- **파일 라이브러리 필터링 개선**
  - 비로그인: 현재 로드된 preset의 asset만 표시
  - 로그인: 본인이 만든 preset + 로드한 preset + 본인이 업로드한 asset 표시

- **API 엔드포인트 추가**
  - `GET /api/graphic-assets`: 그래픽 자산 목록 조회
  - `GET /api/graphic-assets/:id`: 그래픽 자산 상세 조회
  - `POST /api/graphic-assets`: 그래픽 자산 업로드
  - `PUT /api/graphic-assets/:id`: 그래픽 자산 수정
  - `DELETE /api/graphic-assets/:id`: 그래픽 자산 삭제
  - `POST /api/graphic-assets/delete`: 그래픽 자산 배치 삭제
  - `POST /presets/:id/access`: 프리셋 접근 기록

- **프리셋 저장/로드 개선**
  - 프리셋 저장 시 패드 이미지(`graphicAssetId`) 및 색상(`color`) 포함
  - 프리셋 로드 시 `GraphicAsset` 정보 포함하여 패드 이미지 복원
  - 프리셋 로드 시 자동으로 접근 기록 생성

---

**문서 버전**: 1.1  
**최종 업데이트**: 2024  
**작성자**: Web-DAW Development Team
