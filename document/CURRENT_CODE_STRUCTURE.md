# 현재 코드베이스 구조 분석 문서

Phase 1: 코드베이스 구조 완전 파악 결과 보고서

**생성일**: 2024-01-XX  
**업데이트**: Phase 4 완료 및 UserPreferences/Posts 구현 완료 후 최신 상태 반영

**참고**: 이 문서는 스키마 리팩토링 전 단계(Phase 1)의 분석 결과입니다.  
Phase 4에서 추가된 필드 정보는 아래 "Phase 4 업데이트" 섹션 또는 `document/legacy/PHASE4_COMPLETION_SUMMARY.md`를 참조하세요.  
UserPreferences와 Posts 모델은 최근 구현 완료되었습니다.

---

## 📋 목차

1. [모델 구조 분석](#1-모델-구조-분석)
2. [API 라우트 분석](#2-api-라우트-분석)
3. [프론트엔드 코드 분석](#3-프론트엔드-코드-분석)
4. [필드 매핑 정리](#4-필드-매핑-정리)
5. [관계 및 참조](#5-관계-및-참조)
6. [API 요청/응답 구조](#6-api-요청응답-구조)

---

## 1. 모델 구조 분석

### 1.1 Preset 모델 (`server/models/preset.js`)

**테이블명**: `Presets`

**필드**:
| 필드명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `id` | INTEGER | PK, AUTO_INCREMENT | - | 기본키 (Sequelize 자동) |
| `title` | STRING | NOT NULL | - | 프리셋 제목 |
| `bpm` | INTEGER | - | `120` | 템포 (Beats Per Minute) |
| `masterVolume` | FLOAT | NOT NULL | `0.7` | 전체 마스터 볼륨 (0.0 ~ 1.0, Phase 4 추가) |
| `isQuantized` | BOOLEAN | NOT NULL | `true` | 퀀타이즈 활성화 여부 (Phase 4 추가) |
| `userId` | INTEGER | FK (Users.id) | - | 소유자 (외래키) |
| `createdAt` | DATETIME | - | 현재 시간 | 생성일시 (Sequelize 자동) |
| `updatedAt` | DATETIME | - | 현재 시간 | 수정일시 (Sequelize 자동) |

**관계**:
- `belongsTo` User (foreignKey: `userId`)
- `hasMany` KeyMapping (foreignKey: `presetId`)
- `hasOne` Post (foreignKey: `presetId`, onDelete: 'RESTRICT')

**코드 예시**:
```javascript
const Preset = sequelize.define('Preset', {
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    bpm: {
        type: DataTypes.INTEGER,
        defaultValue: 120
    },
    settings: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '프리셋별 전역 설정 (믹서 레벨, 이펙트, 퀀타이즈, 테마 등)'
    },
    masterVolume: {
        type: DataTypes.FLOAT,
        defaultValue: 0.7,
        allowNull: false
    },
    isQuantized: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    }
}, {
    tableName: 'Presets',
    underscored: true
});

Preset.associate = function (models) {
    Preset.belongsTo(models.User, { foreignKey: 'userId' });
    Preset.hasMany(models.KeyMapping, { foreignKey: 'presetId' });
    Preset.hasOne(models.Post, { 
        foreignKey: 'presetId',
        onDelete: 'RESTRICT'
    });
};
```

---

### 1.2 KeyMapping 모델 (`server/models/keyMapping.js`)

**테이블명**: `KeyMappings`

**필드**:
| 필드명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `id` | INTEGER | PK, AUTO_INCREMENT | - | 기본키 (Sequelize 자동) |
| `keyChar` | STRING | NOT NULL | - | 키 문자 ('Z', '0' 등, 패드 ID로도 사용) |
| `mode` | ENUM | - | `'one-shot'` | 동작 모드: `'one-shot'`, `'gate'`, `'toggle'` |
| `volume` | FLOAT | - | `0` | 볼륨 (0.0 ~ 1.0) |
| `type` | STRING | - | `'sample'` | 타입: `'sample'` 또는 `'synth'` |
| `note` | STRING | NULL 허용 | - | 노트 (예: 'C4') |
| `synthSettings` | JSON | NULL 허용 | - | Tone.js 신서사이저 파라미터 (Phase 4 추가) |
| `presetId` | INTEGER | FK (Presets.id) | - | 소속 프리셋 (외래키) |
| `assetId` | INTEGER | FK (Assets.id), NULL 허용 | - | 연결된 에셋 ID (외래키, 선택적) |
| `createdAt` | DATETIME | - | 현재 시간 | 생성일시 (Sequelize 자동) |
| `updatedAt` | DATETIME | - | 현재 시간 | 수정일시 (Sequelize 자동) |

**관계**:
- `belongsTo` Preset (foreignKey: `presetId`)
- `belongsTo` Asset (foreignKey: `assetId`)

**코드 예시**:
```javascript
const KeyMapping = sequelize.define('KeyMapping', {
    keyChar: {
        type: DataTypes.STRING,
        allowNull: false
    },
    mode: {
        type: DataTypes.ENUM('one-shot', 'gate', 'toggle'),
        defaultValue: 'one-shot'
    },
    volume: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    type: {
        type: DataTypes.STRING,
        defaultValue: 'sample' // 'sample' or 'synth'
    },
    note: {
        type: DataTypes.STRING,
        allowNull: true // e.g., 'C4'
    }
}, {
    tableName: 'KeyMappings',
    underscored: true
});
```

---

### 1.3 User 모델 (`server/models/user.js`)

**테이블명**: `Users`

**필드**:
| 필드명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `id` | INTEGER | PK, AUTO_INCREMENT | - | 기본키 (Sequelize 자동) |
| `email` | STRING | NOT NULL, UNIQUE | - | 이메일 주소 |
| `nickname` | STRING | NOT NULL | - | 닉네임 (표시 이름) |
| `googleId` | STRING | NULL 허용 | - | Google OAuth ID |
| `snsId` | STRING | NULL 허용 | - | SNS ID (레거시 또는 대체 지원) |
| `createdAt` | DATETIME | - | 현재 시간 | 생성일시 (Sequelize 자동) |
| `updatedAt` | DATETIME | - | 현재 시간 | 수정일시 (Sequelize 자동) |

**관계**:
- `hasMany` Preset (foreignKey: `userId`)
- `hasMany` Asset (foreignKey: `userId`)
- `hasOne` UserPreference (foreignKey: `userId`, onDelete: 'CASCADE')
- `hasMany` Post (foreignKey: `userId`, onDelete: 'CASCADE')

**코드 예시**:
```javascript
const User = sequelize.define('User', {
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    nickname: {
        type: DataTypes.STRING,
        allowNull: false
    },
    googleId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    snsId: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'Users',
    underscored: true
});
```

---

### 1.4 Asset 모델 (`server/models/asset.js`)

**테이블명**: `Assets`

**필드**:
| 필드명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `id` | INTEGER | PK, AUTO_INCREMENT | - | 기본키 (Sequelize 자동) |
| `originalName` | STRING | NOT NULL | - | 원본 파일명 (사용자가 업로드한 이름) |
| `filename` | STRING | NOT NULL | - | 저장된 파일명 (랜덤 생성) |
| `filePath` | STRING | NOT NULL | - | 파일 저장 경로 |
| `mimetype` | STRING | NULL 허용 | - | MIME 타입 (예: 'audio/mpeg') |
| `isRecorded` | BOOLEAN | NOT NULL | `false` | 마이크 녹음 여부 (Phase 4 추가) |
| `category` | ENUM | NOT NULL | `'sample'` | 파일 카테고리 ('sample', 'synth', 'instrument') |
| `userId` | INTEGER | FK (Users.id), NULL 허용 | - | 소유자 (외래키, 게스트 업로드 시 NULL) |
| `createdAt` | DATETIME | - | 현재 시간 | 생성일시 (Sequelize 자동) |
| `updatedAt` | DATETIME | - | 현재 시간 | 수정일시 (Sequelize 자동) |

**관계**:
- `belongsTo` User (foreignKey: `userId`)
- `hasMany` KeyMapping (foreignKey: `assetId`)

**코드 예시**:
```javascript
const Asset = sequelize.define('Asset', {
    originalName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    filename: {
        type: DataTypes.STRING,
        allowNull: false
    },
    filePath: {
        type: DataTypes.STRING,
        allowNull: false
    },
    mimetype: {
        type: DataTypes.STRING
    },
    isRecorded: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    category: {
        type: DataTypes.ENUM('sample', 'synth', 'instrument'),
        defaultValue: 'sample',
        allowNull: false
    }
}, {
    tableName: 'Assets',
    underscored: true
});
```

---

### 1.5 UserPreference 모델 (`server/models/userPreference.js`)

**테이블명**: `UserPreferences`

**필드**:
| 필드명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `id` | INTEGER | PK, AUTO_INCREMENT | - | 기본키 (Sequelize 자동) |
| `userId` | INTEGER | FK (Users.id), UNIQUE, NOT NULL | - | 사용자 ID (외래키, 1:1 관계) |
| `latencyMs` | INTEGER | NOT NULL | `100` | 오디오 출력 레이턴시 (밀리초) |
| `visualizerMode` | STRING(50) | NULL 허용 | - | 비주얼라이저 모드 ('waveform', 'spectrum', 'bars' 등) |
| `defaultMasterVolume` | FLOAT | NOT NULL | `0.7` | 기본 마스터 볼륨 (0.0 ~ 1.0) |
| `createdAt` | DATETIME | - | 현재 시간 | 생성일시 (Sequelize 자동) |
| `updatedAt` | DATETIME | - | 현재 시간 | 수정일시 (Sequelize 자동) |

**관계**:
- `belongsTo` User (foreignKey: `userId`, onDelete: 'CASCADE')

**코드 예시**:
```javascript
const UserPreference = sequelize.define('UserPreference', {
    latencyMs: {
        type: DataTypes.INTEGER,
        defaultValue: 100,
        allowNull: false
    },
    visualizerMode: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    defaultMasterVolume: {
        type: DataTypes.FLOAT,
        defaultValue: 0.7,
        allowNull: false
    }
}, {
    tableName: 'UserPreferences',
    underscored: true
});
```

---

### 1.6 Post 모델 (`server/models/post.js`)

**테이블명**: `Posts`

**필드**:
| 필드명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `id` | INTEGER | PK, AUTO_INCREMENT | - | 기본키 (Sequelize 자동) |
| `userId` | INTEGER | FK (Users.id), NOT NULL | - | 작성자 ID (외래키) |
| `presetId` | INTEGER | FK (Presets.id), UNIQUE, NOT NULL | - | 공유 대상 프리셋 ID (외래키, 1:1 관계) |
| `title` | STRING | NOT NULL | - | 게시글 제목 |
| `description` | TEXT | NULL 허용 | - | 게시글 설명 |
| `likeCount` | INTEGER | NOT NULL | `0` | 좋아요 수 |
| `downloadCount` | INTEGER | NOT NULL | `0` | 다운로드 수 |
| `isPublished` | BOOLEAN | NOT NULL | `true` | 공개 여부 |
| `createdAt` | DATETIME | - | 현재 시간 | 생성일시 (Sequelize 자동) |
| `updatedAt` | DATETIME | - | 현재 시간 | 수정일시 (Sequelize 자동) |

**관계**:
- `belongsTo` User (foreignKey: `userId`, onDelete: 'CASCADE')
- `belongsTo` Preset (foreignKey: `presetId`, onDelete: 'RESTRICT')

**코드 예시**:
```javascript
const Post = sequelize.define('Post', {
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    likeCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    downloadCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    isPublished: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    }
}, {
    tableName: 'Posts',
    underscored: true
});
```

---

## 2. API 라우트 분석

### 2.1 Presets API (`server/routes/presets.js`)

**기본 경로**: `/presets`

#### GET `/presets`
- **인증**: 필요 (`isAuthenticated` 미들웨어)
- **기능**: 현재 사용자의 모든 프리셋 목록 조회
- **응답**:
  ```json
  [
    {
      "id": 1,
      "title": "My Preset",
      "bpm": 120,
      "userId": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
  ```

#### GET `/presets/:id`
- **인증**: 필요
- **기능**: 특정 프리셋의 상세 정보 및 키 매핑 조회
- **응답**:
  ```json
  {
    "id": 1,
    "title": "My Preset",
    "bpm": 120,
    "userId": 1,
    "KeyMappings": [
      {
        "id": 1,
        "keyChar": "0",
        "mode": "one-shot",
        "volume": 0.7,
        "type": "sample",
        "note": null,
        "presetId": 1,
        "assetId": 1,
        "Asset": {
          "id": 1,
          "originalName": "kick.mp3",
          "filename": "1234567890-kick.mp3",
          "filePath": "/uploads/1234567890-kick.mp3",
          "mimetype": "audio/mpeg"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
  ```

#### POST `/presets`
- **인증**: 필요
- **기능**: 새 프리셋 생성 및 키 매핑 저장
- **요청 본문**:
  ```json
  {
    "title": "New Preset",
    "bpm": 120,
    "settings": {
      "mixerLevels": {},
      "trackStates": {},
      "effects": {},
      "launchQuantization": "none",
      "currentThemeId": "cosmic",
      "customBackgroundImage": null
    },
    "masterVolume": 0.7,
    "isQuantized": true,
    "mappings": [
      {
        "keyChar": "0",
        "mode": "one-shot",
        "volume": 0.7,
        "type": "sample",
        "note": null,
        "assetId": 1,
        "synthSettings": null
      }
    ]
  }
  ```
- **응답**: 생성된 프리셋 객체

**트랜잭션**: 프리셋 생성과 키 매핑 저장을 하나의 트랜잭션으로 처리

---

### 2.2 Upload API (`server/routes/upload.js`)

**기본 경로**: `/upload`

#### GET `/upload`
- **인증**: 불필요 (향후 인증 추가 가능)
- **기능**: 모든 에셋 목록 조회 (카테고리 필터링 가능)
- **Query Parameters**: `category` (선택사항: 'sample', 'synth', 'instrument')
- **응답**: Asset 배열 (최신순 정렬)

#### POST `/upload`
- **인증**: 선택적 (게스트 업로드 허용 가능)
- **기능**: 파일 업로드
- **요청**: `multipart/form-data`, 필드명: `file`
- **요청 본문 필드**:
  - `file`: 업로드할 파일 (필수)
  - `isRecorded`: 'true' 또는 'false' (선택사항, 기본값: false)
  - `category`: 'sample', 'synth', 'instrument' (선택사항, 기본값: 'sample')
- **응답**:
  ```json
  {
    "message": "File uploaded successfully",
    "file": {
      "id": 1,
      "originalName": "kick.mp3",
      "filename": "1234567890-kick.mp3",
      "filePath": "/uploads/1234567890-kick.mp3",
      "mimetype": "audio/mpeg",
      "isRecorded": false,
      "category": "sample",
      "userId": 1
    }
  }
  ```

#### POST `/upload/delete`
- **인증**: 선택적
- **기능**: 여러 에셋 일괄 삭제
- **요청 본문**:
  ```json
  {
    "ids": [1, 2, 3]
  }
  ```
- **기능**: 파일 시스템에서 파일 삭제 + DB 레코드 삭제

#### PUT `/upload/rename`
- **인증**: 선택적
- **기능**: 에셋 파일명 변경 (originalName만 변경)
- **요청 본문**:
  ```json
  {
    "id": 1,
    "newName": "New Name.mp3"
  }
  ```

---

### 2.3 Auth API (`server/routes/auth.js`)

**기본 경로**: `/auth`

#### GET `/auth/google`
- **인증**: 불필요
- **기능**: Google OAuth 인증 시작

#### GET `/auth/google/callback`
- **인증**: 불필요 (OAuth 콜백)
- **기능**: Google OAuth 인증 완료 후 리다이렉트

#### GET `/auth/dev_login`
- **인증**: 불필요 (개발용)
- **기능**: 개발용 로그인 (Google OAuth 우회)
- **기능**: `googleId: 'dev_user_123'`인 사용자 생성/조회 후 로그인

#### GET `/auth/logout`
- **인증**: 필요
- **기능**: 로그아웃

#### GET `/auth/user`
- **인증**: 불필요 (세션 체크)
- **기능**: 현재 로그인된 사용자 정보 조회
- **응답** (인증된 경우):
  ```json
  {
    "id": 1,
    "email": "user@example.com",
    "nickname": "User Name",
    "googleId": "123456789",
    "snsId": null
  }
  ```
- **응답** (미인증): `401 Unauthorized`

---

## 3. 프론트엔드 코드 분석

### 3.1 API 클라이언트 (`client/src/api/presets.js`)

```javascript
export const getPresets = async () => {
    const response = await client.get('/presets');
    return response.data;
};

export const getPreset = async (id) => {
    const response = await client.get(`/presets/${id}`);
    return response.data;
};

export const savePreset = async (data) => {
    // data: { title, bpm, mappings }
    const response = await client.post('/presets', data);
    return response.data;
};
```

---

### 3.2 상태 관리 (`client/src/store/useStore.js`)

**Presets 관련 상태**:
```javascript
presets: [],           // 프리셋 목록 (현재 미사용)
setPresets: (presets) => set({ presets }),
```

**Pad Mappings 상태**:
```javascript
padMappings: Array(64).fill(null).map((_, index) => ({
    id: index,
    key: null,              // 키 문자
    file: null,             // 파일 경로
    mode: 'one-shot',       // 'one-shot' | 'gate' | 'toggle'
    volume: 0,
    type: 'sample',         // 'sample' | 'synth'
    note: 'C4',
    color: null,
    chokeGroup: null,
    assetId: null,          // 연결된 에셋 ID
    originalName: null      // 원본 파일명
}))
```

---

### 3.3 프리셋 로드 로직 (`client/src/App.jsx`)

**handleLoad 함수**:
```javascript
const handleLoad = async (e) => {
    const presetId = e.target.value;
    const preset = await getPreset(presetId);
    
    if (preset.KeyMappings) {
        preset.KeyMappings.forEach(mapping => {
            const padId = parseInt(mapping.keyChar); // keyChar를 패드 ID로 변환
            
            if (!isNaN(padId)) {
                let fileUrl = null;
                if (mapping.Asset) {
                    fileUrl = `http://localhost:3001/uploads/${mapping.Asset.filename}`;
                    sampler.loadSample(padId, fileUrl);
                }
                
                const newMapping = {
                    mode: mapping.mode,
                    volume: mapping.volume,
                    file: fileUrl,
                    assetId: mapping.Asset ? mapping.Asset.id : null,
                    originalName: mapping.Asset ? mapping.Asset.originalName : null
                };
                
                useStore.getState().updatePadMapping(padId, newMapping);
            }
        });
    }
};
```

**주요 패턴**:
- `preset.KeyMappings`: 배열 형태로 접근 (Sequelize include 결과)
- `mapping.keyChar`: 문자열을 `parseInt()`로 패드 ID로 변환
- `mapping.Asset`: include된 Asset 객체

---

### 3.4 프리셋 저장 로직 (`client/src/App.jsx`)

**handleSave 함수**:
```javascript
const handleSave = async () => {
    const title = prompt('Enter preset name:');
    
    const mappings = padMappings.map(p => ({
        keyChar: String(p.id),  // 패드 ID를 문자열로 변환
        mode: p.mode,
        volume: p.volume,
        assetId: p.assetId      // type 필드는 전송하지 않음
    }));
    
    await savePreset({ title, bpm, mappings });
};
```

**주요 패턴**:
- `keyChar: String(p.id)`: 패드 ID를 문자열로 변환하여 keyChar에 저장
- `type` 필드는 전송하지 않음 (백엔드에서 처리하지 않음)
- `note` 필드도 전송하지 않음

---

### 3.5 Asset 사용 패턴

**FileLibrary 컴포넌트** (`client/src/components/Audio/FileLibrary.jsx`):
- `asset.id`: 에셋 ID
- `asset.originalName`: 원본 파일명 (표시용)
- `asset.filename`: 저장된 파일명 (URL 생성용)
- `asset.createdAt`: 생성일시

**Pad 컴포넌트** (`client/src/components/Launchpad/Pad.jsx`):
- 드래그 앤 드롭으로 에셋 할당 시:
  ```javascript
  {
      type: 'asset',
      asset: {
          id: asset.id,
          originalName: asset.originalName,
          filename: asset.filename
      }
  }
  ```

---

## 4. 필드 매핑 정리

### 4.1 Presets 테이블

| 코드 필드명 | DB Schema 제안 필드명 | 타입 | 제약조건 | 비고 |
|-------------|----------------------|------|----------|------|
| `id` | `id` | INTEGER | PK, AUTO_INCREMENT | ✅ 일치 |
| `title` | `title` | VARCHAR(255) | NOT NULL | ✅ 일치 |
| `bpm` | `bpm` | INTEGER | DEFAULT 120 | ✅ 일치 |
| `userId` | `user_id` | INTEGER | FK | ✅ 일치 (Sequelize 자동 변환) |
| `createdAt` | `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | ✅ 일치 |
| `updatedAt` | `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | ✅ 일치 |

**DB Schema에 있지만 코드에 없는 필드**:
- `master_volume` (FLOAT, DEFAULT 0.7) - **추가 필요 여부 결정 필요**
- `is_quantized` (BOOLEAN, DEFAULT TRUE) - **추가 필요 여부 결정 필요**

---

### 4.2 KeyMappings 테이블

| 코드 필드명 | DB Schema 제안 필드명 | 타입 | 제약조건 | 비고 |
|-------------|----------------------|------|----------|------|
| `id` | `id` | INTEGER | PK, AUTO_INCREMENT | ✅ 일치 |
| `keyChar` | `key_char` | VARCHAR(255) | NOT NULL | ✅ 일치 (DB Schema: `pad_index` → 변경 필요) |
| `mode` | `mode` | ENUM | DEFAULT 'one-shot' | ⚠️ ENUM 값 다름: `'one-shot'/'gate'/'toggle'` vs `'SAMPLE'/'SYNTH'` |
| `volume` | `volume` | FLOAT | DEFAULT 0 | ✅ 일치 |
| `type` | `type` | VARCHAR(50) | DEFAULT 'sample' | ✅ 일치 (DB Schema에 없음 → 추가 필요) |
| `note` | `note` | VARCHAR(10) | NULL 허용 | ✅ 일치 (DB Schema에 없음 → 추가 필요) |
| `presetId` | `preset_id` | INTEGER | FK | ✅ 일치 (DB Schema: `project_id` → 변경 필요) |
| `assetId` | `asset_id` | INTEGER | FK, NULL 허용 | ✅ 일치 |
| `synthSettings` | `synth_settings` | JSON | NULL 허용 | ✅ **Phase 4에서 추가 완료** |
| `createdAt` | `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | ✅ 일치 |
| `updatedAt` | `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | ✅ 일치 |

**Phase 4 업데이트**:
- ✅ `synthSettings` (JSON) 필드 추가 완료
- ✅ `type`, `note` 필드는 코드에 존재하며 DB Schema에도 반영됨

---

### 4.3 Users 테이블

| 코드 필드명 | DB Schema 제안 필드명 | 타입 | 제약조건 | 비고 |
|-------------|----------------------|------|----------|------|
| `id` | `id` | INTEGER | PK, AUTO_INCREMENT | ✅ 일치 |
| `email` | `email` | VARCHAR(255) | NOT NULL, UNIQUE | ✅ 일치 |
| `nickname` | `nickname` | VARCHAR(255) | NOT NULL | ⚠️ DB Schema: `display_name` → 변경 필요 |
| `googleId` | `google_id` | VARCHAR(255) | NULL 허용, UNIQUE | ✅ 일치 (DB Schema에 있음) |
| `snsId` | `sns_id` | VARCHAR(255) | NULL 허용 | ✅ 일치 (DB Schema에 없음 → 추가 필요 또는 제거) |
| `createdAt` | `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | ✅ 일치 |
| `updatedAt` | `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | ✅ 일치 |

---

### 4.4 Assets 테이블

| 코드 필드명 | DB Schema 제안 필드명 | 타입 | 제약조건 | 비고 |
|-------------|----------------------|------|----------|------|
| `id` | `id` | INTEGER | PK, AUTO_INCREMENT | ✅ 일치 |
| `originalName` | `original_name` | VARCHAR(255) | NOT NULL | ✅ 일치 |
| `filename` | `file_name` | VARCHAR(255) | NOT NULL, UNIQUE | ✅ 일치 (DB Schema: `file_name` → 일치) |
| `filePath` | `file_path` | VARCHAR(500) | NOT NULL | ✅ 일치 |
| `mimetype` | `mimetype` | VARCHAR(100) | NULL 허용 | ✅ 일치 |
| `userId` | `user_id` | INTEGER | FK, NULL 허용 | ✅ 일치 |
| `isRecorded` | `is_recorded` | BOOLEAN | DEFAULT FALSE | ✅ **Phase 4에서 추가 완료** |
| `createdAt` | `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | ✅ 일치 |
| `updatedAt` | `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | ✅ 일치 |

**Phase 4 업데이트**:
- ✅ `isRecorded` (BOOLEAN, DEFAULT FALSE) 필드 추가 완료
- ⏳ `file_size` (BIGINT) - 향후 확장용 (선택적)

---

## 5. 관계 및 참조

### 5.1 현재 코드 관계

```
Users (1) ──< (N) Presets
Users (1) ──< (N) Assets
Presets (1) ──< (N) KeyMappings
Assets (1) ──< (0..N) KeyMappings
```

### 5.2 Sequelize 관계 정의

**Preset 모델**:
```javascript
Preset.associate = function (models) {
    Preset.belongsTo(models.User, { foreignKey: 'userId' });
    Preset.hasMany(models.KeyMapping, { foreignKey: 'presetId' });
};
```

**KeyMapping 모델**:
```javascript
KeyMapping.associate = function (models) {
    KeyMapping.belongsTo(models.Preset, { foreignKey: 'presetId' });
    KeyMapping.belongsTo(models.Asset, { foreignKey: 'assetId' });
};
```

**User 모델**:
```javascript
User.associate = function (models) {
    User.hasMany(models.Preset, { foreignKey: 'userId' });
    User.hasMany(models.Asset, { foreignKey: 'userId' });
};
```

**Asset 모델**:
```javascript
Asset.associate = function (models) {
    Asset.belongsTo(models.User, { foreignKey: 'userId' });
    Asset.hasMany(models.KeyMapping, { foreignKey: 'assetId' });
};
```

---

## 6. API 요청/응답 구조

### 6.1 Preset 저장 요청

**요청** (`POST /presets`):
```json
{
    "title": "My Preset",
    "bpm": 120,
    "mappings": [
        {
            "keyChar": "0",
            "mode": "one-shot",
            "volume": 0.7,
            "assetId": 1
        },
        {
            "keyChar": "1",
            "mode": "gate",
            "volume": 0.8,
            "assetId": 2
        }
    ]
}
```

**응답**:
```json
{
    "id": 1,
    "title": "My Preset",
    "bpm": 120,
    "userId": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 6.2 Preset 로드 응답

**요청** (`GET /presets/:id`):
- URL 파라미터: `id`

**응답**:
```json
{
    "id": 1,
    "title": "My Preset",
    "bpm": 120,
    "userId": 1,
    "KeyMappings": [
        {
            "id": 1,
            "keyChar": "0",
            "mode": "one-shot",
            "volume": 0.7,
            "type": "sample",
            "note": null,
            "presetId": 1,
            "assetId": 1,
            "Asset": {
                "id": 1,
                "originalName": "kick.mp3",
                "filename": "1234567890-kick.mp3",
                "filePath": "/uploads/1234567890-kick.mp3",
                "mimetype": "audio/mpeg",
                "userId": 1
            }
        }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**주요 특징**:
- `KeyMappings`는 배열로 응답 (Sequelize `hasMany` 관계)
- `Asset`은 각 KeyMapping 객체 내부에 포함 (Sequelize `include` 결과)
- 프론트엔드에서는 `preset.KeyMappings`로 접근

---

## 📊 요약

### ✅ 확인된 사항

1. **테이블명**: 코드는 `Presets`, `KeyMappings` 사용 (DB Schema는 `Projects`, `ButtonSettings`)
2. **필드명**: 대부분 camelCase 사용 (Sequelize 자동 변환)
3. **필수 필드**: 모든 모델에 기본 필드 존재

### ✅ Phase 4 완료 후 업데이트

**Phase 4에서 추가된 필드** (2024-01-XX):
1. ✅ **Presets**: `masterVolume`, `isQuantized` 필드 추가
2. ✅ **KeyMappings**: `synthSettings` (JSON) 필드 추가
3. ✅ **Assets**: `isRecorded` 필드 추가

### ✅ Conflict 해결 후 추가된 필드 (2024-01-XX)

**충돌 해결 과정에서 추가/통합된 필드**:
1. ✅ **Presets**: `settings` (JSON) 필드 추가 - 전역 설정 저장 (믹서 레벨, 이펙트, 테마 등)
2. ✅ **Assets**: `category` (ENUM) 필드 추가 - 파일 카테고리 분류 ('sample', 'synth', 'instrument')

**결정 사항**:
- 코드베이스의 실제 구현을 기준으로 DB Schema 문서가 수정됨
- 테이블명: `Presets`, `KeyMappings` 유지 (코드 기준)
- 필드명: `nickname`, `keyChar` 유지 (코드 기준)
- `type`, `note` 필드는 코드에 존재하며 정상적으로 사용됨

**참고**: 
- Phase 4 자세한 내용은 `document/legacy/PHASE4_COMPLETION_SUMMARY.md`를 참조하세요.
- UserPreferences와 Posts 모델은 최근 구현 완료되었습니다. API 문서는 `document/API_DOCUMENTATION.md`를 참조하세요.

---

## 다음 단계

Phase 2: DB Schema 문서를 코드베이스의 실제 구조에 맞게 수정하겠습니다.
