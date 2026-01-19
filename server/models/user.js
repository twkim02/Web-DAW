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
        },
        avatarUrl: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: '프로필 이미지 URL'
        },
        bio: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: '사용자 자기소개'
        }
    }, {
        tableName: 'Users',
        underscored: true
    });

    User.associate = function (models) {
        User.hasMany(models.Preset, { foreignKey: 'userId' });
        User.hasMany(models.Asset, { foreignKey: 'userId' });
        User.hasOne(models.UserPreference, {
            foreignKey: 'userId',
            onDelete: 'CASCADE'
        });
        User.hasMany(models.Post, {
            foreignKey: 'userId',
            onDelete: 'CASCADE'
        });
        User.hasMany(models.Comment, {
            foreignKey: 'userId',
            onDelete: 'CASCADE'
        });
    };

    return User;
};
