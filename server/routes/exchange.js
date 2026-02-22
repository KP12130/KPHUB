const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');

let clearUserCache = () => { }; // Placeholder
const setClearUserCache = (fn) => { clearUserCache = fn; };

/**
 * KPC MEMBERSHIP TIERS
 */
const RANKS = {
    'PRO': { kpcPrice: 5000, label: 'Pro Architect', description: 'Unlock advanced grid visualizers and priority upload streaming.', roles: ['PRO_ARCHITECT'] },
    'ELITE': { kpcPrice: 15000, label: 'Elite Operator', description: 'Full access to experimental protocols and custom avatar flares.', roles: ['PRO_ARCHITECT', 'ELITE_OPERATOR'] },
    'LEGEND': { kpcPrice: 50000, label: 'Grid Legend', description: 'Permanent footprint in the global leaderboard and exclusive badge metadata.', roles: ['PRO_ARCHITECT', 'ELITE_OPERATOR', 'GRID_LEGEND'] }
};

const KPC_BUNDLES = {
    'STARTER': { amount: 2500, price: 4.99, label: 'Starter Hub' },
    'PULSE': { amount: 10000, price: 14.99, label: 'Pulse Stream' },
    'MATRIX': { amount: 50000, price: 49.99, label: 'Matrix Core' },
    'OVERLORD': { amount: 150000, price: 99.99, label: 'Overlord Node' }
};

const FLARES = {
    'NEON': { kpcPrice: 2000, label: 'Neon Flare', style: 'text-shadow: 0 0 10px #39FF14; color: #39FF14;' },
    'CYBER': { kpcPrice: 5000, label: 'Cyber Glitch', style: 'animation: glitch 2s infinite; color: #FF003C;' },
    'MATRIX': { kpcPrice: 10000, label: 'Matrix Flow', style: 'background: linear-gradient(180deg, #00FF41, #003B00); -webkit-background-clip: text; -webkit-text-fill-color: transparent;' }
};

// GET /api/exchange/ranks
router.get('/ranks', (req, res) => {
    res.json(RANKS);
});

// GET /api/exchange/bundles
router.get('/bundles', (req, res) => {
    res.json(KPC_BUNDLES);
});

// GET /api/exchange/flares
router.get('/flares', (req, res) => {
    res.json(FLARES);
});

