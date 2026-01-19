const express = require('express');
const router = express.Router({ mergeParams: true }); // Access parent params if nested
const db = require('../models');

// Helper to ensure auth
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ message: 'Unauthorized' });
};

// GET /api/posts/:postId/comments
router.get('/', async (req, res) => {
    try {
        const comments = await db.Comment.findAll({
            where: { postId: req.params.postId },
            include: [{
                model: db.User,
                attributes: ['id', 'nickname', 'avatarUrl']
            }],
            order: [['createdAt', 'ASC']]
        });
        res.json(comments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST /api/posts/:postId/comments
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) return res.status(400).json({ message: 'Content is required' });

        const comment = await db.Comment.create({
            content,
            postId: req.params.postId,
            userId: req.user.id
        });

        // Return full comment with user data
        const fullComment = await db.Comment.findByPk(comment.id, {
            include: [{
                model: db.User,
                attributes: ['id', 'nickname', 'avatarUrl']
            }]
        });

        res.json(fullComment);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to create comment' });
    }
});

// DELETE /api/posts/:postId/comments/:id
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const comment = await db.Comment.findByPk(req.params.id);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        // Check ownership
        if (comment.userId !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        await comment.destroy();
        res.json({ message: 'Comment deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to delete comment' });
    }
});

module.exports = router;
