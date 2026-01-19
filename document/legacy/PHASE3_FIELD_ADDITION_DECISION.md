# Phase 3: 누락된 필드 추가 결정 문서

생성일: 2024-01-XX

이 문서는 코드에 없지만 DB Schema에 있는 누락된 필드들을 추가할지 여부를 결정한 결과를 정리합니다.

---

## 📋 평가 기준

1. **현재 코드 사용 여부**: 코드에서 실제로 사용되는가?
2. **High-Fi 로드맵**: HIGH_FI_ROADMAP.md에 계획되어 있는가?
3. **우선순위**: High-Fi 단계 달성에 필수인가?
4. **구현 복잡도**: 추가하기 쉬운가?

---

## 🔍 필드별 평가 결과

### 1. Presets 테이블

#### 1.1 `master_volume` (FLOAT, DEFAULT 0.7)

**현재 상태**:
- ❌ 코드에 없음
- ✅ AudioEngine에 `masterBuss`는 존재하지만 별도의 master volume 컨트롤은 없음
- ✅ HIGH_FI_ROADMAP.md 2.3 "마스터 제어 - 마스터 볼륨 조절" 계획됨

**분석**:
```javascript
// 현재 코드: AudioEngine.js
this.masterBuss = new Tone.Gain(1).toDestination(); // 고정값 1
```
- 마스터 볼륨은 현재 하드코딩됨
- 프리셋별로 다른 마스터 볼륨 설정 필요성 낮음 (프로젝트 레벨 설정)

**결정**: ✅ **향후 확장용으로 추가 권장** (우선순위: 중간)
- **이유**:
  - High-Fi 로드맵에 포함됨
  - 프리셋별 마스터 볼륨 설정 가능
  - 구현 복잡도 낮음 (프리셋 로드 시 masterBuss.volume.value 설정)
- **추가 시점**: Phase 4 (모델 파일 확장) 또는 High-Fi 로드맵 2.3 구현 시

---

#### 1.2 `is_quantized` (BOOLEAN, DEFAULT TRUE)

**현재 상태**:
- ❌ 코드에 없음
- ✅ 전역 `launchQuantization` 상태는 있지만 프리셋별 저장 안 됨
- ✅ HIGH_FI_ROADMAP.md 2.2 "퀀타이즈 기능 - 퀀타이즈 활성화/비활성화" 계획됨

**분석**:
```javascript
// 현재 코드: useStore.js
launchQuantization: '16n', // 전역 설정만 존재
```
- 퀀타이즈는 전역 설정으로만 존재
- 프리셋별로 다른 퀀타이즈 설정 가능성 있음 (예: 일부 프리셋은 퀀타이즈 끔)

**결정**: ✅ **향후 확장용으로 추가 권장** (우선순위: 중간)
- **이유**:
  - High-Fi 로드맵에 포함됨
  - 프리셋별 퀀타이즈 설정 가능
  - 구현 복잡도 낮음
- **추가 시점**: Phase 4 (모델 파일 확장) 또는 High-Fi 로드맵 2.2 구현 시

---

### 2. KeyMappings 테이블

#### 2.1 `synth_settings` (JSON, NULL 허용)

**현재 상태**:
- ❌ 코드에 없음 (KeyMapping별로 저장 안 됨)
- ✅ 전역 `synthParams`는 있음
- ✅ `SYNTH_PRESETS` 하드코딩된 프리셋은 있음
- ✅ HIGH_FI_ROADMAP.md 2.4 "신서사이저 기능 - 신스 프리셋 저장/로드" 계획됨

**분석**:
```javascript
// 현재 코드: useStore.js
synthParams: {
    oscillatorType: 'triangle',
    envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 1 }
}

// 현재 코드: instruments/Synths.js
export const SYNTH_PRESETS = {
    'default': { params: { oscillator: { type: 'triangle' }, ... } },
    'saw_lead': { params: { oscillator: { type: 'fatsawtooth' }, ... } },
    ...
}
```
- 신스 설정은 전역으로만 관리되며, 각 패드별로 다른 신스 설정 불가
- 각 KeyMapping(type='synth')마다 다른 신스 설정 저장 필요

**결정**: ✅ **향후 확장용으로 추가 필수** (우선순위: 높음)
- **이유**:
  - High-Fi 로드맵에 포함됨
  - **패드별 신스 설정은 핵심 기능**
  - 현재 구조로는 패드별 신스 커스터마이징 불가
  - 구현 복잡도 중간 (JSON 파싱, Tone.js 파라미터 매핑)
- **추가 시점**: Phase 4 (모델 파일 확장) 또는 High-Fi 로드맵 2.4 구현 시

**JSON 구조 예시**:
```json
{
  "oscillator": { "type": "sine" },
  "envelope": { "attack": 0.1, "decay": 0.2, "sustain": 0.5, "release": 1 },
  "filter": { "type": "lowpass", "frequency": 1000, "Q": 1 }
}
```

---

### 3. Assets 테이블

#### 3.1 `file_size` (BIGINT, NULL 허용)

