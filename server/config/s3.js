const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
require('dotenv').config();

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_BUCKET_NAME,
        limit: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
        acl: 'public-read', // Force public-read for all uploads
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            // Original logic: Date.now() + path.extname(file.originalname)
            // But we might want to organize folders e.g. "public/"
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            cb(null, `uploads/${uniqueSuffix}${ext}`);
        },
        contentType: multerS3.AUTO_CONTENT_TYPE // Automatically set content type
    })
});

// Helper to delete object
const deleteFromS3 = async (key) => {
    try {
        const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
        const command = new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
        });
        await s3.send(command);
        console.log(`Successfully deleted ${key} from S3`);
    } catch (err) {
        console.error('Error deleting from S3:', err);
        throw err;
    }
};

module.exports = { upload, deleteFromS3 };
