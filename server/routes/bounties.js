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
        const bountyRef = db.collection('bounties').doc(req.params.id);
        const doc = await bountyRef.get();
        if (!doc.exists) return res.status(404).json({ error: 'Bounty not found.' });

        const data = doc.data();

        // LAZY_AUTO_PAYOUT_LOGIC
        if (data.status === 'OPEN' && data.submissions && data.submissions.length > 0) {
            const now = new Date();
            const oldestPending = data.submissions
                .filter(s => s.status === 'PENDING')
                .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];

            if (oldestPending && new Date(oldestPending.autoPayoutAt) < now) {
                // Trigger Auto-Payout
                console.log(`Auto-payout triggered for bounty ${req.params.id}`);
                await awardBountyInternal(req.params.id, oldestPending.id, 'SYSTEM_AUTO_PAYOUT');

                // Fetch fresh data after auto-payout
                const freshDoc = await bountyRef.get();
                return res.json({ id: freshDoc.id, ...freshDoc.data(), _autoPayout: true });
            }
        }

        res.json({ id: doc.id, ...data });
    } catch (error) {
        console.error("Bounty fetch/payout error:", error);
        res.status(500).json({ error: 'Bounty retrieval failed.' });
    }
});

// Internal helper for awarding (re-used by manual and auto payout)
async function awardBountyInternal(bountyId, submissionId, authorUid = 'SYSTEM_AUTO_PAYOUT') {
    const bountyRef = db.collection('bounties').doc(bountyId);

    await db.runTransaction(async (transaction) => {
        const bountyDoc = await transaction.get(bountyRef);
        if (!bountyDoc.exists) throw new Error('Bounty not found.');

        const bountyData = bountyDoc.data();
        if (authorUid !== 'SYSTEM_AUTO_PAYOUT' && bountyData.authorUid !== authorUid) {
            throw new Error('UNAUTHORIZED_MODIFICATION');
        }
        if (bountyData.status !== 'OPEN') throw new Error('BOUNTY_ALREADY_CLOSED');

        const winnerSubmission = bountyData.submissions.find(s => s.id === submissionId);
        if (!winnerSubmission) throw new Error('SUBMISSION_NOT_FOUND');

        const winnerRef = db.collection('users').doc(winnerSubmission.uid);

        // Release KPC to winner and increment reputation
        transaction.update(winnerRef, {
            'stats.kpcBalance': admin.firestore.FieldValue.increment(bountyData.rewardKpc),
            'stats.reputation': admin.firestore.FieldValue.increment(10) // +10 reputation for mission completion
        });

        // Close bounty
        transaction.update(bountyRef, {
            status: 'COMPLETED',
            winnerUid: winnerSubmission.uid,
            winnerId: submissionId,
            awardedBy: authorUid,
            awardedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Log to ledger
        transaction.set(db.collection('kpc_ledger').doc(), {
            uid: winnerSubmission.uid,
            amount: bountyData.rewardKpc,
            type: authorUid === 'SYSTEM_AUTO_PAYOUT' ? 'BOUNTY_AUTO_PAYOUT' : 'BOUNTY_REWARD',
            bountyId: bountyId,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
    });
}

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
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            autoPayoutAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48h from now
        };

        await bountyRef.update({
            submissions: admin.firestore.FieldValue.arrayUnion(submission),
            lastSubmissionAt: admin.firestore.FieldValue.serverTimestamp()
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

        await awardBountyInternal(id, submissionId, authorUid);

        res.json({ success: true, message: 'Reward dispensed. Bounty finalized.' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// POST /api/bounties/:id/cancel - Recall a bounty
router.post('/:id/cancel', async (req, res) => {
    try {
        const { uid } = req.body;
        const { id } = req.params;

        const bountyRef = db.collection('bounties').doc(id);

        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(bountyRef);
            if (!doc.exists) throw new Error('Bounty not found.');

            const data = doc.data();
            if (data.authorUid !== uid) throw new Error('UNAUTHORIZED_MODIFICATION');
            if (data.status !== 'OPEN') throw new Error('BOUNTY_NOT_ACTIVE');

            // If there are submissions, we don't allow simple cancellation
            if (data.submissions && data.submissions.length > 0) {
                throw new Error('SUBMISSIONS_EXIST: Please open a dispute if you wish to recall this bounty.');
            }

            const userRef = db.collection('users').doc(uid);

            // Refund KPC
            transaction.update(userRef, {
                'stats.kpcBalance': admin.firestore.FieldValue.increment(data.rewardKpc)
            });

            // Update status
            transaction.update(bountyRef, { status: 'CANCELLED' });

            // Log ledger
            transaction.set(db.collection('kpc_ledger').doc(), {
                uid,
                amount: data.rewardKpc,
                type: 'BOUNTY_REFUND',
                bountyId: id,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        });

        res.json({ success: true, message: 'Bounty recalled. Credits refunded to your account.' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// POST /api/bounties/:id/dispute - Flag a bounty for review
router.post('/:id/dispute', async (req, res) => {
    try {
        const { uid, reason } = req.body;
        const { id } = req.params;

        const bountyRef = db.collection('bounties').doc(id);
        const bountyDoc = await bountyRef.get();

        if (!bountyDoc.exists) return res.status(404).json({ error: 'Bounty not found.' });

        const data = bountyDoc.data();
        const isAuthor = data.authorUid === uid;
        const isSubmitter = data.submissions.some(s => s.uid === uid);

        if (!isAuthor && !isSubmitter) {
            return res.status(403).json({ error: 'Only involved parties can initiate a dispute.' });
        }

        await bountyRef.update({
            status: 'DISPUTED',
            disputeReason: reason || 'Generic dispute initiated.',
            disputedBy: uid,
            disputedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ success: true, message: 'Dispute protocol initiated. An admin will review the sector shortly.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to initiate dispute.' });
    }
});

// GET /api/bounties/admin/disputes - List all disputed bounties (Admin only)
router.get('/admin/disputes', async (req, res) => {
    try {
        const snapshot = await db.collection('bounties')
            .where('status', '==', 'DISPUTED')
            .orderBy('disputedAt', 'desc')
            .get();

        const bounties = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(bounties);
    } catch (error) {
        res.status(500).json({ error: 'Failed to access disputed sectors.' });
    }
});

// POST /api/bounties/:id/resolve-dispute - Forcefully resolve a dispute (Admin only)
router.post('/:id/resolve-dispute', async (req, res) => {
    try {
        const { submissionId, action, adminPass } = req.body;
        const { id } = req.params;

        // Simple admin check
        if (adminPass !== "KxhTpq53249..__gKP") {
            return res.status(403).json({ error: 'ADMIN_PROTOCOL_INVALID' });
        }

        const bountyRef = db.collection('bounties').doc(id);

        if (action === 'AWARD') {
            await awardBountyInternal(id, submissionId, 'SYSTEM_ADMIN_RESOLUTION');
        } else if (action === 'REFUND') {
            await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(bountyRef);
                if (!doc.exists) throw new Error('Bounty not found.');
                const data = doc.data();

                const userRef = db.collection('users').doc(data.authorUid);
                transaction.update(userRef, {
                    'stats.kpcBalance': admin.firestore.FieldValue.increment(data.rewardKpc)
                });

                transaction.update(bountyRef, {
                    status: 'REFUNDED_BY_ADMIN',
                    resolvedAt: admin.firestore.FieldValue.serverTimestamp()
                });

                transaction.set(db.collection('kpc_ledger').doc(), {
                    uid: data.authorUid,
                    amount: data.rewardKpc,
                    type: 'BOUNTY_ADMIN_REFUND',
                    bountyId: id,
                    timestamp: admin.firestore.FieldValue.serverTimestamp()
                });
            });
        }

        res.json({ success: true, message: `Dispute resolved via ${action} protocol.` });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// POST /api/bounties/:id/reject - Reject a submission
router.post('/:id/reject', async (req, res) => {
    try {
        const { uid, submissionId, reason } = req.body;
        const { id } = req.params;

        const bountyRef = db.collection('bounties').doc(id);
        const doc = await bountyRef.get();

        if (!doc.exists) return res.status(404).json({ error: 'Bounty not found.' });
        const data = doc.data();

        if (data.authorUid !== uid) return res.status(403).json({ error: 'Unauthorized.' });

        const submissions = data.submissions.map(s => {
            if (s.id === submissionId) {
                return { ...s, status: 'REJECTED', rejectionReason: reason, rejectedAt: new Date().toISOString() };
            }
            return s;
        });

        await bountyRef.update({ submissions });

        res.json({ success: true, message: 'Submission rejected. Auto-payout aborted for this packet.' });
    } catch (error) {
        res.status(500).json({ error: 'Rejection failed.' });
    }
});

module.exports = router;
