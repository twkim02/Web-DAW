# 스키마 리팩토링 작업 계획

이 문서는 코드베이스의 현재 상태를 기준으로 DB Schema를 동기화하는 작업의 단계별 계획입니다.

---

## 📋 현재 상태 분석

### 코드베이스 (실제 구현)
- **모델 파일**: `preset.js`, `keyMapping.js`, `user.js`, `asset.js`
- **테이블명**: `Presets`, `KeyMappings`, `Users`, `Assets`
- **API 엔드포인트**: `/presets`
- **프론트엔드**: `presets`, `getPresets()`, `savePreset()`

### DB Schema 문서 (목표 상태)
- **테이블명**: `Projects`, `ButtonSettings`, `Users`, `Assets`
- **필드명**: `display_name`, `pad_index`, `SAMPLE/SYNTH` 등

### 결정 사항
✅ **코드의 이름을 기준으로 DB Schema를 수정** (코드 변경 최소화)

---

## 🔄 작업 단계

### Phase 1: 현재 코드 구조 완전 파악 ✅ **완료**
**목적**: 코드베이스에서 실제로 사용하는 모든 필드와 구조를 정확히 파악

**결과 문서**: `document/CURRENT_CODE_STRUCTURE.md`

#### 1.1 모델 파일 분석 ✅
- [x] `server/models/preset.js` - 모든 필드 확인
- [x] `server/models/keyMapping.js` - 모든 필드 확인
- [x] `server/models/user.js` - 모든 필드 확인
- [x] `server/models/asset.js` - 모든 필드 확인
- [x] `server/models/index.js` - 관계 설정 확인

#### 1.2 API 라우트 분석 ✅
- [x] `server/routes/presets.js` - 요청/응답 구조 확인
- [x] `server/routes/upload.js` - Asset 관련 필드 확인
- [x] `server/routes/auth.js` - User 관련 필드 확인

#### 1.3 프론트엔드 코드 분석 ✅
- [x] `client/src/api/presets.js` - API 호출 구조 확인
- [x] `client/src/App.jsx` - Preset/KeyMapping 사용 패턴 확인
- [x] `client/src/store/useStore.js` - 상태 구조 확인

#### 1.4 현재 필드 매핑 정리 ✅
다음과 같은 표를 작성:
```
Preset 모델:
- title (STRING)
- bpm (INTEGER, default: 120)
- userId (FK)
- createdAt, updatedAt (자동)

KeyMapping 모델:
- keyChar (STRING) - 'Z' or '0' (pad ID)
- mode (ENUM: 'one-shot', 'gate', 'toggle')
- volume (FLOAT, default: 0)
- type (STRING, default: 'sample') - 'sample' or 'synth'
- note (STRING, nullable) - e.g., 'C4'
- presetId (FK)
- assetId (FK, nullable)

User 모델:
- email (STRING, unique)
- nickname (STRING)
- googleId (STRING, nullable)
- snsId (STRING, nullable)

Asset 모델:
- originalName (STRING)
- filename (STRING)
- filePath (STRING)
- mimetype (STRING, nullable)
- userId (FK)
```

---

### Phase 2: DB Schema 문서 수정 (테이블명/필드명 동기화) ✅ **완료**
**목적**: DB Schema 문서를 코드베이스의 실제 구조에 맞게 수정

**결과**: `document/DB_SCHEMA.md` 파일 업데이트 완료

#### 2.1 테이블명 변경 ✅
- [x] `Projects` → `Presets`로 변경
- [x] `ButtonSettings` → `KeyMappings`로 변경
- [x] 관계 정의(Ref) 섹션 업데이트

#### 2.2 Presets 테이블 필드 동기화 ✅
- [x] 현재 코드: `title`, `bpm`만 있음 (반영됨)
- [x] DB Schema에 추가할 필드 결정:
  - `master_volume` (향후 확장용으로 주석 추가)
  - `is_quantized` (향후 확장용으로 주석 추가)
- [x] 필드명과 타입을 코드에 맞게 수정

#### 2.3 KeyMappings 테이블 필드 동기화 ✅
- [x] `pad_index` → `keyChar`로 변경 (코드 기준)
- [x] `mode` ENUM: `'SAMPLE'/'SYNTH'` → `'one-shot'/'gate'/'toggle'`로 변경
- [x] `type` 필드 추가 (코드에 있음: 'sample' or 'synth')
- [x] `note` 필드 추가 (코드에 있음)
- [x] `synth_settings` JSON 필드 (향후 확장용으로 주석 추가)
- [x] `project_id` → `presetId`로 변경

