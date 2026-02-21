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
                console.log(`[FIREWALL] Loaded ${bannedIPs.size} banned IPs from grid.`);
            }
        } catch (e) {
            console.error('[FIREWALL] Failed to load banned IPs grid data.', e.message);
            // Retry after 5 minutes, not on every request
            setTimeout(() => { isIpListLoaded = false; }, 5 * 60 * 1000);
        } finally {
            // CRITICAL: always mark as loaded to prevent hammering Firestore on every request
            isIpListLoaded = true;
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

// --- AUTO-MODERATION ENGINE ---
const strikeLocks = new Map(); // Cooldown map to prevent burst-strikes progressing tiers
const activeStrikes = new Map(); // Promise tracker to fix concurrent HTTP race conditions

const triggerAutoModeration = async (uid, ip, actionType) => {
    // If there is no UID, they are an anonymous user/bot. Instantly IP Ban them.
    if (!uid) {
        if (ip) {
            console.warn(`[ANTI_CHEAT] Anonymous bot detected. Banning IP: ${ip} for ${actionType}`);
            try {
                await banIp(ip, `[AUTO] Anonymous Anti-Cheat Violation: ${actionType} Spam`);
            } catch (e) {
                console.error('[ANTI_CHEAT] Failed to IP ban anonymous user:', e);
            }
        }
        return;
    }

    // Force concurrent spam requests to wait if a strike is currently being written to the database.
    // This prevents the server from returning a 429 early, which would cause the frontend to reload
    // before the database write is completed.
    if (activeStrikes.has(uid)) {
        console.warn(`[ANTI_CHEAT] Concurrent burst delayed for User ${uid}...`);
        await activeStrikes.get(uid).catch(() => { });
        return;
    }

    // Prevent race conditions and burst-strikes progressing tiers (max 1 strike progression per UID per minute)
    const nowMs = Date.now();
    const lastStrike = strikeLocks.get(uid);
    if (lastStrike && nowMs - lastStrike < 60000) {
        console.warn(`[ANTI_CHEAT] Ignored burst strike for User ${uid} (cooldown active).`);
        return;
    }
    strikeLocks.set(uid, nowMs);

    // Encapsulate DB logic in a promise and track it
    const moderationProcess = (async () => {

        try {
            const { db } = require('../config/firebase');
            const now = new Date();
            const penaltyWindow = new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000).toISOString();

            // 1. Log violation
            await db.collection('violations').add({
                uid,
                action: 'ANTI_CHEAT_STRIKE',
                reason: `[AUTO] Velocity limit exceeded for: ${actionType}`,
                appliedAt: now.toISOString(),
                ip: ip || 'Unknown'
            });

            // 2. Count strikes in last 100 days
            const snap = await db.collection('violations').where('uid', '==', uid).get();
            let strikeCount = 0;
            snap.forEach(doc => {
                const data = doc.data();
                if (data.action === 'ANTI_CHEAT_STRIKE' && data.appliedAt >= penaltyWindow) {
                    strikeCount++;
                }
            });

            const userRef = db.collection('users').doc(uid);
            let restrictionUpdates = {};
            let rootUpdates = {};

            if (strikeCount === 1) {
                // Strike 1: 1-hour mute
                restrictionUpdates['muted'] = true;
                restrictionUpdates['mutedUntil'] = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
                restrictionUpdates['muteReason'] = `[AUTO] Anti-Cheat Strike 1: ${actionType} Spam`;
            } else if (strikeCount === 2) {
                // Strike 2: 24-hour mute and upload block
                const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
                restrictionUpdates['muted'] = true;
                restrictionUpdates['mutedUntil'] = expiresAt;
                restrictionUpdates['uploadBlocked'] = true;
                restrictionUpdates['uploadBlockedUntil'] = expiresAt;
                restrictionUpdates['muteReason'] = `[AUTO] Anti-Cheat Strike 2: ${actionType} Spam`;
            } else if (strikeCount === 3) {
                // Strike 3: 10-day Ban
                const expiresAt = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString();
                rootUpdates['tier'] = 'BANNED';
                rootUpdates['banReason'] = `[AUTO] Anti-Cheat Strike 3: Repeated systemic abuse (${actionType})`;
                rootUpdates['bannedAt'] = now.toISOString();
                restrictionUpdates['banExpiry'] = expiresAt;
            } else if (strikeCount === 4) {
                // Strike 4: 90-day Ban
                const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
                rootUpdates['tier'] = 'BANNED';
                rootUpdates['banReason'] = `[AUTO] Anti-Cheat Strike 4: Severe systemic abuse (${actionType})`;
                rootUpdates['bannedAt'] = now.toISOString();
                restrictionUpdates['banExpiry'] = expiresAt;
            } else {
                // Strike 5+: Permanent Ban
                rootUpdates['tier'] = 'BANNED';
                rootUpdates['banReason'] = `[AUTO] Anti-Cheat Strike 5: Permanent Grid Isolation (${actionType})`;
                rootUpdates['bannedAt'] = now.toISOString();
                restrictionUpdates['banExpiry'] = null; // null = permanent
            }

            // Use set with merge to ensure nested 'restrictions' object is created if it doesn't exist
            const finalPayload = { ...rootUpdates };
            if (Object.keys(restrictionUpdates).length > 0) {
                finalPayload.restrictions = restrictionUpdates;
            }

            await userRef.set(finalPayload, { merge: true });
            console.log(`[ANTI_CHEAT] Strike ${strikeCount} applied to User ${uid}. Payload:`, finalPayload);
        } catch (e) {
            console.error('[ANTI_CHEAT] Auto-moderation DB error:', e);
        }
    })();

    activeStrikes.set(uid, moderationProcess);
    try {
        await moderationProcess;
    } catch (e) {
        console.error('[ANTI_CHEAT] Auto-moderation failed:', e);
    } finally {
        activeStrikes.delete(uid);
    }
};

