module.exports = (sequelize, DataTypes) => {
    const UserPreference = sequelize.define('UserPreference', {
        latencyMs: {
            type: DataTypes.INTEGER,
            defaultValue: 100,
            allowNull: false,
            comment: '오디오 출력 레이턴시 설정 (단위: 밀리초)'
        },
        visualizerMode: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: "사운드 비주얼라이저 디자인 타입 (예: 'waveform', 'spectrum', 'bars')"
        },
        defaultMasterVolume: {
            type: DataTypes.FLOAT,
            defaultValue: 0.7,
            allowNull: false,
            comment: '앱 시작 시 기본 마스터 볼륨 (0.0 ~ 1.0)'
        }
    }, {
        tableName: 'UserPreferences',
        underscored: true
    });

    UserPreference.associate = function (models) {
        // User와 1:1 관계 (사용자 삭제 시 설정도 삭제)
        UserPreference.belongsTo(models.User, { 
            foreignKey: 'userId',
            onDelete: 'CASCADE'
        });
    };

    return UserPreference;
};
