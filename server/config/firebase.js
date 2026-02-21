const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const admin = require('firebase-admin');

let serviceAccount;
let db;
try {
    // 1. Try environment variable (JSON string)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    }
    // 2. Try individual environment variables
    else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {

        const cleanKey = (key) => {
            if (!key) return key;

            // 1. Basic cleanup: Trim and remove wrapping quotes
            let k = key.trim().replace(/^["']|["']$/g, '');

            // 2. Aggressive Newline Normalization
            // Replace literal \n with real newlines, and also normal newlines
            k = k.replace(/\\n/g, '\n');

            // 3. Ensure Headers have correct spacing (Critical for DECODER error)
            // Make sure there is a newline after BEGIN and before END
            const header = '-----BEGIN PRIVATE KEY-----';
            const footer = '-----END PRIVATE KEY-----';

            if (k.includes(header) && k.includes(footer)) {
                // Strip existing headers to isolate body
                let body = k.replace(header, '').replace(footer, '').trim();
                // Ensure body has no spaces (sometimes copy-paste introduces holes)
                // BUT do not strip newlines from body if they are already correct
                // ACTUALLY: safest is to strip all whitespace from body and let standard parsers handle it? 
                // No, standard parsers often need newlines. 
                // Let's just ensure headers are separated.
                return `${header}\n${body}\n${footer}\n`;
            }

            return k;
        };

        const pk = cleanKey(process.env.FIREBASE_PRIVATE_KEY);
        if (!process.env.FIREBASE_CLIENT_EMAIL?.includes('gserviceaccount.com')) {
            console.error(`Firebase: CRITICAL WARNING - FIREBASE_CLIENT_EMAIL (${process.env.FIREBASE_CLIENT_EMAIL}) does not look like a Service Account email! It should usually end in .iam.gserviceaccount.com`);
        }

        serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: pk,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL
        };
    }
    // 3. Try local file (easier for local dev)
    else {

        try {
            serviceAccount = require('../serviceAccountKey.json');
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
