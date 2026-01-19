const express = require('express');
const router = express.Router();
const db = require('../models');

// Helper to ensure auth
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ message: 'Unauthorized' });
};

// GET /api/user/preferences - Get user preferences
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const preferences = await db.UserPreference.findOne({
            where: { userId: req.user.id }
        });

        // If preferences don't exist, return default values
        if (!preferences) {
            return res.json({
                id: null,
                userId: req.user.id,
                latencyMs: 100,
                visualizerMode: null,
                defaultMasterVolume: 0.7,
                createdAt: null,
                updatedAt: null
            });
        }

        res.json(preferences);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// PUT /api/user/preferences - Update user preferences (create if not exists)
router.put('/', isAuthenticated, async (req, res) => {
    try {
        const { latencyMs, visualizerMode, defaultMasterVolume } = req.body;

        // Validate input
        if (latencyMs !== undefined && (typeof latencyMs !== 'number' || latencyMs < 0)) {
            return res.status(400).json({ message: 'latencyMs must be a non-negative number' });
        }
        if (defaultMasterVolume !== undefined && 
            (typeof defaultMasterVolume !== 'number' || defaultMasterVolume < 0 || defaultMasterVolume > 1)) {
            return res.status(400).json({ message: 'defaultMasterVolume must be a number between 0 and 1' });
        }

        // Find or create preferences
        const [preferences, created] = await db.UserPreference.findOrCreate({
            where: { userId: req.user.id },
            defaults: {
                latencyMs: latencyMs !== undefined ? latencyMs : 100,
                visualizerMode: visualizerMode !== undefined ? visualizerMode : null,
                defaultMasterVolume: defaultMasterVolume !== undefined ? defaultMasterVolume : 0.7
            }
        });

        // Update if already exists
        if (!created) {
            if (latencyMs !== undefined) preferences.latencyMs = latencyMs;
            if (visualizerMode !== undefined) preferences.visualizerMode = visualizerMode;
            if (defaultMasterVolume !== undefined) preferences.defaultMasterVolume = defaultMasterVolume;
            
            await preferences.save();
        }

        res.json(preferences);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to update preferences' });
    }
});

// POST /api/user/preferences - Create user preferences (only if not exists)
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { latencyMs, visualizerMode, defaultMasterVolume } = req.body;

        // Validate input
        if (latencyMs !== undefined && (typeof latencyMs !== 'number' || latencyMs < 0)) {
            return res.status(400).json({ message: 'latencyMs must be a non-negative number' });
        }
        if (defaultMasterVolume !== undefined && 
            (typeof defaultMasterVolume !== 'number' || defaultMasterVolume < 0 || defaultMasterVolume > 1)) {
            return res.status(400).json({ message: 'defaultMasterVolume must be a number between 0 and 1' });
        }

        // Check if preferences already exist
        const existing = await db.UserPreference.findOne({
            where: { userId: req.user.id }
        });

        if (existing) {
            return res.status(409).json({ 
                message: 'Preferences already exist. Use PUT to update.',
                preferences: existing
            });
        }

        // Create new preferences
        const preferences = await db.UserPreference.create({
            userId: req.user.id,
            latencyMs: latencyMs !== undefined ? latencyMs : 100,
            visualizerMode: visualizerMode !== undefined ? visualizerMode : null,
            defaultMasterVolume: defaultMasterVolume !== undefined ? defaultMasterVolume : 0.7
        });

        res.status(201).json(preferences);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to create preferences' });
    }
});

module.exports = router;
