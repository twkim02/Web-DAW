const db = require('../models');
require('dotenv').config({ path: '../.env' });

async function initDB() {
    console.log('--- Initializing Database Schema ---');
    try {
        await db.sequelize.authenticate();
        console.log('✅ Connection has been established successfully.');

        // Sync all models
        await db.sequelize.sync({ alter: true });
        console.log('✅ All models were synchronized successfully.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
        process.exit(1);
    }
}

initDB();
