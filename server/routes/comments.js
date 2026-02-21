const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');
const rateLimit = require('express-rate-limit');
const { triggerAutoModeration, triggerProfanityModeration } = require('../middleware/security');
const { filterProfanity, hasProfanity } = require('../utils/profanity');

const antiCheatHandler = (actionType) => async (req, res, next, options) => {
    const userId = req.body.userId;
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (userId) {
        // Await the moderation logic so the database is guaranteed to be updated BEFORE returning 429.
        await triggerAutoModeration(userId, ip, actionType).catch(console.error);
    }
    res.status(options.statusCode || 429).json(options.message);
};

// -- ANTI-CHEAT RATE LIMITER --
const commentLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    handler: antiCheatHandler('Comment Spam'),
    message: { error: 'ANTI_CHEAT: Comment velocity exceeded. You have received an automated strike.' }
});

// GET /api/comments/user/:uid - Get all comments for projects owned by the user
router.get('/user/:uid', async (req, res) => {
    console.log(`GET /api/comments/user/${req.params.uid} - HIT`);
    try {
        const { uid } = req.params;

        // 1. Get all project IDs for this user
        const projectsSnapshot = await db.collection('projects')
            .where('author.uid', '==', uid)
            .get();

        const projectIds = projectsSnapshot.docs.map(doc => doc.id);
        const projectMap = {};
        projectsSnapshot.docs.forEach(doc => {
            projectMap[doc.id] = doc.data().title;
        });

        if (projectIds.length === 0) return res.json([]);

        // 2. Fetch comments for these projects
        const comments = [];
        const chunkSize = 30;
        for (let i = 0; i < projectIds.length; i += chunkSize) {
            const chunk = projectIds.slice(i, i + chunkSize);
            const snapshot = await db.collection('comments')
                .where('projectId', 'in', chunk)
                .get();

            snapshot.docs.forEach(doc => {
                const comment = doc.data();
                comments.push({
                    id: doc.id,
                    ...comment,
                    projectTitle: projectMap[comment.projectId] || "SYSTEM"
                });
            });
        }

        comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(comments);
    } catch (error) {
        console.error('Fetch User Project Comments Error:', error);
        res.status(500).json({ error: 'Failed to fetch community interactions.' });
    }
});

// GET /api/comments/:projectId - Get all comments for a project
router.get('/:projectId', async (req, res) => {
    try {
        const snapshot = await db.collection('comments')
            .where('projectId', '==', req.params.projectId)
            .get();

        const comments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json(comments);
    } catch (error) {
        console.error('Fetch Comments Error:', error);
        res.status(500).json({ error: 'Failed to fetch comments.' });
    }
});

// POST /api/comments/:projectId - Add a new comment
router.post('/:projectId', commentLimiter, async (req, res) => {
    try {
        const { userId, userName, userAvatar, content } = req.body;
        const { projectId } = req.params;

        if (!content) return res.status(400).json({ error: 'Comment content is required.' });

        // SWEAR FILTER: Halt comment, apply penalty, and return 403 to trigger frontend reload
        if (hasProfanity(content)) {
            const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            await triggerProfanityModeration(userId, ip, 'Comment');
            return res.status(403).json({ error: 'PROFANITY_STRIKE: Account restricted.' });
        }

        const newComment = {
            projectId,
            uid: userId,
            userName,
            userAvatar,
            content, // Uncensored, because it passed the filter check above
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('comments').add(newComment);

        // Optional: Update project comment count
        const projectRef = db.collection('projects').doc(projectId);
        const projectDoc = await projectRef.get();

        await projectRef.update({
            'stats.comments': admin.firestore.FieldValue.increment(1)
        });

        // Create Notification & Log Activity for Author
        if (projectDoc.exists) {
            const projectData = projectDoc.data();
            const { createNotification } = require('./notifications');
            const { logActivity } = require('./activities');
            await Promise.all([
                createNotification(
                    projectData.author.uid,
                    userId,
                    userName,
                    'comment',
                    projectId,
                ),
                logActivity(userId, userName, 'comment', projectId, projectData.title),
                db.collection('users').doc(userId).update({
                    'stats.commentsMade': admin.firestore.FieldValue.increment(1),
                    'stats.reputation': admin.firestore.FieldValue.increment(2)
                })
            ]);
        }

        res.status(201).json({ id: docRef.id, ...newComment });
    } catch (error) {
        console.error('Add Comment Error:', error);
        res.status(500).json({ error: 'Failed to add comment.' });
    }
});

// DELETE /api/comments/:commentId
router.delete('/:commentId', async (req, res) => {
    try {
        const { userId } = req.body; // Requester UID
        const { commentId } = req.params;

        const commentRef = db.collection('comments').doc(commentId);
        const commentDoc = await commentRef.get();

        if (!commentDoc.exists) return res.status(404).json({ error: 'Comment not found' });
        const commentData = commentDoc.data();

        // 1. Fetch project to check if requester is project author
        const projectRef = db.collection('projects').doc(commentData.projectId);
        const projectDoc = await projectRef.get();

        const isCommentOwner = commentData.uid === userId;
        const isProjectAuthor = projectDoc.exists && projectDoc.data().author.uid === userId;

        if (!isCommentOwner && !isProjectAuthor) {
            return res.status(403).json({ error: 'Unauthorized to delete this comment' });
        }

        await commentRef.delete();

        // Decrement count
        if (projectDoc.exists) {
            await projectRef.update({
                'stats.comments': admin.firestore.FieldValue.increment(-1)
            });
        }

        res.json({ success: true, message: 'Comment deleted' });
    } catch (error) {
        console.error('Delete Comment Error:', error);
        res.status(500).json({ error: 'Failed to delete comment.' });
    }
});


module.exports = router;
