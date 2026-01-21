const db = require('./models');

async function checkAssets() {
    try {
        const assets = await db.Asset.findAll({ limit: 5, order: [['createdAt', 'DESC']] });
        console.log('--- ASSET DEBUG ---');
        assets.forEach(a => {
            console.log(`ID: ${a.id}`);
            console.log(`Storage: ${a.storageType}`);
            console.log(`Filename: ${a.filename}`);
            console.log(`FilePath: ${a.filePath}`);
            console.log(`Virtual URL: ${a.url}`); // Check if virtual field works
            console.log('JSON:', JSON.stringify(a)); // Check serialization
            console.log('-------------------');
        });
    } catch (err) {
        console.error(err);
    } finally {
        await db.sequelize.close();
    }
}

checkAssets();
