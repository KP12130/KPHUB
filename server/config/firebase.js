const dotenv = require('dotenv');
dotenv.config();

const admin = require('firebase-admin');

let serviceAccount;
let db;
try {
    // 1. Try environment variable (JSON string)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        console.log("Firebase: Using FIREBASE_SERVICE_ACCOUNT JSON blob.");
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    }
    // 2. Try individual environment variables
    else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        console.log("Firebase: Using individual environment variables.");

        const cleanKey = (key) => {
            if (!key) return key;
            // Simple quote removal and newline replacement
            // This is safer than rebuilding the PEM from scratch which might corrupt specific key types
            return key.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
        };

        const pk = cleanKey(process.env.FIREBASE_PRIVATE_KEY);
        console.log(`Firebase: Private Key scrubbed. Header: ${pk.substring(0, 27)}...`);
        console.log(`Firebase: Identity Check - Project: ${process.env.FIREBASE_PROJECT_ID} | Email: ${process.env.FIREBASE_CLIENT_EMAIL}`);

        serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: pk,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL
        };
    }
    // 3. Try local file (easier for local dev)
    else {
        console.log("Firebase: Awaiting full credentials. Current status:");
        console.log(`- FIREBASE_PROJECT_ID: ${process.env.FIREBASE_PROJECT_ID ? '✅ SET' : '❌ MISSING'}`);
        console.log(`- FIREBASE_PRIVATE_KEY: ${process.env.FIREBASE_PRIVATE_KEY ? '✅ SET' : '❌ MISSING'}`);
        console.log(`- FIREBASE_CLIENT_EMAIL: ${process.env.FIREBASE_CLIENT_EMAIL ? '✅ SET' : '❌ MISSING'}`);

        try {
            serviceAccount = require('../serviceAccountKey.json');
            console.log("Firebase: Found local serviceAccountKey.json file.");
        } catch (e) {
            // File not found
        }
    }
} catch (error) {
    console.warn("Firebase Service Account not found in .env or server/serviceAccountKey.json");
}

if (serviceAccount) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin Initialized");
    db = admin.firestore(); // Move db initialization here
} else {
    console.warn("Firebase Admin NOT initialized. Please set FIREBASE_SERVICE_ACCOUNT or add serviceAccountKey.json.");
    // Create a mock DB to prevent immediate crash, but requests will fail
    db = {
        collection: () => ({
            get: async () => { throw new Error("Firebase not initialized"); },
            add: async () => { throw new Error("Firebase not initialized"); },
            doc: () => ({
                set: async () => { throw new Error("Firebase not initialized"); },
                get: async () => { throw new Error("Firebase not initialized"); },
                update: async () => { throw new Error("Firebase not initialized"); }
            })
        })
    };
}

module.exports = { admin, db };
