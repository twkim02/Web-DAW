module.exports = (sequelize, DataTypes) => {
    const KeyMapping = sequelize.define('KeyMapping', {
        keyChar: {
            type: DataTypes.STRING, // e.g., 'Z' or '0' (for pad ID 0)
            allowNull: false
        },
        mode: {
            type: DataTypes.ENUM('one-shot', 'gate', 'toggle', 'loop'),
            defaultValue: 'one-shot'
        },
        volume: {
            type: DataTypes.FLOAT,
            defaultValue: 0
        },
        type: { // 'sample' or 'synth'
            type: DataTypes.STRING,
            defaultValue: 'sample'
        },
        note: {
            type: DataTypes.STRING,
            allowNull: true // e.g., 'C4'
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: '사용자가 지정한 패드 이름'
        },
        effects: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '패드별 이펙트 체인 설정 (배열)'
        },
        chokeGroup: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: '초크 그룹 (1, 2, 3, 4)'
        },
        instrumentPreset: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: '가상 악기 프리셋 키 (예: grand_piano, rhodes)'
        },
        synthSettings: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Tone.js 신서사이저 파라미터 (type=synth일 때 사용)'
            // 예시: { oscillator: { type: 'sine' }, envelope: { attack: 0.1, ... } }
        },
        graphicAssetId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '패드 이미지 GraphicAsset ID'
        },
        color: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: '패드 LED 색상'
        },
        image: {
            type: DataTypes.TEXT, // URL can be long
            allowNull: true,
            comment: '패드 배경 이미지 URL (레거시 지원, graphicAssetId 사용 권장)'
        },
        visualEffect: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: '패드 시각 효과 (ripple, cross 등)'
        }
    }, {
        tableName: 'KeyMappings',
        underscored: true
    });

    KeyMapping.associate = function (models) {
        KeyMapping.belongsTo(models.Preset, { foreignKey: 'presetId' });
        KeyMapping.belongsTo(models.Asset, { foreignKey: 'assetId' });
        KeyMapping.belongsTo(models.GraphicAsset, { foreignKey: 'graphicAssetId', onDelete: 'SET NULL' });
    };

    return KeyMapping;
};
