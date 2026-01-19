const express = require('express');
const passport = require('passport');
const router = express.Router();

// Check if Google OAuth is configured
const isGoogleOAuthConfigured = () => {
    return !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
};

// GET /auth/google
router.get('/google', (req, res, next) => {
    if (!isGoogleOAuthConfigured()) {
        return res.status(503).json({
            message: 'Google OAuth is not configured. Please use Dev Login or set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.'
        });
    }
    const state = req.query.state ? req.query.state : undefined;
    passport.authenticate('google', { scope: ['profile', 'email'], state: state })(req, res, next);
});

// GET /auth/google/callback
router.get('/google/callback',
    (req, res, next) => {
        if (!isGoogleOAuthConfigured()) {
            return res.status(503).json({
                message: 'Google OAuth is not configured. Please use Dev Login.'
            });
        }
        passport.authenticate('google', { failureRedirect: '/' })(req, res, next);
    },
    (req, res) => {
        // Successful authentication
        // Google Strategy should preserve 'state' in req.query.state if configured,
        // but often it matches the request query params.
        const returnTo = req.query.state ? decodeURIComponent(req.query.state) : '/';
        const clientBase = 'http://localhost:5173';
        res.redirect(`${clientBase}${returnTo}`);
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

            const returnTo = req.query.returnTo ? decodeURIComponent(req.query.returnTo) : '/community';
            res.redirect(`http://localhost:5173${returnTo}`);
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Dev login failed');
    }
});

// GET /auth/logout
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed', error: err.message });
        }
        // JSON 응답 반환 (프론트엔드에서 처리)
        res.json({ message: 'Logged out successfully' });
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
