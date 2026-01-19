const express = require('express');
const passport = require('passport');
const router = express.Router();

// GET /auth/google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// GET /auth/google/callback
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        // Successful authentication, redirect frontend.
        // In dev, usually redirect to client URL.
        res.redirect('http://localhost:5173/');
    }
);

// Dev Login Route (Bypass Google)
router.get('/dev_login', async (req, res) => {
    try {
        const { User } = require('../models');
        const [user] = await User.findOrCreate({
            where: { googleId: 'dev_user_123' },
            defaults: {
                email: 'dev@example.com',
                nickname: 'Dev User'
            }
        });

        req.login(user, (err) => {
            if (err) return res.status(500).json({ error: err });
            res.redirect('http://localhost:5173/');
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Dev login failed');
    }
});

// GET /auth/logout
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.sendStatus(200);
    });
});

// GET /auth/user (Check session)
router.get('/user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json(req.user);
    } else {
        res.status(401).json({ message: 'Not authenticated' });
    }
});

module.exports = router;
