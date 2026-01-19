const db = require('../models');

async function checkColumns() {
    try {
        const tableInfo = await db.sequelize.getQueryInterface().describeTable('Assets');
        console.log('Current Assets Table Columns:', Object.keys(tableInfo));
    } catch (error) {
        console.error('Error checking columns:', error);
    }
}

checkColumns();
