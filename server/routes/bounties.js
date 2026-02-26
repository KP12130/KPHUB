const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');
const { checkMuteMiddleware } = require('../middleware/security');

// GET /api/bounties - List all open bounties
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('bounties')
            .where('status', '==', 'OPEN')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        const bounties = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(bounties);
    } catch (error) {
        console.error('Fetch Bounties Error:', error);
        res.status(500).json({ error: 'Failed to fetch the bounty grid.' });
    }
});

// GET /api/bounties/:id - Get specific bounty details
router.get('/:id', async (req, res) => {
    try {
        const doc = await db.collection('bounties').doc(req.params.id).get();
        if (!doc.exists) return res.status(404).json({ error: 'Bounty not found.' });
        res.json({ id: doc.id, ...doc.data() });
    } catch (error) {
        res.status(500).json({ error: 'Bounty retrieval failed.' });
    }
});

// POST /api/bounties - Create a new bounty (Escrow logic)
router.post('/', checkMuteMiddleware, async (req, res) => {
    try {
        const { authorUid, authorName, authorAvatar, title, description, rewardKpc, projectId, category } = req.body;

        if (!title || !description || !rewardKpc || rewardKpc < 100) {
            return res.status(400).json({ error: 'Bounty requires title, description and min 100 KPC reward.' });
        }

        const userRef = db.collection('users').doc(authorUid);
        const bountyRef = db.collection('bounties').doc();

        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw new Error('User protocol not found.');

            const userData = userDoc.data();
            if ((userData.stats?.kpcBalance || 0) < rewardKpc) {
                throw new Error('INSUFFICIENT_KPC_CREDITS');
            }

            // Lock KPC in escrow (deduct from user)
            transaction.update(userRef, {
                'stats.kpcBalance': admin.firestore.FieldValue.increment(-rewardKpc)
            });

            // Create Bounty
            transaction.set(bountyRef, {
                authorUid,
                authorName,
                authorAvatar,
                title,
                description,
                rewardKpc,
                projectId: projectId || null,
                category: category || 'General',
                status: 'OPEN',
                submissions: [],
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // Log to ledger
            transaction.set(db.collection('kpc_ledger').doc(), {
                uid: authorUid,
                amount: -rewardKpc,
                type: 'BOUNTY_ESCROW',
                bountyId: bountyRef.id,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        });

        res.status(201).json({ id: bountyRef.id, message: 'Bounty signal broadcasted. Credits locked in escrow.' });
    } catch (error) {
        console.error('Create Bounty Error:', error);
        res.status(400).json({ error: error.message });
    }
});

// POST /api/bounties/:id/submit - Submit a solution
router.post('/:id/submit', checkMuteMiddleware, async (req, res) => {
    try {
        const { uid, username, avatar, content, githubLink } = req.body;
        const { id } = req.params;

        if (!content) return res.status(400).json({ error: 'Submission requires content.' });

        const bountyRef = db.collection('bounties').doc(id);
        const bountyDoc = await bountyRef.get();

        if (!bountyDoc.exists) return res.status(404).json({ error: 'Bounty expired or deleted.' });
        if (bountyDoc.data().status !== 'OPEN') return res.status(400).json({ error: 'Bounty is no longer accepting submissions.' });

        const submission = {
            id: admin.firestore.FieldValue.serverTimestamp().toString() + Math.random().toString(36).substr(2, 5),
            uid,
            username,
            avatar,
            content,
            githubLink: githubLink || null,
            createdAt: new Date().toISOString()
        };

        await bountyRef.update({
            submissions: admin.firestore.FieldValue.arrayUnion(submission)
        });

        // Notify author (optional, integrate with notifications if exists)
        const { createNotification } = require('./notifications');
        await createNotification(
            bountyDoc.data().authorUid,
            uid,
            username,
            'bounty_submission',
            id
        ).catch(err => console.error("Notification failed", err));

        res.json({ success: true, message: 'Solution transmitted to architect.' });
    } catch (error) {
        res.status(500).json({ error: 'Transmission failed.' });
    }
});

// POST /api/bounties/:id/award - Award the bounty to a winner
router.post('/:id/award', async (req, res) => {
    try {
        const { authorUid, submissionId } = req.body;
        const { id } = req.params;

        const bountyRef = db.collection('bounties').doc(id);

        await db.runTransaction(async (transaction) => {
            const bountyDoc = await transaction.get(bountyRef);
            if (!bountyDoc.exists) throw new Error('Bounty not found.');

            const bountyData = bountyDoc.data();
            if (bountyData.authorUid !== authorUid) throw new Error('UNAUTHORIZED_MODIFICATION');
            if (bountyData.status !== 'OPEN') throw new Error('BOUNTY_ALREADY_CLOSED');

            const winnerSubmission = bountyData.submissions.find(s => s.id === submissionId);
            if (!winnerSubmission) throw new Error('SUBMISSION_NOT_FOUND');

            const winnerRef = db.collection('users').doc(winnerSubmission.uid);

            // Release KPC to winner
            transaction.update(winnerRef, {
                'stats.kpcBalance': admin.firestore.FieldValue.increment(bountyData.rewardKpc)
            });

            // Close bounty
            transaction.update(bountyRef, {
                status: 'COMPLETED',
                winnerUid: winnerSubmission.uid,
                winnerId: submissionId
            });

            // Log to ledger
            transaction.set(db.collection('kpc_ledger').doc(), {
                uid: winnerSubmission.uid,
                amount: bountyData.rewardKpc,
                type: 'BOUNTY_REWARD',
                bountyId: id,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        });

        res.json({ success: true, message: 'Reward dispensed. Bounty finalized.' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
