const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');

// POST /api/reviews/request - Request a code review
// POST /api/reviews/request - Request a code review
router.post('/request', async (req, res) => {
    try {
        const { userId, projectId, comments, type } = req.body; // type: SECURITY, OPTIMIZATION, BUG_HUNT, GENERAL

        if (!userId || !projectId) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        const projectRef = db.collection('projects').doc(projectId);
        const projectDoc = await projectRef.get();

        if (!projectDoc.exists) {
            return res.status(404).json({ error: "Project not found." });
        }

        const projectData = projectDoc.data();

        if (projectData.author.uid !== userId) {
            return res.status(403).json({ error: "Only the author can request a review." });
        }

        // Check if already has an open review
        const existingReview = await db.collection('reviews')
            .where('projectId', '==', projectId)
            .where('status', '==', 'OPEN')
            .get();

        if (!existingReview.empty) {
            return res.status(400).json({ error: "An open review request already exists for this project." });
        }

        const newReview = {
            projectId,
            projectTitle: projectData.title,
            authorId: userId,
            authorName: projectData.author.name,
            authorAvatar: projectData.author.avatar,
            requestComment: comments || "Please review my code logic and structure.",
            type: type || 'GENERAL',
            status: 'OPEN', // OPEN, COMPLETED
            reviews: [], // Array of review comments
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('reviews').add(newReview);

        res.json({ success: true, id: docRef.id, ...newReview });

    } catch (error) {
        console.error("Request Review Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/reviews - List open review requests
router.get('/', async (req, res) => {
    try {
        const { type } = req.query;
        let query = db.collection('reviews').where('status', '==', 'OPEN');

        if (type && type !== 'ALL') {
            query = query.where('type', '==', type);
        }

        const snapshot = await query.get();

        const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Sort in memory
        reviews.sort((a, b) => {
            const timeA = a.createdAt?._seconds || 0;
            const timeB = b.createdAt?._seconds || 0;
            return timeB - timeA;
        });

        res.json(reviews.slice(0, 20)); // Keep limit
    } catch (error) {
        console.error("Fetch Reviews Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/reviews/:id/comment - Submit a review
router.post('/:id/comment', async (req, res) => {
    try {
        const { userId, userName, userAvatar, content, rating } = req.body; // rating: 'approve', 'request_changes', 'comment'

        if (!userId || !content) {
            return res.status(400).json({ error: "Missing review content." });
        }

        const reviewRef = db.collection('reviews').doc(req.params.id);
        const reviewDoc = await reviewRef.get();

        if (!reviewDoc.exists) {
            return res.status(404).json({ error: "Review request not found." });
        }

        const newComment = {
            userId,
            userName: userName || 'Anonymous',
            userAvatar: userAvatar || null,
            content,
            rating: rating || 'comment',
            createdAt: new Date().toISOString()
        };

        await reviewRef.update({
            reviews: admin.firestore.FieldValue.arrayUnion(newComment)
        });

        // For now, reviewers earn KPC from the contract (placeholder)
        // No reputation incremented.

        res.json({ success: true, message: "Review submitted." });

    } catch (error) {
        console.error("Submit Review Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/reviews/:id/close - Close review request
router.post('/:id/close', async (req, res) => {
    try {
        const { userId } = req.body;
        const reviewRef = db.collection('reviews').doc(req.params.id);
        const reviewDoc = await reviewRef.get();

        if (!reviewDoc.exists) {
            return res.status(404).json({ error: "Review request not found." });
        }

        if (reviewDoc.data().authorId !== userId) {
            return res.status(403).json({ error: "Only the author can close this review." });
        }

        await reviewRef.update({
            status: 'COMPLETED'
        });

        res.json({ success: true, message: "Review request closed." });

    } catch (error) {
        console.error("Close Review Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/reviews/leaderboard - Get top auditors
router.get('/leaderboard', async (req, res) => {
    try {
        // In a real app, we would aggregate this efficiently.
        // For now, let's fetch users with high KPC balance or specific audit stats.
        // Since we don't track "auditScore" explicitly in a separate collection, we'll assume 
        // high rep users are auditors or we just return a mock list for the visual "Polish"
        // provided we don't have time to re-architect the DB for this specific feature right now.

        // However, we CAN fetch users and sort by KPC balance as a proxy, 
        // or properly, we should have incremented an 'auditScore' on the user doc when they review.

        const snapshot = await db.collection('users')
            .get();

        const auditors = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                uid: doc.id,
                name: data.name || data.username,
                photoURL: data.photoURL,
                kpcBalance: data.stats?.kpcBalance || 0,
                auditScore: Math.floor((data.stats?.kpcBalance || 0) / 1000) // Mock audit score from wealth
            };
        });

        // Sort in memory
        auditors.sort((a, b) => b.kpcBalance - a.kpcBalance);

        res.json(auditors.slice(0, 5));
    } catch (error) {
        console.error("Fetch Audit Leaderboard Error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
