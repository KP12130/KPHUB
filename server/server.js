const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { db } = require('./config/firebase');
const { securityMiddleware, sanitizeInput, ipBanMiddleware, getBannedIps, banIp, unbanIp } = require('./middleware/security');

const app = express();
app.set('trust proxy', 1); // Required for express-rate-limit on Render

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: false,
        directives: {
            "default-src": ["'self'"],
            "connect-src": ["'self'", "https://api.dicebear.com", "http://localhost:5000", "https://*.render.com", "https://*.googleapis.com", "https://*.firebaseio.com", "wss://*.firebaseio.com", "https://*.googlesyndication.com", "https://*.doubleclick.net", "https://*.google.com", "https://*.googleadservices.com", "https://firestore.googleapis.com", "https://*.adtrafficquality.google"],
            "img-src": ["'self'", "data:", "blob:", "https://api.dicebear.com", "https://*.googleusercontent.com", "https://www.svgrepo.com", "https://www.transparenttextures.com", "https://images.unsplash.com", "https://*.r2.cloudflarestorage.com", "https://media.giphy.com", "https://*.googlesyndication.com", "https://*.doubleclick.net", "https://*.google.com", "https://*.gstatic.com", "https://*.googleadservices.com", "https://*.adtrafficquality.google"],
            "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "blob:", "https://*.google.com", "https://*.gstatic.com", "https://*.googlesyndication.com", "https://*.googleadservices.com", "https://*.doubleclick.net"],
            "script-src-elem": ["'self'", "'unsafe-inline'", "blob:", "https://*.google.com", "https://*.gstatic.com", "https://*.googlesyndication.com", "https://*.googleadservices.com", "https://*.doubleclick.net", "https://*.adtrafficquality.google"],
            "worker-src": ["'self'", "blob:"],

            "child-src": ["'self'", "blob:", "https://*.firebaseapp.com", "https://*.googlesyndication.com"],
            "frame-src": ["'self'", "https://*.google.com", "https://*.firebaseapp.com", "https://*.doubleclick.net", "https://*.googlesyndication.com", "https://*.googleadservices.com", "https://*.adtrafficquality.google"],
            "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://*.gstatic.com"],
            "font-src": ["'self'", "https://fonts.gstatic.com"],
            "object-src": ["'none'"],
        },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginEmbedderPolicy: false
}));

// Debug header to verify deployment
app.use((req, res, next) => {
    res.setHeader('X-KPHUB-Debug', 'csp-v3-permissive');
    next();
});
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:3000',
        /\.web\.app$/,
        /\.firebaseapp\.com$/,
        /\.vercel\.app$/, // Allow all Vercel deployments
        process.env.FRONTEND_URL || '*'
    ],
    credentials: true
}));
app.use(express.json({ limit: '10kb' })); // Body limit to prevent DOS
app.use(sanitizeInput); // Data sanitization against XSS
app.use(securityMiddleware); // Custom security logic

// Apply IP Ban Firewall on all routes EARLY
app.use(ipBanMiddleware);
app.use((req, res, next) => {
    // Re-verify against latest bannedIPs just in case middleware was cached
    const { getBannedIps } = require('./middleware/security');
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (getBannedIps().includes(clientIp)) {
        return res.status(403).json({ error: 'ACCESS_DENIED_IP_BAN', message: 'Your IP address has been permanently isolated from the grid.' });
    }
    next();
});

// Rate Limiting
// Skip entirely for localhost (dev mode hits limits from React StrictMode double-invokes)
const isLocalhost = (req) => {
    const ip = req.ip || req.socket.remoteAddress || '';
    return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
};

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5000, // Very generous for both dev and prod
    skip: isLocalhost, // Skip entirely for local dev
    message: { error: "TOO_MANY_REQUESTS: Firewall engaged. Try again later." }
});

const supportLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 3000,
    skip: isLocalhost,
    message: { error: "SUPPORT_THROTTLE: Chat sync delayed." }
});

app.use('/api/support', supportLimiter);
app.use('/api/', limiter);

// Request Logger & Emergency Circuit Breaker
// PLACED AFTER RATE LIMITERS to ensure metrics only count processed traffic.
let readApiCount = 0;
let writeApiCount = 0;
let circuitBreakerTripped = false;
let lastBreakerReset = Date.now();

