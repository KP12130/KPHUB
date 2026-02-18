const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');

// GET /api/hackathons - List active/upcoming hackathons
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('hackathons')
            .orderBy('startDate', 'asc')
            .get();

        const hackathons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(hackathons);
    } catch (error) {
        console.error("Fetch Hackathons Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/hackathons/:id/join - Join a hackathon
router.post('/:id/join', async (req, res) => {
    try {
        const { userId } = req.body;
        const hackathonRef = db.collection('hackathons').doc(req.params.id);
        const hackathonDoc = await hackathonRef.get();

        if (!hackathonDoc.exists) {
            return res.status(404).json({ error: "Hackathon not found." });
        }

        // Add user to participants array if not already there
        await hackathonRef.update({
            participants: admin.firestore.FieldValue.arrayUnion(userId)
        });

        res.json({ success: true, message: "Registered for hackathon." });
    } catch (error) {
        console.error("Join Hackathon Error:", error);
        res.status(500).json({ error: error.message });
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

// ADMIN: Create a mock hackathon (for testing)
router.post('/seed', async (req, res) => {
    try {
        const newHackathon = {
            title: "Neon City Builder",
            description: "Build the most immersive cyberpunk city environment or tool. Judges will rate based on aesthetics and functionality.",
            startDate: admin.firestore.Timestamp.fromDate(new Date()),
            endDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days from now
            participants: [],
            submissions: [],
            reward: "10,000 Credits + 'Architect' Badge",
            status: "ACTIVE",
            image: "https://images.unsplash.com/photo-1605647540924-852290f6b0d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
        };

        await db.collection('hackathons').add(newHackathon);
        res.json({ success: true, message: "Seed hackathon created." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
