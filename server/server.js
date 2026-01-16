const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const db = require('./models');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const presetRoutes = require('./routes/presets');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: 'http://localhost:5173', // Vite Frontend
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

// Sync Database & Start Server
db.sequelize.sync().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Failed to sync database:', err);
});
