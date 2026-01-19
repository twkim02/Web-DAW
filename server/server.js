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

// Sync Database & Start Server
db.sequelize.sync().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Failed to sync database:', err);
});