#### 2.4 Users 테이블 필드 동기화 ✅
- [x] `display_name` → `nickname`로 변경 (코드 기준)
- [x] `google_id` 필드명 유지 (주석에 Sequelize 필드명 표시)
- [x] `snsId` 필드 추가 (코드에 있음, `sns_id`로 추가)
- [x] `created_at`, `updated_at` 필드 확인 (Sequelize 자동 추가, 주석 추가)

#### 2.5 Assets 테이블 필드 동기화 ✅
- [x] `file_name` → `filename`로 변경 (코드 기준)
- [x] `original_name` → `originalName`로 변경 (주석에 Sequelize 필드명 표시)
- [x] `file_path` → `filePath`로 변경 (주석에 Sequelize 필드명 표시)
- [x] `is_recorded` 필드 (향후 확장용으로 주석 추가 - 코드에 없음)
- [x] `file_size` 필드 (향후 확장용으로 주석 추가 - 코드에 없음)
- [x] `user_id` NULL 허용 (게스트 업로드 지원)

#### 2.6 관계(Ref) 섹션 업데이트 ✅
- [x] `Projects` → `Presets`로 변경
- [x] `ButtonSettings` → `KeyMappings`로 변경
- [x] `project_id` → `presetId`로 변경
- [x] 외래키 필드명 확인 및 수정
- [x] 관계 요약 섹션 업데이트

---

### Phase 3: 누락된 필드 추가 계획 수립 ✅ **완료**
**목적**: DB Schema에 있지만 코드에 없는 필드들을 추가할지 결정

**결과 문서**: `document/PHASE3_FIELD_ADDITION_DECISION.md`

#### 3.1 Presets 테이블 ✅
- [x] `master_volume` (FLOAT, default: 0.7) - ✅ **향후 확장용으로 추가 권장** (우선순위: 중간)
- [x] `is_quantized` (BOOLEAN, default: true) - ✅ **향후 확장용으로 추가 권장** (우선순위: 중간)

#### 3.2 KeyMappings 테이블 ✅
- [x] `synth_settings` (JSON) - ✅ **추가 필수** (우선순위: 높음)
  - 현재 코드: 전역 `synthParams`만 있음, 패드별 신스 설정 불가
  - High-Fi 핵심 기능: 패드별 신스 커스터마이징 필요

#### 3.3 Assets 테이블 ✅
- [x] `is_recorded` (BOOLEAN, default: false) - ✅ **추가 필수** (우선순위: 높음)
  - 현재 코드에 없음
  - 녹음 기능 구현 시 필수 (High-Fi 로드맵 포함)
- [x] `file_size` (BIGINT) - ⚠️ **선택적 추가** (우선순위: 낮음)
  - 파일 관리 최적화용 (필수 아님)

#### 3.4 UserPreferences 테이블
- [x] **향후 구현 예정** (현재 Phase 범위 아님)
  - 현재 코드에 모델 없음
  - DB Schema에는 정의되어 있음
  - High-Fi 로드맵 2.9에서 구현 계획

#### 3.5 Posts 테이블
- [x] **향후 구현 예정** (현재 Phase 범위 아님)
  - 현재 코드에 모델 없음
  - DB Schema에는 정의되어 있음
  - High-Fi 로드맵 2.8에서 구현 계획

**Phase 4 추천 작업**:
1. ✅ **즉시 추가**: `KeyMappings.synth_settings`, `Assets.is_recorded`
2. ⚠️ **향후 추가**: `Presets.master_volume`, `Presets.is_quantized` (High-Fi 로드맵 진행 시)
3. 🔵 **선택적**: `Assets.file_size` (필요 시)

---

### Phase 4: 모델 파일에 누락된 필드 추가 ✅ **완료**
**목적**: Phase 3에서 결정한 필드들을 실제 모델에 추가

**결과**: 모든 필수 필드 및 향후 확장 필드 추가 완료

#### 4.1 Presets 모델 확장 ✅
- [x] `masterVolume` 필드 추가 (FLOAT, DEFAULT 0.7)
- [x] `isQuantized` 필드 추가 (BOOLEAN, DEFAULT TRUE)

