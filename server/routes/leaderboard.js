const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// GET /api/leaderboard
router.get('/', async (req, res) => {
    try {
        // Fetch users and sort in memory to avoid composite index requirement
        const snapshot = await db.collection('users').get();

        const leaderboard = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })).sort((a, b) => (b.stats?.reputation || 0) - (a.stats?.reputation || 0))
            .slice(0, 10);

        res.json(leaderboard);
    } catch (error) {
        console.error('Leaderboard Error:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

module.exports = router;
