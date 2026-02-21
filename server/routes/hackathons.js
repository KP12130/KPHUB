const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');

// GET /api/hackathons - List active/upcoming hackathons
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('hackathons')
            .orderBy('startDate', 'desc')
            .get();

        const hackathons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(hackathons);
    } catch (error) {
        console.error("Fetch Hackathons Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/hackathons/:id/join - Join a hackathon (with Entry Fee logic)
router.post('/:id/join', async (req, res) => {
    const { userId } = req.body;
    const hackathonRef = db.collection('hackathons').doc(req.params.id);
    const userRef = db.collection('users').doc(userId);

    try {
        await db.runTransaction(async (transaction) => {
            const hackDoc = await transaction.get(hackathonRef);
            const userDoc = await transaction.get(userRef);

            if (!hackDoc.exists) throw new Error("HACKATHON_NOT_FOUND");
            if (!userDoc.exists) throw new Error("USER_NOT_FOUND");

            const hackData = hackDoc.data();
            const userData = userDoc.data();

            if (hackData.participants?.includes(userId)) throw new Error("ALREADY_REGISTERED");

            const entryFee = parseInt(hackData.entryFee) || 0;
            if (entryFee > 0) {
                if ((userData.stats?.kpcBalance || 0) < entryFee) {
                    throw new Error("INSUFFICIENT_KPC_FOR_ENTRY");
                }
                // Deduct Fee
                transaction.update(userRef, {
                    'stats.kpcBalance': admin.firestore.FieldValue.increment(-entryFee)
                });
                // Log Fee
                transaction.set(db.collection('kpc_ledger').doc(), {
                    uid: userId,
                    amount: -entryFee,
                    type: 'HACKATHON_ENTRY_FEE',
                    hackathonId: req.params.id,
                    timestamp: admin.firestore.FieldValue.serverTimestamp()
                });
            }

            // Register
            transaction.update(hackathonRef, {
                participants: admin.firestore.FieldValue.arrayUnion(userId)
            });
        });

        res.json({ success: true, message: "Registered for hackathon." });
    } catch (error) {
        console.error("Join Hackathon Error:", error);
        res.status(400).json({ error: error.message });
    }
});

// POST /api/hackathons/:id/submit - Submit a project
router.post('/:id/submit', async (req, res) => {
    try {
        const { userId, projectId, projectTitle } = req.body;

        if (!userId || !projectId) {
            return res.status(400).json({ error: "Missing submission details." });
        }

        const hackathonRef = db.collection('hackathons').doc(req.params.id);

        // Add to submissions array
        await hackathonRef.update({
            submissions: admin.firestore.FieldValue.arrayUnion({
                userId,
                projectId,
                projectTitle,
                submittedAt: new Date().toISOString()
            })
        });

        res.json({ success: true, message: "Project submitted successfully." });

    } catch (error) {
        console.error("Submit Hackathon Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ADMIN: Create a new hackathon
router.post('/admin/create', async (req, res) => {
    try {
        const { title, description, reward, entryFee, durationDays, image, adminToken } = req.body;

        // Simple auth check (could be improved with proper middleware)
        if (adminToken !== "kL9#mP2$vR5!xT8*zQ1^") {
            return res.status(403).json({ error: "UNAUTHORIZED_ACCESS" });
        }

        const newHackathon = {
            title,
            description,
            reward,
            entryFee: parseInt(entryFee) || 0,
            startDate: admin.firestore.Timestamp.fromDate(new Date()),
            endDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + (durationDays || 7) * 24 * 60 * 60 * 1000)),
            participants: [],
            submissions: [],
            status: "ACTIVE",
            image: image || "https://images.unsplash.com/photo-1605647540924-852290f6b0d5?auto=format"
        };

        const docRef = await db.collection('hackathons').add(newHackathon);
        res.json({ success: true, id: docRef.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ADMIN: Manual Payout to winner
router.post('/admin/payout', async (req, res) => {
    const { hackathonId, winnerId, amount, adminToken } = req.body;

    if (adminToken !== "kL9#mP2$vR5!xT8*zQ1^") {
        return res.status(403).json({ error: "UNAUTHORIZED_ACCESS" });
    }

    const userRef = db.collection('users').doc(winnerId);
    const hackRef = db.collection('hackathons').doc(hackathonId);

    try {
        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw new Error("Winner not found.");

            const amt = parseInt(amount);
            if (isNaN(amt) || amt <= 0) throw new Error("Invalid reward amount.");

            // Credit User
            transaction.update(userRef, {
                'stats.kpcBalance': admin.firestore.FieldValue.increment(amt),
                'stats.reputation': admin.firestore.FieldValue.increment(100) // Bonus rep for winning
            });

            // Log Reward
            transaction.set(db.collection('kpc_ledger').doc(), {
                uid: winnerId,
                amount: amt,
                type: 'HACKATHON_PRIZE',
                hackathonId,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

            // Add notification
            transaction.set(db.collection('notifications').doc(), {
                recipientId: winnerId,
                senderName: "SYSTEM",
                type: "HACKATHON_WIN",
                reward: amt,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                read: false
            });

            // Mark hackathon winner
            transaction.update(hackRef, {
                winnerId,
                payoutAmount: amt,
                status: "COMPLETED"
            });
        });

        res.json({ success: true, message: "Payout transmitted successfully." });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// ADMIN: End a hackathon manually
router.post('/admin/end', async (req, res) => {
    try {
        const { hackathonId, adminToken } = req.body;
        if (adminToken !== "kL9#mP2$vR5!xT8*zQ1^") {
            return res.status(403).json({ error: "UNAUTHORIZED_ACCESS" });
        }

        await db.collection('hackathons').doc(hackathonId).update({
            status: "COMPLETED",
            endDate: admin.firestore.Timestamp.fromDate(new Date())
        });

        res.json({ success: true, message: "Event terminated." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
