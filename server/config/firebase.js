const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

let serviceAccount;
let db;
try {
    // 1. Try environment variable (JSON string)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    }
    // 2. Try individual environment variables
    else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL
        };
    }
    // 3. Try local file (easier for local dev)
    else {
        try {
            serviceAccount = require('../serviceAccountKey.json');
        } catch (e) {
            // File not found, ignore
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
