module.exports = (sequelize, DataTypes) => {
    const Asset = sequelize.define('Asset', {
        originalName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        filename: { // Stored filename
            type: DataTypes.STRING,
            allowNull: false
        },
        filePath: {
            type: DataTypes.STRING,
            allowNull: false
        },
        mimetype: {
            type: DataTypes.STRING
        },
        isRecorded: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
            comment: '마이크 녹음 여부 (TRUE: 녹음 파일, FALSE: 업로드 파일)'
        },
        category: {
            type: DataTypes.ENUM('sample', 'synth', 'instrument'),
            defaultValue: 'sample',
            comment: '파일 카테고리 (sample: 샘플 파일, synth: 신스 프리셋, instrument: 악기 프리셋)'
        }
    }, {
        tableName: 'Assets',
        underscored: true
    });

    Asset.associate = function (models) {
        Asset.belongsTo(models.User, { foreignKey: 'userId' });
        Asset.hasMany(models.KeyMapping, { foreignKey: 'assetId' });
    };

    return Asset;
};
