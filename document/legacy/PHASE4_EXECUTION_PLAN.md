# Phase 4 실행 계획

Phase 4: 모델 파일에 필드 추가 - 단계별 작업 계획

---

## 📋 작업 단계 구성

### Step 1: 모델 파일에 필드 추가
**목적**: Sequelize 모델 정의에 새 필드 추가

**작업 내용**:
1. `server/models/keyMapping.js`: `synth_settings` 필드 추가
2. `server/models/asset.js`: `is_recorded` 필드 추가
3. `server/models/preset.js`: `master_volume`, `is_quantized` 필드 추가

**예상 영향**:
- 데이터베이스 테이블 자동 업데이트 (Sequelize sync 시)
- 기존 코드 호환성 유지 (새 필드는 nullable 또는 기본값 있음)

---

### Step 2: API 라우트 수정
**목적**: 새 필드를 요청/응답에서 처리

**작업 내용**:
1. `server/routes/presets.js`:
   - POST `/presets`: `master_volume`, `is_quantized`, `synth_settings` 처리
   - GET `/presets/:id`: 새 필드 응답 포함
2. `server/routes/upload.js`:
   - POST `/upload`: `is_recorded` 필드 처리

**예상 영향**:
- API 요청/응답 구조 변경
- 프론트엔드와의 호환성 확인 필요

---

### Step 3: 프론트엔드 코드 확인 (선택적)
**목적**: 새 필드 사용 가능 여부 확인

**작업 내용**:
- 프론트엔드에서 새 필드를 사용하는지 확인
- 필요시 프론트엔드 코드 업데이트

**예상 영향**:
- 현재는 선택적 (필드 추가만으로도 작동 가능)
- 향후 High-Fi 로드맵 구현 시 실제 사용

---

## 🔄 실행 순서

### ✅ Step 1: 모델 파일 수정 **완료**
- [x] `server/models/keyMapping.js`: `synthSettings` 필드 추가
- [x] `server/models/asset.js`: `isRecorded` 필드 추가
- [x] `server/models/preset.js`: `masterVolume`, `isQuantized` 필드 추가

### ✅ Step 2: API 라우트 수정 **완료**
- [x] `server/routes/presets.js`: 새 필드 처리 추가
- [x] `server/routes/upload.js`: `isRecorded` 필드 처리 추가

### ✅ Step 3: 프론트엔드 확인 **완료**
- [x] 향후 확장 가능성 주석 추가
- [x] 하위 호환성 유지

---

## ⚠️ 주의사항

1. **데이터베이스 마이그레이션**:
   - Sequelize `sync: true` 옵션 사용 시 자동으로 테이블 업데이트
   - 기존 데이터는 NULL 또는 기본값으로 채워짐

2. **하위 호환성**:
   - 새 필드는 nullable 또는 기본값 설정
   - 기존 API 호출은 정상 작동해야 함

3. **테스트**:
   - 각 Step 완료 후 관련 기능 테스트 권장

---

## 📝 시작

Step 1부터 진행하겠습니다.
