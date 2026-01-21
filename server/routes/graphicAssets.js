const express = require('express');
const router = express.Router();
const { upload, deleteFromS3 } = require('../config/s3');
const db = require('../models');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');

// Helper to ensure auth (optional for public assets)
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ message: 'Unauthorized' });
};

// Helper to get image dimensions (optional, requires sharp or similar)
const getImageDimensions = async (filePath) => {
    try {
        // For now, return null. Can be enhanced with sharp library later
        // const sharp = require('sharp');
        // const metadata = await sharp(filePath).metadata();
        // return { width: metadata.width, height: metadata.height };
        return { width: null, height: null };
    } catch (err) {
        console.warn('Failed to get image dimensions:', err);
        return { width: null, height: null };
    }
};

// GET /graphic-assets - List graphic assets
// 필터링 규칙:
// - 비로그인: 공개된 asset만 (isPublic: true)
// - 로그인: 본인이 업로드한 asset + 공개된 asset
router.get('/', async (req, res) => {
    try {
        const { category } = req.query;
        const userId = req.user ? req.user.id : null;
        
        const whereClause = {};

        if (category) {
            whereClause.category = category;
        }

        // Filter by access rights
        if (!userId) {
            // 비로그인: 공개된 asset만
            whereClause.isPublic = true;
        } else {
            // 로그인: 본인 asset 또는 공개된 asset
            whereClause[Op.or] = [
                { userId: userId },
                { isPublic: true }
            ];
        }

        const assets = await db.GraphicAsset.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']]
        });

        res.json(assets);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// GET /graphic-assets/:id - Get single graphic asset
router.get('/:id', async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null;
        
        const asset = await db.GraphicAsset.findByPk(req.params.id);

        if (!asset) {
            return res.status(404).json({ message: 'Graphic asset not found' });
        }

        // Check access rights
        if (!asset.isPublic && (!userId || asset.userId !== userId)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(asset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST /graphic-assets - Upload graphic asset
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

        const { originalname, mimetype, size } = req.file;
        const { category = 'background', isPublic = false } = req.body;

        // Validate category
        const validCategories = ['background', 'icon', 'texture', 'overlay', 'pad', 'other'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ message: 'Invalid category' });
        }

        // Get image dimensions (optional)
        const dimensions = await getImageDimensions(filePath);

        // Create graphics upload directory if local
        let finalFilePath = filePath;
        if (!isS3) {
            const graphicsPath = path.join(__dirname, '../uploads/graphics');
            if (!fs.existsSync(graphicsPath)) {
                fs.mkdirSync(graphicsPath, { recursive: true });
            }
            // Move file to graphics subdirectory
            const newPath = path.join(graphicsPath, filename);
            if (filePath !== newPath && fs.existsSync(filePath)) {
                try {
                    fs.renameSync(filePath, newPath);
                    finalFilePath = newPath;
                } catch (err) {
                    console.warn('Failed to move file to graphics directory:', err);
                    // Continue with original path
                }
            }
        }

        const asset = await db.GraphicAsset.create({
            originalName: originalname,
            filename: filename,
            filePath: isS3 ? filePath : path.relative(path.join(__dirname, '..'), finalFilePath).replace(/\\/g, '/'),
            mimetype: mimetype,
            category: category,
            width: dimensions.width,
            height: dimensions.height,
            fileSize: size,
            isPublic: isPublic === 'true' || isPublic === true,
            userId: req.user ? req.user.id : null,
            storageType: isS3 ? 's3' : 'local',
            s3Key: isS3 ? req.file.key : null
        });

        // Ensure URL is included in response (virtual getter might not be in toJSON)
        const assetData = asset.toJSON();
        assetData.url = asset.url; // Explicitly add virtual getter
        
        res.json({
            message: 'Graphic asset uploaded successfully',
            asset: assetData
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// DELETE /graphic-assets/:id - Delete graphic asset
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const asset = await db.GraphicAsset.findByPk(req.params.id);

        if (!asset) {
            return res.status(404).json({ message: 'Graphic asset not found' });
        }

        // Check ownership
        if (asset.userId !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Delete file
        if (asset.storageType === 's3' && asset.s3Key) {
            try {
                await deleteFromS3(asset.s3Key);
            } catch (e) {
                console.error(`Failed to delete S3 object: ${asset.s3Key}`, e);
            }
        } else if (asset.filePath && asset.storageType !== 's3') {
            // Local file deletion
            const fullPath = path.join(__dirname, '..', asset.filePath);
            fs.unlink(fullPath, (err) => {
                if (err) console.error(`Failed to delete file: ${fullPath}`, err);
            });
        }

        // Delete DB record
        await asset.destroy();

        res.json({ message: 'Graphic asset deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST /graphic-assets/delete - Batch delete
router.post('/delete', isAuthenticated, async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No IDs provided' });
        }

        const assets = await db.GraphicAsset.findAll({
            where: {
                id: ids,
                userId: req.user.id // Only delete own assets
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
                const fullPath = path.join(__dirname, '..', asset.filePath);
                fs.unlink(fullPath, (err) => {
                    if (err) console.error(`Failed to delete file: ${fullPath}`, err);
                });
            }
        }

        // Delete DB records
        await db.GraphicAsset.destroy({
            where: {
                id: ids,
                userId: req.user.id
            }
        });

        res.json({ message: 'Graphic assets deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// PUT /graphic-assets/:id - Update graphic asset (name, isPublic, etc.)
router.put('/:id', isAuthenticated, async (req, res) => {
    try {
        const { originalName, isPublic } = req.body;

        const asset = await db.GraphicAsset.findByPk(req.params.id);

        if (!asset) {
            return res.status(404).json({ message: 'Graphic asset not found' });
        }

        // Check ownership
        if (asset.userId !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        if (originalName !== undefined) asset.originalName = originalName;
        if (isPublic !== undefined) asset.isPublic = isPublic === true || isPublic === 'true';

        await asset.save();

        res.json({
            message: 'Graphic asset updated successfully',
            asset: {
                ...asset.toJSON(),
                url: asset.url
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
