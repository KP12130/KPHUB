const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');

// GET /api/notifications/:userId - Get recent notifications
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const snapshot = await db.collection('notifications')
            .where('recipientId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();

        const notifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json(notifications);
    } catch (error) {
        console.error('Fetch Notifications Error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// PUT /api/notifications/:notificationId/read - Mark as read
router.put('/:notificationId/read', async (req, res) => {
    try {
        await db.collection('notifications').doc(req.params.notificationId).update({
            read: true
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Read Notification Error:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

// Helper Function (Internal Use - Not a route)
const createNotification = async (recipientId, senderId, senderName, type, projectId, projectTitle) => {
    if (recipientId === senderId) return; // Don't notify self

    try {
        await db.collection('notifications').add({
            recipientId,
            senderId,
            senderName,
            type, // 'like', 'comment'
            projectId,
            projectTitle,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Create Notification Error:', error);
    }
};

module.exports = router;
// Named exports for helpers
module.exports.createNotification = createNotification;
