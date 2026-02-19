const express = require('express');
const router = express.Router();
const { sendUserConfirmation, sendVerificationCode, sendAdminResponse } = require('../utils/email');
const { db } = require('../config/firebase');

// Utility to generate 6-digit code
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// POST /api/support/submit - Initialize Chat
router.post('/submit', async (req, res) => {
    try {
        const { type, subject, userEmail, userId } = req.body;

        if (!subject || !userEmail || !userId) {
            return res.status(400).json({ error: 'Subject, Email and UID required.' });
        }

        // Check 2 active ticket limit
        const activeSnapshot = await db.collection('support_tickets')
            .where('userId', '==', userId)
            .where('status', '==', 'OPEN')
            .get();

        if (activeSnapshot.size >= 2) {
            return res.status(403).json({ error: 'LIMIT_REACHED: Max 2 active tickets allowed.' });
        }

        const ticketRef = db.collection('support_tickets').doc();
        await ticketRef.set({
            id: ticketRef.id,
            type: type || 'REQUEST',
            subject,
            userEmail,
            userId,
            status: 'OPEN',
            isVerified: true,
            responded: false,
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString()
        });

        res.json({
            success: true,
            ticketId: ticketRef.id,
            message: 'CHAT_INITIALIZED'
        });

    } catch (error) {
        console.error('[SUPPORT_LOGIC] Submit Error:', error);
        res.status(500).json({ error: 'System error during chat initialization.' });
    }
});

// GET /api/support/my-chats - Fetch user's tickets
router.get('/my-chats', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: 'User ID required.' });

        const snapshot = await db.collection('support_tickets')
            .where('userId', '==', userId)
            .orderBy('lastActivity', 'desc')
            .limit(10)
            .get();

        const chats = snapshot.docs.map(doc => doc.data());
        res.json(chats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch your communications.' });
    }
});

// GET /api/support/chat/:id/messages
router.get('/chat/:id/messages', async (req, res) => {
    try {
        const snapshot = await db.collection('support_tickets')
            .doc(req.params.id)
            .collection('messages')
            .orderBy('timestamp', 'asc')
            .get();

        const messages = snapshot.docs.map(doc => doc.data());
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to sync message history.' });
    }
});

// POST /api/support/chat/:id/message - Send Message
router.post('/chat/:id/message', async (req, res) => {
    try {
        const { text, sender } = req.body;
        if (!text || !sender) return res.status(400).json({ error: 'Message payload required.' });

        const ticketRef = db.collection('support_tickets').doc(req.params.id);
        const messageRef = ticketRef.collection('messages').doc();

        const messageData = {
            id: messageRef.id,
            text,
            sender, // 'user' or 'admin'
            timestamp: new Date().toISOString()
        };

        await messageRef.set(messageData);

        // Update last activity
        await ticketRef.update({
            lastActivity: new Date().toISOString(),
            responded: sender === 'admin'
        });

        res.json({ success: true, message: messageData });
    } catch (error) {
        res.status(500).json({ error: 'Transmission failure.' });
    }
});

// GET /api/support/tickets - Admin List
router.get('/tickets', async (req, res) => {
    try {
        const snapshot = await db.collection('support_tickets')
            .where('status', '==', 'OPEN')
            .orderBy('lastActivity', 'desc')
            .limit(50)
            .get();

        const tickets = snapshot.docs.map(doc => doc.data());
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve grid data.' });
    }
});

// POST /api/support/close - Admin/User Close Ticket
router.post('/close', async (req, res) => {
    try {
        const { ticketId } = req.body;
        await db.collection('support_tickets').doc(ticketId).update({ status: 'CLOSED' });
        res.json({ success: true, message: 'PROTOCOL_TERMINATED' });
    } catch (error) {
        res.status(500).json({ error: 'System error during termination.' });
    }
});

module.exports = router;
