const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const multer = require('multer');
const AdmZip = require('adm-zip');
const { db, admin } = require('../config/firebase');
const { uploadFile, getFileUrl, getFileBuffer } = require('../utils/storage');
const { createNotification } = require('./notifications');
const rateLimit = require('express-rate-limit');
const { triggerAutoModeration, checkMuteMiddleware } = require('../middleware/security');

// --- BACKGROUND SECURITY TASKS ---
const triggerSecurityScan = async (projectId, hashes, title, authorName) => {
    if (!hashes || hashes.length === 0) return;

    const VT_API_KEY = process.env.VIRUSTOTAL_API_KEY;
    const DISCORD_WEBHOOK = process.env.DISCORD_MODERATION_WEBHOOK;

    let scanResults = [];
    let vtSummary = "No scan performed (API Key missing)";

    if (VT_API_KEY) {
        try {
            const results = await Promise.all(hashes.map(async (h) => {
                const response = await fetch(`https://www.virustotal.com/api/v3/files/${h.sha256}`, {
                    headers: { 'x-apikey': VT_API_KEY }
                });

                if (response.ok) {
                    const data = await response.json();
                    const stats = data.data.attributes.last_analysis_stats;
                    return {
                        name: h.name,
                        malicious: stats.malicious,
                        suspicious: stats.suspicious,
                        permalink: `https://www.virustotal.com/gui/file/${h.sha256}`
                    };
                }
                return { name: h.name, status: 'NOT_FOUND_OR_ERROR' };
            }));

            scanResults = results;
            const maliciousCount = results.reduce((sum, r) => sum + (r.malicious || 0), 0);
            vtSummary = maliciousCount > 0 ? `⚠️ ${maliciousCount} threats detected!` : "✅ Clean (Scan complete)";
        } catch (e) {
            console.error('[SECURITY_SCAN] VT Error:', e);
            vtSummary = "❌ Scan Failed (Network)";
        }
    }

    // Update Firestore with results
    try {
        await db.collection('projects').doc(projectId).update({
            'security.scanStatus': VT_API_KEY ? 'COMPLETE' : 'NO_KEY',
            'security.vtResults': scanResults,
            'security.vtSummary': vtSummary
        });
    } catch (e) { console.error('[SECURITY_SCAN] DB Update Failed:', e); }

    // Discord Notification
    if (DISCORD_WEBHOOK) {
        try {
            const vtLinks = scanResults.map(r => `[${r.name}](${r.permalink || 'https://virustotal.com'}) - ${r.malicious || 0} detections`).join('\n');

            await fetch(DISCORD_WEBHOOK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    embeds: [{
                        title: "📦 NEW APP UPLOAD DETECTED",
                        color: maliciousCount > 0 ? 0xff0000 : 0x00ff00,
                        fields: [
                            { name: "Project", value: title, inline: true },
                            { name: "Author", value: authorName, inline: true },
                            { name: "Scan Result", value: vtSummary },
                            { name: "VirusTotal Links", value: vtLinks || "None" },
                            { name: "Admin Actions", value: `[🗑️ Delete Project](${process.env.FRONTEND_URL}/admin?action=delete&id=${projectId}) | [🚫 Ban Author](${process.env.FRONTEND_URL}/admin?action=ban&uid=${hashes[0]?.authorId || ''})` }
                        ],
                        footer: { text: `Project ID: ${projectId}` }
                    }]
                })
            });
        } catch (e) { console.error('[DISCORD_NOTIF] Failed:', e); }
    }
};

const antiCheatHandler = (actionType) => async (req, res, next, options) => {
    const userId = req.body?.userId || req.query?.userId || req.params?.uid; // Detection parity
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Await moderation logic regardless of userId (anonymous triggers IP ban)
    await triggerAutoModeration(userId, ip, actionType).catch(console.error);

    // Merge options.message with forceReload flag
    const responseBody = typeof options.message === 'string'
        ? { error: options.message, forceReload: true }
        : { ...options.message, forceReload: true };

    res.status(options.statusCode || 429).json(responseBody);
};

