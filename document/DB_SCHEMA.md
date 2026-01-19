# 데이터베이스 스키마 (Database Schema)

이 문서는 Web-DAW 프로젝트의 데이터베이스 스키마를 Database Markup Language (DBML) 형식으로 표현합니다.

DBML은 [dbdiagram.io](https://dbdiagram.io) 또는 [dbml-cli](https://www.dbml.org/cli/)와 같은 도구를 사용하여 시각적인 ERD 다이어그램으로 변환할 수 있습니다.

---

## DBML 스키마

```dbml
Project WebDAW {
  database_type: 'MySQL'
  Note: 'Web-DAW 프로젝트 데이터베이스 스키마\nYEEZY LOOP STATION - 웹 기반 디지털 오디오 워크스테이션\nMySQL 8.0 사용 (Docker 컨테이너 또는 로컬 설치)'
}

// ============================================
// 사용자 및 인증 관련 테이블
// ============================================

Table Users {
  id int [pk, increment, not null]
  google_id varchar(255) [unique, null, note: 'Google OAuth 고유 식별자 (Sequelize: googleId)']
  email varchar(255) [unique, not null]
  nickname varchar(255) [not null, note: '서비스 내 표시될 이름 (Sequelize: nickname)']
  sns_id varchar(255) [null, note: 'SNS ID (레거시 또는 대체 지원, Sequelize: snsId)']
  created_at datetime [default: `CURRENT_TIMESTAMP`, not null, note: 'Sequelize: createdAt']
  updated_at datetime [default: `CURRENT_TIMESTAMP`, not null, note: 'ON UPDATE CURRENT_TIMESTAMP, Sequelize: updatedAt']
  
  Note: 'Google OAuth를 통해 가입한 사용자 정보를 저장하는 테이블'
  Indexes {
    google_id [unique]
    email [unique]
  }
}

Table UserPreferences {
  id int [pk, increment, not null]
  user_id int [unique, not null]
  latency_ms int [default: 100, not null, note: '오디오 출력 레이턴시 설정 (단위: 밀리초)']
  visualizer_mode varchar(50) [null, note: "사운드 비주얼라이저 디자인 타입 (예: 'waveform', 'spectrum', 'bars')"]
  default_master_volume float [default: 0.7, not null, note: '앱 시작 시 기본 마스터 볼륨 (0.0 ~ 1.0)']
  created_at datetime [default: `CURRENT_TIMESTAMP`, not null]
  updated_at datetime [default: `CURRENT_TIMESTAMP`, not null, note: 'ON UPDATE CURRENT_TIMESTAMP']
  
  Note: '특정 프로젝트에 귀속되지 않고, 유저가 로그인했을 때 앱 전체에 적용되는 설정을 저장'
  
  Indexes {
    user_id [unique]
    (latency_ms) [note: 'CHECK: latency_ms >= 0']
    (default_master_volume) [note: 'CHECK: 0.0 <= default_master_volume <= 1.0']
  }
}

// ============================================
// 에셋 관리 테이블
// ============================================

Table Assets {
  id int [pk, increment, not null]
  user_id int [null, note: '소유자 외래키 (게스트 업로드 시 NULL 허용, Sequelize: userId)']
  filename varchar(255) [unique, not null, note: '서버에 저장된 파일명 (랜덤 생성, 중복 방지, Sequelize: filename)']
  original_name varchar(255) [not null, note: '사용자가 올린 원래 파일명 (Sequelize: originalName)']
  file_path varchar(500) [not null, note: "파일 저장 경로 또는 URL (예: '/uploads/xxx.mp3', Sequelize: filePath)"]
  mimetype varchar(100) [null, note: "파일 MIME 타입 (예: 'audio/mpeg', 'audio/wav')"]
  is_recorded boolean [default: false, not null, note: '마이크 녹음 여부 (TRUE: 녹음 파일, FALSE: 업로드 파일, Sequelize: isRecorded)']
  created_at datetime [default: `CURRENT_TIMESTAMP`, not null, note: 'Sequelize: createdAt']
  updated_at datetime [default: `CURRENT_TIMESTAMP`, not null, note: 'ON UPDATE CURRENT_TIMESTAMP, Sequelize: updatedAt']
  
  Note: '사용자가 업로드한 파일이나 웹 마이크로 녹음한 파일의 정보를 관리\n\n향후 확장 필드 (선택적):\n- file_size (BIGINT): 파일 크기 (단위: 바이트)'
  
  Indexes {
    user_id
    filename [unique]
    created_at
  }
}

// ============================================
// 프리셋 및 패드 설정 테이블
// ============================================

Table Presets {
  id int [pk, increment, not null]
  user_id int [not null, note: '소유자 외래키 (Sequelize: userId)']
  title varchar(255) [default: 'Untitled', not null, note: '프리셋 제목']
  bpm int [default: 120, not null, note: '프로젝트 템포 (Beats Per Minute)']
  master_volume float [default: 0.7, not null, note: '전체 마스터 볼륨 (0.0 ~ 1.0, Sequelize: masterVolume)']
  is_quantized boolean [default: true, not null, note: '퀀타이즈 활성화 여부 (Sequelize: isQuantized)']
  created_at datetime [default: `CURRENT_TIMESTAMP`, not null, note: 'Sequelize: createdAt']
  updated_at datetime [default: `CURRENT_TIMESTAMP`, not null, note: 'ON UPDATE CURRENT_TIMESTAMP, Sequelize: updatedAt']
  
  Note: '프리셋마다 반영되는 런치패드의 전역 설정을 저장합니다.'
  
  Indexes {
    user_id
    updated_at
    (bpm) [note: 'CHECK: 60 <= bpm <= 200 (권장)']
    (master_volume) [note: 'CHECK: 0.0 <= master_volume <= 1.0']
  }
}

Table KeyMappings {
  id int [pk, increment, not null]
  preset_id int [not null, note: '소속 프리셋 외래키 (Sequelize: presetId)']
  key_char varchar(255) [not null, note: "키 문자 ('Z', '0' 등, 패드 ID로도 사용, Sequelize: keyChar)"]
  mode enum('one-shot', 'gate', 'toggle') [not null, default: 'one-shot', note: "패드 동작 모드: 'one-shot' (원샷), 'gate' (게이트), 'toggle' (토글)"]
  volume float [default: 0, not null, note: '패드별 개별 볼륨 (0.0 ~ 1.0)']
  type varchar(50) [default: 'sample', note: "패드 타입: 'sample' (샘플 파일) 또는 'synth' (신서사이저, Sequelize: type)"]
  note varchar(10) [null, note: "노트 (예: 'C4', Sequelize: note)"]
  asset_id int [null, note: '연결된 에셋 외래키 (type=sample일 경우, Sequelize: assetId)']
  synth_settings json [null, note: "Tone.js 신서사이저 파라미터 (type=synth일 때 사용, Sequelize: synthSettings)"]
  created_at datetime [default: `CURRENT_TIMESTAMP`, not null, note: 'Sequelize: createdAt']
  updated_at datetime [default: `CURRENT_TIMESTAMP`, not null, note: 'ON UPDATE CURRENT_TIMESTAMP, Sequelize: updatedAt']
  
  Note: '하나의 프리셋은 여러 개의 키 매핑을 가집니다. 각 키 매핑은 패드 ID를 나타내는 keyChar와 설정을 포함합니다.\n\nsynth_settings JSON 예시:\n{ "oscillator": { "type": "sine" }, "envelope": { "attack": 0.1, "decay": 0.2, "sustain": 0.5, "release": 1 } }'
  
  Indexes {
    preset_id
    asset_id
    (preset_id, key_char) [note: '프리셋 내 키 문자 인덱스 (유일성 보장 필요시 추가)']
    (volume) [note: 'CHECK: 0.0 <= volume <= 1.0']
  }
}

// ============================================
// 게시판 및 공유 테이블
// ============================================

Table Posts {
  id int [pk, increment, not null]
  user_id int [not null, note: '작성자 외래키 (Sequelize: userId)']
  preset_id int [unique, not null, note: '공유 대상 프리셋 (1:1 관계, Sequelize: presetId)']
  title varchar(255) [not null, note: '게시글 제목']
  description text [null, note: '프로젝트 설명 또는 사용법']
  like_count int [default: 0, not null, note: '좋아요 수 (인기 순 정렬용)']
  download_count int [default: 0, not null, note: '본인 프로젝트로 가져간 횟수']
  is_published boolean [default: true, not null, note: '공개 여부']
  created_at datetime [default: `CURRENT_TIMESTAMP`, not null, note: 'Sequelize: createdAt']
  updated_at datetime [default: `CURRENT_TIMESTAMP`, not null, note: 'ON UPDATE CURRENT_TIMESTAMP, Sequelize: updatedAt']
  
  Note: '프리셋을 게시판에 업로드할 때 생성되는 데이터\n\n참고: 현재 코드베이스에는 이 모델이 구현되어 있지 않습니다 (향후 기능)'
  
  Indexes {
    user_id
    preset_id [unique]
    like_count
    created_at
    is_published
    (like_count) [note: 'CHECK: like_count >= 0']
    (download_count) [note: 'CHECK: download_count >= 0']
  }
}

// ============================================
// 관계 정의 (Relationships)
// ============================================

// User 관계
// 1:1 관계 - 사용자 삭제 시 설정도 삭제
Ref: Users.id < UserPreferences.user_id [delete: cascade]
// 1:N 관계 - 사용자 삭제 시 에셋도 삭제 (nullable이므로 CASCADE 주의)
Ref: Users.id < Assets.user_id [delete: cascade]
// 1:N 관계 - 사용자 삭제 시 프리셋도 삭제
Ref: Users.id < Presets.user_id [delete: cascade]
// 1:N 관계 - 사용자 삭제 시 게시글도 삭제
Ref: Users.id < Posts.user_id [delete: cascade]

// Presets 관계
// 1:N 관계 - 프리셋 삭제 시 키 매핑도 삭제
Ref: Presets.id < KeyMappings.preset_id [delete: cascade]
// 1:1 관계 - 프리셋 삭제 시 게시글도 삭제 또는 제한
Ref: Presets.id - Posts.preset_id [delete: restrict]

// Assets 관계
// N:0..1 관계 - 에셋 삭제 시 키 매핑의 asset_id만 NULL 처리
Ref: Assets.id - KeyMappings.asset_id [delete: set null]

```

---

## 사용 방법

### 1. dbdiagram.io에서 시각화

1. [dbdiagram.io](https://dbdiagram.io) 접속
2. 위의 DBML 코드를 복사하여 붙여넣기
3. 자동으로 ERD 다이어그램 생성

### 2. dbml-cli로 SQL 변환

```bash
# dbml-cli 설치
npm install -g @dbml/cli

# DBML을 MySQL SQL로 변환
dbml2sql DB_SCHEMA.md --mysql -o schema.sql
```

### 3. 주요 특징

- **관계 타입**:
  - `>` : one-to-many (부모에서 자식으로)
  - `-` : one-to-one
  - `<` : many-to-one (자식에서 부모로)

- **제약조건**:
  - `pk`: Primary Key
  - `increment`: AUTO_INCREMENT
  - `unique`: UNIQUE 제약조건
  - `not null`: NOT NULL 제약조건
  - `default`: 기본값
  - `ref`: Foreign Key 관계

- **인덱스**:
  - 단일 컬럼 인덱스
  - 복합 인덱스 (UNIQUE 포함)
  - CHECK 제약조건 주석

---

## 관계 요약

```
Users (1) ──< (N) Presets
Users (1) ──< (N) Assets
Users (1) ──< (N) Posts
Users (1) ──< (1) UserPreferences

Presets (1) ──< (N) KeyMappings
Presets (1) ──< (1) Posts

Assets (1) ──< (0..N) KeyMappings
```

**주의사항**:
- `Presets`는 코드베이스에서 `Preset` 모델로 구현됨 (테이블명: `Presets`)
- `KeyMappings`는 코드베이스에서 `KeyMapping` 모델로 구현됨 (테이블명: `KeyMappings`)
- Sequelize는 자동으로 camelCase 필드명을 snake_case로 변환하여 DB에 저장

---

## 참고사항

1. **MySQL 타입 매핑**:
   - `int`: INTEGER
   - `varchar(n)`: VARCHAR(n)
   - `datetime`: DATETIME
   - `boolean`: TINYINT(1) 또는 BOOLEAN
   - `float`: FLOAT
   - `text`: TEXT
   - `json`: JSON (MySQL 5.7+)

2. **CASCADE 옵션**:
   - `delete: cascade`: 부모 레코드 삭제 시 자식 레코드도 삭제
   - `delete: restrict`: 부모 레코드가 참조되고 있으면 삭제 불가
   - `delete: set null`: 부모 레코드 삭제 시 외래키를 NULL로 설정

3. **ENUM 타입**:
   - `KeyMappings.mode`: 'one-shot', 'gate', 'toggle' 중 하나
   - 현재 코드에서 사용되는 값은 'one-shot', 'gate', 'toggle'입니다
   - 향후 'SAMPLE'/'SYNTH'로 확장 가능 (현재는 `type` 필드로 구분)

4. **필드명 매핑**:
   - Sequelize는 camelCase 필드명을 snake_case로 자동 변환
   - 예: `presetId` → `preset_id`, `keyChar` → `key_char`, `userId` → `user_id`
   - DBML에서는 실제 DB 컬럼명(snake_case)으로 정의하며, Sequelize 필드명(camelCase)을 주석으로 표시

5. **JSON 필드**:
   - `KeyMappings.synth_settings`: Tone.js 신서사이저 파라미터를 JSON 형식으로 저장 (Phase 4에서 추가 완료)
   - 예시 구조는 PROJECT_SPEC.md의 KeyMappings 섹션 참조

6. **MySQL 특성**:
   - Docker Compose를 통해 MySQL 8.0 컨테이너로 실행 가능
   - 로컬 설치 시 별도의 MySQL 서버 필요
   - Docker 환경: `mysql` 서비스 이름으로 접근, 로컬 환경: `127.0.0.1:3306`
   - Sequelize를 통해 자동으로 테이블 생성 및 마이그레이션 관리
   - `docker-compose.yml`에서 MySQL 초기화 설정 포함

7. **현재 코드베이스와의 차이점**:
   - 이 스키마는 **현재 구현된 코드를 기준으로 작성**되었습니다
   - `Presets`, `KeyMappings` 테이블명 사용 (코드 기준)
   - 향후 확장을 위한 필드(`master_volume`, `is_quantized`, `synth_settings` 등)는 주석으로 표시
   - `UserPreferences`, `Posts` 테이블은 아직 코드에 구현되지 않았으나 스키마에는 포함 (향후 구현 예정)