app.use((req, res, next) => {
    const now = Date.now();

    // Reset counters every 60 seconds
    if (now - lastBreakerReset > 60000) {
        readApiCount = 0;
        writeApiCount = 0;
        lastBreakerReset = now;
        if (circuitBreakerTripped) {
            circuitBreakerTripped = false;
        }
    }

    // If tripped, block everything
    if (circuitBreakerTripped) {
        return res.status(503).json({
            error: 'CIRCUIT_BREAKER_ACTIVE',
            message: 'Emergency Halt: Excessive Grid traffic detected. API operations suspended to preserve database quota.'
        });
    }

    // Categorize request type
    if (req.method === 'GET') {
        readApiCount++;
    } else {
        writeApiCount++; // Includes POST, PUT, DELETE, PATCH
    }


    // Trip the breaker if we exceed 500 reads or 100 writes per minute
    if (readApiCount > 500 || writeApiCount > 100) {
        console.error(`[CIRCUIT_BREAKER] 🔴 EMERGENCY HALT TRIPPED. Reads: ${readApiCount}/min, Writes: ${writeApiCount}/min`);
        circuitBreakerTripped = true;
        return res.status(503).json({
            error: 'CIRCUIT_BREAKER_TRIPPED',
            message: 'Emergency Halt: Excessive Grid traffic detected. API operations suspended to preserve database quota.'
        });
    }

    next();
});

// Auth limiter - still apply on localhost for security testing
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 200,
    message: { error: "BRUTE_FORCE_PROTECTION: Access locked for 1 hour." }
});

// Routes
const projectRoutes = require('./routes/projects');
const userRoutesExport = require('./routes/users');
const userRoutes = userRoutesExport.router;
const clearUserCache = userRoutesExport.clearUserCache;

const leaderboardRoutes = require('./routes/leaderboard');
const commentsRoutes = require('./routes/comments');
const notificationsRoutes = require('./routes/notifications');
const activityRoutes = require('./routes/activities');
const adRoutes = require('./routes/ads');
const hackathonRoutes = require('./routes/hackathons');
const supportRoutes = require('./routes/support');
const exchangeRoutes = require('./routes/exchange');

app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/users', userRoutes);

const exchangeRoutesExport = require('./routes/exchange');
const exchangeRoutes = exchangeRoutesExport.router;
exchangeRoutesExport.setClearUserCache(clearUserCache);

app.use('/api/exchange', exchangeRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/hackathons', require('./routes/hackathons'));
app.use('/api/voting', require('./routes/voting'));

// Static File Hosting (Frontend)
const distPath = path.join(__dirname, '../client/dist');
app.use(express.static(distPath));

// --- SECURITY & IP BAN MANAGEMENT ROUTES ---
app.get('/api/security/banned-ips', (req, res) => {
    res.json({ success: true, bannedIps: getBannedIps() });
});

app.post('/api/security/ban-ip', async (req, res) => {
    try {
        const { ip, reason } = req.body;
        if (!ip) return res.status(400).json({ error: 'IP address required' });
        await banIp(ip, reason);
        res.json({ success: true, message: `IP ${ip} permanently banned.` });
    } catch (err) {
        res.status(500).json({ error: 'Failed to ban IP' });
    }
});

app.post('/api/security/unban-ip', async (req, res) => {
    try {
        const { ip } = req.body;
        if (!ip) return res.status(400).json({ error: 'IP address required' });
        await unbanIp(ip);
        res.json({ success: true, message: `IP ${ip} unbanned.` });
    } catch (err) {
        res.status(500).json({ error: 'Failed to unban IP' });
    }
});


app.get('/api', (req, res) => {
    res.send('CodeNeon API is running (Firebase Mode)');
});

// SPA Catch-all (Must be after API routes)
app.use((req, res, next) => {
    // If it's an API route that didn't match, or not a GET request, move on
    if (req.url.startsWith('/api') || req.method !== 'GET') {
        return next();
    }
    // Serve index.html for all other GET requests (SPA)
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

// Grid Health Heartbeat
app.get('/api/health', (req, res) => {
    const { db } = require('./config/firebase');
    // Check if db is a mock (has no _settings or internal props usually found in Firestore)
    // Or just check if it's the specific mock object we created
    let isMock = false;
    try {
        // Our mock db explicitly throws on get()
        if (db.collection && db.collection('test').get.toString().includes('Firebase not initialized')) {
            isMock = true;
        }
    } catch (e) {
        // If real firestore, this might fail on connection, but not logic
    }

    // Fallback: Check if the "db" object is just our simple mock object from firebase.js
    if (db.collection.toString().includes('throw new Error')) isMock = true;

    res.json({
        status: 'ONLINE',
        firebase: isMock ? 'DISCONNECTED (Mock Mode)' : 'CONNECTED',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
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

    if (err.message && err.message.includes('Firebase not initialized')) {
        return res.status(503).json({ error: 'SERVICE_UNAVAILABLE', message: 'GRID_DATABASE_OFFLINE: Firebase env vars missing.' });
    }

    // Firestore quota exceeded — return graceful empty responses instead of 500
    if (err.code === 8 || (err.message && err.message.includes('RESOURCE_EXHAUSTED'))) {
        console.warn('[QUOTA] Firestore daily read quota exceeded. Returning degraded response.');
        return res.status(503).json({ error: 'QUOTA_EXCEEDED', message: 'Database quota exceeded. Resets at midnight PST.' });
    }

    res.status(500).json({
        error: 'INTERNAL_GRID_ERROR',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Shields holding, but an anomaly occurred.'
    });
});
