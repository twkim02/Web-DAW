-- GraphicAssets 테이블 수정 스크립트
-- 문제: userId 컬럼이 없어서 인덱스 생성 실패

-- 방법 1: 기존 테이블에 userId 컬럼 추가 (데이터 보존)
-- 주의: 테이블에 데이터가 있으면 이 방법 사용

ALTER TABLE GraphicAssets 
ADD COLUMN user_id INT NULL 
COMMENT '소유자 사용자 ID (NULL이면 비로그인 사용자)'
AFTER id;

-- User 테이블과의 외래키 관계 추가 (선택사항)
ALTER TABLE GraphicAssets
ADD CONSTRAINT fk_graphic_assets_user
FOREIGN KEY (user_id) REFERENCES Users(id)
ON DELETE CASCADE;

-- 인덱스 추가 (이제 userId 컬럼이 있으므로 가능)
-- 주의: 이미 인덱스가 있으면 에러 발생 (IGNORE 또는 DROP INDEX 후 재생성)

-- 방법 2: 테이블 삭제 후 재생성 (데이터 손실)
-- 주의: 이 방법은 모든 데이터를 삭제합니다!
-- DROP TABLE IF EXISTS GraphicAssets;

-- 방법 3: 기존 테이블 구조 확인
-- DESCRIBE GraphicAssets;
-- SHOW CREATE TABLE GraphicAssets;
