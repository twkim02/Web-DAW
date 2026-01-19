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
            type: DataTypes.JSON, // Stores global state: mixerLevels, effects, etc.
            allowNull: true
        }
    }, {
        tableName: 'Presets',
        underscored: true
    });

    Preset.associate = function (models) {
        Preset.belongsTo(models.User, { foreignKey: 'userId' });
        Preset.hasMany(models.KeyMapping, { foreignKey: 'presetId' });
    };

    return Preset;
};
