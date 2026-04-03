const admin = require('../functions/node_modules/firebase-admin');
const path = require('path');

// Initialize the Admin SDK
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

async function listDbs() {
    try {
        console.log('Project ID:', admin.app().options.projectId || serviceAccount.project_id);

        // Try to get a document from a known path in the app
        console.log('Checking users collection...');
        const snap = await admin.firestore().collection('users').limit(1).get();
        console.log('Users found:', snap.size);

        if (snap.size > 0) {
            console.log('First user email:', snap.docs[0].data().email);
        } else {
            console.log('No users found in Firestore.');
        }
    } catch (e) {
        console.error('Firestore Error:', e.message);
        if (e.stack) console.error(e.stack);
    } finally {
        setTimeout(() => process.exit(0), 1000);
    }
}

listDbs();
