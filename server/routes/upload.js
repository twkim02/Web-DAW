const express = require('express');
const router = express.Router();
const { upload, deleteFromS3 } = require('../config/s3');
const db = require('../models');
const fs = require('fs');
const path = require('path');

// GET /upload - List all assets (optional filter by category)
router.get('/', async (req, res) => {
    try {
        const { category } = req.query;
        const whereClause = {};
        if (category) whereClause.category = category;

        const assets = await db.Asset.findAll({
            where: whereClause,
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

        // Multer-S3 adds 'location' and 'key' to req.file
        // Local multer adds 'path' and 'filename'
        const isS3 = !!req.file.location;
        const filename = req.file.key ? path.basename(req.file.key) : req.file.filename;
        const filePath = req.file.location || req.file.path;

        const { originalname: rawOriginalname, mimetype } = req.file;
        const { isRecorded, category } = req.body;

        // ECD: Fix for Korean/UTF-8 filenames (Multer Latin1 issue)
        let originalname = rawOriginalname;
        try {
            // Buffer.from(..., 'latin1') takes the raw bytes interpreted as latin1 and restores them
            // Then .toString('utf8') interprets them correctly as UTF8.
            // Only apply if it looks like it needs it? Hard to detect.
            // But Safe to try: if it IS utf8 already, this might mangle it if it contains latin1 chars that are valid?
            // Actually, Node.js Multer 1.4.x default behavior IS latin1.
            originalname = Buffer.from(rawOriginalname, 'latin1').toString('utf8');
        } catch (e) {
            console.warn('Encoding fix failed, using raw:', e);
        }

        const asset = await db.Asset.create({
            originalName: originalname,
            filename: filename, // Start using key as filename for consistency or keep meaningful name
            filePath: filePath, // This will be S3 URL for S3 files
            mimetype: mimetype,
            isRecorded: isRecorded === 'true' || isRecorded === true || false,
            category: category || 'sample',
            userId: req.user ? req.user.id : null,
            isPublic: true,
            storageType: isS3 ? 's3' : 'local',
            s3Key: isS3 ? req.file.key : null
        });

        res.json({
            message: 'File uploaded successfully',
            file: {
                ...asset.toJSON(),
                url: asset.url // Use virtual getter
            }
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
        for (const asset of assets) {
            if (asset.storageType === 's3' && asset.s3Key) {
                try {
                    await deleteFromS3(asset.s3Key);
                } catch (e) {
                    console.error(`Failed to delete S3 object: ${asset.s3Key}`, e);
                }
            } else if (asset.filePath && asset.storageType !== 's3') {
                // Local file deletion
                fs.unlink(asset.filePath, (err) => {
                    if (err) console.error(`Failed to delete file: ${asset.filePath}`, err);
                });
            }
        }

        // Pre-step: Nullify assetId in KeyMappings that reference these assets
        await db.KeyMapping.update({ assetId: null }, {
            where: {
                assetId: ids
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
