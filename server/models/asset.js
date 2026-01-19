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
        category: {
            type: DataTypes.ENUM('sample', 'synth', 'instrument', 'background'),
            defaultValue: 'sample'
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
