const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const db = require('./models');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const presetRoutes = require('./routes/presets');
const userPreferencesRoutes = require('./routes/userPreferences');
const postRoutes = require('./routes/posts');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Allow localhost and local network IPs
        const allowedOrigins = [
            'http://localhost:5173',
            'http://127.0.0.1:5173'
        ];

        // Allow 10.x.x.x, 192.168.x.x, 172.16-31.x.x (Private IPs) for dev access
        const isLocalNetwork = /^http:\/\/(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|localhost)/.test(origin);

        if (allowedOrigins.indexOf(origin) !== -1 || isLocalNetwork) {
            callback(null, true);
        } else {
            console.warn('CORS Blocked Origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve static files from uploads
app.use('/uploads', express.static('uploads'));
// Serve graphic assets
app.use('/uploads/graphics', express.static('uploads/graphics'));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'keyboard cat',
    resave: false,
    saveUninitialized: false,
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Passport Config (Simple setup for now)
// Google OAuth는 환경 변수가 설정된 경우에만 활성화
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const GoogleStrategy = require('passport-google-oauth20').Strategy;
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.CALLBACK_URL || "/auth/google/callback"
    },
        async function (accessToken, refreshToken, profile, cb) {
            try {
                const [user] = await db.User.findOrCreate({
                    where: { googleId: profile.id },
                    defaults: {
                        email: profile.emails[0].value,
                        nickname: profile.displayName
                    }
                });
                return cb(null, user);
            } catch (err) {
                return cb(err, null);
            }
        }
    ));
    console.log('Google OAuth strategy configured');
} else {
    console.warn('Google OAuth credentials not found. OAuth login will be disabled.');
}

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await db.User.findByPk(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Routes
app.use('/auth', authRoutes);
app.use('/upload', uploadRoutes);
app.use('/presets', presetRoutes);
app.use('/api/user/preferences', userPreferencesRoutes);
app.use('/api/user/preferences', userPreferencesRoutes);
app.use('/api/posts', postRoutes);
// Mount comments router - Note: We need to handle this carefully.
// Best practice: Use mergeParams in comments.js and mount it.
// Option A: app.use('/api/posts/:postId/comments', commentRoutes)
const commentRoutes = require('./routes/comments');
app.use('/api/posts/:postId/comments', commentRoutes);

// Graphic Assets Routes
const graphicAssetRoutes = require('./routes/graphicAssets');
app.use('/api/graphic-assets', graphicAssetRoutes);

// Sync Database & Start Server
// Users 테이블은 인덱스가 너무 많아서 alter를 건너뛰고, 다른 테이블만 동기화
(async () => {
    try {
        // Users 모델은 alter 없이 확인만 (이미 존재하면 건너뜀)
        // email unique 제약조건이 이미 있으면 alter 시도 시 인덱스 초과 에러 발생
        try {
            await db.User.sync({ alter: false });
            console.log('User model: table exists, skipping alter');
        } catch (err) {
            // 테이블이 없으면 생성만 시도 (alter 없이)
            if (err.message && err.message.includes("doesn't exist")) {
                await db.User.sync({ alter: false });
                console.log('User model: table created');
            } else {
                console.warn('User model sync warning:', err.message);
            }
        }

        // 다른 모델들은 정상적으로 alter 동기화
        const modelsToSync = ['Preset', 'KeyMapping', 'Asset', 'Post', 'Comment', 'UserPreference', 'PresetAccess', 'GraphicAsset'];
        for (const modelName of modelsToSync) {
            if (db[modelName]) {
                try {
                    await db[modelName].sync({ alter: true });
                    console.log(`${modelName} model: synced`);
                } catch (err) {
                    console.warn(`${modelName} model sync warning:`, err.message);
                }
            }
        }

        // 테이블에 인덱스 추가 (컬럼 생성 후)
        try {
            await db.GraphicAsset.addIndexes();
        } catch (err) {
            console.warn('GraphicAsset index addition skipped (may already exist):', err.message);
        }
        
        try {
            await db.PresetAccess.addIndexes();
        } catch (err) {
            console.warn('PresetAccess index addition skipped (may already exist):', err.message);
        }
        
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Failed to sync database:', err);
    }
})();
