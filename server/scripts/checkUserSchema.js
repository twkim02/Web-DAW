const db = require('../models');

async function checkUserSchema() {
    try {
        console.log('Checking User table columns...');
        const [results] = await db.sequelize.query("PRAGMA table_info(Users);");
        console.log(results);
        process.exit();
    } catch (err) {
        console.error('Check failed:', err);
    }
}

checkUserSchema();
