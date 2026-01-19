const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const db = require('../models');
const fs = require('fs');

// GET /upload - List all assets
router.get('/', async (req, res) => {
    try {
        const assets = await db.Asset.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.json(assets);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST /upload
router.post('/', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        if (!req.user) {
            // For Phase 1/2 demo without strict login enforcement, we might mock a user or require login
            // return res.status(401).json({ message: 'Unauthorized' });
        }

        const { originalname, filename, path: filePath, mimetype, size } = req.file;
        const { isRecorded } = req.body; // Optional: 'true' or 'false' as string from form data

        const asset = await db.Asset.create({
            originalName: originalname,
            filename: filename,
            filePath: filePath,
            mimetype: mimetype,
            isRecorded: isRecorded === 'true' || isRecorded === true || false, // Default to false for uploads
            userId: req.user ? req.user.id : null // Allow null for guest uploads if desired
        });

        res.json({
            message: 'File uploaded successfully',
            file: asset
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST /upload/delete - Batch delete assets
router.post('/delete', async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No IDs provided' });
        }

        const assets = await db.Asset.findAll({
            where: {
                id: ids
            }
        });

        // Delete files
        assets.forEach(asset => {
            if (asset.filePath) {
                fs.unlink(asset.filePath, (err) => {
                    if (err) console.error(`Failed to delete file: ${asset.filePath}`, err);
                });
            }
        });

        // Delete DB Records
        await db.Asset.destroy({
            where: {
                id: ids
            }
        });

        res.json({ message: 'Assets deleted successfully' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// PUT /upload/rename
router.put('/rename', async (req, res) => {
    try {
        const { id, newName } = req.body;

        if (!id || !newName) {
            return res.status(400).json({ message: 'Missing id or newName' });
        }

        const asset = await db.Asset.findByPk(id);
        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        asset.originalName = newName;
        await asset.save();

        res.json({ message: 'Asset renamed successfully', asset });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
