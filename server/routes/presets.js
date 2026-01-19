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
    const { title, bpm, mappings, settings } = req.body;
    // mappings: Array of { keyChar, mode, volume, type, assetId }
    // settings: JSON object { mixerLevels, effects, ... }

    const t = await db.sequelize.transaction();

    try {
        const preset = await db.Preset.create({
            title: title,
            bpm: bpm,
            settings: settings, // Save global settings
            userId: req.user.id
        }, { transaction: t });

        if (mappings && mappings.length > 0) {
            const mappingData = mappings.map(m => ({
                presetId: preset.id,
                keyChar: m.keyChar,
                mode: m.mode,
                volume: m.volume,
                type: m.type,
                assetId: m.assetId // Optional if file linked
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
    try {
        const result = await db.Preset.destroy({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });

        if (result === 0) {
            return res.status(404).json({ message: 'Preset not found or unauthorized' });
        }

        res.json({ message: 'Preset deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
