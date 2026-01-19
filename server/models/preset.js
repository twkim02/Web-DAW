module.exports = (sequelize, DataTypes) => {
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
            type: DataTypes.JSON, // Stores global state: mixerLevels, effects, launchQuantization, theme, etc.
            allowNull: true,
            comment: '프리셋별 전역 설정 (믹서 레벨, 이펙트, 퀀타이즈, 테마 등)'
        },
        masterVolume: {
            type: DataTypes.FLOAT,
            defaultValue: 0.7,
            allowNull: false,
            comment: '전체 마스터 볼륨 (0.0 ~ 1.0)'
        },
        isQuantized: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false,
            comment: '퀀타이즈 활성화 여부'
        },
        parentPresetId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '포크된 경우 원본 프리셋 ID (NULL이면 원본)'
        },
        isPublic: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
            comment: '공개 여부 (Draft vs Published)'
        }
    }, {
        tableName: 'Presets',
        underscored: true
    });

    Preset.associate = function (models) {
        Preset.belongsTo(models.User, { foreignKey: 'userId' });
        Preset.hasMany(models.KeyMapping, { foreignKey: 'presetId' });
        Preset.hasMany(models.Post, {
            foreignKey: 'presetId',
            onDelete: 'CASCADE' // 프리셋 삭제 시 연결된 게시글도 함께 삭제
        });
        Preset.belongsTo(models.Preset, {
            as: 'ParentPreset',
            foreignKey: 'parentPresetId'
        });
    };

    return Preset;
};
