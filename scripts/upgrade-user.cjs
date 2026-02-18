const admin = require('../functions/node_modules/firebase-admin');
const path = require('path');

// Initialize the Admin SDK
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

const TARGET_USER_EMAIL = 'omakaoe@gmail.com';
const NEW_PLAN = 'pro';

async function upgradeUser() {
    try {
        console.log(`Searching for user: ${TARGET_USER_EMAIL}...`);

        const userRecord = await admin.auth().getUserByEmail(TARGET_USER_EMAIL);
        const uid = userRecord.uid;
        console.log(`✅ Found UID: ${uid}`);

        console.log(`Attempting Firestore update...`);
        const userDocRef = db.collection('users').doc(uid);

        // Try to set it
        await userDocRef.set({
            plan: NEW_PLAN,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`🚀 Successfully upgraded ${TARGET_USER_EMAIL} to ${NEW_PLAN}!`);

    } catch (error) {
        console.error('❌ Error:', error);
        if (error.stack) console.error('Stack:', error.stack);
    } finally {
        setTimeout(() => process.exit(0), 1000);
    }
}

upgradeUser();
