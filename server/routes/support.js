const express = require('express');
const router = express.Router();
const { sendUserConfirmation, sendVerificationCode, sendAdminResponse } = require('../utils/email');
const { db, admin } = require('../config/firebase');
const multer = require('multer');
const { uploadFile, getFileUrl } = require('../utils/storage');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Utility to generate 6-digit code
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// POST /api/support/submit - Initialize Chat
router.post('/submit', async (req, res) => {
    try {
        const { subject, userEmail, userId, type, attachments = [] } = req.body;

        if (!subject || !userEmail || !userId) {
            return res.status(400).json({ error: 'Subject, Email and UID required.' });
        }

        // Check 2 active ticket limit - Refactored to avoid composite index
        const activeSnapshot = await db.collection('support_tickets')
            .where('userId', '==', userId)
            .get();

        const activeCount = activeSnapshot.docs.filter(doc => doc.data().status === 'OPEN').length;

        if (activeCount >= 2) {
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
            lastActivity: new Date().toISOString(),
            attachments // Support initial attachments
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
            .get();

        const chats = snapshot.docs.map(doc => doc.data());
        // Sort in memory to avoid composite index requirement
        chats.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
        res.json(chats.slice(0, 10));
    } catch (error) {
        console.error('[SUPPORT] Fetch my-chats error:', error);
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
        const { text, sender, attachments = [] } = req.body;
        if (!text && attachments.length === 0) return res.status(400).json({ error: 'Message payload required.' });

        const ticketRef = db.collection('support_tickets').doc(req.params.id);
        const messageRef = ticketRef.collection('messages').doc();

        const messageData = {
            id: messageRef.id,
            text,
            sender, // 'user' or 'admin'
            attachments, // Support image/file attachments
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
        const { status = 'OPEN' } = req.query; // Support status filtering
        const snapshot = await db.collection('support_tickets')
            .where('status', '==', status)
            .get();

        const tickets = snapshot.docs.map(doc => doc.data());
        // Sort in memory
        tickets.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
        res.json(tickets.slice(0, 50));
    } catch (error) {
        console.error('[SUPPORT] Admin fetch error:', error);
        res.status(500).json({ error: 'Failed to retrieve grid data.' });
    }
});

// POST /api/support/close - Admin/User Close Ticket
router.post('/close', async (req, res) => {
    try {
        const { ticketId, reason } = req.body;
        const updateData = {
            status: 'CLOSED',
            closedAt: new Date().toISOString()
        };
        if (reason) updateData.closeReason = reason;

        const ticketRef = db.collection('support_tickets').doc(ticketId);
        await ticketRef.update(updateData);

        // Optionally add a system message for the reason
        if (reason) {
            const messageRef = ticketRef.collection('messages').doc();
            await messageRef.set({
                id: messageRef.id,
                text: `[SYSTEM_TERMINATION]: ${reason}`,
                sender: 'admin',
                timestamp: new Date().toISOString()
            });
        }

        res.json({ success: true, message: 'PROTOCOL_TERMINATED' });
    } catch (error) {
        res.status(500).json({ error: 'System error during termination.' });
    }
});

// POST /api/support/upload - Handle chat attachments
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No payload detected.' });

        const fileName = `support/attachments/${Date.now()}_${req.file.originalname}`;
        const fileKey = await uploadFile(req.file.buffer, fileName, req.file.mimetype);
        const url = await getFileUrl(fileKey);

        res.json({ url, key: fileKey });
    } catch (error) {
        console.error('[SUPPORT] Upload Error:', error);
        res.status(500).json({ error: 'Upload failed.' });
    }
});

module.exports = router;
