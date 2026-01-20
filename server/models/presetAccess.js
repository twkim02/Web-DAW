module.exports = (sequelize, DataTypes) => {
    const PresetAccess = sequelize.define('PresetAccess', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: true, // NULL for anonymous users
            comment: '사용자 ID (NULL이면 비로그인 사용자)'
        },
        presetId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '로드한 프리셋 ID'
        },
        sessionId: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: '비로그인 사용자 세션 ID (선택적)'
        },
        loadedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            comment: '프리셋 로드 시각'
        }
    }, {
        tableName: 'PresetAccesses',
        underscored: true,
        timestamps: false // Only loadedAt is relevant
        // 인덱스는 컬럼 생성 후 수동으로 추가
        // indexes: [
        //     {
        //         fields: ['userId', 'presetId'],
        //         unique: false
        //     },
        //     {
        //         fields: ['presetId']
        //     }
        // ]
    });

    PresetAccess.associate = function (models) {
        PresetAccess.belongsTo(models.User, { foreignKey: 'userId', onDelete: 'CASCADE' });
        PresetAccess.belongsTo(models.Preset, { foreignKey: 'presetId', onDelete: 'CASCADE' });
    };

    // 테이블 생성 후 인덱스 추가 (컬럼이 먼저 생성된 후)
    PresetAccess.addIndexes = async function() {
        const sequelize = this.sequelize;
        const queryInterface = sequelize.getQueryInterface();
        
        try {
            // user_id 컬럼이 존재하는지 확인
            const tableDescription = await queryInterface.describeTable('PresetAccesses');
            if (!tableDescription.user_id) {
                console.log('user_id column does not exist yet in PresetAccesses, skipping index creation');
                return;
            }

            // 인덱스가 이미 존재하는지 확인
            const indexes = await queryInterface.showIndex('PresetAccesses');
            const hasUserIdPresetIdIndex = indexes.some(idx => idx.name === 'preset_accesses_user_id_preset_id');
            const hasPresetIdIndex = indexes.some(idx => idx.name === 'preset_accesses_preset_id');

            if (!hasUserIdPresetIdIndex) {
                await queryInterface.addIndex('PresetAccesses', ['user_id', 'preset_id'], {
                    name: 'preset_accesses_user_id_preset_id'
                });
                console.log('Added index: preset_accesses_user_id_preset_id');
            }

            if (!hasPresetIdIndex) {
                await queryInterface.addIndex('PresetAccesses', ['preset_id'], {
                    name: 'preset_accesses_preset_id'
                });
                console.log('Added index: preset_accesses_preset_id');
            }
        } catch (err) {
            // 인덱스가 이미 존재하거나 다른 이유로 실패하면 무시
            console.warn('Failed to add indexes to PresetAccesses (may already exist):', err.message);
        }
    };

    return PresetAccess;
};
