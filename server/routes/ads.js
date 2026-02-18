const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');

// Mock Ad Inventory
const ADS = [
    { id: 'ad_1', brand: 'NeuroLink', title: 'Upgrade Your Cortex', cpc: 0.05, cpm: 0.002 },
    { id: 'ad_2', brand: 'CyberDyne', title: 'Automated Defense Systems', cpc: 0.08, cpm: 0.003 },
    { id: 'ad_3', brand: 'Soma', title: 'Synthetic Relaxation', cpc: 0.04, cpm: 0.001 },
    { id: 'ad_4', brand: 'Momo', title: 'Courier Services', cpc: 0.06, cpm: 0.002 }
];

// POST /api/ads/view
router.post('/view', async (req, res) => {
    try {
        const { projectId, viewerId } = req.body;
        if (!projectId) return res.status(400).json({ error: 'Missing Project ID' });

        // Verify Project Author
        const projectDoc = await db.collection('projects').doc(projectId).get();
        if (!projectDoc.exists) return res.status(404).json({ error: 'Project not found' });

        const project = projectDoc.data();
        const authorId = project.author.uid;

        // Don't pay for self-views
        if (viewerId === authorId) return res.json({ success: false, message: 'Self-view ignored' });

        // Calculate Revenue (Randomized slightly for realism)
        const revenue = 0.002; // $0.002 per view

        // Check if author exists before updating
        const authorRef = db.collection('users').doc(authorId);
        const authorDoc = await authorRef.get();

        if (!authorDoc.exists) {
            console.warn(`[AdSystem] Project ${projectId} has invalid author ${authorId}. Revenue skipped.`);
            return res.json({ success: false, message: 'Author not found' });
        }

        // Update Author Balance
        await authorRef.update({
            'stats.balance': admin.firestore.FieldValue.increment(revenue),
            'stats.adRevenue': admin.firestore.FieldValue.increment(revenue) // Track ad revenue separately
        });

        res.json({ success: true, earned: revenue });
    } catch (error) {
        console.error('Ad View Error:', error);
        res.status(500).json({ error: 'Failed to track view' });
    }
});

// POST /api/ads/click
router.post('/click', async (req, res) => {
    try {
        const { projectId, viewerId } = req.body;
        if (!projectId) return res.status(400).json({ error: 'Missing Project ID' });

        const projectDoc = await db.collection('projects').doc(projectId).get();
        if (!projectDoc.exists) return res.status(404).json({ error: 'Project not found' });

        const project = projectDoc.data();
        const authorId = project.author.uid;

        if (viewerId === authorId) return res.json({ success: false, message: 'Self-click ignored' });

        const revenue = 0.05; // $0.05 per click

        await db.collection('users').doc(authorId).update({
            'stats.balance': admin.firestore.FieldValue.increment(revenue),
            'stats.adRevenue': admin.firestore.FieldValue.increment(revenue)
        });

        res.json({ success: true, earned: revenue });
    } catch (error) {
        console.error('Ad Click Error:', error);
        res.status(500).json({ error: 'Failed to track click' });
    }
});

module.exports = router;
