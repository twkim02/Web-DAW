const db = require('../models');

async function updateSchema() {
    try {
        console.log('Starting schema update for Posts...');

        // Add tags column
        try {
            await db.sequelize.query("ALTER TABLE Posts ADD COLUMN tags TEXT;");
            console.log('Added tags column');
        } catch (e) {
            console.log('tags column might already exist:', e.message);
        }

        // Add genre column
        try {
            await db.sequelize.query("ALTER TABLE Posts ADD COLUMN genre TEXT;");
            console.log('Added genre column');
        } catch (e) {
            console.log('genre column might already exist:', e.message);
        }

        console.log('Schema update completed.');
    } catch (err) {
        console.error('Schema update failed:', err);
    } finally {
        process.exit();
    }
}

updateSchema();
