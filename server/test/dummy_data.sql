-- ============================================
-- 테스트용 더미 데이터 삽입 SQL
-- ============================================
-- 
-- 사용 전 확인사항:
-- 1. Users 테이블에 id=1인 사용자가 존재해야 합니다.
-- 2. Assets 테이블에 id=1인 에셋이 존재해야 합니다.
-- 3. 이 스크립트는 기존 데이터를 삭제하지 않습니다.
--    중복 실행 시 외래키 제약조건 오류가 발생할 수 있습니다.
--
-- 실행 방법:
--   mysql> source server/test/dummy_data.sql;
--   또는
--   mysql> \. server/test/dummy_data.sql;
-- ============================================

-- 1. Presets 테이블에 더미 데이터 삽입
INSERT INTO Presets (user_id, title, bpm, master_volume, is_quantized, created_at, updated_at)
VALUES (
    1,                              -- user_id: Users 테이블의 id=1
    'My First Beat',                -- title: 프리셋 제목
    128,                            -- bpm: 템포 (60~200 권장)
    0.75,                           -- master_volume: 마스터 볼륨 (0.0~1.0)
    TRUE,                           -- is_quantized: 퀀타이즈 활성화
    NOW(),                          -- created_at
    NOW()                           -- updated_at
);

-- 방금 삽입한 Preset의 ID를 변수에 저장 (MySQL에서는 LAST_INSERT_ID() 사용)
SET @preset_id = LAST_INSERT_ID();

-- 2. KeyMappings 테이블에 16개의 패드 설정 삽입
--    일부는 sample 타입 (asset_id=1 사용), 일부는 synth 타입 (synth_settings 사용)

-- 패드 0-3: Sample 타입 (에셋 사용)
INSERT INTO KeyMappings (preset_id, key_char, mode, volume, type, asset_id, created_at, updated_at)
VALUES
    (@preset_id, '0', 'one-shot', 0.8, 'sample', 1, NOW(), NOW()),
    (@preset_id, '1', 'one-shot', 0.7, 'sample', 1, NOW(), NOW()),
    (@preset_id, '2', 'gate', 0.9, 'sample', 1, NOW(), NOW()),
    (@preset_id, '3', 'toggle', 0.6, 'sample', 1, NOW(), NOW());

-- 패드 4-7: Synth 타입 (synth_settings 사용)
INSERT INTO KeyMappings (preset_id, key_char, mode, volume, type, note, synth_settings, created_at, updated_at)
VALUES
    (@preset_id, '4', 'one-shot', 0.7, 'synth', 'C4', 
     '{"oscillator": {"type": "sine"}, "envelope": {"attack": 0.1, "decay": 0.2, "sustain": 0.5, "release": 1}}', 
     NOW(), NOW()),
    (@preset_id, '5', 'one-shot', 0.75, 'synth', 'D4', 
     '{"oscillator": {"type": "square"}, "envelope": {"attack": 0.05, "decay": 0.3, "sustain": 0.4, "release": 0.8}}', 
     NOW(), NOW()),
    (@preset_id, '6', 'gate', 0.8, 'synth', 'E4', 
     '{"oscillator": {"type": "triangle"}, "envelope": {"attack": 0.2, "decay": 0.1, "sustain": 0.6, "release": 1.2}}', 
     NOW(), NOW()),
    (@preset_id, '7', 'toggle', 0.65, 'synth', 'F4', 
     '{"oscillator": {"type": "sawtooth"}, "envelope": {"attack": 0.15, "decay": 0.25, "sustain": 0.5, "release": 0.9}}', 
     NOW(), NOW());