#### 4.2 KeyMappings 모델 확장 ✅
- [x] `synthSettings` JSON 필드 추가 (JSON, NULL 허용)

#### 4.3 Assets 모델 확장 ✅
- [x] `isRecorded` 필드 추가 (BOOLEAN, DEFAULT FALSE)

#### 4.4 API 라우트 수정 ✅
- [x] `server/routes/presets.js`: 새 필드 처리 (masterVolume, isQuantized, synthSettings)
- [x] `server/routes/upload.js`: `isRecorded` 필드 처리

#### 4.5 프론트엔드 코드 업데이트 ✅
- [x] 향후 확장 가능성 주석 추가 (`App.jsx`, `api/presets.js`)
- [x] 하위 호환성 유지 (기존 코드 정상 작동)

#### 4.6 새로운 모델 생성 (선택적, Phase 범위 아님)
- [ ] `UserPreferences` 모델 생성 (High-Fi 로드맵 2.9에서 구현 예정)
- [ ] `Posts` 모델 생성 (High-Fi 로드맵 2.8에서 구현 예정)

---

### Phase 5: 문서 동기화
**목적**: 모든 문서를 최종 스키마에 맞게 업데이트

#### 5.1 DB_SCHEMA.md 업데이트
- [ ] 테이블명 변경 반영
- [ ] 필드명 변경 반영
- [ ] 관계 정의 업데이트
- [ ] 주석 및 설명 업데이트

#### 5.2 PROJECT_SPEC.md 업데이트
- [ ] 데이터베이스 스키마 섹션 업데이트
- [ ] 모델 설명 업데이트
- [ ] API 엔드포인트 설명 확인

#### 5.3 HIGH_FI_ROADMAP.md 업데이트
- [ ] 1.1 스키마 리팩토링 섹션 업데이트
- [ ] 완료된 작업 체크박스 업데이트
- [ ] 작업 순서 조정 (필요시)

---

## 📝 작업 순서 요약

### 즉시 시작 가능한 작업 (Phase 1)
1. ✅ 모델 파일 읽기 및 분석
2. ✅ API 라우트 분석
3. ✅ 프론트엔드 코드 분석
4. ✅ 필드 매핑 표 작성

### 핵심 작업 (Phase 2) - **우선순위 높음**
1. DB_SCHEMA.md에서 테이블명 변경
   - `Projects` → `Presets`
   - `ButtonSettings` → `KeyMappings`
2. 필드명 동기화
   - `display_name` → `nickname`
   - `pad_index` → `keyChar`
   - `project_id` → `presetId`
   - 기타 필드명 camelCase로 통일
3. ENUM 값 동기화
   - `mode`: `'SAMPLE'/'SYNTH'` → `'one-shot'/'gate'/'toggle'`
4. 관계 정의 업데이트

### 선택적 작업 (Phase 3, 4)
- 누락된 필드 추가 여부는 프로젝트 요구사항에 따라 결정
- High-Fi 로드맵의 우선순위와 일치시킬 것

### 마무리 작업 (Phase 5)
- 모든 문서 동기화

---

## ⚠️ 주의사항

1. **데이터베이스 마이그레이션**
   - 실제 데이터베이스에 변경사항을 적용하려면 Sequelize 마이그레이션 필요
   - 이 문서는 **스키마 문서만 수정**하는 작업
   - 실제 DB 마이그레이션은 별도 작업으로 진행

2. **하위 호환성**
   - 기존 코드가 정상 작동하는지 확인
   - API 응답 구조 변경 시 프론트엔드 영향도 확인

3. **테스트**
   - 각 Phase 완료 후 관련 기능 테스트
   - 특히 API 엔드포인트 동작 확인

---

## 🎯 예상 작업 시간

- **Phase 1**: 30분 (분석 작업)
- **Phase 2**: 1-2시간 (문서 수정)
- **Phase 3**: 30분 (계획 수립)
- **Phase 4**: 1-2시간 (코드 수정, 선택적)
- **Phase 5**: 30분 (문서 동기화)

**총 예상 시간**: 3-5시간 (Phase 4 제외 시 2-3시간)

---

## 📅 시작하기

Phase 1부터 순차적으로 진행하시겠습니까?
