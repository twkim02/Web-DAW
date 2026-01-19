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
    const { title, bpm, masterVolume, isQuantized, mappings } = req.body;
    // mappings: Array of { keyChar, mode, volume, type, assetId, synthSettings }

    const t = await db.sequelize.transaction();

    try {
        const preset = await db.Preset.create({
            title: title,
            bpm: bpm || 120,
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

module.exports = router;
