-- GraphicAssets 테이블에 userId 컬럼 추가
-- 문제: 테이블이 이미 생성되었지만 userId 컬럼이 없어서 인덱스 생성 실패

-- 1. 기존 테이블 구조 확인
-- DESCRIBE GraphicAssets;

-- 2. userId 컬럼 추가 (테이블에 데이터가 있는 경우)
ALTER TABLE GraphicAssets 
ADD COLUMN user_id INT NULL 
COMMENT '소유자 사용자 ID (NULL이면 비로그인 사용자)'
AFTER id;

-- 3. User 테이블과의 외래키 관계 추가
ALTER TABLE GraphicAssets
ADD CONSTRAINT fk_graphic_assets_user
FOREIGN KEY (user_id) REFERENCES Users(id)
ON DELETE CASCADE;

-- 4. 인덱스 추가 (컬럼이 생성된 후)
-- 주의: 이미 인덱스가 있으면 에러 발생할 수 있음
CREATE INDEX IF NOT EXISTS graphic_assets_user_id_category 
ON GraphicAssets(user_id, category);

CREATE INDEX IF NOT EXISTS graphic_assets_category 
ON GraphicAssets(category);

-- 또는 테이블을 완전히 재생성하려면 (데이터 손실 주의!)
-- DROP TABLE IF EXISTS GraphicAssets;
