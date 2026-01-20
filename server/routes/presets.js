const express = require('express');
const router = express.Router();
const db = require('../models');

// Helper to ensure auth
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ message: 'Unauthorized' });
};

// GET /presets - List all presets for user
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const presets = await db.Preset.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']]
        });
        res.json(presets);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST /presets/:id/access - Record preset access (for tracking loaded presets)
router.post('/:id/access', async (req, res) => {
    try {
        const presetId = parseInt(req.params.id);
        const userId = req.user ? req.user.id : null;
        const sessionId = req.sessionID || null;

        // Check if preset exists
        const preset = await db.Preset.findByPk(presetId);
        if (!preset) {
            return res.status(404).json({ message: 'Preset not found' });
        }

        // Record access (upsert: update if exists, create if not)
        const [presetAccess, created] = await db.PresetAccess.findOrCreate({
            where: {
                userId: userId,
                presetId: presetId
            },
            defaults: {
                userId: userId,
                presetId: presetId,
                sessionId: sessionId,
                loadedAt: new Date()
            }
        });

        // Update loadedAt if already exists
        if (!created) {
            presetAccess.loadedAt = new Date();
            presetAccess.sessionId = sessionId;
            await presetAccess.save();
        }

        res.json({ success: true, message: 'Preset access recorded' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// GET /presets/:id - Get full preset with mappings
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const preset = await db.Preset.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            },
            include: [
                {
                    model: db.KeyMapping,
                    include: [
                        db.Asset, // Include file info
                        db.GraphicAsset // Include pad image info
                    ]
                }
            ]
        });

        if (!preset) return res.status(404).json({ message: 'Preset not found' });
        
        // Record access when user loads their own preset
        await db.PresetAccess.findOrCreate({
            where: {
                userId: req.user.id,
                presetId: preset.id
            },
            defaults: {
                userId: req.user.id,
                presetId: preset.id,
                loadedAt: new Date()
            }
        });

        res.json(preset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST /presets - Create new preset
router.post('/', isAuthenticated, async (req, res) => {
    const { title, bpm, mappings, settings, masterVolume, isQuantized } = req.body;
    // mappings: Array of { keyChar, mode, volume, type, assetId, note, synthSettings }
    // settings: JSON object { mixerLevels, effects, launchQuantization, theme, etc. }
    // masterVolume: Optional, defaults to 0.7
    // isQuantized: Optional, defaults to true

    const t = await db.sequelize.transaction();

    try {
        const preset = await db.Preset.create({
            title: title,
            bpm: bpm || 120,
            settings: settings || null, // Save global settings (mixerLevels, effects, etc.)
            masterVolume: masterVolume !== undefined ? masterVolume : 0.7,
            isQuantized: isQuantized !== undefined ? isQuantized : true,
            userId: req.user.id
        }, { transaction: t });

        if (mappings && mappings.length > 0) {
            const mappingData = mappings.map(m => ({
                presetId: preset.id,
                keyChar: m.keyChar,
                mode: m.mode,
                volume: m.volume,
                type: m.type,
                note: m.note || null,
                assetId: m.assetId || null, // Optional if file linked
                synthSettings: m.synthSettings || null, // Optional if type=synth
                graphicAssetId: m.graphicAssetId || null // Optional pad image
            }));

            await db.KeyMapping.bulkCreate(mappingData, { transaction: t });
        }

        await t.commit();
        res.json(preset);
    } catch (err) {
        await t.rollback();
        console.error(err);
        res.status(500).json({ message: 'Failed to save preset' });
    }
});

// DELETE /presets/:id - Delete a preset
router.delete('/:id', isAuthenticated, async (req, res) => {
    const t = await db.sequelize.transaction();

    try {
        // 먼저 preset이 존재하고 사용자 소유인지 확인
        const preset = await db.Preset.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            },
            transaction: t
        });

        if (!preset) {
            await t.rollback();
            return res.status(404).json({ message: 'Preset not found or unauthorized' });
        }

        // 연결된 Post들을 찾아서 ID 확보
        const posts = await db.Post.findAll({
            where: { presetId: req.params.id },
            attributes: ['id'],
            transaction: t
        });

        const postIds = posts.map(p => p.id);

        if (postIds.length > 0) {
            // 1. Post에 달린 Comment 삭제 (Cascade 수동 처리) -> Post를 삭제하지 않으므로 필요 없음
            // 하지만, 혹시 모르니 Post 자체를 update

            // 2. Post 업데이트: presetId = null (Snapshot 사용)
            await db.Post.update({ presetId: null }, {
                where: { id: postIds },
                transaction: t
            });
        }

        // 연결된 KeyMapping들을 삭제
        await db.KeyMapping.destroy({
            where: {
                presetId: req.params.id
            },
            transaction: t
        });

        // 마지막으로 Preset 삭제
        await db.Preset.destroy({
            where: {
                id: req.params.id,
                userId: req.user.id
            },
            transaction: t
        });

        await t.commit();
        res.json({ message: 'Preset deleted successfully' });
    } catch (err) {
        await t.rollback();
        console.error('Error deleting preset:', err);
        res.status(500).json({
            message: 'Server Error',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

module.exports = router;
