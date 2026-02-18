const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');

// GET /api/voting/candidates
// Returns top 5 liked projects from the last 30 days as candidates
router.get('/candidates', async (req, res) => {
    try {
        const { userId } = req.query;

        // In a real app, query by date range. For now, just top 5 liked overall.
        const snapshot = await db.collection('projects')
            .orderBy('stats.likes', 'desc')
            .limit(5)
            .get();

        const candidates = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title,
                author: data.author,
                likes: data.stats?.likes || 0,
                thumbnail: data.thumbnail || data.screenshots?.[0] || '',
                votes: data.monthlyVotes || 0
            };
        });

        // Check if user has voted this month
        let hasVoted = false;
        let votedProjectId = null;

        if (userId) {
            const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
            const voteDoc = await db.collection('monthly_votes').doc(`${userId}_${currentMonth}`).get();
            if (voteDoc.exists) {
                hasVoted = true;
                votedProjectId = voteDoc.data().projectId;
            }
        }

        res.json({ candidates, hasVoted, votedProjectId });
    } catch (error) {
        console.error('Voting Candidates Error:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

// POST /api/voting/vote
router.post('/vote', async (req, res) => {
    try {
        const { userId, projectId } = req.body;
        if (!userId || !projectId) return res.status(400).json({ error: 'Missing fields' });

        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        const voteRef = db.collection('monthly_votes').doc(`${userId}_${currentMonth}`);

        await db.runTransaction(async (t) => {
            const voteDoc = await t.get(voteRef);
            if (voteDoc.exists) {
                throw new Error('ALREADY_VOTED');
            }

            const projectRef = db.collection('projects').doc(projectId);
            const projectDoc = await t.get(projectRef);
            if (!projectDoc.exists) throw new Error('PROJECT_NOT_FOUND');

            t.set(voteRef, {
                userId,
                projectId,
                month: currentMonth,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            t.update(projectRef, {
                monthlyVotes: admin.firestore.FieldValue.increment(1)
            });
        });

        const { logActivity } = require('./activities');
        await logActivity(userId, 'Voter', 'vote', projectId, 'Project of the Month');

        res.json({ success: true });
    } catch (error) {
        if (error.message === 'ALREADY_VOTED') {
            return res.status(403).json({ error: 'You have already voted this cycle.' });
        }
        console.error('Vote Casting Error:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

module.exports = router;
