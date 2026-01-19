const db = require('../models');

async function updateSchema() {
    try {
        console.log('Adding preset_data column to Posts table...');

        try {
            await db.sequelize.query("ALTER TABLE Posts ADD COLUMN preset_data TEXT;");
            console.log('Added preset_data column');
        } catch (e) {
            console.log('preset_data column might already exist:', e.message);
        }

        console.log('Schema update completed.');
    } catch (err) {
        console.error('Schema update failed:', err);
    } finally {
        process.exit();
    }
}

updateSchema();