-- 패드 8-11: Sample 타입 (에셋 사용, 다른 모드 조합)
INSERT INTO KeyMappings (preset_id, key_char, mode, volume, type, asset_id, created_at, updated_at)
VALUES
    (@preset_id, '8', 'one-shot', 0.85, 'sample', 1, NOW(), NOW()),
    (@preset_id, '9', 'gate', 0.7, 'sample', 1, NOW(), NOW()),
    (@preset_id, '10', 'toggle', 0.75, 'sample', 1, NOW(), NOW()),
    (@preset_id, '11', 'one-shot', 0.9, 'sample', 1, NOW(), NOW());

-- 패드 12-15: Synth 타입 (다양한 노트와 설정)
INSERT INTO KeyMappings (preset_id, key_char, mode, volume, type, note, synth_settings, created_at, updated_at)
VALUES
    (@preset_id, '12', 'one-shot', 0.7, 'synth', 'G4', 
     '{"oscillator": {"type": "sine"}, "envelope": {"attack": 0.1, "decay": 0.2, "sustain": 0.5, "release": 1}}', 
     NOW(), NOW()),
    (@preset_id, '13', 'gate', 0.8, 'synth', 'A4', 
     '{"oscillator": {"type": "square"}, "envelope": {"attack": 0.05, "decay": 0.3, "sustain": 0.4, "release": 0.8}}', 
     NOW(), NOW()),
    (@preset_id, '14', 'toggle', 0.65, 'synth', 'B4', 
     '{"oscillator": {"type": "triangle"}, "envelope": {"attack": 0.2, "decay": 0.1, "sustain": 0.6, "release": 1.2}}', 
     NOW(), NOW()),
    (@preset_id, '15', 'one-shot', 0.75, 'synth', 'C5', 
     '{"oscillator": {"type": "sawtooth"}, "envelope": {"attack": 0.15, "decay": 0.25, "sustain": 0.5, "release": 0.9}}', 
     NOW(), NOW());

-- 3. Posts 테이블에 더미 데이터 삽입
INSERT INTO Posts (user_id, preset_id, title, description, like_count, download_count, is_published, created_at, updated_at)
VALUES (
    1,                              -- user_id: Users 테이블의 id=1
    @preset_id,                     -- preset_id: 방금 생성한 Preset의 ID
    'My First Beat - 공유 버전',     -- title: 게시글 제목
    '이 프리셋은 테스트용 더미 데이터입니다.\n\n사용법:\n- 패드 0-3, 8-11: 샘플 파일 재생\n- 패드 4-7, 12-15: 신서사이저 사운드\n- BPM: 128\n- 마스터 볼륨: 0.75',  -- description: 게시글 설명
    5,                              -- like_count: 좋아요 수
    12,                             -- download_count: 다운로드 수
    TRUE,                           -- is_published: 공개 여부
    NOW(),                          -- created_at
    NOW()                           -- updated_at
);

-- ============================================
-- 삽입된 데이터 확인 쿼리
-- ============================================

-- Preset 확인
SELECT '=== Presets 테이블 ===' AS '';
SELECT * FROM Presets WHERE id = @preset_id;

-- KeyMappings 확인 (16개)
SELECT '=== KeyMappings 테이블 (16개 패드) ===' AS '';
SELECT 
    id, 
    preset_id, 
    key_char, 
    mode, 
    volume, 
    type, 
    note, 
    asset_id,
    CASE 
        WHEN synth_settings IS NOT NULL THEN 'JSON 설정 있음'
        ELSE 'NULL'
    END AS synth_settings_status
FROM KeyMappings 
WHERE preset_id = @preset_id 
ORDER BY CAST(key_char AS UNSIGNED);

-- Post 확인
SELECT '=== Posts 테이블 ===' AS '';
SELECT * FROM Posts WHERE preset_id = @preset_id;

-- ============================================
-- 참고: 데이터 삭제 (필요시 주석 해제)
-- ============================================
-- 
-- DELETE FROM Posts WHERE preset_id = @preset_id;
-- DELETE FROM KeyMappings WHERE preset_id = @preset_id;
-- DELETE FROM Presets WHERE id = @preset_id;
-- 
-- ============================================
