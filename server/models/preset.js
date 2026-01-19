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
        }
    }, {
        tableName: 'Presets',
        underscored: true
    });

    Preset.associate = function (models) {
        Preset.belongsTo(models.User, { foreignKey: 'userId' });
        Preset.hasMany(models.KeyMapping, { foreignKey: 'presetId' });
        Preset.hasOne(models.Post, { 
            foreignKey: 'presetId',
            onDelete: 'RESTRICT' // 프리셋이 게시글에 연결되어 있으면 삭제 불가
        });
    };

    return Preset;
};
