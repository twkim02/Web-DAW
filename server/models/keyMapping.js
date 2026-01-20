module.exports = (sequelize, DataTypes) => {
    const KeyMapping = sequelize.define('KeyMapping', {
        keyChar: {
            type: DataTypes.STRING, // e.g., 'Z' or '0' (for pad ID 0)
            allowNull: false
        },
        mode: {
            type: DataTypes.ENUM('one-shot', 'gate', 'toggle'),
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
