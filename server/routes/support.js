const express = require('express');
const router = express.Router();
const { sendUserConfirmation, sendVerificationCode, sendAdminResponse } = require('../utils/email');
const { db } = require('../config/firebase');

// Utility to generate 6-digit code
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// POST /api/support/submit - Initial Step
router.post('/submit', async (req, res) => {
    try {
        const { type, subject, description, userEmail } = req.body;

        if (!type || !subject || !description || !userEmail) {
            return res.status(400).json({ error: 'Missing required report fields.' });
        }

        const verificationCode = generateCode();

        // Save to Firestore
        const ticketRef = db.collection('support_tickets').doc();
        await ticketRef.set({
            id: ticketRef.id,
            type,
            subject,
            description,
            userEmail,
            verificationCode,
            isVerified: false,
            createdAt: new Date().toISOString()
        });

        // Send Email to User
        try {
            await sendVerificationCode(userEmail, verificationCode);
        } catch (emailErr) {
            console.error('[SUPPORT_LOGIC] Verification email failed:', emailErr.message);
            return res.status(500).json({ error: 'Failed to dispatch verification transmission.' });
        }

        res.json({
            success: true,
            ticketId: ticketRef.id,
            message: 'VERIFICATION_CODE_DISPATCHED: Check your communication lines.'
        });

    } catch (error) {
        console.error('[SUPPORT_LOGIC] Submit Error:', error);
        res.status(500).json({ error: 'System error during report initialization.' });
    }
});

// POST /api/support/verify - Final Step
router.post('/verify', async (req, res) => {
    try {
        const { ticketId, code } = req.body;

        if (!ticketId || !code) {
            return res.status(400).json({ error: 'Identification required.' });
        }

        const ticketRef = db.collection('support_tickets').doc(ticketId);
        const doc = await ticketRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Transmission signature not found.' });
        }

        const ticket = doc.data();

        if (ticket.verificationCode !== code) {
            return res.status(400).json({ error: 'INVALID_CODE: Verification failed.' });
        }

        // Update to verified
        await ticketRef.update({
            isVerified: true,
            verifiedAt: new Date().toISOString()
        });

        // Send Confirmation to User
        try {
            await sendUserConfirmation(ticket.userEmail, ticket.subject);
        } catch (emailErr) {
            console.error('[SUPPORT_LOGIC] Confirmation email failed:', emailErr.message);
        }

        res.json({
            success: true,
            message: 'IDENTITY_CONFIRMED: Bug report has been indexed in the Support_Grid.'
        });

    } catch (error) {
        console.error('[SUPPORT_LOGIC] Verify Error:', error);
        res.status(500).json({ error: 'System error during verification.' });
    }
});

// POST /api/support/respond - Admin Response
router.post('/respond', async (req, res) => {
    try {
        const { ticketId, responseText } = req.body;

        if (!ticketId || !responseText) {
            return res.status(400).json({ error: 'Ticket ID and response required.' });
        }

        const ticketRef = db.collection('support_tickets').doc(ticketId);
        const doc = await ticketRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Ticket not found.' });
        }

        const ticket = doc.data();

        // Send Email to User
        try {
            await sendAdminResponse(ticket.userEmail, ticket.subject, responseText);
        } catch (emailErr) {
            console.error('[SUPPORT_LOGIC] Admin response email failed:', emailErr.message);
            return res.status(500).json({ error: 'Failed to transmit response email.' });
        }

        // Update Firestore
        await ticketRef.update({
            responded: true,
            adminResponse: responseText,
            respondedAt: new Date().toISOString()
        });

        res.json({
            success: true,
            message: 'RESPONSE_TRANSMITTED: The user has been notified via secure line.'
        });

    } catch (error) {
        console.error('[SUPPORT_LOGIC] Respond Error:', error);
        res.status(500).json({ error: 'System error during response synchronization.' });
    }
});

// GET /api/support/tickets - Admin List (For Studio)
router.get('/tickets', async (req, res) => {
    try {
        // Simple 12h filter + only verified
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

        const snapshot = await db.collection('support_tickets')
            .where('isVerified', '==', true)
            .where('createdAt', '>=', twelveHoursAgo)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        const tickets = snapshot.docs.map(doc => doc.data());

        res.json(tickets);
    } catch (error) {
        console.error('[SUPPORT_LOGIC] Fetch Error:', error);
        res.status(500).json({ error: 'Failed to retrieve documentation.' });
    }
});

module.exports = router;
