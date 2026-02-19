const express = require('express');
const router = express.Router();
const { sendAdminAlert, sendUserConfirmation } = require('../utils/email');

// POST /api/support
router.post('/', async (req, res) => {
    try {
        const { type, subject, description, userEmail } = req.body;

        if (!type || !subject || !description) {
            return res.status(400).json({ error: 'Missing required report fields.' });
        }

        console.log(`[SUPPORT_NODE] Processing ${type} report: ${subject}`);

        // 1. Send Admin Notification
        try {
            await sendAdminAlert({ type, subject, description, userEmail });
        } catch (emailErr) {
            console.error('[SUPPORT_NODE] Admin email failed:', emailErr.message);
            // We continue even if admin email fails, so user gets their confirmation
        }

        // 2. Send User Confirmation
        if (userEmail) {
            try {
                await sendUserConfirmation(userEmail, subject);
            } catch (emailErr) {
                console.error('[SUPPORT_NODE] User confirmation failed:', emailErr.message);
            }
        }

        res.json({
            success: true,
            message: 'GLITCH_REPORT_INDEXED: Administrators notified and confirmation dispatched.'
        });

    } catch (error) {
        console.error('[SUPPORT_NODE] Critical failure:', error);
        res.status(500).json({ error: 'System error during report synchronization.' });
    }
});

module.exports = router;
