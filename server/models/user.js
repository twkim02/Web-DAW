module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        nickname: {
            type: DataTypes.STRING,
            allowNull: false
        },
        googleId: {
            type: DataTypes.STRING,
            allowNull: true
        },
        snsId: { // Legacy or alternative support
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        tableName: 'Users',
        underscored: true
    });

    User.associate = function (models) {
        User.hasMany(models.Preset, { foreignKey: 'userId' });
        User.hasMany(models.Asset, { foreignKey: 'userId' });
    };

    return User;
};
