const db = require('../models');

async function migrate() {
    try {
        console.log('Starting migration...');
        const queryInterface = db.sequelize.getQueryInterface();

        // Add 'color' column
        try {
            await queryInterface.addColumn('KeyMappings', 'color', {
                type: db.Sequelize.STRING,
                allowNull: true
            });
            console.log('Added column: color');
        } catch (e) {
            console.log('Column "color" might already exist or failed:', e.original ? e.original.message : e.message);
        }

        // Add 'image' column
        try {
            await queryInterface.addColumn('KeyMappings', 'image', {
                type: db.Sequelize.TEXT,
                allowNull: true
            });
            console.log('Added column: image');
        } catch (e) {
            console.log('Column "image" might already exist or failed:', e.original ? e.original.message : e.message);
        }

        console.log('Migration complete.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