**현재 상태**:
- ❌ 코드에 없음
- ❌ HIGH_FI_ROADMAP.md에 명시적 언급 없음

**분석**:
- 파일 크기는 업로드 시 `req.file.size`로 쉽게 얻을 수 있음
- 파일 관리 최적화(용량 제한, 정렬 등)에 유용하지만 필수는 아님

**결정**: ⚠️ **선택적 추가** (우선순위: 낮음)
- **이유**:
  - High-Fi 로드맵에 명시적 계획 없음
  - 파일 관리 최적화를 위한 부가 기능
  - 구현 복잡도 매우 낮음 (업로드 시 `req.file.size` 저장)
- **추가 시점**: 필요 시 추가 (프로덕션 최적화 단계)

---

#### 3.2 `is_recorded` (BOOLEAN, DEFAULT FALSE)

**현재 상태**:
- ❌ 코드에 없음
- ✅ HIGH_FI_ROADMAP.md 2.6 "녹음 기능 - 마이크 녹음" 계획됨

**분석**:
```javascript
// 현재 코드: RecordingLibrary.jsx (녹음 기능 존재하나 Asset 모델에 저장 안 됨)
```
- 녹음 기능은 일부 구현되어 있으나, Asset 모델에 녹음 여부 구분 없음
- 녹음 파일과 업로드 파일을 구분해야 함 (UI, 관리 차별화)

**결정**: ✅ **향후 확장용으로 추가 필수** (우선순위: 높음)
- **이유**:
  - High-Fi 로드맵에 포함됨
  - **녹음 기능 구현 시 필수**
  - 업로드 파일과 녹음 파일 구분 필요
  - 구현 복잡도 낮음 (녹음 시 `is_recorded: true` 저장)
- **추가 시점**: Phase 4 (모델 파일 확장) 또는 High-Fi 로드맵 2.6 구현 시

---

## 📊 결정 요약

| 테이블 | 필드명 | 타입 | 우선순위 | 결정 | 추가 시점 |
|--------|--------|------|----------|------|-----------|
| Presets | `master_volume` | FLOAT | 중간 | ✅ 추가 권장 | Phase 4 또는 High-Fi 2.3 |
| Presets | `is_quantized` | BOOLEAN | 중간 | ✅ 추가 권장 | Phase 4 또는 High-Fi 2.2 |
| KeyMappings | `synth_settings` | JSON | 높음 | ✅ **추가 필수** | Phase 4 또는 High-Fi 2.4 |
| Assets | `file_size` | BIGINT | 낮음 | ⚠️ 선택적 | 필요 시 |
| Assets | `is_recorded` | BOOLEAN | 높음 | ✅ **추가 필수** | Phase 4 또는 High-Fi 2.6 |

---

## 🎯 Phase 4 추천 작업 순서

### 즉시 추가 권장 (높은 우선순위)
1. ✅ **KeyMappings.synth_settings** (JSON)
   - 패드별 신스 커스터마이징 필수
   - High-Fi 핵심 기능

2. ✅ **Assets.is_recorded** (BOOLEAN)
   - 녹음 기능 구현 시 필수
   - 파일 관리 차별화

### 향후 추가 (중간 우선순위)
3. ⚠️ **Presets.master_volume** (FLOAT)
   - 프리셋별 마스터 볼륨 설정
   - High-Fi 로드맵 포함

4. ⚠️ **Presets.is_quantized** (BOOLEAN)
   - 프리셋별 퀀타이즈 설정
   - High-Fi 로드맵 포함

### 선택적 추가 (낮은 우선순위)
5. 🔵 **Assets.file_size** (BIGINT)
   - 파일 관리 최적화
   - 필요 시 추가

---

## 📝 다음 단계

### 옵션 1: 즉시 추가 (권장)
- Phase 4에서 `synth_settings`, `is_recorded` 필드 추가
- High-Fi 핵심 기능 구현에 필수

### 옵션 2: 점진적 추가
- Phase 4에서는 결정만 내리고, 실제 구현은 High-Fi 로드맵 진행 시 추가
- 현재 스키마는 주석으로 표시 유지

### 옵션 3: 전체 추가
- Phase 4에서 모든 필드 추가
- 향후 확장성 고려

---

## ✅ 최종 권장사항

**Phase 4에서는 다음 필드만 추가하는 것을 권장**:
1. ✅ `KeyMappings.synth_settings` (JSON) - **필수**
2. ✅ `Assets.is_recorded` (BOOLEAN) - **필수**

나머지 필드(`master_volume`, `is_quantized`, `file_size`)는:
- DB Schema에는 주석으로 유지
- 실제 모델 파일 확장은 High-Fi 로드맵 진행 시 추가

**이유**:
- 현재 코드에서 사용하지 않는 필드를 추가하면 불필요한 복잡도 증가
- High-Fi 로드맵 진행 시 실제 필요성에 따라 추가하는 것이 효율적
- 스키마 문서에는 향후 확장성을 명시하여 계획은 유지
