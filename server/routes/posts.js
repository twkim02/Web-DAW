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
        const search = req.query.search || '';
        const tag = req.query.tag || '';
        const genre = req.query.genre || '';
        const offset = (page - 1) * limit;

        // Build where clause
        const whereClause = {
            isPublished: true
        };

        if (search) {
            // Check title or description
            // For MySQL, LIKE is case-insensitive usually. For standard generic, use Op.like
            whereClause[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }

        if (genre) {
            whereClause.genre = genre;
        }

        // Tag filtering needs JSON handling. 
        // Simple string search in JSON array string for SQLite/MySQL specific
        if (tag) {
            // For JSON column 'tags', we can try standard string check if JSON functions tricky cross-db
            // Or use Op.contains in Postgres/MySQL (if dialect specific)
            // Simple fallback: check if tag is in the array. 
            // Note: SQLite JSON support in Sequelize might vary. 
            // Let's assume standard 'contains' logic is managed or string match for simplicity first
            // but `tags` is defined as JSON. 

            // Check if dialect is mysql or sqlite
            const isMysql = db.sequelize.options.dialect === 'mysql';
            if (isMysql) {
                whereClause.tags = db.sequelize.literal(`JSON_CONTAINS(tags, '"${tag}"')`);
            } else {
                // SQLite fallback using LIKE operator
                // tags are stored as JSON strings: ["tag1", "tag2"]
                // We search for "tag" inside the string
                whereClause.tags = {
                    [Op.like]: `%"${tag}"%`
                };
            }
        }

        // Build order clause
        let order;
        if (sort === 'popular') {
            order = [['likeCount', 'DESC'], ['createdAt', 'DESC']];
        } else {
            order = [['createdAt', 'DESC']];
        }

        // Find all published posts
        const { count, rows: posts } = await db.Post.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: db.User,
                    attributes: ['id', 'nickname', 'email', 'avatarUrl']
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
        const { presetId, title, description, isPublished, tags, genre } = req.body;

        // Validate input
        if (!presetId || !title) {
            return res.status(400).json({ message: 'presetId and title are required' });
        }

        // Check if preset exists and belongs to user
        const preset = await db.Preset.findOne({
            where: {
                id: presetId,
                userId: req.user.id
            },
            include: [
                {
                    model: db.KeyMapping,
                    include: [db.Asset]
                }
            ]
        });

        if (!preset) {
            return res.status(404).json({ message: 'Preset not found or you do not have permission' });
        }

        // Snapshot the preset data
        const presetSnapshot = preset.toJSON();

        // Create new post with snapshot
        const post = await db.Post.create({
            userId: req.user.id,
            presetId: presetId,
            title: title,
            description: description || null,
            isPublished: isPublished !== undefined ? isPublished : true,
            likeCount: 0,
            downloadCount: 0,
            tags: tags || [], // Save tags
            genre: genre || null,
            presetData: presetSnapshot // Save snapshot
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

// POST /api/posts/:id/download - Download/increment download count (optional auth)
// 비로그인 사용자도 공개된 post의 프리셋을 다운로드할 수 있음
// 다운로드 카운트 증가는 로그인한 사용자에게만 적용
router.post('/:id/download', async (req, res) => {
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

        // 로그인한 사용자에게만 다운로드 카운트 증가
        if (req.isAuthenticated()) {
            post.downloadCount += 1;
            await post.save();
        }

        // Return post with full preset data for download (로그인 여부와 관계없이)
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

// POST /api/posts/:id/fork - Fork a post's preset to my library (authenticated)
router.post('/:id/fork', isAuthenticated, async (req, res) => {
    const t = await db.sequelize.transaction();
    try {
        const post = await db.Post.findOne({
            where: {
                id: req.params.id,
                isPublished: true
            },
            include: [
                {
                    model: db.Preset,
                    include: [db.KeyMapping]
                }
            ]
        });

        if (!post) {
            await t.rollback();
            return res.status(404).json({ message: 'Post not found' });
        }

        // Determine source data: Active Preset or Snapshot
        let sourceData = null;
        if (post.Preset) {
            sourceData = post.Preset.toJSON();
        } else if (post.presetData) {
            sourceData = post.presetData;
            // Ensure it has the structure we expect (it should, as it's a direct toJSON copy)
        }

        if (!sourceData) {
            await t.rollback();
            return res.status(404).json({ message: 'Preset data not found (Original deleted and no snapshot available)' });
        }

        // 1. Create a deep copy of the Preset
        const forkedPreset = await db.Preset.create({
            title: `Remix of ${sourceData.title || post.title}`,
            bpm: sourceData.bpm,
            settings: sourceData.settings,
            masterVolume: sourceData.masterVolume,
            isQuantized: sourceData.isQuantized,
            userId: req.user.id,
            parentPresetId: sourceData.id || null, // Might be null if from snapshot and ID is irrelevant
            isPublic: false // Default to private
        }, { transaction: t });

        // 2. Adjust KeyMappings
        // sourceData.KeyMappings should exist in both live object and snapshot
        if (sourceData.KeyMappings && sourceData.KeyMappings.length > 0) {
            const mappingData = sourceData.KeyMappings.map(m => ({
                presetId: forkedPreset.id,
                keyChar: m.keyChar,
                mode: m.mode,
                volume: m.volume,
                type: m.type,
                note: m.note,
                assetId: m.assetId, // Keep reference to same asset
                synthSettings: m.synthSettings
            }));

            await db.KeyMapping.bulkCreate(mappingData, { transaction: t });
        }

        // Increment download count on the original post
        post.downloadCount += 1;
        await post.save({ transaction: t });

        await t.commit();

        res.json({
            success: true,
            message: 'Forked successfully',
            newPresetId: forkedPreset.id
        });

    } catch (err) {
        await t.rollback();
        console.error(err);
        res.status(500).json({ message: 'Failed to fork preset' });
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
