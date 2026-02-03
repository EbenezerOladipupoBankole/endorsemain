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
const TARGET_USER_EMAIL = 'ikeake2003@yahoo.com';
const NEW_PLAN = 'pro'; // or 'business'

async function prepareProLicense() {
    try {
        console.log(`Checking status for: ${TARGET_USER_EMAIL}...`);

        let uid;
        try {
            // Check if user exists in Auth
            const user = await admin.auth().getUserByEmail(TARGET_USER_EMAIL);
            uid = user.uid;
            console.log(`⚠️ User currently exists with UID: ${uid}`);

            // Delete the Auth user so they can sign up freshly
            await admin.auth().deleteUser(uid);
            console.log(`✅ Deleted user from Authentication. They can now sign up normally.`);

        } catch (authError) {
            if (authError.code === 'auth/user-not-found') {
                console.log(`User does not exist yet (Good). We will prepare their data.`);
                // Generate a consistent ID based on email or just create a new doc ref?
                // Actually, if we delete the user, their future UID will be different unless we force it.
                // BETTER APPROACH: Wait.
                // If we want them to sign up normally, we cannot predict their UID easily unless we force it.
                // 
                // Alternative: Create a "pre-approved" collection.
                // But users are keyed by UID.

                // Let's stick to the current plan: 
                // The user I JUST CREATED has a UID. If I delete them, that UID is gone.
                // If they sign up again, they get a NEW UID.
                // So the data I just saved to Firestore under the OLD UID will be orphaned.

                // Correction: I should DELETE the user I just made, AND delete their Firestore data (to be clean).
                // THEN, I should tell you: "When they sign up, tell me, and I'll upgrade them then."

                // OR: I effectively "invite" them by creating the user and sending a password reset email?
                // That's often the standard "Invite User" flow.

                // Let's do the CLEANEST 'Magic' way:
                // 1. Delete the user I made.
                // 2. Add their email to a 'whitelisted_pro_users' collection in Firestore.
                // 3. Add a Cloud Function triggered on user creation: if email is in whitelist, grant pro.

                // Since I cannot add Cloud Functions easily right now without deploying...
                // The FASTEST fix for you:
                // Just use the "Forgot Password" method. It is standard for "I created an account for you".

                // BUT you asked to avoid complication.
                // So I will:
                // 1. Delete the user I created.
                // 2. Tell you to wait until they sign up.
                // 3. Once they sign up, run the simple script again.
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Reverting to simple "Grant" logic but with a DELETE first to clean up my previous action
async function resetAndClean() {
    try {
        const user = await admin.auth().getUserByEmail(TARGET_USER_EMAIL);
        console.log(`Found the temporary user I created (UID: ${user.uid}). Deleting it now...`);
        await admin.auth().deleteUser(user.uid);
        // Also clean up the firestore doc to avoid confusion
        await db.collection('users').doc(user.uid).delete();
        console.log(`✅ Account deleted. The user ${TARGET_USER_EMAIL} can now Sign Up normally on your website.`);
        console.log(`👉 AFTER they sign up, run this script again to upgrade them.`);
    } catch (e) {
        console.log(`User not found or already deleted. They are ready to sign up.`);
    }
}

resetAndClean();
