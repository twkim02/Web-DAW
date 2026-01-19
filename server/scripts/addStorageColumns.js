const db = require('../models');

async function addColumns() {
    const queryInterface = db.sequelize.getQueryInterface();
    const table = 'Assets';

    try {
        console.log('Checking Assets table columns...');
        const tableInfo = await queryInterface.describeTable(table);

        if (!tableInfo.storage_type) {
            console.log('Adding storage_type column...');
            await queryInterface.addColumn(table, 'storage_type', {
                type: db.Sequelize.STRING, // SQLite doesn't strictly enforce ENUM
                defaultValue: 'local'
            });
        } else {
            console.log('storage_type column already exists.');
        }

        if (!tableInfo.s3_key) {
            console.log('Adding s3_key column...');
            await queryInterface.addColumn(table, 's3_key', {
                type: db.Sequelize.STRING,
                allowNull: true
            });
        } else {
            console.log('s3_key column already exists.');
        }

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

addColumns();
