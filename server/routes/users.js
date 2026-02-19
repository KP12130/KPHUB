const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');
const { BADGES } = require('../utils/achievements');

// GET /api/users/badges/definitions
router.get('/badges/definitions', (req, res) => {
    res.json(BADGES);
});

// POST /api/users/redeem (Secret Protocol - Moved to top for priority)
router.post('/redeem', async (req, res) => {
    try {
        const { uid, code } = req.body;
        console.log(`[SYSTEM_AUDIT] Attempting redeem for UID: ${uid} with Code: '${code}'`);

        if (!uid || !code) return res.status(400).json({ error: 'Missing credentials.' });

        // The Secret Protocol (Trimmed for safety)
        if (String(code).trim() === '12130') {
            console.log('[SYSTEM_AUDIT] Access GRANTED.');

            await db.collection('users').doc(uid).update({
                tier: 'PRO',
                membershipExpires: null, // Lifetime access
                'stats.reputation': admin.firestore.FieldValue.increment(1000) // Bonus rep
            });

            return res.json({
                success: true,
                message: 'ACCESS_GRANTED: Override code accepted. Welcome to the Elite.',
                tier: 'PRO'
            });
        }

        console.log('[SYSTEM_AUDIT] Access DENIED.');
        res.status(400).json({ error: 'ACCESS_DENIED: Invalid protocol code.' });

    } catch (error) {
        console.error('Redeem Error:', error);
        res.status(500).json({ error: 'System error during override.' });
    }
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
                reputation: 0,
                balance: 0, // Monetization balance (USD)
                kpcBalance: 0, // Virtual currency balance
                xp: 0, // Experience points
                verified: false, // Professional verification status
                supporters: 0
            },
            tier: 'GHOST', // Default tier
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

// GET /api/users/:id
router.get('/:id', async (req, res) => {
    try {
        const userRef = db.collection('users').doc(req.params.id);
        const doc = await userRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        let userData = doc.data();

        // --- DAILY PULSE REWARD LOGIC ---
        const now = new Date();
        const lastPulse = userData.lastLoginPulse ? (userData.lastLoginPulse.toDate ? userData.lastLoginPulse.toDate() : new Date(userData.lastLoginPulse)) : null;
        const isNewDay = !lastPulse || (now.setHours(0, 0, 0, 0) > new Date(lastPulse).setHours(0, 0, 0, 0));

        if (isNewDay) {
            const oneDayMs = 24 * 60 * 60 * 1000;
            const diffDays = lastPulse ? Math.floor((now - lastPulse) / oneDayMs) : 0;

            let newStreak = (userData.streakCount || 0) + 1;
            if (diffDays > 1) newStreak = 1;

            const reward = Math.min(100 + (newStreak - 1) * 50, 500);

            await userRef.update({
                'stats.kpcBalance': admin.firestore.FieldValue.increment(reward),
                'stats.xp': admin.firestore.FieldValue.increment(reward),
                'streakCount': newStreak,
                'lastLoginPulse': admin.firestore.FieldValue.serverTimestamp()
            });

            userData.stats.kpcBalance = (userData.stats.kpcBalance || 0) + reward;
            userData.stats.xp = (userData.stats.xp || 0) + reward;
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
        const { uid, displayName, bio, gender, birthdate, username } = req.body;

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
            displayName,
            bio,
            gender,
            birthdate,
            socials: req.body.socials || userData.socials || {},
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // Handle Username Change
        if (username && username !== userData.username) {
            // 1. Check 14-day limit
            const lastChange = userData.lastUsernameChange ? userData.lastUsernameChange.toDate() : null;
            if (lastChange) {
                const daysSinceChange = (new Date() - lastChange) / (1000 * 60 * 60 * 24);
                if (daysSinceChange < 14) {
                    return res.status(429).json({
                        error: `You can only change your username once every 14 days. Try again in ${Math.ceil(14 - daysSinceChange)} days.`
                    });
                }
            }

            // 2. Check availability
            const usernameCheck = await db.collection('users').where('username', '==', username).get();
            if (!usernameCheck.empty) {
                return res.status(400).json({ error: 'Username already taken' });
            }

            updates.username = username;
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
        const { followerId } = req.body;
        const targetId = req.params.id;

        if (followerId === targetId) {
            return res.status(400).json({ error: 'You cannot follow yourself system-ghost.' });
        }

        const followerRef = db.collection('users').doc(followerId);
        const targetRef = db.collection('users').doc(targetId);

        // Atomic update using batch
        const batch = db.batch();
        batch.update(followerRef, {
            following: admin.firestore.FieldValue.arrayUnion(targetId)
        });
        batch.update(targetRef, {
            followers: admin.firestore.FieldValue.arrayUnion(followerId),
            'stats.reputation': admin.firestore.FieldValue.increment(5)
        });

        await batch.commit();
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

        const batch = db.batch();
        batch.update(followerRef, {
            following: admin.firestore.FieldValue.arrayRemove(targetId)
        });
        batch.update(targetRef, {
            followers: admin.firestore.FieldValue.arrayRemove(followerId)
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
            'stats.reputation': admin.firestore.FieldValue.increment(Math.ceil(amount / 2)),
            supporters: admin.firestore.FieldValue.arrayUnion(donorId)
        });
        batch.update(donorRef, {
            'stats.reputation': admin.firestore.FieldValue.increment(10) // Donation reward
        });

        await batch.commit();
        res.json({ success: true, message: 'Donation received! Reputation increased.' });
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

// POST /api/users/quests/complete
router.post('/quests/complete', async (req, res) => {
    try {
        const { uid, questId } = req.body;
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
            'stats.reputation': admin.firestore.FieldValue.increment(reward),
            'stats.kpcBalance': admin.firestore.FieldValue.increment(reward * 10), // 10x Rep = KPC payout
            'stats.xp': admin.firestore.FieldValue.increment(reward * 10) // XP matches KPC payout
        });

        res.json({
            success: true,
            message: 'Quest Complete',
            reward,
            newReputation: (userData.stats?.reputation || 0) + reward
        });

    } catch (error) {
        console.error('Quest Completion Error:', error);
        res.status(500).json({ error: 'Failed' });
    }
});



module.exports = router;
