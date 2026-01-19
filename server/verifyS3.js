require('dotenv').config();
const { S3Client, ListObjectsCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

async function run() {
    console.log('Testing S3 Connection...');
    console.log('Region:', process.env.AWS_REGION);
    console.log('Bucket:', process.env.AWS_BUCKET_NAME);
    try {
        const data = await s3.send(new ListObjectsCommand({ Bucket: process.env.AWS_BUCKET_NAME, MaxKeys: 1 }));
        console.log("Success! Connected to bucket.");
    } catch (err) {
        console.log("Error connecting to S3:", err.name, err.message);
    }
}
run();