// -- ANTI-CHEAT RATE LIMITERS --
const likeLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 15, // Increased from 5 to allow normal browsing
    handler: antiCheatHandler('Like Spam'),
    message: { error: 'ANTI_CHEAT: Like velocity exceeded. You have received an automated strike.' }
});

const viewLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // Tightened from 30
    handler: antiCheatHandler('View Spam'),
    message: { error: 'ANTI_CHEAT: View velocity exceeded. You have received an automated strike.' }
});

// Memory storage for Multer
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB total limit
});

// POST /api/projects
router.post('/', upload.fields([
    { name: 'projectFiles', maxCount: 100 },
    { name: 'screenshots', maxCount: 10 }
]), async (req, res) => {
    try {
        const { title, description, category, authorId, authorName, authorAvatar, demoUrl, repoUrl } = req.body;
        const projectFiles = req.files['projectFiles'] || [];
        const screenshots = req.files['screenshots'] || [];

        if (projectFiles.length === 0) {
            return res.status(400).json({ error: 'No project files detected.' });
        }

        // --- SECURITY: File Filtering & Sandbox Logic ---
        const BLOCKED_EXTENSIONS = ['.dll', '.sys', '.drv', '.ocx', '.scr', '.vbs'];
        const EXECUTABLE_EXTENSIONS = ['.exe', '.bat', '.msi', '.cmd'];

        for (const file of projectFiles) {
            const fileName = file.originalname.toLowerCase();
            const parts = fileName.split('.');

            // 1. Block Double Extensions (Spam/Malware prevention)
            if (parts.length > 2) {
                const lastExt = parts[parts.length - 1];
                const prevExt = parts[parts.length - 2];
                if (EXECUTABLE_EXTENSIONS.includes(`.${lastExt}`)) {
                    return res.status(400).json({ error: `SECURITY_VIOLATION: Double extension detected (${prevExt}.${lastExt}). This transmission has been flagged.` });
                }
            }

            // 2. Block System Files
            if (BLOCKED_EXTENSIONS.some(ext => fileName.endsWith(ext))) {
                return res.status(400).json({ error: `SECURITY_VIOLATION: System-critical file type detected (${fileName}). These files are restricted for grid safety.` });
            }
        }

        // 1. Authorization & Limit Check
        const userDoc = await db.collection('users').doc(authorId).get();
        if (!userDoc.exists) return res.status(404).json({ error: 'User system not found' });

        const userData = userDoc.data();
        const userTier = userData.tier || 'GHOST';
        const projectCount = userData.stats?.uploads || 0;

        // Multi-tier & Upgradeable Limits
        const baseSlots = userTier === 'GHOST' ? 5 : Infinity;
        const extraSlots = userData.stats?.extraSlots || 0;
        const maxSlots = baseSlots + extraSlots;

        if (projectCount >= maxSlots) {
            return res.status(403).json({
                error: `UPLOAD_LIMIT_REACHED: Your grid capacity is full (${projectCount}/${maxSlots} slots occupied). Upgrade to PRO or acquire extra infrastructure slots in the Forge.`
            });
        }

        // Dynamic File Size Limit
        const baseStorageMB = 100; // Base 100MB
        const extraStorageLifetimeMB = userData.stats?.extraStorageLifetimeMB || 0;
        const extraStorageSubMB = userData.stats?.extraStorageSubMB || 0;
        const extraStorageExpiry = userData.stats?.extraStorageExpiry || 0;

        // --- SECURITY: Verified Developer Check for Apps ---
        const hasExecutables = projectFiles.some(f => EXECUTABLE_EXTENSIONS.some(ext => f.originalname.toLowerCase().endsWith(ext)));
        if (hasExecutables) {
            const isVerified = (userData.stats?.extraSlots || 0) >= 10 || userData.tier === 'PRO';
            if (!isVerified) {
                return res.status(403).json({
                    error: 'SECURITY_RESTRICTION: Uploading executable apps (.exe, .bat) requires Verified Developer status. Acquire a Small Booster (+10 Slots) in the Forge to verify your identity.'
                });
            }
        }

        const activeSubStorage = (Date.now() < extraStorageExpiry) ? extraStorageSubMB : 0;

        const totalStorageMB = baseStorageMB + extraStorageLifetimeMB + activeSubStorage;
        const maxFileSize = totalStorageMB * 1024 * 1024;

        // Check total size of current upload
        const totalUploadSize = projectFiles.reduce((sum, f) => sum + f.size, 0);
        if (totalUploadSize > maxFileSize) {
            return res.status(413).json({
                error: `SYSTEM_PAYLOAD_EXCEEDED: Your transmission size (${(totalUploadSize / (1024 * 1024)).toFixed(2)}MB) exceeds your current grid allocation (${totalStorageMB}MB). Acquire more storage in the Forge.`
            });
        }

        const projectId = admin.firestore().collection('projects').doc().id;
        const UPLOAD_FEE = 100;

        // 2. Preliminary Balance Check
        if ((userData.stats?.kpcBalance || 0) < UPLOAD_FEE) {
            return res.status(403).json({ error: `INSUFFICIENT_FUNDS: Deployment requires ${UPLOAD_FEE} KPC for spam protection.` });
        }

        // 3. Upload Project Files & Build Tree
        const uploadedFiles = [];
        for (const file of projectFiles) {
            const relativePath = file.originalname;
            const fileName = `projects/${projectId}/source/${relativePath}`;
            const fileKey = await uploadFile(file.buffer, fileName, file.mimetype);
            uploadedFiles.push({ path: relativePath, key: fileKey, size: file.size });
        }

        // 4. Upload Screenshots
        const uploadedScreenshots = [];
        for (const file of screenshots) {
            const fileName = `projects/${projectId}/screenshots/${Date.now()}_${file.originalname}`;
            const fileKey = await uploadFile(file.buffer, fileName, file.mimetype);
            uploadedScreenshots.push(fileKey);
        }

        // 5. Save Metadata & Deduct Fee (Atomic)
        const tagsString = req.body.tags;
        const tagsArray = tagsString
            ? tagsString.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag !== '')
            : [];

        const newProject = {
            id: projectId,
            title,
            description,
            category,
            tags: tagsArray,
            files: uploadedFiles,
            screenshots: uploadedScreenshots,
            thumbnail: uploadedScreenshots[0] ? await getFileUrl(uploadedScreenshots[0]) : '',
            demoUrl: demoUrl || '',
            repoUrl: repoUrl || '',
            devlogs: [],
            author: {
                uid: authorId,
                name: authorName,
                avatar: authorAvatar
            },
            security: {
                hasExecutables,
                scanStatus: hasExecutables ? 'PENDING' : 'SKIPPED',
                hashes: hasExecutables ? projectFiles.filter(f => EXECUTABLE_EXTENSIONS.some(ext => f.originalname.toLowerCase().endsWith(ext))).map(f => ({
                    name: f.originalname,
                    sha256: crypto.createHash('sha256').update(f.buffer).digest('hex')
                })) : []
            },
            stats: { likes: 0, views: 0, downloads: 0, comments: 0 },
            memberOnly: req.body.memberOnly === 'true' || req.body.memberOnly === true,
            isPrivate: req.body.isPrivate === 'true' || req.body.isPrivate === true,
            createdAt: new Date().toISOString()
        };

        const userRef = db.collection('users').doc(authorId);
        const projectRef = db.collection('projects').doc(projectId);

        await db.runTransaction(async (transaction) => {
            const userSnap = await transaction.get(userRef);
            if (!userSnap.exists) throw new Error('User protocol not found.');

            const currentBalance = userSnap.data().stats?.kpcBalance || 0;
            if (currentBalance < UPLOAD_FEE) throw new Error('INSUFFICIENT_FUNDS');

            // 1. Create Project
            transaction.set(projectRef, newProject);

            // 2. Deduct Fee & Increment Project Count
            transaction.update(userRef, {
                'stats.kpcBalance': admin.firestore.FieldValue.increment(-UPLOAD_FEE),
                'stats.uploads': admin.firestore.FieldValue.increment(1)
            });

            // 3. Log to Ledger
            transaction.set(db.collection('kpc_ledger').doc(), {
                uid: authorId,
                amount: -UPLOAD_FEE,
                type: 'UPLOAD_FEE',
                details: { projectId, title },
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        });

        // 6. Log Activity (Non-critical to transaction)
        const { logActivity } = require('./activities');
        await logActivity(authorId, authorName, 'upload', projectId, title).catch(console.error);

        // 7. Trigger Security Scan (Background)
        if (newProject.security.hasExecutables) {
            triggerSecurityScan(projectId, newProject.security.hashes, title, authorName).catch(console.error);
        }

        res.status(201).json(newProject);

    } catch (error) {
        console.error('Advanced Upload Error:', error);
        res.status(500).json({ error: 'System deployment failed. Check grid integrity.' });
    }
});

// GET /api/projects/:id/download
router.get('/:id/download', async (req, res) => {
    try {
        const docRef = db.collection('projects').doc(req.params.id);
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const project = doc.data();
        const { userId } = req.query;

        // Authorization check for member-only content
        if (project.memberOnly && project.author.uid !== userId) {
            if (!userId) return res.status(403).json({ error: 'Authentication required for elite systems' });

            const userDoc = await db.collection('users').doc(userId).get();
            const userData = userDoc.data();
            if (userData.tier === 'GHOST' || !userData.tier) {
                return res.status(403).json({ error: 'PRO tier membership required to access this system.' });
            }
        }

        if ((!project.files || project.files.length === 0) && !project.fileKey) {
            return res.status(404).json({ error: 'Source files not found on grid.' });
        }

        // Increment download counts
        // Increment download counts (Safely)
        await docRef.update({ 'stats.downloads': admin.firestore.FieldValue.increment(1) });

        try {
            const authorRef = db.collection('users').doc(project.author.uid);
            const authorDoc = await authorRef.get();
            if (authorDoc.exists) {
                await authorRef.update({ 'stats.downloads': admin.firestore.FieldValue.increment(1) });
            } else {
                console.warn(`[Download] Author ${project.author.uid} not found. Skipping stat update.`);
            }
        } catch (err) {
            console.warn('[Download] Failed to update author stats:', err);
        }

        // Multi-file logic
        if (project.files && project.files.length > 0) {
            const zip = new AdmZip();

            for (const file of project.files) {
                try {
                    const buffer = await getFileBuffer(file.key);
                    zip.addFile(file.path, buffer);
                } catch (err) {
                    console.warn(`Skipping missing file: ${file.path}`);
                }
            }

            const zipBuffer = zip.toBuffer();
            res.set({
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${project.title.replace(/\s+/g, '_')}_CodeNeon.zip"`,
                'Content-Length': zipBuffer.length
            });
            return res.send(zipBuffer);
        }

        // Fallback for legacy single-file projects
        const signedUrl = await getFileUrl(project.fileKey);
        res.redirect(signedUrl);

    } catch (error) {
        console.error('[DATABASE_ERROR] Project Download failed:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

// GET /api/projects/:id/files - Returns the file structure
router.get('/:id/files', async (req, res) => {
    try {
        const doc = await db.collection('projects').doc(req.params.id).get();
        if (!doc.exists) return res.status(404).json({ error: 'Project not found' });

        const project = doc.data();
        res.json(project.files || []);
    } catch (error) {
        console.error('[DATABASE_ERROR] Fetch Files failed:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

// POST /api/projects/:id/like
router.post('/:id/like', checkMuteMiddleware, likeLimiter, async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'User ID required' });

        const docRef = db.collection('projects').doc(req.params.id);
        const doc = await docRef.get();

        if (!doc.exists) return res.status(404).json({ error: 'Project not found' });

        const project = doc.data();
        const likes = project.likes || [];
        const isLiked = likes.includes(userId);
        const authorId = project.author.uid;

        // Invalidate cache on change
        projectDetailCache.store.delete(req.params.id);
        projectsCache.clear();

        if (isLiked) {
            await docRef.update({
                likes: admin.firestore.FieldValue.arrayRemove(userId),
                'stats.likes': admin.firestore.FieldValue.increment(-1)
            });

            // SAFELY UPDATE AUTHOR STATS
            try {
                const authorRef = db.collection('users').doc(authorId);
                const authorDoc = await authorRef.get();
                if (authorDoc.exists) {
                    await authorRef.update({
                        'stats.likesReceived': admin.firestore.FieldValue.increment(-1)
                    });
                }
            } catch (e) { console.warn("Author stats update skipped (User not found)."); }

            await db.collection('users').doc(userId).update({
                likesGiven: admin.firestore.FieldValue.arrayRemove(req.params.id)
            });
        } else {
            await docRef.update({
                likes: admin.firestore.FieldValue.arrayUnion(userId),
                'stats.likes': admin.firestore.FieldValue.increment(1)
            });

            // SAFELY UPDATE AUTHOR REPUTATION
            try {
                const authorRef = db.collection('users').doc(authorId);
                const authorDoc = await authorRef.get();
                if (authorDoc.exists) {
                    await authorRef.update({
                        'stats.likesReceived': admin.firestore.FieldValue.increment(1)
                    });
                    // Move notification logic here to ensure author exists?
                    // Actually keeping it separate below is fine, but maybe check existence there too.
                }
            } catch (e) { console.warn("Author stats update skipped (User not found)."); }

            await db.collection('users').doc(userId).update({
                likesGiven: admin.firestore.FieldValue.arrayUnion(req.params.id)
            });

            const { logActivity } = require('./activities');
            const likerName = req.body.userName || "Someone";
            await Promise.all([
                createNotification(authorId, userId, likerName, 'like', doc.id, project.title),
                logActivity(userId, likerName, 'like', doc.id, project.title)
            ]);
        }

        res.json({ success: true, liked: !isLiked });
    } catch (error) {
        console.error('Like Error:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

// POST /api/projects/:id/view
router.post('/:id/view', checkMuteMiddleware, viewLimiter, async (req, res) => {
    try {
        const { userId } = req.body;
        const docRef = db.collection('projects').doc(req.params.id);

        let shouldIncrement = false;

        if (userId) {
            const doc = await docRef.get();
            if (doc.exists) {
                const project = doc.data();
                const viewedBy = project.viewedBy || [];

                if (viewedBy.includes(userId)) return res.json({ success: true });

                await docRef.update({
                    viewedBy: admin.firestore.FieldValue.arrayUnion(userId),
                    'stats.views': admin.firestore.FieldValue.increment(1)
                });
                shouldIncrement = true;
            }
        } else {
            await docRef.update({ 'stats.views': admin.firestore.FieldValue.increment(1) });
            shouldIncrement = true;
        }

        if (shouldIncrement) {
            const doc = await docRef.get();
            const project = doc.data();
            if (project && project.author && project.author.uid) {
                await db.collection('users').doc(project.author.uid).update({
                    'stats.views': admin.firestore.FieldValue.increment(1)
                });
            }
        }

        res.json({ success: true });
    } catch (error) {
        console.error('[DATABASE_ERROR] Fetch Files failed:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

// Simple Memory Cache for Projects List (TTL 30 seconds)
const projectsCache = {
    store: new Map(),
    get(key) {
        const item = this.store.get(key);
        if (!item) return null;
        if (Date.now() > item.expiry) {
            this.store.delete(key);
            return null;
        }
        return item.value;
    },
    set(key, value) {
        if (this.store.size > 100) this.store.clear();
        this.store.set(key, { value, expiry: Date.now() + 30000 });
    },
    clear() { this.store.clear(); }
};

// Cache for Individual Project Details (TTL 30 seconds)
const projectDetailCache = {
    store: new Map(),
    get(id) {
        const item = this.store.get(id);
        if (item && Date.now() < item.expiry) return item.value;
        return null;
    },
    set(id, value) {
        if (this.store.size > 500) this.store.clear();
        this.store.set(id, { value, expiry: Date.now() + 30000 });
    }
};

// Cache for Devlogs/Updates (TTL 60 seconds)
const updatesCache = {
    store: new Map(),
    get(id) {
        const item = this.store.get(id);
        if (item && Date.now() < item.expiry) return item.value;
        return null;
    },
    set(id, value) {
        if (this.store.size > 500) this.store.clear();
        this.store.set(id, { value, expiry: Date.now() + 60000 });
    }
};


// GET /api/projects/user/:uid
router.get('/user/:uid', async (req, res) => {
    try {
        const snapshot = await db.collection('projects').where('author.uid', '==', req.params.uid).get();
        const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(projects);
    } catch (error) {
        console.error('[DATABASE_ERROR] User Projects Fetch failed:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

// GET /api/projects
router.get('/', async (req, res) => {
    try {
        const { search, category, sort, limit } = req.query;
        const cacheKey = JSON.stringify({ search, category, sort, limit });
        const cachedData = projectsCache.get(cacheKey);

        if (cachedData) {
            return res.json(cachedData);
        }

        let query = db.collection('projects');

        if (category && category !== 'All') {
            query = query.where('category', '==', category);
        }

        const snapshot = await query.get();
        let projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Filter in memory for safety
        projects = projects.filter(p => p.isPrivate !== true);

        if (search) {
            const searchLower = search.toLowerCase();
            projects = projects.filter(p =>
                p.title.toLowerCase().includes(searchLower) ||
                p.description?.toLowerCase().includes(searchLower) ||
                (p.tags && p.tags.some(tag => tag.toLowerCase().includes(searchLower)))
            );
        }

        projects.sort((a, b) => {
            // Priority 1: Promoted/Boosted
            const aPromoted = a.boostedUntil && new Date(a.boostedUntil) > new Date();
            const bPromoted = b.boostedUntil && new Date(b.boostedUntil) > new Date();
            if (aPromoted && !bPromoted) return -1;
            if (!aPromoted && bPromoted) return 1;

            if (sort === 'liked') return (b.stats?.likes || 0) - (a.stats?.likes || 0);
            if (sort === 'viewed') return (b.stats?.views || 0) - (a.stats?.views || 0);

            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return dateB - dateA;
        });

        // Store in Cache
        projectsCache.set(cacheKey, projects);

        res.json(projects);
    } catch (error) {
        console.error('[DATABASE_ERROR] Project List Fetch failed:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

// GET /api/projects/:id
router.get('/:id', async (req, res) => {
    try {
        const projectId = req.params.id;
        const { userId } = req.query;

        // Try cache first (if not checking membership or dev status)
        const cached = projectDetailCache.get(projectId);
        if (cached && !cached.memberOnly) {
            return res.json(cached);
        }

        const doc = await db.collection('projects').doc(projectId).get();
        if (!doc.exists) return res.status(404).json({ error: 'Project not found' });

        const data = doc.data();
        if (!data.memberOnly) projectDetailCache.set(projectId, data);

        // Fetch Author Rank & Tenure for Trust Signals
        try {
            const authorDoc = await db.collection('users').doc(data.author.uid).get();
            if (authorDoc.exists) {
                const authorData = authorDoc.data();
                data.author.tier = authorData.tier || 'GHOST';
                data.author.memberSince = authorData.createdAt || data.createdAt;
                data.author.isVerified = (authorData.stats?.extraSlots || 0) >= 10;
            }
        } catch (e) { console.warn("Failed to fetch author trust signals", e); }

        if (data.memberOnly && data.author.uid !== userId) {
            if (!userId) {
                data.isLocked = true;
            } else {
                const userDoc = await db.collection('users').doc(userId).get();
                const userData = userDoc.data();
                if (userData.tier === 'GHOST' || !userData.tier) {
                    data.isLocked = true;
                }
            }
        }

        res.json({ id: doc.id, ...data });
    } catch (error) {
        console.error('[DATABASE_ERROR] Project Detail Fetch failed:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

// DELETE /api/projects/:id
router.delete('/:id', async (req, res) => {
    try {
        const { userId } = req.body;
        const docRef = db.collection('projects').doc(req.params.id);
        const doc = await docRef.get();

        if (!doc.exists) return res.status(404).json({ error: 'Project not found' });

        const project = doc.data();
        if (project.author.uid !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await docRef.delete();
        await db.collection('users').doc(userId).update({
            'stats.uploads': admin.firestore.FieldValue.increment(-1)
        });

        res.json({ success: true });
    } catch (error) {
        console.error('[DATABASE_ERROR] Project Delete failed:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

// PUT /api/projects/:id
router.put('/:id', async (req, res) => {
    try {
        const { userId, title, description, category, tags } = req.body;
        const docRef = db.collection('projects').doc(req.params.id);
        const doc = await docRef.get();

        if (!doc.exists) return res.status(404).json({ error: 'Project not found' });

        const project = doc.data();
        if (project.author.uid !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { demoUrl, repoUrl } = req.body;

        const tagsArray = Array.isArray(tags) ? tags : (tags ? tags.split(',').map(tag => tag.trim().toLowerCase()) : []);

        const updates = {
            title: title || project.title,
            description: description || project.description,
            category: category || project.category,
            demoUrl: demoUrl !== undefined ? demoUrl : project.demoUrl,
            repoUrl: repoUrl !== undefined ? repoUrl : project.repoUrl,
            tags: tagsArray,
            updatedAt: new Date().toISOString()
        };

        await docRef.update(updates);
        res.json({ success: true });
    } catch (error) {
        console.error('[DATABASE_ERROR] Project Meta Update failed:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

// GET /api/projects/:id/updates
router.get('/:id/updates', async (req, res) => {
    try {
        const projectId = req.params.id;
        const cached = updatesCache.get(projectId);
        if (cached) return res.json(cached);

        const doc = await db.collection('projects').doc(projectId).get();
        if (!doc.exists) return res.status(404).json({ error: 'Project not found' });

        const project = doc.data();
        const updates = project.updates || [];

        // Sort by date desc (in memory, no index required)
        updates.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        updatesCache.set(projectId, updates);
        res.json(updates);
    } catch (error) {
        console.error('[DATABASE_ERROR] Fetch Updates failed:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

// POST /api/projects/:id/updates
router.post('/:id/updates', async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title || !content) return res.status(400).json({ error: 'Missing fields' });

        const updateData = {
            title,
            content,
            createdAt: new Date().toISOString()
        };

        const docRef = db.collection('projects').doc(req.params.id);
        await docRef.update({
            updates: admin.firestore.FieldValue.arrayUnion(updateData),
            updatedAt: new Date().toISOString()
        });

        // Invalidate cache
        updatesCache.store.delete(req.params.id);

        // Return all updates to sync state
        const doc = await docRef.get();
        const project = doc.data();
        const updates = project.updates || [];
        updates.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json(updates);
    } catch (error) {
        console.error('[DATABASE_ERROR] Post Update failed:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

// GET /api/projects/raw - Serve raw file content for explorer
router.get('/raw', async (req, res) => {
    try {
        const { key } = req.query;
        if (!key) return res.status(400).json({ error: 'Missing grid key.' });

        const buffer = await getFileBuffer(key);

        // Basic extension-based mime type detection
        const ext = key.split('.').pop().toLowerCase();
        let mime = 'text/plain';
        if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) mime = 'application/javascript';
        else if (['css'].includes(ext)) mime = 'text/css';
        else if (['json'].includes(ext)) mime = 'application/json';
        else if (['html'].includes(ext)) mime = 'text/html';
        else if (['md'].includes(ext)) mime = 'text/markdown';

        res.set('Content-Type', mime);
        res.send(buffer);
    } catch (error) {
        console.error('Raw File Fetch Error:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

module.exports = router;
