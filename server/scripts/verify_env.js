const mysql = require('mysql2/promise');
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: './.env' });


async function checkDatabase() {
    console.log('--- Checking MySQL Database ---');
    console.log(`Connecting to ${process.env.DB_HOST} as ${process.env.DB_USERNAME}...`);

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
        });

        console.log('✅ Connected to MySQL server.');

        const [rows] = await connection.query(`SHOW DATABASES LIKE '${process.env.DB_NAME}';`);
        if (rows.length > 0) {
            console.log(`✅ Database '${process.env.DB_NAME}' exists.`);
        } else {
            console.error(`❌ Database '${process.env.DB_NAME}' DOES NOT EXIST.`);
            console.log(`Attempting to create database '${process.env.DB_NAME}'...`);
            await connection.query(`CREATE DATABASE \`${process.env.DB_NAME}\`;`);
            console.log(`✅ Database '${process.env.DB_NAME}' created.`);
        }

        // Check for Users table and columns
        await connection.query(`USE \`${process.env.DB_NAME}\`;`);
        try {
            const [columns] = await connection.query(`DESCRIBE Users;`);
            console.log('✅ Table \'Users\' columns:', columns.map(c => c.Field).join(', '));
        } catch (e) {
            console.error(`❌ Table 'Users' check failed: ${e.message}`);
        }

        await connection.end();
        return true;
    } catch (err) {
        console.error('❌ Database Check Failed:', err.message);
        return false;
    }
}

async function checkS3() {
    console.log('\n--- Checking AWS S3 ---');
    const s3 = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
    });

    try {
        const command = new ListBucketsCommand({});
        const response = await s3.send(command);
        console.log('✅ AWS S3 Connection Successful.');

        const bucketExists = response.Buckets.some(b => b.Name === process.env.AWS_BUCKET_NAME);
        if (bucketExists) {
            console.log(`✅ Bucket '${process.env.AWS_BUCKET_NAME}' found.`);
        } else {
            console.warn(`⚠️ Bucket '${process.env.AWS_BUCKET_NAME}' NOT found in account.`);
        }
        return true;
    } catch (err) {
        console.error('❌ AWS S3 Check Failed:', err.message);
        return false;
    }
}

async function run() {
    const dbOk = await checkDatabase();
    const s3Ok = await checkS3();

    if (dbOk && s3Ok) {
        console.log('\n✅ Environment Verification Passed.');
        process.exit(0);
    } else {
        console.error('\n❌ Environment Verification Failed.');
        process.exit(1);
    }
}

run();
