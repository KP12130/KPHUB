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
        .replace(/'/g, '&#x27;');
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
const strikeLocks = new Map(); // --- In-memory lock systems for anti-cheat ---
const activeStrikes = new Map(); // Promise tracker to fix concurrent HTTP race conditions

// Immediately lock out users the moment a ban/mute decision is made,
// before the Firestore write completes. Prevents concurrent requests from slipping through.
const pendingBans = new Set();
const pendingMutes = new Map(); // uid -> mutedUntil ISO string

/**
 * Middleware to check if a user is muted or banned before allowing interaction.
 * Should be used on all POST/PUT/DELETE interaction routes.
 */
const checkMuteMiddleware = async (req, res, next) => {
    // Robust detection: Body -> Query -> Params
    const userId = req.body?.userId || req.query?.userId || req.params?.uid || req.params?.userId;
    if (!userId) return next();

    try {
        // 0. INSTANT CHECK: In-memory pending restriction
        if (pendingBans.has(userId)) {
            // Re-verify against DB to allow manual admin resets to bypass memory
            const { db } = require('../config/firebase');
            const userDoc = await db.collection('users').doc(userId).get();
            if (userDoc.exists && userDoc.data().tier !== 'BANNED') {
                pendingBans.delete(userId);
            } else {
                return res.status(403).json({ error: 'ACCOUNT_BANNED', message: 'Your credentials have been permanently isolated from the grid.', forceReload: true });
            }
        }

        const pendingMuteUntil = pendingMutes.get(userId);
        if (pendingMuteUntil && new Date(pendingMuteUntil) > new Date()) {
            // Re-verify against DB to allow manual admin clears
            const { db } = require('../config/firebase');
            const userDoc = await db.collection('users').doc(userId).get();
            if (userDoc.exists && userDoc.data().restrictions?.muted === false) {
                pendingMutes.delete(userId);
            } else {
                const remaining = Math.ceil((new Date(pendingMuteUntil) - new Date()) / (1000 * 60));
                return res.status(403).json({ error: 'ACCOUNT_MUTED', message: `Interaction restricted for ${remaining} more minutes.`, forceReload: true });
            }
        }

        const { db } = require('../config/firebase');
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) return next();

        const userData = userDoc.data();
        const restrictions = userData.restrictions || {};

        // 1. Check if Banned
        if (userData.tier === 'BANNED') {
            const banExpiry = restrictions.banExpiry ? new Date(restrictions.banExpiry) : null;
            if (!banExpiry || banExpiry > new Date()) {
                return res.status(403).json({
                    error: 'ACCOUNT_BANNED',
                    message: userData.banReason || 'Your credentials have been permanently isolated from the grid.',
                    forceReload: true
                });
            }
        }

        // 2. Check if Muted
        if (restrictions.muted) {
            const mutedUntil = restrictions.mutedUntil ? new Date(restrictions.mutedUntil) : null;
            if (mutedUntil && mutedUntil > new Date()) {
                const remaining = Math.ceil((mutedUntil - new Date()) / (1000 * 60));
                return res.status(403).json({
                    error: 'ACCOUNT_MUTED',
                    message: restrictions.muteReason || `Your interaction capability is restricted for ${remaining} more minutes due to systemic violations.`,
                    forceReload: true
                });
            }
        }

        next();
    } catch (e) {
        console.error('[FIREWALL] Mute check failed:', e);
        next(); // Fail open to not block users on DB errors
    }
};

const triggerAutoModeration = async (uid, ip, actionType) => {
    // Cooldown check for violations to prevent DB hammering during spam bursts
    // Use individual lock keys for anonymous vs authenticated
    const lockKey = uid ? `${uid}_viol` : `anon_${ip}_viol`;
    const nowMs = Date.now();
    const lastViol = strikeLocks.get(lockKey);
    if (lastViol && nowMs - lastViol < 30000) {
        return;
    }
    strikeLocks.set(lockKey, nowMs);

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
    if (activeStrikes.has(uid)) {
        await activeStrikes.get(uid).catch(() => { });
        return;
    }

    // Encapsulate DB logic in a promise and track it
    const moderationProcess = (async () => {
        try {
            const { db, admin } = require('../config/firebase');
            const now = new Date();

            // 0. QUICK CHECK: Is user already muted/banned? If so, exit early to save reads/writes.
            const userDoc = await db.collection('users').doc(uid).get();
            if (userDoc.exists) {
                const ud = userDoc.data();
                if (ud.tier === 'BANNED' || (ud.restrictions?.muted && new Date(ud.restrictions.mutedUntil) > now)) {
                    return;
                }
            }

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
                const muteExpiry = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
                pendingMutes.set(uid, muteExpiry); // Instant lock
                restrictionUpdates['muted'] = true;
                restrictionUpdates['mutedUntil'] = muteExpiry;
                restrictionUpdates['muteReason'] = `[AUTO] Anti-Cheat Strike 1: ${actionType} Spam`;
            } else if (strikeCount === 2) {
                // Strike 2: 24-hour mute and upload block
                const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
                pendingMutes.set(uid, expiresAt); // Instant lock
                restrictionUpdates['muted'] = true;
                restrictionUpdates['mutedUntil'] = expiresAt;
                restrictionUpdates['uploadBlocked'] = true;
                restrictionUpdates['uploadBlockedUntil'] = expiresAt;
                restrictionUpdates['muteReason'] = `[AUTO] Anti-Cheat Strike 2: ${actionType} Spam`;
            } else if (strikeCount === 3) {
                // Strike 3: 10-day Ban
                pendingBans.add(uid); // Instant lock
                const expiresAt = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString();
                rootUpdates['tier'] = 'BANNED';
                rootUpdates['banReason'] = `[AUTO] Anti-Cheat Strike 3: Repeated systemic abuse (${actionType})`;
                rootUpdates['bannedAt'] = now.toISOString();
                restrictionUpdates['banExpiry'] = expiresAt;
            } else if (strikeCount === 4) {
                // Strike 4: 90-day Ban
                pendingBans.add(uid); // Instant lock
                const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
                rootUpdates['tier'] = 'BANNED';
                rootUpdates['banReason'] = `[AUTO] Anti-Cheat Strike 4: Severe systemic abuse (${actionType})`;
                rootUpdates['bannedAt'] = now.toISOString();
                restrictionUpdates['banExpiry'] = expiresAt;
            } else {
                // Strike 5+: Permanent Ban
                pendingBans.add(uid); // Instant lock
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
    triggerProfanityModeration,
    checkMuteMiddleware
};
