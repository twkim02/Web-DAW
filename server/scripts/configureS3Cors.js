require('dotenv').config();
const { S3Client, PutBucketCorsCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const corsRules = [
    {
        AllowedHeaders: ["*"],
        AllowedMethods: ["GET", "HEAD", "PUT", "POST", "DELETE"],
        AllowedOrigins: ["*"], // Allow all for development flexibility
        ExposeHeaders: ["ETag"]
    }
];

async function configureCors() {
    console.log(`Configuring CORS for bucket: ${process.env.AWS_BUCKET_NAME}...`);

    try {
        const command = new PutBucketCorsCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            CORSConfiguration: {
                CORSRules: corsRules
            }
        });

        await s3.send(command);
        console.log("Successfully set CORS configuration!");
    } catch (err) {
        console.error("Error setting CORS:", err);
    }
}

configureCors();
