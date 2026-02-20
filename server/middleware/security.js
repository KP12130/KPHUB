// Custom Sanitization Engine (Matrix Shield)
// Bypasses the immutable property errors of deprecated libraries like xss-clean
const admin = require('firebase-admin');

const sanitize = (val) => {
    if (typeof val !== 'string') return val;
    return val
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            if (typeof obj[key] === 'object') {
                sanitizeObject(obj[key]);
            } else if (typeof obj[key] === 'string') {
                obj[key] = sanitize(obj[key]);
            }
        }
    }
    return obj;
};

const sanitizeInput = (req, res, next) => {
    if (req.body) sanitizeObject(req.body);
    if (req.query) sanitizeObject(req.query);
    if (req.params) sanitizeObject(req.params);
    next();
};

const securityMiddleware = (req, res, next) => {
    // 1. Log sensitive activity
    const sensitiveEndpoints = ['/api/redeem', '/api/users/login', '/api/users/register'];
    if (sensitiveEndpoints.includes(req.path) && req.method === 'POST') {
        console.log(`[FIREWALL_ALERT] Sensitive access attempt on ${req.path} from IP: ${req.ip}`);
    }

    // 2. Add security headers (Extra layer)
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN'); // Allow SAMEORIGIN for Firebase/Iframes
    // REMOVED MANUAL CSP - Handled by Helmet in server.js
    // res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;");

    next();
};

// --- IP BAN FIREWALL ---
const bannedIPs = new Set();
let isIpListLoaded = false;

// Middleware to block requests from banned IPs
const ipBanMiddleware = async (req, res, next) => {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Load from DB once on startup (lazy load)
    if (!isIpListLoaded) {
        try {
            const { db } = require('../config/firebase');
            if (db && db.collection) {
                const snapshot = await db.collection('banned_ips').get();
                snapshot.forEach(doc => bannedIPs.add(doc.id));
                isIpListLoaded = true;
                console.log(`[FIREWALL] Loaded ${bannedIPs.size} banned IPs from grid.`);
            }
        } catch (e) {
            console.error('[FIREWALL] Failed to load banned IPs grid data.', e.message);
        }
    }

    if (bannedIPs.has(clientIp)) {
        return res.status(403).json({ error: 'ACCESS_DENIED_IP_BAN', message: 'Your IP address has been permanently isolated from the grid.' });
    }
    next();
};

// Functions to manage IP bans from other routes
const banIp = async (ip, reason = 'Admin Action') => {
    bannedIPs.add(ip);
    try {
        const { db } = require('../config/firebase');
        await db.collection('banned_ips').doc(ip).set({ bannedAt: new Date().toISOString(), reason });
    } catch (e) { console.error('[FIREWALL] DB ban sync failed:', e); }
};

const unbanIp = async (ip) => {
    bannedIPs.delete(ip);
    try {
        const { db } = require('../config/firebase');
        await db.collection('banned_ips').doc(ip).delete();
    } catch (e) { console.error('[FIREWALL] DB unban sync failed:', e); }
};

const getBannedIps = () => Array.from(bannedIPs);

module.exports = {
    securityMiddleware,
    sanitizeInput,
    ipBanMiddleware,
    banIp,
    unbanIp,
    getBannedIps
};