// POST /api/exchange/buy-flare
router.post('/buy-flare', async (req, res) => {
    try {
        const { uid, flareId } = req.body;
        const flare = FLARES[flareId];
        if (!flare) return res.status(400).json({ error: 'Invalid flare protocol.' });

        const userRef = db.collection('users').doc(uid);

        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw new Error('User not found.');

            const userData = userDoc.data();
            if ((userData.stats?.kpcBalance || 0) < flare.kpcPrice) throw new Error('INSUFFICIENT_KPC_CREDITS');

            transaction.update(userRef, {
                'stats.kpcBalance': admin.firestore.FieldValue.increment(-flare.kpcPrice),
                'activeFlare': flareId,
                'unlockedFlares': admin.firestore.FieldValue.arrayUnion(flareId)
            });

            // Ledger log
            transaction.set(db.collection('kpc_ledger').doc(), {
                uid, amount: -flare.kpcPrice, type: 'COSMETIC_PURCHASE', item: flareId, timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        });

        res.json({ success: true, flareId });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

// POST /api/exchange/verify
router.post('/verify', async (req, res) => {
    try {
        const { uid } = req.body;
        const VERIFY_COST = 25000;

        const userRef = db.collection('users').doc(uid);

        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            const userData = userDoc.data();

            if (userData.stats?.verified) throw new Error('ALREADY_VERIFIED');
            if (userData.stats?.kpcBalance < VERIFY_COST) throw new Error('INSUFFICIENT_KPC_CREDITS');

            transaction.update(userRef, {
                'stats.kpcBalance': admin.firestore.FieldValue.increment(-VERIFY_COST),
                'verificationPending': true
            });

            // Ledger log
            transaction.set(db.collection('kpc_ledger').doc(), {
                uid, amount: -VERIFY_COST, type: 'VERIFICATION_APPLICATION', timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        });

        res.json({ success: true, message: 'Application submitted for central audit.' });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

// POST /api/exchange/buy-kpc
router.post('/buy-kpc', async (req, res) => {
    try {
        const { uid, bundleId } = req.body;
        if (!uid || !bundleId) return res.status(400).json({ error: 'System error: Missing acquisition data.' });

        const bundle = KPC_BUNDLES[bundleId];
        if (!bundle) return res.status(400).json({ error: 'Invalid bundle protocol.' });

        const userRef = db.collection('users').doc(uid);

        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw new Error('User not found.');

            // In a real app, verify payment status here with Stripe/PayPal webhook
            // For this sim, we assume payment success reached this route.

            transaction.update(userRef, {
                'stats.kpcBalance': admin.firestore.FieldValue.increment(bundle.amount),
                'updatedAt': admin.firestore.FieldValue.serverTimestamp()
            });

            // Log to ledger
            const ledgerRef = db.collection('kpc_ledger').doc();
            transaction.set(ledgerRef, {
                uid,
                amount: bundle.amount,
                price: bundle.price,
                type: 'PURCHASE_CREDITS',
                bundleId,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        });

        res.json({ success: true, message: `Acquisition complete. ${bundle.amount} KPC channeled to your account.`, newIncrement: bundle.amount });

    } catch (error) {
        console.error('KPC Purchase Error:', error);
        res.status(400).json({ error: error.message || 'Acquisition failed.' });
    }
});

// POST /api/exchange/purchase
router.post('/purchase', async (req, res) => {
    try {
        const { uid, rankId } = req.body;
        if (!uid || !rankId) return res.status(400).json({ error: 'Missing logic credentials.' });

        const rank = RANKS[rankId];
        if (!rank) return res.status(400).json({ error: 'Invalid protocol rank.' });

        const userRef = db.collection('users').doc(uid);

        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw new Error('User not found.');

            const userData = userDoc.data();
            const currentBalance = userData.stats?.kpcBalance || 0;

            if (currentBalance < rank.kpcPrice) {
                throw new Error('INSUFFICIENT_KPC_CREDITS');
            }

            // Deduct balance and upgrade tier/roles
            transaction.update(userRef, {
                'stats.kpcBalance': admin.firestore.FieldValue.increment(-rank.kpcPrice),
                'tier': rankId,
                'roles': admin.firestore.FieldValue.arrayUnion(...(rank.roles || [])),
                'updatedAt': admin.firestore.FieldValue.serverTimestamp()
            });

            // Log to ledger
            const ledgerRef = db.collection('kpc_ledger').doc();
            transaction.set(ledgerRef, {
                uid,
                amount: -rank.kpcPrice,
                type: 'PURCHASE',
                item: rankId,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        });

        // Invalidate cache immediately
        clearUserCache(uid);

        res.json({ success: true, message: `Rank UPGRADED to ${rankId}. KPC deducted.`, tier: rankId });

    } catch (error) {
        console.error('KPC Exchange Error:', error);
        res.status(400).json({ error: error.message || 'Transaction failed.' });
    }
});

// GET /api/exchange/ledger/:uid
router.get('/ledger/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        const snapshot = await db.collection('kpc_ledger')
            .where('uid', '==', uid)
            .get();

        const transactions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Sort in memory to avoid missing index 400 errors
        transactions.sort((a, b) => {
            const timeA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
            const timeB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
            return timeB - timeA;
        });

        res.json(transactions.slice(0, 50));
    } catch (e) {
        console.error('Ledger error:', e);
        res.status(400).json({ error: e.message });
    }
});

const { checkAchievements } = require('../utils/achievements');

// POST /api/exchange/donate/:id
router.post('/donate/:id', async (req, res) => {
    try {
        const { donorId, amount } = req.body;
        const targetId = req.params.id;

        if (!donorId || !targetId || !amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid transfer parameters.' });
        }

        const donorRef = db.collection('users').doc(donorId);
        const recipientRef = db.collection('users').doc(targetId);

        let newBadges = [];

        await db.runTransaction(async (transaction) => {
            const [donorDoc, recipientDoc] = await Promise.all([
                transaction.get(donorRef),
                transaction.get(recipientRef)
            ]);

            if (!donorDoc.exists || !recipientDoc.exists) throw new Error('Citizen not found in grid.');
            const donorData = donorDoc.data();
            const recipientData = recipientDoc.data();

            if ((donorData.stats?.kpcBalance || 0) < amount) throw new Error('INSUFFICIENT_KPC_CREDITS');

            const updatedTotalDonated = (donorData.stats?.totalDonated || 0) + amount;

            // Donor: Deduct balance, update total donated
            transaction.update(donorRef, {
                'stats.kpcBalance': admin.firestore.FieldValue.increment(-amount),
                'stats.totalDonated': admin.firestore.FieldValue.increment(amount)
            });

            // Recipient: Add balance, track supporter
            transaction.update(recipientRef, {
                'stats.kpcBalance': admin.firestore.FieldValue.increment(amount),
                'supporters': admin.firestore.FieldValue.arrayUnion(donorId)
            });

            // Achievement Check for Donor
            const donorUpdateObj = {
                ...donorData,
                stats: { ...donorData.stats, totalDonated: updatedTotalDonated }
            };
            newBadges = checkAchievements(donorUpdateObj);
            if (newBadges.length > 0) {
                transaction.update(donorRef, {
                    'badges': admin.firestore.FieldValue.arrayUnion(...newBadges)
                });
            }

            // Ledger: Log donor deduction
            transaction.set(db.collection('kpc_ledger').doc(), {
                uid: donorId, amount: -amount, type: 'PEER_DONATION_OUT', recipientId: targetId, recipientName: recipientData.username || 'Unknown', timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

            // Ledger: Log recipient addition
            transaction.set(db.collection('kpc_ledger').doc(), {
                uid: targetId, amount: amount, type: 'PEER_DONATION_IN', donorId: donorId, donorName: donorData.username || 'Unknown', timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        });

        res.json({ success: true, message: `System synced. ${amount} KPC transferred.`, achievements: newBadges });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

// ADMIN: GET /api/exchange/admin/pending-verifications
router.get('/admin/pending-verifications', async (req, res) => {
    try {
        const snapshot = await db.collection('users').where('verificationPending', '==', true).get();
        const pending = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(pending);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

// ADMIN: POST /api/exchange/admin/verify-action
router.post('/admin/verify-action', async (req, res) => {
    try {
        const { uid, action, feedback } = req.body; // action: 'APPROVE' or 'REJECT'
        const userRef = db.collection('users').doc(uid);

        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw new Error('User not found.');

            const updates = { verificationPending: false };
            if (action === 'APPROVE') {
                updates['stats.verified'] = true;
                updates['verificationFeedback'] = 'Identity verified by central audit.';
            } else {
                updates['verificationFeedback'] = feedback || 'Application rejected. Insufficient grid presence.';
            }

            transaction.update(userRef, updates);

            // Log result to ledger
            transaction.set(db.collection('kpc_ledger').doc(), {
                uid, type: `VERIFICATION_${action}`, timestamp: admin.firestore.FieldValue.serverTimestamp(), amount: 0
            });
        });

        res.json({ success: true, message: `Action ${action} processed for ${uid}.` });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

// POST /api/exchange/broadcast
router.post('/broadcast', async (req, res) => {
    try {
        const { uid, message } = req.body;
        const BROADCAST_COST = 50000;

        if (!message || message.length > 100) throw new Error('Invalid message packet.');
        const userRef = db.collection('users').doc(uid);

        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw new Error('Citizen not found.');
            const userData = userDoc.data();

            if ((userData.stats?.kpcBalance || 0) < BROADCAST_COST) throw new Error('INSUFFICIENT_KPC_CREDITS');

            // Deduct balance
            const updatedBroadcastsCount = (userData.stats?.broadcastsCount || 0) + 1;
            transaction.update(userRef, {
                'stats.kpcBalance': admin.firestore.FieldValue.increment(-BROADCAST_COST),
                'stats.broadcastsCount': admin.firestore.FieldValue.increment(1)
            });

            // Achievement Check
            const userUpdateObj = {
                ...userData,
                stats: { ...userData.stats, broadcastsCount: updatedBroadcastsCount }
            };
            const newBadges = checkAchievements(userUpdateObj);
            if (newBadges.length > 0) {
                transaction.update(userRef, {
                    'badges': admin.firestore.FieldValue.arrayUnion(...newBadges)
                });
            }

            // Create global broadcast entry
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
            const broadcastRef = db.collection('broadcasts').doc();
            transaction.set(broadcastRef, {
                uid,
                username: userData.username,
                message,
                expiresAt,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

            // Ledger log
            transaction.set(db.collection('kpc_ledger').doc(), {
                uid, amount: -BROADCAST_COST, type: 'GLOBAL_BROADCAST', timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        });

        res.json({ success: true, message: 'Pulse broadcasted to the grid.' });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

/**
 * PHASE 16: GIFTING & PRESTIGE
 */

// POST /api/exchange/gift-rank
router.post('/gift-rank', async (req, res) => {
    try {
        const { donorId, targetId, rankId } = req.body;
        if (!donorId || !targetId || !rankId) throw new Error('Invalid gifting parameters.');

        const rank = RANKS[rankId];
        if (!rank) throw new Error('Invalid protocol rank.');

        const donorRef = db.collection('users').doc(donorId);
        const recipientRef = db.collection('users').doc(targetId);

        await db.runTransaction(async (transaction) => {
            const [donorDoc, recipientDoc] = await Promise.all([
                transaction.get(donorRef),
                transaction.get(recipientRef)
            ]);

            if (!donorDoc.exists || !recipientDoc.exists) throw new Error('Citizen not found.');
            const donorData = donorDoc.data();
            const recipientData = recipientDoc.data();

            if ((donorData.stats?.kpcBalance || 0) < rank.kpcPrice) throw new Error('INSUFFICIENT_KPC_CREDITS');
            if (recipientData.tier === rankId) throw new Error('TARGET_ALREADY_HAS_RANK');

            // Donor: Deduct balance
            const updatedTotalGifted = (donorData.stats?.totalGifted || 0) + rank.kpcPrice;
            transaction.update(donorRef, {
                'stats.kpcBalance': admin.firestore.FieldValue.increment(-rank.kpcPrice),
                'stats.totalGifted': admin.firestore.FieldValue.increment(rank.kpcPrice)
            });

            // Gifting Achievement Check
            const donorUpdateObj = {
                ...donorData,
                stats: { ...donorData.stats, totalGifted: updatedTotalGifted }
            };
            const newBadges = checkAchievements(donorUpdateObj);
            if (newBadges.length > 0) {
                transaction.update(donorRef, {
                    'badges': admin.firestore.FieldValue.arrayUnion(...newBadges)
                });
            }

            // Recipient: Upgrade tier and roles
            transaction.update(recipientRef, {
                'tier': rankId,
                'roles': admin.firestore.FieldValue.arrayUnion(...(rank.roles || [])),
                'updatedAt': admin.firestore.FieldValue.serverTimestamp()
            });

            // Ledger: Log donor deduction
            transaction.set(db.collection('kpc_ledger').doc(), {
                uid: donorId, amount: -rank.kpcPrice, type: 'GIFT_RANK_OUT', recipientId: targetId, recipientName: recipientData.username, rankId, timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

        });
    });

// Invalidate cache for both parties
clearUserCache(donorId);
clearUserCache(targetId);

res.json({ success: true, message: `Gift Protocol Successful. ${rankId} granted to ${targetId}.` });
    } catch (e) {
    res.status(400).json({ error: e.message });
}
});

// GET /api/exchange/top-donors/:uid
router.get('/top-donors/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        // Find users who have donated OUT to this UID
        const snapshot = await db.collection('kpc_ledger')
            .where('recipientId', '==', uid)
            .where('type', '==', 'PEER_DONATION_OUT')
            .get();

        const donorMap = {};
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const donorId = data.uid;
            const amount = Math.abs(data.amount);
            if (!donorMap[donorId]) {
                donorMap[donorId] = { id: donorId, username: data.donorName || 'GHOST', total: 0 };
            }
            donorMap[donorId].total += amount;
        });

        const topDonors = Object.values(donorMap).sort((a, b) => b.total - a.total).slice(0, 10);
        res.json(topDonors);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

// Simple cache for heavy aggregation (TTL 5 minutes)
let statsCache = { value: null, expiry: 0 };

// GET /api/exchange/stats
router.get('/stats', async (req, res) => {
    try {
        if (statsCache.value && Date.now() < statsCache.expiry) {
            return res.json(statsCache.value);
        }

        // This is a simple aggregation, we might want to cache this in a 'system_stats' doc later
        const ledgerSnap = await db.collection('kpc_ledger').get();
        let totalBurned = 0; // Rank purchases, flares, boosts, verification
        let totalVolume = 0; // Total transaction amount

        ledgerSnap.docs.forEach(doc => {
            const data = doc.data();
            if (data.amount < 0) totalBurned += Math.abs(data.amount);
            totalVolume += Math.abs(data.amount);
        });

        const usersSnap = await db.collection('users').get();
        // Since we need to sum kpcBalance, we still fetch users for now, 
        // but let's at least mention totalUsers from the size.
        // In a real high-scale app, we'd use a summary doc for this.
        let totalCreditsInCirculation = 0;
        usersSnap.docs.forEach(doc => {
            totalCreditsInCirculation += (doc.data().stats?.kpcBalance || 0);
        });

        const totalUsers = usersSnap.size;

        const responseData = {
            totalBurned,
            totalVolume,
            totalCreditsInCirculation,
            totalUsers,
            protocolVersion: '2.4.0_EXPANSION'
        };

        statsCache = { value: responseData, expiry: Date.now() + 300000 }; // 5 minutes

        res.json(responseData);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

// POST /api/exchange/redeem - Secret protocol for access overrides
router.post('/redeem', async (req, res) => {
    try {
        const { uid, code } = req.body;
        if (!uid || !code) return res.status(400).json({ error: 'Missing credentials.' });

        if (String(code).trim() === '12130') {
            await db.collection('users').doc(uid).update({
                tier: 'PRO',
                membershipExpires: null
            });

            // Ledger log for the bypass
            await db.collection('kpc_ledger').add({
                uid,
                amount: 1000,
                type: 'CODE_REDEMPTION',
                item: 'PRO_OVERRIDE',
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

            return res.json({
                success: true,
                message: 'ACCESS_GRANTED: Override code accepted.',
                tier: 'PRO'
            });
        }

        res.status(400).json({ error: 'ACCESS_DENIED: Invalid protocol code.' });
    } catch (error) {
        res.status(500).json({ error: 'System error.' });
    }
});

module.exports = {
    router,
    setClearUserCache
};
