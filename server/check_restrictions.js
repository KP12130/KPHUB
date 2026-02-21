const { db } = require('./config/firebase');

async function checkUser() {
    console.log("Fetching test user...");
    const snap = await db.collection('users').limit(1).get();
    if (snap.empty) return console.log("No user found");
    const doc = snap.docs[0];
    console.log("User:", doc.id);
    console.log("Restrictions:", doc.data().restrictions);
}

checkUser().catch(console.error);
