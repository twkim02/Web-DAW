const db = require('../models');

async function updateSchema() {
    try {
        console.log('Starting schema update...');
        // Add storage_type column
        try {
            await db.sequelize.query("ALTER TABLE Assets ADD COLUMN storage_type TEXT DEFAULT 'local';");
            console.log('Added storage_type column');
        } catch (e) {
            console.log('storage_type column might already exist:', e.message);
        }

        // Add s3_key column
        try {
            await db.sequelize.query("ALTER TABLE Assets ADD COLUMN s3_key TEXT;");
            console.log('Added s3_key column');
        } catch (e) {
            console.log('s3_key column might already exist:', e.message);
        }

        console.log('Schema update completed.');
    } catch (err) {
        console.error('Schema update failed:', err);
    } finally {
        process.exit();
    }
}

updateSchema();
