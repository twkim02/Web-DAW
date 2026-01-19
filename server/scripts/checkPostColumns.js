const db = require('../models');

async function checkPostColumns() {
    try {
        console.log('Checking Posts table columns...');
        const [results] = await db.sequelize.query("PRAGMA table_info(Posts);");
        console.log(results);
        process.exit();
    } catch (err) {
        console.error('Check failed:', err);
    }
}

checkPostColumns();
