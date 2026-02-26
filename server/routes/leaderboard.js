const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// GET /api/leaderboard
router.get('/', async (req, res) => {
    try {
        const { sort, timeframe } = req.query;

        if (timeframe === 'monthly') {
            const monthStr = new Date().toISOString().substring(0, 7);
            const snapshot = await db.collection('analytics')
                .where('month', '==', monthStr)
                .get();

            if (snapshot.empty) return res.json([]);

            const monthData = snapshot.docs.map(doc => {
                const data = doc.data();
                const history = data.history || [];
                return {
                    uid: data.uid,
                    views: history.reduce((sum, h) => sum + (h.views || 0), 0),
                    revenue: history.reduce((sum, h) => sum + (h.revenue || 0), 0)
                };
            });

            // Fetch user basic info
            const leaders = await Promise.all(monthData.map(async (l) => {
                const userDoc = await db.collection('users').doc(l.uid).get();
                if (!userDoc.exists) return null;
                const u = userDoc.data();
                return {
                    uid: l.uid,
                    username: u.username,
                    displayName: u.displayName,
                    photoURL: u.photoURL,
                    tier: u.tier,
                    stats: {
                        ...(u.stats || {}),
                        kpcBalance: l.revenue, // For monthly, we show monthly revenue in the "Wealth" slot
                        views: l.views
                    }
                };
            }));

            const result = leaders
                .filter(Boolean)
                .sort((a, b) => {
                    if (sort === 'reputation') return (b.stats?.views || 0) - (a.stats?.views || 0);
                    return (b.stats?.kpcBalance || 0) - (a.stats?.kpcBalance || 0);
                })
                .slice(0, 10);

            return res.json(result);
        }

        // All-Time Reputation / Wealth
        const snapshot = await db.collection('users').get();

        const leaderboard = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })).sort((a, b) => {
            if (sort === 'reputation') {
                return ((b.stats?.likesReceived || 0) + (b.stats?.uploads || 0)) -
                    ((a.stats?.likesReceived || 0) + (a.stats?.uploads || 0));
            }
            return (b.stats?.kpcBalance || 0) - (a.stats?.kpcBalance || 0);
        })
            .slice(0, 10);

        res.json(leaderboard);
    } catch (error) {
        console.error('Leaderboard Error:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

module.exports = router;
