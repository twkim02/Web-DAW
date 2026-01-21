module.exports = (sequelize, DataTypes) => {
    const GraphicAsset = sequelize.define('GraphicAsset', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '소유자 사용자 ID (NULL이면 비로그인 사용자)'
        },
        originalName: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: '원본 파일명'
        },
        filename: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: '저장된 파일명'
        },
        filePath: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: '파일 경로 (로컬 경로 또는 S3 URL)'
        },
        mimetype: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'MIME 타입 (image/jpeg, image/png, image/gif, etc.)'
        },
        category: {
            type: DataTypes.ENUM('background', 'icon', 'texture', 'overlay', 'pad', 'other'),
            defaultValue: 'background',
            allowNull: false,
            comment: '그래픽 자산 카테고리'
        },
        width: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '이미지 너비 (픽셀)'
        },
        height: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '이미지 높이 (픽셀)'
        },
        fileSize: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '파일 크기 (바이트)'
        },
        isPublic: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
            comment: '공개 여부'
        },
        storageType: {
            type: DataTypes.ENUM('local', 's3'),
            defaultValue: 'local',
            allowNull: false,
            comment: '저장소 유형 (local: 로컬 디스크, s3: AWS S3)'
        },
        s3Key: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'S3 객체 키 (storageType이 s3일 때 사용)'
        },
        url: {
            type: DataTypes.VIRTUAL,
            get() {
                if (this.storageType === 's3' && this.s3Key) {
                    // Return full S3 URL
                    const bucketName = process.env.AWS_BUCKET_NAME;
                    const region = process.env.AWS_REGION;
                    if (bucketName && region) {
                        return `https://${bucketName}.s3.${region}.amazonaws.com/${this.s3Key}`;
                    }
                    // Fallback if env vars not set
                    return this.filePath;
                }
                // Local file: return relative path
                // filePath might be 'uploads/graphics/filename' or full path
                if (this.filePath && this.filePath.startsWith('uploads/')) {
                    return `/${this.filePath}`;
                }
                return `/uploads/graphics/${this.filename}`;
            }
        }
    }, {
        tableName: 'GraphicAssets',
        underscored: true
        // 인덱스는 컬럼 생성 후 수동으로 추가하거나, 
        // Sequelize가 컬럼을 먼저 생성한 후 자동으로 추가됩니다.
        // 임시로 주석 처리하여 컬럼이 먼저 생성되도록 함
        // indexes: [
        //     {
        //         fields: ['userId', 'category']
        //     },
        //     {
        //         fields: ['category']
        //     }
        // ]
    });

    GraphicAsset.associate = function (models) {
        GraphicAsset.belongsTo(models.User, { 
            foreignKey: 'userId',
            onDelete: 'CASCADE'
        });
        GraphicAsset.hasMany(models.KeyMapping, { foreignKey: 'graphicAssetId' });
    };

    // Override toJSON to ensure url virtual field is included
    GraphicAsset.prototype.toJSON = function() {
        const values = Object.assign({}, this.get());
        // Calculate url directly to ensure it's always correct
        // Access properties directly from the instance, not from values
        const storageType = this.getDataValue('storageType') || values.storageType;
        const s3Key = this.getDataValue('s3Key') || values.s3Key;
        const filename = this.getDataValue('filename') || values.filename;
        const filePath = this.getDataValue('filePath') || values.filePath;
        
        if (storageType === 's3' && s3Key) {
            const bucketName = process.env.AWS_BUCKET_NAME;
            const region = process.env.AWS_REGION;
            if (bucketName && region) {
                values.url = `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;
            } else {
                values.url = filePath || `/uploads/graphics/${filename}`;
            }
        } else {
            if (filePath && filePath.startsWith('uploads/')) {
                values.url = `/${filePath}`;
            } else {
                values.url = `/uploads/graphics/${filename}`;
            }
        }
        return values;
    };

    // 테이블 생성 후 인덱스 추가 (컬럼이 먼저 생성된 후)
    GraphicAsset.addIndexes = async function() {
        const sequelize = this.sequelize;
        const queryInterface = sequelize.getQueryInterface();
        
        try {
            // user_id 컬럼이 존재하는지 확인
            const tableDescription = await queryInterface.describeTable('GraphicAssets');
            if (!tableDescription.user_id) {
                console.log('user_id column does not exist yet, skipping index creation');
                return;
            }

            // 인덱스가 이미 존재하는지 확인
            const indexes = await queryInterface.showIndex('GraphicAssets');
            const hasUserIdCategoryIndex = indexes.some(idx => idx.name === 'graphic_assets_user_id_category');
            const hasCategoryIndex = indexes.some(idx => idx.name === 'graphic_assets_category');

            if (!hasUserIdCategoryIndex) {
                await queryInterface.addIndex('GraphicAssets', ['user_id', 'category'], {
                    name: 'graphic_assets_user_id_category'
                });
                console.log('Added index: graphic_assets_user_id_category');
            }

            if (!hasCategoryIndex) {
                await queryInterface.addIndex('GraphicAssets', ['category'], {
                    name: 'graphic_assets_category'
                });
                console.log('Added index: graphic_assets_category');
            }
        } catch (err) {
            // 인덱스가 이미 존재하거나 다른 이유로 실패하면 무시
            console.warn('Failed to add indexes to GraphicAssets (may already exist):', err.message);
        }
    };

    return GraphicAsset;
};