const triggerProfanityModeration = async (uid, ip, actionType) => {
    if (!uid) return; // Anonymous users are handled via IP elsewhere

    // Prevent burst strikes for profanity
    const nowMs = Date.now();
    const lastStrike = strikeLocks.get(`${uid}_profanity`);
    if (lastStrike && nowMs - lastStrike < 10000) {
        return;
    }
    strikeLocks.set(`${uid}_profanity`, nowMs);

    const moderationProcess = (async () => {
        try {
            const { db } = require('../config/firebase');
            const now = new Date();
            const penaltyWindow = new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000).toISOString();

            // 1. Log violation
            await db.collection('violations').add({
                uid,
                action: 'PROFANITY_STRIKE',
                reason: `[AUTO] Profanity filter triggered in: ${actionType}`,
                appliedAt: now.toISOString(),
                ip: ip || 'Unknown'
            });

            // 2. Count strikes in last 100 days
            const snap = await db.collection('violations').where('uid', '==', uid).get();
            let strikeCount = 0;
            snap.forEach(doc => {
                const data = doc.data();
                if (data.action === 'PROFANITY_STRIKE' && data.appliedAt >= penaltyWindow) {
                    strikeCount++;
                }
            });

            const userRef = db.collection('users').doc(uid);
            let restrictionUpdates = {};
            let rootUpdates = {};

            const logReason = `[AUTO] Profanity Strike ${strikeCount}: ${actionType}`;

            if (strikeCount === 1) {
                // 1 -> mute 1 hour
                restrictionUpdates['muted'] = true;
                restrictionUpdates['mutedUntil'] = new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString();
                restrictionUpdates['muteReason'] = logReason;
            } else if (strikeCount === 2) {
                // 2 -> mute 12 hours
                restrictionUpdates['muted'] = true;
                restrictionUpdates['mutedUntil'] = new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString();
                restrictionUpdates['muteReason'] = logReason;
            } else if (strikeCount === 3) {
                // 3 -> mute 24 hours
                restrictionUpdates['muted'] = true;
                restrictionUpdates['mutedUntil'] = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
                restrictionUpdates['muteReason'] = logReason;
            } else if (strikeCount === 4) {
                // 4 -> mute 7 days
                restrictionUpdates['muted'] = true;
                restrictionUpdates['mutedUntil'] = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
                restrictionUpdates['muteReason'] = logReason;
            } else if (strikeCount >= 5 && strikeCount <= 7) {
                // 5-7 -> ban 7 days
                const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
                rootUpdates['tier'] = 'BANNED';
                rootUpdates['banReason'] = logReason;
                rootUpdates['bannedAt'] = now.toISOString();
                restrictionUpdates['banExpiry'] = expiresAt;
            } else if (strikeCount >= 8 && strikeCount <= 14) {
                // 8-14 -> ban 30 days
                const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
                rootUpdates['tier'] = 'BANNED';
                rootUpdates['banReason'] = logReason;
                rootUpdates['bannedAt'] = now.toISOString();
                restrictionUpdates['banExpiry'] = expiresAt;
            } else {
                // 15+ -> perma ban
                rootUpdates['tier'] = 'BANNED';
                rootUpdates['banReason'] = `[AUTO] Permanent Ban: Excessive Profanity Violations`;
                rootUpdates['bannedAt'] = now.toISOString();
                restrictionUpdates['banExpiry'] = null; // permanent
            }

            const finalPayload = { ...rootUpdates };
            if (Object.keys(restrictionUpdates).length > 0) {
                finalPayload.restrictions = restrictionUpdates;
            }

            await userRef.set(finalPayload, { merge: true });
            console.log(`[PROFANITY_MOD] Strike ${strikeCount} applied to User ${uid}. Payload:`, finalPayload);
        } catch (e) {
            console.error('[PROFANITY_MOD] DB error:', e);
        }
    })();

    activeStrikes.set(`${uid}_profanity`, moderationProcess);
    try {
        await moderationProcess;
    } catch (e) {
        console.error('[PROFANITY_MOD] Auto-moderation failed:', e);
    } finally {
        activeStrikes.delete(`${uid}_profanity`);
    }
};

module.exports = {
    securityMiddleware,
    sanitizeInput,
    ipBanMiddleware,
    banIp,
    unbanIp,
    getBannedIps,
    triggerAutoModeration,
    triggerProfanityModeration
};
