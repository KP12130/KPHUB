const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// Simple Memory Cache for Activity Feed (TTL 30 seconds)
let activityCache = {
    value: null,
    expiry: 0
};

// GET /api/activity - Returns recent rank changes and punishments
router.get('/', async (req, res) => {
    try {
        if (activityCache.value && Date.now() < activityCache.expiry) {
            return res.json(activityCache.value);
        }

        // Get all violations, sort in JS (avoids composite index requirement)
        const snapshot = await db.collection('violations').get();

        if (snapshot.empty) {
            activityCache = { value: [], expiry: Date.now() + 30000 };
            return res.json([]);
        }

        const violations = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(v => v.uid) // only entries with a uid
            .sort((a, b) => {
                const da = a.appliedAt ? new Date(a.appliedAt) : 0;
                const db2 = b.appliedAt ? new Date(b.appliedAt) : 0;
                return db2 - da;
            })
            .slice(0, 20);

        // Batch-fetch usernames only for violations that don't have one embedded
        const uids = [...new Set(
            violations.filter(v => !v.username).map(v => v.uid)
        )];
        const userMap = {};

        await Promise.all(uids.map(async (uid) => {
            try {
                const doc = await db.collection('users').doc(uid).get();
                if (doc.exists) {
                    const data = doc.data();
                    userMap[uid] = data.username || data.displayName || uid;
                } else {
                    userMap[uid] = uid;
                }
            } catch (_) {
                userMap[uid] = uid;
            }
        }));

        const events = violations.map(v => ({
            id: v.id,
            uid: v.uid,
            username: v.username || userMap[v.uid] || v.uid || 'Unknown',
            action: v.action || 'UNKNOWN',
            reason: v.reason || '',
            revoked: v.revoked || false,
            appliedAt: v.appliedAt || null,
            expiresAt: v.expiresAt || null
        }));

        activityCache = { value: events, expiry: Date.now() + 30000 };
        res.json(events);
    } catch (err) {
        console.error('[DATABASE_ERROR] Fetch Activity failed:', err);
        res.status(500).json({ error: 'Failed to fetch activity' });
    }
});

// Kept for backward compat — no longer writes to activities collection
const logActivity = async () => { };

module.exports = router;
module.exports.logActivity = logActivity;
