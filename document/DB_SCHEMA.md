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
  google_id varchar(255) [unique, null]
  email varchar(255) [unique, not null]
  display_name varchar(255) [not null]
  created_at datetime [default: `CURRENT_TIMESTAMP`, not null]
  updated_at datetime [default: `CURRENT_TIMESTAMP`, not null, note: 'ON UPDATE CURRENT_TIMESTAMP']
  
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
  user_id int [not null]
  file_name varchar(255) [unique, not null, note: '서버에 저장된 파일명 (랜덤 생성, 중복 방지)']
  original_name varchar(255) [not null, note: '사용자가 올린 원래 파일명']
  file_path varchar(500) [not null, note: "파일 저장 경로 또는 URL (예: '/uploads/xxx.mp3')"]
  mimetype varchar(100) [null, note: "파일 MIME 타입 (예: 'audio/mpeg', 'audio/wav')"]
  file_size bigint [null, note: '파일 크기 (단위: 바이트)']
  is_recorded boolean [default: false, not null, note: '마이크 녹음 여부 (TRUE: 녹음 파일, FALSE: 업로드 파일)']
  created_at datetime [default: `CURRENT_TIMESTAMP`, not null]
  updated_at datetime [default: `CURRENT_TIMESTAMP`, not null, note: 'ON UPDATE CURRENT_TIMESTAMP']
  
  Note: '사용자가 업로드한 파일이나 웹 마이크로 녹음한 파일의 정보를 관리'
  
  Indexes {
    user_id
    file_name [unique]
    created_at
  }
}

// ============================================
// 프로젝트 및 패드 설정 테이블
// ============================================

Table Projects {
  id int [pk, increment, not null]
  user_id int [not null]
  title varchar(255) [default: 'Untitled', not null, note: '프로젝트 제목']
  bpm int [default: 120, not null, note: '프로젝트 템포 (60 ~ 200)']
  master_volume float [default: 0.7, not null, note: '전체 마스터 볼륨 (0.0 ~ 1.0)']
  is_quantized boolean [default: true, not null, note: '퀀타이즈 활성화 여부']
  created_at datetime [default: `CURRENT_TIMESTAMP`, not null]
  updated_at datetime [default: `CURRENT_TIMESTAMP`, not null, note: 'ON UPDATE CURRENT_TIMESTAMP']
  
  Note: '프로젝트마다 반영되는 런치패드의 전역 설정을 저장합니다. (기존 Presets 테이블과 동일한 역할)'
  
  Indexes {
    user_id
    updated_at
    (bpm) [note: 'CHECK: 60 <= bpm <= 200']
    (master_volume) [note: 'CHECK: 0.0 <= master_volume <= 1.0']
  }
}

Table ButtonSettings {
  id int [pk, increment, not null]
  project_id int [not null]
  pad_index int [not null, note: '0~15번 패드 번호 (프로젝트 내 유일)']
  mode enum('SAMPLE', 'SYNTH') [not null, note: "패드 모드: 'SAMPLE' (유저 음원 파일) 또는 'SYNTH' (자체 생성)"]
  volume float [default: 0.7, not null, note: '패드별 개별 볼륨 (0.0 ~ 1.0)']
  asset_id int [null, note: "mode='SAMPLE'일 경우, 음원 에셋 id"]
  synth_settings json [null, note: "mode='SYNTH'일 경우, Tone.js 연동되는 신스 파라미터 묶음"]
  created_at datetime [default: `CURRENT_TIMESTAMP`, not null]
  updated_at datetime [default: `CURRENT_TIMESTAMP`, not null, note: 'ON UPDATE CURRENT_TIMESTAMP']
  
  Note: '하나의 프로젝트는 16개의 패드 설정을 가집니다. 각 패드는 샘플 모드 또는 신스 모드로 동작합니다.'
  
  Indexes {
    project_id
    (project_id, pad_index) [unique, note: '한 프로젝트 내에서 패드 번호는 유일']
    (pad_index) [note: 'CHECK: 0 <= pad_index <= 15']
    (volume) [note: 'CHECK: 0.0 <= volume <= 1.0']
  }
}

// ============================================
// 게시판 및 공유 테이블
// ============================================

Table Posts {
  id int [pk, increment, not null]
  user_id int [not null]
  project_id int [unique, not null, note: '공유 대상 프로젝트 (1:1 관계)']
  title varchar(255) [not null, note: '게시글 제목']
  description text [null, note: '프로젝트 설명 또는 사용법']
  like_count int [default: 0, not null, note: '좋아요 수 (인기 순 정렬용)']
  download_count int [default: 0, not null, note: '본인 프로젝트로 가져간 횟수']
  is_published boolean [default: true, not null, note: '공개 여부']
  created_at datetime [default: `CURRENT_TIMESTAMP`, not null]
  updated_at datetime [default: `CURRENT_TIMESTAMP`, not null, note: 'ON UPDATE CURRENT_TIMESTAMP']
  
  Note: '프로젝트를 게시판에 업로드할 때 생성되는 데이터'
  
  Indexes {
    user_id
    project_id [unique]
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
// 1:N 관계 - 사용자 삭제 시 에셋도 삭제
Ref: Users.id < Assets.user_id [delete: cascade]
// 1:N 관계 - 사용자 삭제 시 프로젝트도 삭제
Ref: Users.id < Projects.user_id [delete: cascade]
// 1:N 관계 - 사용자 삭제 시 게시글도 삭제
Ref: Users.id < Posts.user_id [delete: cascade]

// Projects 관계
// 1:N 관계 - 프로젝트 삭제 시 패드 설정도 삭제
Ref: Projects.id < ButtonSettings.project_id [delete: cascade]
// 1:1 관계 - 프로젝트 삭제 시 게시글도 삭제 또는 제한
Ref: Projects.id - Posts.project_id [delete: restrict]

// Assets 관계
// N:0..1 관계 - 에셋 삭제 시 패드 설정의 asset_id만 NULL 처리
Ref: Assets.id - ButtonSettings.asset_id [delete: set null]

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
Users (1) ──< (N) Projects
Users (1) ──< (N) Assets
Users (1) ──< (N) Posts
Users (1) ──< (1) UserPreferences

Projects (1) ──< (N) ButtonSettings
Projects (1) ──< (1) Posts

Assets (1) ──< (0..N) ButtonSettings
```

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
   - `ButtonSettings.mode`: 'SAMPLE' 또는 'SYNTH'만 허용

4. **JSON 필드**:
   - `ButtonSettings.synth_settings`: Tone.js 신스 파라미터를 JSON 형식으로 저장
   - 예시 구조는 PROJECT_SPEC.md의 ButtonSettings 섹션 참조

5. **MySQL 특성**:
   - Docker Compose를 통해 MySQL 8.0 컨테이너로 실행 가능
   - 로컬 설치 시 별도의 MySQL 서버 필요
   - Docker 환경: `mysql` 서비스 이름으로 접근, 로컬 환경: `127.0.0.1:3306`
   - Sequelize를 통해 자동으로 테이블 생성 및 마이그레이션 관리
   - `docker-compose.yml`에서 MySQL 초기화 설정 포함