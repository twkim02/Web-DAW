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
                    include: [db.Asset] // Include file info
                }
            ]
        });

        if (!preset) return res.status(404).json({ message: 'Preset not found' });
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
                synthSettings: m.synthSettings || null // Optional if type=synth
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

        // 연결된 Post들을 먼저 삭제 (CASCADE 대신 명시적 삭제)
        await db.Post.destroy({
            where: {
                presetId: req.params.id
            },
            transaction: t
        });

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
