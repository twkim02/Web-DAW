const express = require('express');
const router = express.Router();
const db = require('../models');
const { Op } = require('sequelize');

// Helper to ensure auth
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ message: 'Unauthorized' });
};

// Helper to check if user is the owner of the post
const isOwner = async (req, res, next) => {
    try {
        const post = await db.Post.findByPk(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        if (post.userId !== req.user.id) {
            return res.status(403).json({ message: 'Forbidden: You are not the owner of this post' });
        }
        req.post = post; // Attach post to request for later use
        next();
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// GET /api/posts - List all published posts (with pagination and sorting)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sort = req.query.sort || 'created'; // 'created' or 'popular'
        const offset = (page - 1) * limit;

        // Build order clause
        let order;
        if (sort === 'popular') {
            order = [['likeCount', 'DESC'], ['createdAt', 'DESC']];
        } else {
            order = [['createdAt', 'DESC']];
        }

        // Find all published posts
        const { count, rows: posts } = await db.Post.findAndCountAll({
            where: {
                isPublished: true
            },
            include: [
                {
                    model: db.User,
                    attributes: ['id', 'nickname', 'email']
                },
                {
                    model: db.Preset,
                    attributes: ['id', 'title', 'bpm']
                }
            ],
            order: order,
            limit: limit,
            offset: offset
        });

        res.json({
            posts: posts,
            total: count,
            page: page,
            limit: limit,
            totalPages: Math.ceil(count / limit)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// GET /api/posts/:id - Get post details (published only)
router.get('/:id', async (req, res) => {
    try {
        const post = await db.Post.findOne({
            where: {
                id: req.params.id,
                isPublished: true
            },
            include: [
                {
                    model: db.User,
                    attributes: ['id', 'nickname', 'email']
                },
                {
                    model: db.Preset,
                    attributes: ['id', 'title', 'bpm', 'masterVolume', 'isQuantized'],
                    include: [
                        {
                            model: db.KeyMapping,
                            include: [db.Asset]
                        }
                    ]
                }
            ]
        });

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.json(post);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// GET /api/posts/user/my-posts - Get current user's posts (authenticated)
router.get('/user/my-posts', isAuthenticated, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { count, rows: posts } = await db.Post.findAndCountAll({
            where: {
                userId: req.user.id
            },
            include: [
                {
                    model: db.Preset,
                    attributes: ['id', 'title', 'bpm']
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: limit,
            offset: offset
        });

        res.json({
            posts: posts,
            total: count,
            page: page,
            limit: limit,
            totalPages: Math.ceil(count / limit)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST /api/posts - Create new post (authenticated)
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { presetId, title, description, isPublished } = req.body;

        // Validate input
        if (!presetId || !title) {
            return res.status(400).json({ message: 'presetId and title are required' });
        }

        // Check if preset exists and belongs to user
        const preset = await db.Preset.findOne({
            where: {
                id: presetId,
                userId: req.user.id
            }
        });

        if (!preset) {
            return res.status(404).json({ message: 'Preset not found or you do not have permission' });
        }

        // Check if post already exists for this preset (1:1 relationship)
        const existingPost = await db.Post.findOne({
            where: { presetId: presetId }
        });

        if (existingPost) {
            return res.status(409).json({ 
                message: 'A post already exists for this preset',
                post: existingPost
            });
        }

        // Create new post
        const post = await db.Post.create({
            userId: req.user.id,
            presetId: presetId,
            title: title,
            description: description || null,
            isPublished: isPublished !== undefined ? isPublished : true,
            likeCount: 0,
            downloadCount: 0
        });

        // Load with associations for response
        const postWithDetails = await db.Post.findByPk(post.id, {
            include: [
                {
                    model: db.User,
                    attributes: ['id', 'nickname', 'email']
                },
                {
                    model: db.Preset,
                    attributes: ['id', 'title', 'bpm']
                }
            ]
        });

        res.status(201).json(postWithDetails);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to create post' });
    }
});

// PUT /api/posts/:id - Update post (authenticated, owner only)
router.put('/:id', isAuthenticated, isOwner, async (req, res) => {
    try {
        const { title, description, isPublished } = req.body;

        // Update fields if provided
        if (title !== undefined) req.post.title = title;
        if (description !== undefined) req.post.description = description;
        if (isPublished !== undefined) req.post.isPublished = isPublished;

        await req.post.save();

        // Load with associations for response
        const updatedPost = await db.Post.findByPk(req.post.id, {
            include: [
                {
                    model: db.User,
                    attributes: ['id', 'nickname', 'email']
                },
                {
                    model: db.Preset,
                    attributes: ['id', 'title', 'bpm']
                }
            ]
        });

        res.json(updatedPost);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to update post' });
    }
});

// DELETE /api/posts/:id - Delete post (authenticated, owner only)
router.delete('/:id', isAuthenticated, isOwner, async (req, res) => {
    try {
        await req.post.destroy();
        res.json({ message: 'Post deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to delete post' });
    }
});

// POST /api/posts/:id/like - Like a post (authenticated)
router.post('/:id/like', isAuthenticated, async (req, res) => {
    try {
        const post = await db.Post.findOne({
            where: {
                id: req.params.id,
                isPublished: true
            }
        });

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Increment like count
        post.likeCount += 1;
        await post.save();

        res.json({
            success: true,
            likeCount: post.likeCount
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to like post' });
    }
});

// POST /api/posts/:id/download - Download/increment download count (authenticated)
router.post('/:id/download', isAuthenticated, async (req, res) => {
    try {
        const post = await db.Post.findOne({
            where: {
                id: req.params.id,
                isPublished: true
            },
            include: [
                {
                    model: db.Preset,
                    include: [
                        {
                            model: db.KeyMapping,
                            include: [db.Asset]
                        }
                    ]
                }
            ]
        });

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Increment download count
        post.downloadCount += 1;
        await post.save();

        // Return post with full preset data for download
        res.json({
            success: true,
            downloadCount: post.downloadCount,
            post: post
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to download post' });
    }
});

// POST /api/posts/:id/publish - Toggle publish status (authenticated, owner only)
router.post('/:id/publish', isAuthenticated, isOwner, async (req, res) => {
    try {
        req.post.isPublished = !req.post.isPublished;
        await req.post.save();

        res.json({
            success: true,
            isPublished: req.post.isPublished,
            message: req.post.isPublished ? 'Post published' : 'Post unpublished'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to toggle publish status' });
    }
});

module.exports = router;
