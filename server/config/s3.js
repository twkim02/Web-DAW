const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
require('dotenv').config();

const isAwsConfigured = process.env.ENABLE_AWS_STORAGE === 'true' &&
    process.env.AWS_REGION &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_BUCKET_NAME;

console.log(`[Storage Config] S3 Enabled: ${isAwsConfigured} (Local fallback active)`);

let upload;

if (isAwsConfigured) {
    const s3 = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
    });

    upload = multer({
        storage: multerS3({
            s3: s3,
            bucket: process.env.AWS_BUCKET_NAME,
            limit: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
            acl: 'public-read',
            metadata: function (req, file, cb) {
                cb(null, { fieldName: file.fieldname });
            },
            key: function (req, file, cb) {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = path.extname(file.originalname);
                cb(null, `uploads/${uniqueSuffix}${ext}`);
            },
            contentType: multerS3.AUTO_CONTENT_TYPE
        })
    });
} else {
    // Local Storage Fallback
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            const uploadDir = 'uploads/';
            // Ensure directory exists
            const fs = require('fs');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, uniqueSuffix + path.extname(file.originalname));
        }
    });

    upload = multer({ storage: storage, limits: { fileSize: 50 * 1024 * 1024 } });
}

// Export s3 for deletion logic, but handle if it's not initialized
const s3Client = isAwsConfigured ? new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
}) : null;

// Helper to delete object
const deleteFromS3 = async (key) => {
    if (!s3Client) {
        console.warn('Skipping S3 delete: AWS not configured');
        return;
    }
    try {
        const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
        const command = new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
        });
        await s3Client.send(command);
        console.log(`Successfully deleted ${key} from S3`);
    } catch (err) {
        console.error('Error deleting from S3:', err);
        throw err;
    }
};

module.exports = { upload, deleteFromS3 };
