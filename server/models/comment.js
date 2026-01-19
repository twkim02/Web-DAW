module.exports = (sequelize, DataTypes) => {
    const Comment = sequelize.define('Comment', {
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
            comment: '댓글 내용'
        }
    }, {
        tableName: 'Comments',
        underscored: true
    });

    Comment.associate = function (models) {
        Comment.belongsTo(models.User, { foreignKey: 'userId', onDelete: 'CASCADE' });
        Comment.belongsTo(models.Post, { foreignKey: 'postId', onDelete: 'CASCADE' });
    };

    return Comment;
};
