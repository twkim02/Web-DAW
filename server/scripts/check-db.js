require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkAndCreateDB() {
    const { DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

    console.log(`Connecting to MySQL Server at ${DB_HOST}...`);

    try {
        // 1. Connect to MySQL Server (no DB selected yet)
        const connection = await mysql.createConnection({
            host: DB_HOST,
            user: DB_USERNAME,
            password: DB_PASSWORD,
            port: DB_PORT
        });

        console.log('✅ Connected to MySQL Server successfully!');

        // 2. Check if Database exists
        const [rows] = await connection.query(`SHOW DATABASES LIKE '${DB_NAME}'`);

        if (rows.length === 0) {
            console.log(`⚠️ Database '${DB_NAME}' does not exist.`);
            console.log(`Creating database '${DB_NAME}'...`);
            await connection.query(`CREATE DATABASE \`${DB_NAME}\``);
            console.log(`✅ Database '${DB_NAME}' created successfully!`);
        } else {
            console.log(`✅ Database '${DB_NAME}' already exists.`);
        }

        await connection.end();
        process.exit(0);

    } catch (err) {
        console.error('❌ Connection Failed:', err.message);
        if (err.code === 'ETIMEDOUT') {
            console.error('Hint: Check your AWS Security Group rules (allow inbound 3306 from My IP).');
        }
        process.exit(1);
    }
}

checkAndCreateDB();
