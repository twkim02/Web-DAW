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
            type: DataTypes.ENUM('sample', 'synth', 'instrument', 'background'),
            defaultValue: 'sample',
            comment: '파일 카테고리 (sample: 샘플 파일, synth: 신스 프리셋, instrument: 악기 프리셋, background: 배경화면)'
        },
        isPublic: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
            comment: '공개 여부 (Posts/Presets를 통해 공개될 수 있음)'
        },
        storageType: {
            type: DataTypes.ENUM('local', 's3'),
            defaultValue: 'local',
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
                    return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${this.s3Key}`;
                }
                return `/uploads/${this.filename}`;
            }
        }
    }, {
        tableName: 'Assets',
        underscored: true
    });

    Asset.associate = function (models) {
        Asset.belongsTo(models.User, { foreignKey: 'userId' });
        Asset.hasMany(models.KeyMapping, { foreignKey: 'assetId' });
    };

    // Override toJSON to ensure url virtual field is included
    Asset.prototype.toJSON = function() {
        const values = Object.assign({}, this.get());
        // Calculate url directly to ensure it's always correct
        // Access properties directly from the instance, not from values
        const storageType = this.getDataValue('storageType') || values.storageType;
        const s3Key = this.getDataValue('s3Key') || values.s3Key;
        const filename = this.getDataValue('filename') || values.filename;
        
        if (storageType === 's3' && s3Key) {
            const bucketName = process.env.AWS_BUCKET_NAME;
            const region = process.env.AWS_REGION;
            if (bucketName && region) {
                values.url = `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;
            } else {
                values.url = values.filePath || `/uploads/${filename}`;
            }
        } else {
            values.url = `/uploads/${filename}`;
        }
        return values;
    };

    return Asset;
};
