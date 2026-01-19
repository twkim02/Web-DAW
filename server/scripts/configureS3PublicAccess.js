require('dotenv').config();
const { S3Client, PutBucketPolicyCommand, PutPublicAccessBlockCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

async function configurePublicAccess() {
    console.log(`Configuring Public Access for bucket: ${BUCKET_NAME}...`);

    try {
        // 1. Disable "Block Public Access" (S3 Block Public Access settings)
        console.log("Step 1: Disabling 'Block all public access'...");
        const blockCommand = new PutPublicAccessBlockCommand({
            Bucket: BUCKET_NAME,
            PublicAccessBlockConfiguration: {
                BlockPublicAcls: false,
                IgnorePublicAcls: false,
                BlockPublicPolicy: false,
                RestrictPublicBuckets: false
            }
        });
        await s3.send(blockCommand);
        console.log("  -> 'Block Public Access' disabled.");

        // 2. Set Bucket Policy to Allow Public Read
        console.log("Step 2: Setting Bucket Policy for Public Read...");
        const policy = {
            Version: "2012-10-17",
            Statement: [
                {
                    Sid: "PublicReadGetObject",
                    Effect: "Allow",
                    Principal: "*",
                    Action: "s3:GetObject",
                    Resource: `arn:aws:s3:::${BUCKET_NAME}/*`
                }
            ]
        };

        const policyCommand = new PutBucketPolicyCommand({
            Bucket: BUCKET_NAME,
            Policy: JSON.stringify(policy)
        });

        await s3.send(policyCommand);
        console.log("  -> Bucket Policy updated successfully to allow public read.");
        console.log("Success! Your bucket is now public.");

    } catch (err) {
        console.error("Error configuration public access:", err);
    }
}

configurePublicAccess();
