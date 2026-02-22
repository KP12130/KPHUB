const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');
const { BADGES } = require('../utils/achievements');

// In-memory cache to avoid hammering Firestore with full scans
let countCache = { value: null, fetchedAt: 0 };
const COUNT_TTL_MS = 5 * 60 * 1000; // 5 minutes

// GET /api/users/count - Live member count (must be before /:id wildcard)
router.get('/count', async (req, res) => {
    try {
        const now = Date.now();
        if (countCache.value !== null && (now - countCache.fetchedAt) < COUNT_TTL_MS) {
            return res.json({ count: countCache.value, cached: true });
        }
        const snapshot = await db.collection('users').get();
        countCache = { value: snapshot.size, fetchedAt: now };
        res.json({ count: snapshot.size });
    } catch (err) {
        // Return cached value on error rather than failing
        if (countCache.value !== null) return res.json({ count: countCache.value, cached: true });
        res.status(500).json({ error: 'Failed to fetch member count.' });
    }
});

// GET /api/users/badges/definitions
router.get('/badges/definitions', (req, res) => {
    res.json(BADGES);
});



const multer = require('multer');
const { uploadFile, getFileUrl } = require('../utils/storage');

// Memory storage for Multer
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit for avatars
});

// GET /api/users/check-username?username=neo_coder
router.get('/check-username', async (req, res) => {
    try {
        const { username } = req.query;
        if (!username) return res.status(400).json({ error: 'Username required' });

        // Query Firestore to see if username exists
        const snapshot = await db.collection('users').where('username', '==', username).get();

        if (!snapshot.empty) {
            return res.json({ available: false });
        }
        res.json({ available: true });
    } catch (error) {
        console.error('Username Check Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/users (Create/Update Profile)
router.post('/', async (req, res) => {
    try {
        const { uid, email, username, displayName, photoURL, gender, birthdate } = req.body;

        if (!uid || !username || !email) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if username is taken (double check before write)
        const usernameCheck = await db.collection('users').where('username', '==', username).get();
        // Exclude current user from check if updating (not implemented yet, assuming new user for now)
        if (!usernameCheck.empty) {
            // Check if it's not the same user
            const existingUser = usernameCheck.docs[0];
            if (existingUser.id !== uid) {
                return res.status(400).json({ error: 'Username already taken' });
            }
        }

        const userRef = db.collection('users').doc(uid);

        const userData = {
            uid,
            email,
            username, // @username
            displayName,
            photoURL,
            gender,
            birthdate,
            socials: {
                github: '',
                twitter: '',
                website: ''
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            stats: {
                uploads: 0,
                likesReceived: 0,
                views: 0,
                downloads: 0,
                commentsMade: 0,
                balance: 0, // Monetization balance (USD)
                kpcBalance: 0, // Virtual currency balance
                verified: false, // Professional verification status
                supporters: 0
            },
            tier: 'GHOST', // Default tier
            roles: ['CITIZEN'],
            membershipExpires: null
        };

        // Merge true ensures we don't overwrite existing stats if updating partial info
        await userRef.set(userData, { merge: true });

        res.json({ success: true, user: userData });
    } catch (error) {
        console.error('Profile Creation Error:', error);
        res.status(500).json({ error: 'Failed to save profile' });
    }
});

const { checkAchievements } = require('../utils/achievements');

// Helper: resolve user by identifier (email / @username / UID)
async function resolveUser(identifier) {
    if (!identifier) return null;
    if (identifier.includes('@') && !identifier.startsWith('@')) {
        const snap = await db.collection('users').where('email', '==', identifier.toLowerCase()).get();
        if (!snap.empty) return { ref: snap.docs[0].ref, data: snap.docs[0].data(), id: snap.docs[0].id };
    } else if (identifier.startsWith('@')) {
        const snap = await db.collection('users').where('username', '==', identifier.substring(1)).get();
        if (!snap.empty) return { ref: snap.docs[0].ref, data: snap.docs[0].data(), id: snap.docs[0].id };
    } else {
        const doc = await db.collection('users').doc(identifier).get();
        if (doc.exists) return { ref: doc.ref, data: doc.data(), id: doc.id };
        const snap = await db.collection('users').where('username', '==', identifier).get();
        if (!snap.empty) return { ref: snap.docs[0].ref, data: snap.docs[0].data(), id: snap.docs[0].id };
    }
    return null;
}

// GET /api/users/admin/user-info?identifier=...
router.get('/admin/user-info', async (req, res) => {
    try {
        const { identifier } = req.query;
        const user = await resolveUser(identifier);
        if (!user) return res.status(404).json({ error: 'User not found.' });

        const now = new Date();
        const r = user.data.restrictions || {};
        const updates = {};
        if (r.mutedUntil && new Date(r.mutedUntil) < now) { updates['restrictions.muted'] = false; updates['restrictions.mutedUntil'] = null; }
        if (r.uploadBlockedUntil && new Date(r.uploadBlockedUntil) < now) { updates['restrictions.uploadBlocked'] = false; updates['restrictions.uploadBlockedUntil'] = null; }
        if (r.cashoutBlockedUntil && new Date(r.cashoutBlockedUntil) < now) { updates['restrictions.cashoutBlocked'] = false; updates['restrictions.cashoutBlockedUntil'] = null; }
        if (r.downloadBlockedUntil && new Date(r.downloadBlockedUntil) < now) { updates['restrictions.downloadBlocked'] = false; updates['restrictions.downloadBlockedUntil'] = null; }
        if (user.data.tier === 'BANNED' && r.banExpiry && new Date(r.banExpiry) < now) { updates['tier'] = 'FREE'; updates['restrictions.banExpiry'] = null; }
        if (Object.keys(updates).length > 0) { await user.ref.update(updates); }

        res.json({ uid: user.id, username: user.data.username, email: user.data.email, tier: user.data.tier, restrictions: user.data.restrictions || {}, lastKnownIp: user.data.lastKnownIp });
    } catch (err) {
        console.error('Admin User Info Error:', err);
        res.status(500).json({ error: 'Failed to retrieve user info.' });
    }
});

// POST /api/users/admin/moderate
router.post('/admin/moderate', async (req, res) => {
    try {
        const { identifier, action, reason, duration } = req.body;
        if (!identifier || !action) return res.status(400).json({ error: 'identifier and action required.' });
        const user = await resolveUser(identifier);
        if (!user) return res.status(404).json({ error: 'User not found.' });
        const expiresAt = duration ? new Date(Date.now() + duration * 60 * 60 * 1000).toISOString() : null;
        const updates = {};
        switch (action) {
            case 'BAN': updates.tier = 'BANNED'; updates.banReason = reason || 'Protocol violation.'; updates.bannedAt = new Date().toISOString(); if (expiresAt) updates['restrictions.banExpiry'] = expiresAt; break;
            case 'UNBAN': updates.tier = 'FREE'; updates['restrictions.banExpiry'] = null; break;
            case 'MUTE': updates['restrictions.muted'] = true; updates['restrictions.mutedUntil'] = expiresAt; updates['restrictions.muteReason'] = reason || null; break;
            case 'UNMUTE': updates['restrictions.muted'] = false; updates['restrictions.mutedUntil'] = null; updates['restrictions.muteReason'] = null; break;
            case 'BLOCK_UPLOAD': updates['restrictions.uploadBlocked'] = true; updates['restrictions.uploadBlockedUntil'] = expiresAt; break;
            case 'UNBLOCK_UPLOAD': updates['restrictions.uploadBlocked'] = false; updates['restrictions.uploadBlockedUntil'] = null; break;
            case 'BLOCK_CASHOUT': updates['restrictions.cashoutBlocked'] = true; updates['restrictions.cashoutBlockedUntil'] = expiresAt; break;
            case 'UNBLOCK_CASHOUT': updates['restrictions.cashoutBlocked'] = false; updates['restrictions.cashoutBlockedUntil'] = null; break;
            case 'BLOCK_DOWNLOAD': updates['restrictions.downloadBlocked'] = true; updates['restrictions.downloadBlockedUntil'] = expiresAt; break;
            case 'UNBLOCK_DOWNLOAD': updates['restrictions.downloadBlocked'] = false; updates['restrictions.downloadBlockedUntil'] = null; break;
            default: return res.status(400).json({ error: `Unknown action: ${action}` });
        }
        await user.ref.update(updates);

        // Log violation
        const isRevoke = action.startsWith('UN') || action.startsWith('UNBLOCK');
        await db.collection('violations').add({
            uid: user.id,
            username: user.data.username,
            action,
            reason: reason || null,
            duration: duration || null,
            expiresAt: expiresAt || null,
            appliedAt: new Date().toISOString(),
            revoked: isRevoke,
        });

        res.json({ success: true, action, uid: user.id, username: user.data.username });
    } catch (err) {
        console.error('Moderate Error:', err);
        res.status(500).json({ error: 'Moderation action failed.' });
    }
});

// GET /api/users/admin/violations
router.get('/admin/violations', async (req, res) => {
    try {
        const { uid, period } = req.query;
        if (!uid) return res.status(400).json({ error: 'uid required' });

        // Removing .orderBy() because it requires a composite index (uid ASC, appliedAt DESC).
        // Since we sort the records array in JS later on, the DB query just needs the where() clause.
        const snapshot = await db.collection('violations').where('uid', '==', uid).get();
        let records = [];
        snapshot.forEach(doc => {
            records.push({ id: doc.id, ...doc.data() });
        });

        if (period && period !== 'lifetime') {
            const now = new Date();
            let msToSub = 0;
            switch (period) {
                case '1h': msToSub = 60 * 60 * 1000; break;
                case '1d': msToSub = 24 * 60 * 60 * 1000; break;
                case '7d': msToSub = 7 * 24 * 60 * 60 * 1000; break;
                case '30d': msToSub = 30 * 24 * 60 * 60 * 1000; break;
                case '365d': msToSub = 365 * 24 * 60 * 60 * 1000; break;
            }
            if (msToSub > 0) {
                const cutoff = new Date(now.getTime() - msToSub).toISOString();
                records = records.filter(r => r.appliedAt >= cutoff);
            }
        }

        records.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

        res.json(records);
    } catch (err) {
        console.error('Fetch violations error:', err);
        res.status(500).json({ error: 'Failed to fetch violations' });
    }
});

// Simple Memory Cache for Individual Users (TTL 60 seconds)
const userCache = {
    store: new Map(),
    get(uid) {
        const item = this.store.get(uid);
        if (!item) return null;
        if (Date.now() > item.expiry) {
            this.store.delete(uid);
            return null;
        }
        return item.value;
    },
    set(uid, value) {
        if (this.store.size > 500) this.store.clear(); // max 500 users in memory
        this.store.set(uid, { value, expiry: Date.now() + 60000 });
    },
    clear(uid) {
        if (uid) this.store.delete(uid);
        else this.store.clear();
    }
};

// GET /api/users/:id
router.get('/:id', async (req, res) => {
    try {
        const uid = req.params.id;
        const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        // Check cache first
        const cachedUser = userCache.get(uid);
        if (cachedUser) {
            // Asynchronously update IP if it changed, but still return cached data immediately
            if (cachedUser.lastKnownIp !== clientIp) {
                db.collection('users').doc(uid).update({ lastKnownIp: clientIp }).catch(console.error);
                cachedUser.lastKnownIp = clientIp;
                userCache.set(uid, cachedUser);
            }
            return res.json(cachedUser);
        }

        const userRef = db.collection('users').doc(uid);
        const doc = await userRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        let userData = doc.data();

        if (userData.lastKnownIp !== clientIp) {
            await userRef.update({ lastKnownIp: clientIp });
            userData.lastKnownIp = clientIp;
        }

        // Cache the newly fetched data
        userCache.set(uid, userData);

        // --- AUTO-EXPIRE BAN & RESTRICTIONS ---
        const now = new Date();
        const r = userData.restrictions || {};
        const expireUpdates = {};

        if (userData.tier === 'BANNED' && r.banExpiry && new Date(r.banExpiry) < now) {
            expireUpdates.tier = 'FREE';
            expireUpdates['restrictions.banExpiry'] = null;
        }
        if (r.mutedUntil && new Date(r.mutedUntil) < now) {
            expireUpdates['restrictions.muted'] = false;
            expireUpdates['restrictions.mutedUntil'] = null;
        }
        if (r.uploadBlockedUntil && new Date(r.uploadBlockedUntil) < now) {
            expireUpdates['restrictions.uploadBlocked'] = false;
            expireUpdates['restrictions.uploadBlockedUntil'] = null;
        }
        if (r.cashoutBlockedUntil && new Date(r.cashoutBlockedUntil) < now) {
            expireUpdates['restrictions.cashoutBlocked'] = false;
            expireUpdates['restrictions.cashoutBlockedUntil'] = null;
        }
        if (r.downloadBlockedUntil && new Date(r.downloadBlockedUntil) < now) {
            expireUpdates['restrictions.downloadBlocked'] = false;
            expireUpdates['restrictions.downloadBlockedUntil'] = null;
        }
        if (Object.keys(expireUpdates).length > 0) {
            await userRef.update(expireUpdates);
            if (expireUpdates.tier) userData.tier = expireUpdates.tier;
            Object.assign(userData.restrictions || {}, Object.fromEntries(
                Object.entries(expireUpdates)
                    .filter(([k]) => k.startsWith('restrictions.'))
                    .map(([k, v]) => [k.replace('restrictions.', ''), v])
            ));
        }
        // ----------------------------------------

        // --- DAILY PULSE REWARD LOGIC ---
        const nowPulse = new Date();
        const lastPulse = userData.lastLoginPulse ? (userData.lastLoginPulse.toDate ? userData.lastLoginPulse.toDate() : new Date(userData.lastLoginPulse)) : null;
        const isNewDay = !lastPulse || (nowPulse.setHours(0, 0, 0, 0) > new Date(lastPulse).setHours(0, 0, 0, 0));

        if (isNewDay) {
            const oneDayMs = 24 * 60 * 60 * 1000;
            const diffDays = lastPulse ? Math.floor((nowPulse - lastPulse) / oneDayMs) : 0;

            let newStreak = (userData.streakCount || 0) + 1;
            if (diffDays > 1) newStreak = 1;

            const reward = Math.min(100 + (newStreak - 1) * 50, 500);

            await userRef.update({
                'stats.kpcBalance': admin.firestore.FieldValue.increment(reward),
                'streakCount': newStreak,
                'lastLoginPulse': admin.firestore.FieldValue.serverTimestamp()
            });

            userData.stats.kpcBalance = (userData.stats.kpcBalance || 0) + reward;
            userData.streakCount = newStreak;
            userData.dailyPulseReward = reward;

            await db.collection('kpc_ledger').add({
                uid: req.params.id, amount: reward, type: 'DAILY_PULSE', streak: newStreak, timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        // --------------------------------

        // Lazy check for achievements
        const newBadges = checkAchievements(userData);
        if (newBadges.length > 0) {
            await userRef.update({
                badges: admin.firestore.FieldValue.arrayUnion(...newBadges)
            });
            userData.badges = [...(userData.badges || []), ...newBadges];
        }

        res.json(userData);
    } catch (error) {
        console.error('Fetch User Error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// GET /api/users/profile/:username - Fetch public profile and their projects
router.get('/profile/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const snapshot = await db.collection('users').where('username', '==', username).get();

        if (snapshot.empty) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        const userData = snapshot.docs[0].data();
        const userId = snapshot.docs[0].id;

        const { viewerId } = req.query;

        // Fetch user's projects
        const projectsSnapshot = await db.collection('projects')
            .where('author.uid', '==', userId)
            .get();

        let projects = projectsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Filter private projects: Only show if viewer is the author
        projects = projects.filter(p => !p.isPrivate || p.author.uid === viewerId);

        projects.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB - dateA;
        });

        res.json({
            user: userData,
            projects
        });
    } catch (error) {
        console.error('Fetch Public Profile Error:', error);
        res.status(500).json({ error: 'Failed to fetch public profile' });
    }
});

// PUT /api/users/:id (Update Profile)
router.put('/:id', async (req, res) => {
    try {
        const { uid, displayName, bio, gender, birthdate, username, location, website } = req.body;

        // Security check
        if (req.params.id !== uid) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userData = userDoc.data();

        let updates = {
            displayName: displayName || userData.displayName || '',
            bio: bio || userData.bio || '',
            location: location || userData.location || '',
            website: website || userData.website || '',
            gender: gender || userData.gender || '',
            birthdate: birthdate || userData.birthdate || null,
            socials: req.body.socials || userData.socials || {},
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // Handle Username Change
        const incomingUsername = (username || '').toLowerCase().trim();
        const existingUsername = (userData.username || '').toLowerCase().trim();

        if (incomingUsername && incomingUsername !== existingUsername) {
            // 1. Check 14-day limit
            const lastChange = userData.lastUsernameChange ? userData.lastUsernameChange.toDate() : null;
            if (lastChange) {
                const now = new Date();
                const daysSinceChange = (now - lastChange) / (1000 * 60 * 60 * 24);
                if (daysSinceChange < 14) {
                    const remainingDays = Math.ceil(14 - daysSinceChange);
                    return res.status(429).json({
                        error: `You can only change your username once every 14 days. Try again in ${remainingDays} day${remainingDays > 1 ? 's' : ''}.`
                    });
                }
            }

            // 2. Check availability
            const usernameCheck = await db.collection('users').where('username', '==', incomingUsername).get();
            if (!usernameCheck.empty) {
                // Check if it's taken by someone else
                const takenByOther = usernameCheck.docs.find(doc => doc.id !== uid);
                if (takenByOther) {
                    return res.status(400).json({ error: 'Username already taken' });
                }
            }

            updates.username = incomingUsername;
            updates.lastUsernameChange = admin.firestore.FieldValue.serverTimestamp();
        }

        await userRef.set(updates, { merge: true });

        res.json({ success: true });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// GET /api/users/:id/avatar
router.get('/:id/avatar', async (req, res) => {
    try {
        const doc = await db.collection('users').doc(req.params.id).get();
        if (!doc.exists) return res.redirect('https://ui-avatars.com/api/?name=User&background=random'); // Fallback

        const user = doc.data();
        if (user.photoURL && user.photoURL.startsWith('http') && !user.photoURL.includes('localhost')) {
            // If it's an external URL (Google/GitHub) and not our proxy, redirect directly
            return res.redirect(user.photoURL);
        }

        if (user.avatarKey) {
            // If stored in R2, generate signed URL
            const url = await getFileUrl(user.avatarKey);
            return res.redirect(url);
        }

        // Default fallback if no photo
        res.redirect(`https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=random`);
    } catch (error) {
        console.error('Avatar Fetch Error:', error);
        res.redirect('https://ui-avatars.com/api/?name=Error&background=random');
    }
});

// POST /api/users/:id/avatar
router.post('/:id/avatar', upload.single('avatar'), async (req, res) => {
    try {
        const { uid } = req.body; // passed via formData or param
        const targetUid = req.params.id;

        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const fileName = `avatars/${targetUid}_${Date.now()}`;
        const fileKey = await uploadFile(req.file.buffer, fileName, req.file.mimetype);

        // Update User Profile with local proxy URL or Key
        const photoURL = `http://localhost:5000/api/users/${targetUid}/avatar`;

        await db.collection('users').doc(targetUid).update({
            avatarKey: fileKey,
            photoURL: photoURL,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ success: true, photoURL });
    } catch (error) {
        console.error('Avatar Upload Error:', error);
        res.status(500).json({ error: 'Failed to upload avatar' });
    }
});

// POST /api/users/follow/:id
router.post('/follow/:id', async (req, res) => {
    try {
        const { followerId, followerName } = req.body;
        const targetId = req.params.id;

        if (followerId === targetId) {
            return res.status(400).json({ error: 'You cannot follow yourself system-ghost.' });
        }

        const followerRef = db.collection('users').doc(followerId);
        const targetRef = db.collection('users').doc(targetId);

        const [followerDoc, targetDoc] = await Promise.all([followerRef.get(), targetRef.get()]);
        if (!followerDoc.exists || !targetDoc.exists) return res.status(404).json({ error: 'User(s) not found' });

        const following = followerDoc.data().following || [];
        if (following.includes(targetId)) return res.json({ success: true, message: 'Already following' });

        const batch = db.batch();
        batch.update(followerRef, {
            following: admin.firestore.FieldValue.arrayUnion(targetId),
            'stats.followingCount': admin.firestore.FieldValue.increment(1)
        });
        batch.update(targetRef, {
            followers: admin.firestore.FieldValue.arrayUnion(followerId),
            'stats.followersCount': admin.firestore.FieldValue.increment(1)
        });

        const { createNotification } = require('./notifications');
        const { logActivity } = require('./activities');

        await batch.commit();

        await Promise.all([
            createNotification(targetId, followerId, followerName || "Someone", 'follow', null, "Started following you"),
            logActivity(followerId, followerName || "A user", 'follow', targetId, targetDoc.data().username)
        ]);

        res.json({ success: true, message: 'Followed successfully' });
    } catch (error) {
        console.error('Follow Error:', error);
        res.status(500).json({ error: 'Failed to follow user.' });
    }
});

// POST /api/users/unfollow/:id
router.post('/unfollow/:id', async (req, res) => {
    try {
        const { followerId } = req.body;
        const targetId = req.params.id;

        const followerRef = db.collection('users').doc(followerId);
        const targetRef = db.collection('users').doc(targetId);

        const [followerDoc, targetDoc] = await Promise.all([followerRef.get(), targetRef.get()]);
        if (!followerDoc.exists || !targetDoc.exists) return res.status(404).json({ error: 'User(s) not found' });

        const following = followerDoc.data().following || [];
        if (!following.includes(targetId)) return res.json({ success: true, message: 'Not following' });

        const batch = db.batch();
        batch.update(followerRef, {
            following: admin.firestore.FieldValue.arrayRemove(targetId),
            'stats.followingCount': admin.firestore.FieldValue.increment(-1)
        });
        batch.update(targetRef, {
            followers: admin.firestore.FieldValue.arrayRemove(followerId),
            'stats.followersCount': admin.firestore.FieldValue.increment(-1)
        });

        await batch.commit();
        res.json({ success: true, message: 'Unfollowed successfully' });
    } catch (error) {
        console.error('Unfollow Error:', error);
        res.status(500).json({ error: 'Failed to unfollow user.' });
    }
});

// POST /api/users/upgrade (Simulated upgrade)
router.post('/upgrade', async (req, res) => {
    try {
        const { uid, tier } = req.body; // tier: PRO or ELITE
        if (!['PRO', 'ELITE'].includes(tier)) return res.status(400).json({ error: 'Invalid tier' });

        await db.collection('users').doc(uid).update({
            tier,
            membershipExpires: admin.firestore.FieldValue.serverTimestamp() // Simple sim, expires now+30d conceptually
        });

        res.json({ success: true, tier });
    } catch (error) {
        res.status(500).json({ error: 'Upgrade failed' });
    }
});

// POST /api/users/donate/:id
router.post('/donate/:id', async (req, res) => {
    try {
        const { donorId, amount } = req.body;
        const targetId = req.params.id;

        const targetRef = db.collection('users').doc(targetId);
        const donorRef = db.collection('users').doc(donorId);

        const batch = db.batch();
        batch.update(targetRef, {
            'stats.balance': admin.firestore.FieldValue.increment(amount),
            supporters: admin.firestore.FieldValue.arrayUnion(donorId)
        });
        batch.update(donorRef, {
            // Donation reward placeholder
        });

        await batch.commit();
        res.json({ success: true, message: 'Donation received! System synced.' });
    } catch (error) {
        res.status(500).json({ error: 'Donation failed' });
    }
});

// POST /api/users/withdraw
router.post('/withdraw', async (req, res) => {
    try {
        const { uid, amount } = req.body;
        const userRef = db.collection('users').doc(uid);
        const doc = await userRef.get();

        if (!doc.exists) return res.status(404).json({ error: 'User not found' });
        const userData = doc.data();

        if (userData.restrictions?.cashoutBlocked) {
            return res.status(403).json({ error: 'CASHOUT_BLOCKED — Financial withdrawals are restricted on your account.' });
        }

        const currentBalance = userData.stats?.balance || 0;

        if (amount > currentBalance) {
            return res.status(400).json({ error: 'INSUFFICIENT_CREDITS' });
        }

        if (amount < 10) {
            return res.status(400).json({ error: 'MINIMUM_WITHDRAWAL_IS_$10' });
        }

        await userRef.update({
            'stats.balance': admin.firestore.FieldValue.increment(-amount)
        });

        res.json({
            success: true,
            message: `WITHDRAWAL_INITIATED: $${amount} will be transferred to your linked terminal.`,
            newBalance: currentBalance - amount
        });
    } catch (error) {
        res.status(500).json({ error: 'Withdrawal failed' });
    }
});

// Quick in-memory cache to prevent rapid-fire quest claims (Anti-Cheat Cooldown)
const claimCooldowns = new Map();
const COOLDOWN_MS = 3000; // 3 seconds

// POST /api/users/quests/complete
router.post('/quests/complete', async (req, res) => {
    try {
        const { uid, questId } = req.body;

        // Anti-Cheat: Prevent rapid-fire duplicate requests
        const cooldownKey = `${uid}_${questId}`;
        const lastClaim = claimCooldowns.get(cooldownKey);
        if (lastClaim && Date.now() - lastClaim < COOLDOWN_MS) {
            console.warn(`[ANTI_CHEAT] Dropped duplicate quest claim from ${uid} for ${questId}`);
            return res.status(429).json({ error: 'Action on cooldown. Please wait.' });
        }
        claimCooldowns.set(cooldownKey, Date.now());

        const QUEST_REWARDS = {
            1: 50,  // DAILY_SYNC
            2: 200, // SYSTEM_EXPANSION
            3: 100, // PULSE_DONOR
            4: 500  // STREAK_MAINTAINER
        };

        if (!QUEST_REWARDS[questId]) {
            return res.status(400).json({ error: 'Invalid Quest ID' });
        }

        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });

        const userData = userDoc.data();
        const completedQuests = userData.completedQuests || [];

        // Check if already completed (simple daily check - could be expanded to check timestamps for repeatable quests)
        // For now, we assume quests are one-time or reset daily externally.
        // Let's assume daily reset logic is handled by the client clearing local storage or we just allow "completion" if not in array.
        // To make it robust: we store objects { id: 1, date: '2023-10-27' }

        // Simplified for this iteration: Just ID check
        if (completedQuests.includes(questId)) {
            return res.status(400).json({ error: 'Quest already completed' });
        }

        const reward = QUEST_REWARDS[questId];

        await userRef.update({
            completedQuests: admin.firestore.FieldValue.arrayUnion(questId),
            'stats.kpcBalance': admin.firestore.FieldValue.increment(reward * 10)
        });

        res.json({
            success: true,
            message: 'Quest Complete',
            reward
        });

    } catch (error) {
        console.error('Quest Completion Error:', error);
        res.status(500).json({ error: 'Failed' });
    }
});
// GET /api/users/admin/violations?uid=...&period=1h|1d|7d|30d|365d|lifetime
router.get('/admin/violations', async (req, res) => {
    try {
        const { uid, period = 'lifetime' } = req.query;
        if (!uid) return res.status(400).json({ error: 'uid required' });

        const periodMap = { '1h': 1 / 24, '1d': 1, '7d': 7, '30d': 30, '365d': 365 };
        let query = db.collection('violations').where('uid', '==', uid).orderBy('appliedAt', 'desc');

        if (period !== 'lifetime' && periodMap[period]) {
            const since = new Date(Date.now() - periodMap[period] * 24 * 60 * 60 * 1000).toISOString();
            query = query.where('appliedAt', '>=', since);
        }

        const snap = await query.limit(100).get();
        res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
        console.error('Violations Error:', err);
        res.status(500).json({ error: 'Failed to fetch violations.' });
    }
});

module.exports = {
    router,
    clearUserCache: (uid) => userCache.clear(uid)
};


