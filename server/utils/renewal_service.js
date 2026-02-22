const { db, admin } = require('../config/firebase');

// Rank Weights for logic (redundant but safe mirror for service isolation)
const RANKS = {
    'PRO': { kpcPrice: 5000, weight: 1, periodDays: 30 },
    'ELITE': { kpcPrice: 15000, weight: 2, periodDays: 30 },
    'LEGEND': { kpcPrice: 50000, weight: 3, periodDays: 30 }
};

/**
 * Periodically checks for expired memberships and attempts auto-renewal
 */
const processRenewals = async () => {
    console.log('[RENEWAL_SERVICE] Initializing cycle...');
    const now = new Date().toISOString();

    try {
        const expiredSnapshot = await db.collection('users')
            .where('membershipExpires', '<=', now)
            .where('autoRenew', '==', true)
            .get();

        if (expiredSnapshot.empty) {
            console.log('[RENEWAL_SERVICE] No pending renewals detected.');
            return;
        }

        console.log(`[RENEWAL_SERVICE] Found ${expiredSnapshot.size} citizens up for renewal.`);

        for (const doc of expiredSnapshot.docs) {
            const uid = doc.id;
            const userData = doc.data();
            const rankId = userData.tier;
            const rank = RANKS[rankId];

            if (!rank) {
                console.warn(`[RENEWAL_SERVICE] Unknown rank ${rankId} for user ${uid}. Terminating subscription.`);
                await db.collection('users').doc(uid).update({ autoRenew: false });
                continue;
            }

            const currentBalance = userData.stats?.kpcBalance || 0;

            if (currentBalance >= rank.kpcPrice) {
                // SUCCESS: Auto-renew
                const newExpiry = new Date();
                newExpiry.setDate(newExpiry.getDate() + rank.periodDays);

                await db.runTransaction(async (transaction) => {
                    transaction.update(db.collection('users').doc(uid), {
                        'stats.kpcBalance': admin.firestore.FieldValue.increment(-rank.kpcPrice),
                        'membershipExpires': newExpiry.toISOString(),
                        'updatedAt': admin.firestore.FieldValue.serverTimestamp()
                    });

                    // Ledger log
                    transaction.set(db.collection('kpc_ledger').doc(), {
                        uid,
                        amount: -rank.kpcPrice,
                        type: 'RENEWAL_PURCHASE',
                        item: rankId,
                        timestamp: admin.firestore.FieldValue.serverTimestamp()
                    });

                    // Notification
                    transaction.set(db.collection('notifications').doc(), {
                        recipientId: uid,
                        type: 'system',
                        title: 'SUBSCRIPTION_RENEWED',
                        message: `Your ${rankId} Protocol has been extended for ${rank.periodDays} days. ${rank.kpcPrice} KPC deducted.`,
                        read: false,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                });
                console.log(`[RENEWAL_SERVICE] Successfully renewed ${rankId} for ${uid}.`);
            } else {
                // FAILURE: Insufficient Funds
                await db.runTransaction(async (transaction) => {
                    transaction.update(db.collection('users').doc(uid), {
                        'tier': 'GHOST',
                        'autoRenew': false,
                        'membershipExpires': null,
                        'updatedAt': admin.firestore.FieldValue.serverTimestamp()
                    });

                    // Notification
                    transaction.set(db.collection('notifications').doc(), {
                        recipientId: uid,
                        type: 'system',
                        title: 'SUBSCRIPTION_FAILED',
                        message: `RENEWAL_ERROR: Insufficient KPC for ${rankId} Protocol. Account downgraded to GHOST status.`,
                        read: false,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                });
                console.warn(`[RENEWAL_SERVICE] Renewal failed for ${uid} due to lack of credits.`);
            }
        }
    } catch (err) {
        console.error('[RENEWAL_SERVICE] Global execution error:', err);
    }
};

module.exports = { processRenewals };
