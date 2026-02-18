const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');

// POST /api/bounties - Create a new bounty (Mission)
router.post('/', async (req, res) => {
    try {
        const { authorId, title, description, reward, difficulty } = req.body;

        if (!authorId || !title || !reward) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        const userRef = db.collection('users').doc(authorId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: "User not found." });
        }

        const userData = userDoc.data();
        const currentBalance = userData.stats?.balance || 0;

        if (currentBalance < reward) {
            return res.status(400).json({ error: "Insufficient funds to post this bounty." });
        }

        // Deduct funds
        await userRef.update({
            'stats.balance': admin.firestore.FieldValue.increment(-reward)
        });

        const newBounty = {
            authorId,
            authorName: userData.displayName || "Unknown Architect",
            title,
            description,
            reward: Number(reward),
            difficulty: difficulty || 'Medium',
            status: 'OPEN', // OPEN, IN_PROGRESS, COMPLETED
            claimantId: null,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('bounties').add(newBounty);

        res.json({ success: true, id: docRef.id, ...newBounty });

    } catch (error) {
        console.error("Create Bounty Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/bounties - List all open bounties
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('bounties')
            .where('status', 'in', ['OPEN', 'IN_PROGRESS'])
            .get();

        const bounties = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Sort in memory to avoid missing index errors
        bounties.sort((a, b) => {
            const timeA = a.createdAt?._seconds || 0;
            const timeB = b.createdAt?._seconds || 0;
            return timeB - timeA;
        });

        res.json(bounties);
    } catch (error) {
        console.error("Fetch Bounties Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/bounties/:id/claim - Claim a bounty
router.post('/:id/claim', async (req, res) => {
    try {
        const { userId } = req.body;
        const bountyRef = db.collection('bounties').doc(req.params.id);
        const bountyDoc = await bountyRef.get();

        if (!bountyDoc.exists) {
            return res.status(404).json({ error: "Bounty not found." });
        }

        if (bountyDoc.data().status !== 'OPEN') {
            return res.status(400).json({ error: "Bounty is not available." });
        }

        if (bountyDoc.data().authorId === userId) {
            return res.status(400).json({ error: "You cannot claim your own bounty." });
        }

        await bountyRef.update({
            status: 'IN_PROGRESS',
            claimantId: userId
        });

        res.json({ success: true, message: "Bounty claimed." });
    } catch (error) {
        console.error("Claim Bounty Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/bounties/:id/complete - Mark as complete (Author only)
router.post('/:id/complete', async (req, res) => {
    try {
        const { authorId } = req.body;
        const bountyRef = db.collection('bounties').doc(req.params.id);
        const bountyDoc = await bountyRef.get();

        if (!bountyDoc.exists) {
            return res.status(404).json({ error: "Bounty not found." });
        }

        const data = bountyDoc.data();

        if (data.authorId !== authorId) {
            return res.status(403).json({ error: "Only the author can mark this as complete." });
        }

        if (data.status !== 'IN_PROGRESS' || !data.claimantId) {
            return res.status(400).json({ error: "Bounty must be claimed before completion." });
        }

        // Transfer funds to claimant
        const claimantRef = db.collection('users').doc(data.claimantId);
        await claimantRef.update({
            'stats.balance': admin.firestore.FieldValue.increment(data.reward),
            'stats.reputation': admin.firestore.FieldValue.increment(50) // Bonus rep
        });

        await bountyRef.update({
            status: 'COMPLETED'
        });

        // Notify claimant (Mock notification for now)
        // await createNotification(data.claimantId, authorId, "System", "payout", req.params.id, data.title);

        res.json({ success: true, message: "Bounty completed. Funds transferred." });

    } catch (error) {
        console.error("Complete Bounty Error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
