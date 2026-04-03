const admin = require('../functions/node_modules/firebase-admin');
const path = require('path');

// Initialize the Admin SDK
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const TARGET_USER_EMAIL = 'omakaoe@gmail.com';

async function upgradeUser() {
    try {
        console.log(`Searching for user: ${TARGET_USER_EMAIL}...`);

        const userRecord = await admin.auth().getUserByEmail(TARGET_USER_EMAIL);
        const uid = userRecord.uid;
        console.log(`✅ Found UID: ${uid}`);

        console.log(`Setting custom user claims...`);
        await admin.auth().setCustomUserClaims(uid, { plan: 'pro' });
        console.log(`🚀 Successfully set PRO custom claims for ${TARGET_USER_EMAIL}!`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        setTimeout(() => process.exit(0), 1000);
    }
}

upgradeUser();
