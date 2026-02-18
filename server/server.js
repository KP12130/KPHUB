const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { db } = require('./config/firebase');
const { securityMiddleware, sanitizeInput } = require('./middleware/security');

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        /\.vercel\.app$/, // Allow all Vercel deployments
        process.env.FRONTEND_URL || '*'
    ],
    credentials: true
}));
app.use(express.json({ limit: '10kb' })); // Body limit to prevent DOS
app.use(sanitizeInput); // Data sanitization against XSS
app.use(securityMiddleware); // Custom security logic

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Increased from 100 to avoid blocking legit app traffic
    message: { error: "TOO_MANY_REQUESTS: Firewall engaged. Try again later." }
});
app.use('/api/', limiter);

// Targeted Rate Limiting for sensitive routes
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30, // Increased from 10 to allow more headroom
    message: { error: "BRUTE_FORCE_PROTECTION: Access locked for 1 hour." }
});
app.use('/api/redeem', authLimiter);

// Request Logger
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

// Routes
const projectRoutes = require('./routes/projects');
const userRoutes = require('./routes/users');
const leaderboardRoutes = require('./routes/leaderboard');
const commentsRoutes = require('./routes/comments');
const notificationsRoutes = require('./routes/notifications');
const activityRoutes = require('./routes/activities');
const redeemRoutes = require('./routes/redeem');
const adRoutes = require('./routes/ads');
const bountyRoutes = require('./routes/bounties');
const hackathonRoutes = require('./routes/hackathons');
const reviewRoutes = require('./routes/reviews');

app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/redeem', redeemRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/bounties', bountyRoutes);
app.use('/api/hackathons', hackathonRoutes);
app.use('/api/reviews', reviewRoutes);

// Static File Hosting (Frontend)
const distPath = path.join(__dirname, '../client/dist');
app.use(express.static(distPath));

// DIRECT ROUTE INJECTION FOR DEBUGGING
// POST /api/redeem
app.post('/api/redeem', async (req, res) => {
    console.log('[SYSTEM_AUDIT] DIRECT ROUTE HIT: /api/redeem');
    console.log('[SYSTEM_AUDIT] Body:', req.body);

    try {
        const { uid, code } = req.body;
        if (!uid || !code) return res.status(400).json({ error: 'Missing credentials.' });

        if (String(code).trim() === '12130') {
            console.log('[SYSTEM_AUDIT] Access GRANTED.');

            // We need admin/db here. If not active, we might need to import them or use what's available.
            // server.js imports { db } from './config/firebase'. We need admin too for FieldValue.
            const { admin } = require('./config/firebase');

            await db.collection('users').doc(uid).update({
                tier: 'PRO',
                membershipExpires: null,
                'stats.reputation': admin.firestore.FieldValue.increment(1000)
            });

            return res.json({
                success: true,
                message: 'ACCESS_GRANTED: Override code accepted.',
                tier: 'PRO'
            });
        }
        res.status(400).json({ error: 'ACCESS_DENIED: Invalid protocol code.' });
    } catch (error) {
        console.error('Redeem Error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

app.get('/api', (req, res) => {
    res.send('CodeNeon API is running (Firebase Mode)');
});

// SPA Catch-all (Must be after API routes)
app.get('/:any*', (req, res) => {
    // If it's an API route that didn't match, don't serve index.html
    if (req.url.startsWith('/api')) {
        return res.status(404).json({ error: 'API_ENDPOINT_NOT_FOUND' });
    }
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Example Route to test Firestore connection
app.get('/api/test-db', async (req, res) => {
    try {
        const snapshot = await db.collection('test').get();
        const data = snapshot.docs.map(doc => doc.data());
        res.json({ message: "Firestore connected", data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`SYSTEM_STATUS: Server handle bound to 0.0.0.0:${PORT}`);
});

server.on('listening', () => {
    const addr = server.address();
    console.log(`SYSTEM_STATUS: Actively listening on ${addr.address}:${addr.port}`);
});

server.on('error', (err) => {
    console.error('CRITICAL_SYSTEM_ERROR:', err);
    if (err.code === 'EADDRINUSE') {
        console.error(`PORT_COLLISION: Port ${PORT} is currently occupied by another matrix entity.`);
    }
});

server.on('close', () => {
    console.log('SYSTEM_SIGNAL: Server connection handle closed.');
});

// Force process persistence for diagnostics
const keepAlive = setInterval(() => {
    if (!server.listening) {
        console.log('DIAGNOSTIC_PING: Server is NOT listening. Loop remains active for telemetry.');
    }
}, 5000);

process.on('SIGINT', () => {
    console.log('SYSTEM_HALT: SIGINT received.');
    clearInterval(keepAlive);
    server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
    console.log('SYSTEM_HALT: SIGTERM received.');
    clearInterval(keepAlive);
    server.close(() => process.exit(0));
});

process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT_EXCEPTION_DETECTED:', err.stack || err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED_REJECTION_DETECTED:', reason);
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[FIREWALL_LOG] UNCAUGHT_ERROR:', err.stack);
    res.status(500).json({
        error: 'INTERNAL_GRID_ERROR',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Shields holding, but an anomaly occurred.'
    });
});
