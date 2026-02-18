const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');

// POST /api/redeem
router.post('/', async (req, res) => {
    console.log('[SYSTEM_AUDIT] Redeem endpoint hit.');
    try {
        const { uid, code } = req.body;
        console.log(`[SYSTEM_AUDIT] Payload: UID=${uid}, Code=${code}`);

        if (!uid || !code) return res.status(400).json({ error: 'Missing credentials.' });

        if (String(code).trim() === '12130') {
            console.log('[SYSTEM_AUDIT] Access GRANTED.');
            await db.collection('users').doc(uid).update({
                tier: 'PRO',
                membershipExpires: null,
                'stats.reputation': admin.firestore.FieldValue.increment(1000)
            });

            return res.json({
                success: true,
                message: 'ACCESS_GRANTED: Override code accepted.',
                tier: 'PRO'
            });
        }

        console.log('[SYSTEM_AUDIT] Access DENIED.');
        res.status(400).json({ error: 'ACCESS_DENIED: Invalid protocol code.' });

    } catch (error) {
        console.error('Redeem Error:', error);
        res.status(500).json({ error: 'System error.' });
    }
});

module.exports = router;
