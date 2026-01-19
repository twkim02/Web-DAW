module.exports = (sequelize, DataTypes) => {
    const Post = sequelize.define('Post', {
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: '게시글 제목'
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '프로젝트 설명 또는 사용법'
        },
        likeCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
            comment: '좋아요 수 (인기 순 정렬용)'
        },
        downloadCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
            comment: '본인 프로젝트로 가져간 횟수'
        },
        isPublished: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false,
            comment: '공개 여부'
        }
    }, {
        tableName: 'Posts',
        underscored: true
    });

    Post.associate = function (models) {
        // User와 N:1 관계 (작성자, 사용자 삭제 시 게시글도 삭제)
        Post.belongsTo(models.User, { 
            foreignKey: 'userId',
            onDelete: 'CASCADE'
        });
        
        // Preset과 N:1 관계 (하나의 프리셋에 여러 게시글 가능, 프리셋 삭제 시 연쇄 삭제)
        Post.belongsTo(models.Preset, { 
            foreignKey: 'presetId',
            onDelete: 'CASCADE' // 프리셋 삭제 시 연결된 게시글도 함께 삭제
        });
    };

    return Post;
};
