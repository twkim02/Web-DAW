# 데이터베이스 마이그레이션 가이드

이 문서는 DB Schema 변경 시 MySQL 데이터베이스에 필요한 작업을 설명합니다.

---

## 📋 현재 상황

### 충돌 해결 과정에서 추가된 필드

1. **Assets 테이블**
   - `category` ENUM 필드 추가: `enum('sample', 'synth', 'instrument')` [default: 'sample']

2. **Presets 테이블**
   - `settings` JSON 필드 추가: 전역 설정 저장

---

## 🔄 Sequelize Sync 동작 방식

현재 프로젝트는 `server/server.js`에서 다음 설정을 사용합니다:

```javascript
db.sequelize.sync({ alter: true })
```

### `alter: true` 옵션의 동작

- **기존 테이블이 있는 경우**: 테이블 구조를 모델 정의에 맞게 **자동으로 수정**합니다
- **새 필드 추가**: 기존 데이터는 기본값으로 채워집니다
- **필드 타입 변경**: 데이터 손실 위험이 있을 수 있습니다
- **필드 삭제**: ⚠️ **주의**: 모델에서 제거된 필드는 테이블에서도 삭제됩니다

---

## ⚠️ 주의사항

### 1. 기존 데이터 보존

`alter: true`는 기존 데이터를 보존하려고 하지만, 다음 경우에는 문제가 발생할 수 있습니다:

- **NOT NULL 필드 추가**: 기존 레코드에 기본값이 설정됩니다
- **ENUM 값 변경**: 기존 데이터가 새로운 ENUM 값과 호환되지 않으면 오류 발생
- **필드 타입 변경**: 데이터 변환이 불가능하면 오류 발생

### 2. 프로덕션 환경

프로덕션 환경에서는 `alter: true`를 사용하지 않는 것이 권장됩니다. 대신:
- **마이그레이션 스크립트** 작성
- **수동 SQL 실행**
- **백업 후 진행**

---

## 📝 MySQL에 필요한 변경사항

### 1. Assets 테이블

**추가할 필드**:
```sql
ALTER TABLE Assets 
ADD COLUMN category ENUM('sample', 'synth', 'instrument') 
NOT NULL DEFAULT 'sample' 
AFTER is_recorded;
```

**기존 데이터 처리**:
- 기존 레코드는 모두 `'sample'`로 설정됩니다 (기본값)

**인덱스 추가** (선택사항, 성능 향상):
```sql
CREATE INDEX idx_assets_category ON Assets(category);
```

---

### 2. Presets 테이블

**추가할 필드**:
```sql
ALTER TABLE Presets 
ADD COLUMN settings JSON 
NULL 
AFTER bpm;
```

**기존 데이터 처리**:
- 기존 레코드는 `settings`가 `NULL`로 설정됩니다
- 프론트엔드에서 `settings`가 없으면 기본값을 사용하도록 처리됨

---

## 🚀 자동 마이그레이션 (Sequelize Sync)

### 개발 환경

서버를 재시작하면 자동으로 적용됩니다:

```bash
# 서버 재시작
npm start
# 또는
npm run dev
```

**동작 과정**:
1. Sequelize가 모델 정의를 읽음
2. 기존 테이블 구조와 비교
3. `alter: true` 옵션으로 차이점을 자동 수정
4. 새 필드 추가, 기본값 설정

### 로그 확인

서버 시작 시 다음과 같은 SQL이 실행됩니다:

```sql
-- Assets 테이블
ALTER TABLE `Assets` ADD COLUMN `category` ENUM('sample', 'synth', 'instrument') NOT NULL DEFAULT 'sample';

-- Presets 테이블  
ALTER TABLE `Presets` ADD COLUMN `settings` JSON NULL;
```

---

## 🔧 수동 마이그레이션 (권장: 프로덕션)

프로덕션 환경에서는 수동으로 SQL을 실행하는 것이 안전합니다.

### 1. 백업 생성

```bash
# Docker MySQL 컨테이너에서
docker exec web-daw-mysql mysqldump -u webdaw_user -pwebdaw_password web_daw > backup_$(date +%Y%m%d_%H%M%S).sql

# 로컬 MySQL에서
mysqldump -u root -p web_daw > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. 마이그레이션 SQL 실행

```sql
-- Assets 테이블에 category 필드 추가
ALTER TABLE Assets 
ADD COLUMN category ENUM('sample', 'synth', 'instrument') 
NOT NULL DEFAULT 'sample' 
AFTER is_recorded;

-- Presets 테이블에 settings 필드 추가
ALTER TABLE Presets 
ADD COLUMN settings JSON 
NULL 
AFTER bpm;

-- 인덱스 추가 (선택사항)
CREATE INDEX idx_assets_category ON Assets(category);
```

### 3. 검증

```sql
-- Assets 테이블 구조 확인
DESCRIBE Assets;

-- Presets 테이블 구조 확인
DESCRIBE Presets;

-- 기존 데이터 확인
SELECT id, category, is_recorded FROM Assets LIMIT 5;
SELECT id, settings, master_volume, is_quantized FROM Presets LIMIT 5;
```

---

## 📊 마이그레이션 체크리스트

### 개발 환경

- [ ] 서버 재시작 (`npm start` 또는 `npm run dev`)
- [ ] 서버 로그에서 ALTER TABLE 문 확인
- [ ] 데이터베이스 연결 오류 확인
- [ ] 기존 데이터가 정상적으로 조회되는지 확인

### 프로덕션 환경

- [ ] **데이터베이스 백업 생성** (필수)
- [ ] 마이그레이션 SQL 작성
- [ ] 테스트 환경에서 먼저 실행
- [ ] 프로덕션 데이터베이스에 적용
- [ ] 애플리케이션 재시작
- [ ] 기능 테스트 (파일 업로드, 프리셋 저장/로드)

---

## 🐛 문제 해결

### 오류 1: "Duplicate column name 'category'"

**원인**: 필드가 이미 존재함

**해결**:
```sql
-- 필드 존재 여부 확인
SHOW COLUMNS FROM Assets LIKE 'category';

-- 이미 존재하면 마이그레이션 스킵
```

### 오류 2: "Data truncated for column 'category'"

**원인**: 기존 데이터가 ENUM 값과 맞지 않음

**해결**:
```sql
-- 기존 데이터를 기본값으로 업데이트
UPDATE Assets SET category = 'sample' WHERE category IS NULL OR category NOT IN ('sample', 'synth', 'instrument');
```

### 오류 3: "Invalid JSON text"

**원인**: `settings` 필드에 잘못된 JSON 데이터

**해결**:
```sql
-- NULL로 초기화
UPDATE Presets SET settings = NULL WHERE settings IS NOT NULL AND JSON_VALID(settings) = 0;
```

---

## 📚 참고 자료

- [Sequelize Sync 옵션](https://sequelize.org/docs/v6/core-concepts/model-basics/#model-synchronization)
- [MySQL ALTER TABLE](https://dev.mysql.com/doc/refman/8.0/en/alter-table.html)
- [MySQL JSON 데이터 타입](https://dev.mysql.com/doc/refman/8.0/en/json.html)

---

## ⚡ 빠른 실행 (개발 환경)

개발 환경에서는 서버를 재시작하기만 하면 됩니다:

```bash
# 서버 중지 (Ctrl+C)
# 서버 재시작
npm start
```

Sequelize가 자동으로 테이블을 업데이트합니다.

---

**마지막 업데이트**: 2024-01-XX (Conflict 해결 후)
