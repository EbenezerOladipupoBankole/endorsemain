const admin = require('firebase-admin');

// 🔴 1. Initialize the Admin SDK
// Ideally, set GOOGLE_APPLICATION_CREDENTIALS in your environment
// or use a service account key file.
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 🔴 2. Set the email of the user you want to upgrade
const TARGET_USER_EMAIL = 'user@example.com';
const NEW_PLAN = 'pro'; // or 'business'

async function grantProLicense() {
    try {
        console.log(`Looking for user with email: ${TARGET_USER_EMAIL}...`);

        // Find the user by email in Authentication to get their UID
        const user = await admin.auth().getUserByEmail(TARGET_USER_EMAIL);
        const uid = user.uid;
        console.log(`Found user UID: ${uid}`);

        // Update their profile in Firestore
        const userRef = db.collection('users').doc(uid);
        await userRef.set({
            plan: NEW_PLAN,
            subscriptionStatus: 'active', // Optional but good for logic
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`✅ Success! User ${TARGET_USER_EMAIL} is now on the '${NEW_PLAN}' plan.`);

    } catch (error) {
        console.error('❌ Error updating user:', error.message);
    }
}

grantProLicense();
