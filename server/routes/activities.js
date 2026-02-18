const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');

// GET /api/activity - Get latest 10 activities
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('activities')
            .get();

        const activities = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })).sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB - dateA;
        }).slice(0, 10);

        res.json(activities);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch activity' });
    }
});

// Helper for logger (Internal)
const logActivity = async (userId, userName, type, targetId, targetName) => {
    try {
        await db.collection('activities').add({
            userId,
            userName,
            type, // 'upload', 'like', 'comment'
            targetId,
            targetName,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    } catch (err) {
        console.error("Activity Log Error:", err);
    }
};

module.exports = router;
module.exports.logActivity = logActivity;
