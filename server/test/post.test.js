/**
 * Post 모델 및 API 엔드포인트 테스트
 * 
 * 이 파일은 Post 기능의 기본적인 동작을 검증합니다.
 * 실제 API 서버가 실행 중일 때 테스트를 진행하세요.
 */

const db = require('../models');

/**
 * 1. 모델 로드 테스트
 */
async function testModelLoad() {
    console.log('\n=== 1. 모델 로드 테스트 ===');
    try {
        // Post 모델이 정상적으로 로드되었는지 확인
        if (!db.Post) {
            throw new Error('Post 모델이 로드되지 않았습니다.');
        }
        console.log('✅ Post 모델이 정상적으로 로드되었습니다.');
        
        // User 모델에 hasMany 관계가 설정되었는지 확인 (hasMany는 복수형으로 저장됨)
        if (!db.User.associations.Posts) {
            throw new Error('User와 Post의 관계가 설정되지 않았습니다.');
        }
        console.log('✅ User.hasMany(Post) 관계가 정상적으로 설정되었습니다.');
        
        // Preset 모델에 hasOne 관계가 설정되었는지 확인 (hasOne은 단수형으로 저장됨)
        if (!db.Preset.associations.Post) {
            throw new Error('Preset과 Post의 관계가 설정되지 않았습니다.');
        }
        console.log('✅ Preset.hasOne(Post) 관계가 정상적으로 설정되었습니다.');
        
        return true;
    } catch (error) {
        console.error('❌ 모델 로드 테스트 실패:', error.message);
        return false;
    }
}

/**
 * 2. 테이블 생성 테스트
 */
async function testTableCreation() {
    console.log('\n=== 2. 테이블 생성 테스트 ===');
    try {
        // Sequelize가 테이블을 생성할 수 있는지 확인
        await db.sequelize.authenticate();
        console.log('✅ 데이터베이스 연결 성공');
        
        // Posts 테이블이 존재하는지 확인
        const [results] = await db.sequelize.query(
            "SHOW TABLES LIKE 'Posts'"
        );
        
        if (results.length === 0) {
            console.log('⚠️  Posts 테이블이 아직 생성되지 않았습니다.');
            console.log('   서버를 재시작하면 자동으로 생성됩니다.');
            return false;
        }
        
        console.log('✅ Posts 테이블이 존재합니다.');
        
        // 테이블 구조 확인
        const [columns] = await db.sequelize.query(
            "DESCRIBE Posts"
        );
        console.log('📋 테이블 컬럼:');
        columns.forEach(col => {
            console.log(`   - ${col.Field} (${col.Type})`);
        });
        
        // UNIQUE 제약조건 확인 (preset_id)
        const [indexes] = await db.sequelize.query(
            "SHOW INDEXES FROM Posts WHERE Key_name = 'preset_id'"
        );
        if (indexes.length > 0) {
            console.log('✅ preset_id UNIQUE 제약조건이 설정되었습니다.');
        } else {
            console.log('⚠️  preset_id UNIQUE 제약조건을 확인할 수 없습니다.');
        }
        
        return true;
    } catch (error) {
        console.error('❌ 테이블 생성 테스트 실패:', error.message);
        return false;
    }
}

/**
 * 3. 관계 테스트
 */
async function testRelationships() {
    console.log('\n=== 3. 관계 테스트 ===');
    try {
        // Post의 associate 함수 확인
        const Post = db.Post;
        const associations = Post.associations;
        
        if (!associations.User) {
            throw new Error('Post의 User 관계가 설정되지 않았습니다.');
        }
        console.log('✅ Post.belongsTo(User) 관계가 설정되었습니다.');
        
        if (!associations.Preset) {
            throw new Error('Post의 Preset 관계가 설정되지 않았습니다.');
        }
        console.log('✅ Post.belongsTo(Preset) 관계가 설정되었습니다.');
        
        // User의 associate 함수 확인 (hasMany는 복수형으로 저장됨)
        const User = db.User;
        if (!User.associations.Posts) {
            throw new Error('User의 Post 관계가 설정되지 않았습니다.');
        }
        console.log('✅ User.hasMany(Post) 관계가 설정되었습니다.');
        
        // Preset의 associate 함수 확인
        const Preset = db.Preset;
        if (!Preset.associations.Post) {
            throw new Error('Preset의 Post 관계가 설정되지 않았습니다.');
        }
        console.log('✅ Preset.hasOne(Post) 관계가 설정되었습니다.');
        
        return true;
    } catch (error) {
        console.error('❌ 관계 테스트 실패:', error.message);
        return false;
    }
}

/**
 * 4. 필드 기본값 테스트
 */
async function testDefaultValues() {
    console.log('\n=== 4. 필드 기본값 테스트 ===');
    try {
        // Post 모델의 기본값 확인
        const Post = db.Post;
        const attributes = Post.rawAttributes;
        
        // likeCount 기본값 확인
        if (attributes.likeCount.defaultValue !== 0) {
            throw new Error('likeCount 기본값이 0이 아닙니다.');
        }
        console.log('✅ likeCount 기본값: 0');
        
        // downloadCount 기본값 확인
        if (attributes.downloadCount.defaultValue !== 0) {
            throw new Error('downloadCount 기본값이 0이 아닙니다.');
        }
        console.log('✅ downloadCount 기본값: 0');
        
        // isPublished 기본값 확인
        if (attributes.isPublished.defaultValue !== true) {
            throw new Error('isPublished 기본값이 true가 아닙니다.');
        }
        console.log('✅ isPublished 기본값: true');
        
        return true;
    } catch (error) {
        console.error('❌ 필드 기본값 테스트 실패:', error.message);
        return false;
    }
}

/**
 * 메인 테스트 실행 함수
 */
async function runTests() {
    console.log('========================================');
    console.log('Post 모델 테스트 시작');
    console.log('========================================');
    
    const results = {
        modelLoad: false,
        tableCreation: false,
        relationships: false,
        defaultValues: false
    };
    
    try {
        results.modelLoad = await testModelLoad();
        results.tableCreation = await testTableCreation();
        results.relationships = await testRelationships();
        results.defaultValues = await testDefaultValues();
        
        console.log('\n========================================');
        console.log('테스트 결과 요약');
        console.log('========================================');
        console.log(`모델 로드: ${results.modelLoad ? '✅ 통과' : '❌ 실패'}`);
        console.log(`테이블 생성: ${results.tableCreation ? '✅ 통과' : '⚠️  확인 필요'}`);
        console.log(`관계 설정: ${results.relationships ? '✅ 통과' : '❌ 실패'}`);
        console.log(`기본값 설정: ${results.defaultValues ? '✅ 통과' : '❌ 실패'}`);
        
        const allPassed = Object.values(results).every(r => r === true);
        
        if (allPassed) {
            console.log('\n🎉 모든 테스트가 통과했습니다!');
        } else {
            console.log('\n⚠️  일부 테스트가 실패하거나 확인이 필요합니다.');
        }
        
        return allPassed;
    } catch (error) {
        console.error('\n❌ 테스트 실행 중 오류 발생:', error);
        return false;
    } finally {
        // 데이터베이스 연결을 닫지 않음 (서버에서 계속 사용)
        // await db.sequelize.close();
    }
}

// 직접 실행 시 테스트 실행
if (require.main === module) {
    runTests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('테스트 실행 실패:', error);
            process.exit(1);
        });
}

module.exports = {
    runTests,
    testModelLoad,
    testTableCreation,
    testRelationships,
    testDefaultValues
};
