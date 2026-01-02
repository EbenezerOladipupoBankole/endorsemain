import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

// Initialize Admin SDK
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// --- EMAIL CONFIGURATION ---
// For Gmail, use an App Password: https://myaccount.google.com/apppasswords
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "ebenezerbankole7@gmail.com",
    pass: "rslkarucyqbvtsbz",
  },
});

const APP_URL = "https://endorse.onrender.com"; // Changed to root to avoid 404s if server rewrites aren't configured

interface InvitePayload {
  documentId: string;
  recipientEmail: string;
}

interface SendDocumentPayload {
  recipientEmail: string;
  pdfBase64: string;
  documentName: string;
}

interface SendSignerInvitesPayload {
  signers: { email: string; role: string }[];
  documentName: string;
  uploaderName: string;
  uploaderEmail: string;
  documentId: string;
}

// Function to invite a user to sign
export const inviteToSign = functions.https.onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
  }

  const data = request.data as InvitePayload;
  const { documentId, recipientEmail } = data;

  if (!documentId || !recipientEmail) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required fields.");
  }

  const db = admin.firestore();

  try {
    // 1. Get Original Document
    const docRef = db.collection("documents").doc(documentId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Document not found.");
    }

    const originalData = docSnap.data();

    // 2. Create New Document (Clone)
    const newDocumentData = {
      ...originalData,
      status: "pending",
      signature_data: null,
      signature_type: null,
      ownerEmail: recipientEmail,
      invitedBy: request.auth.token.email || request.auth.uid,
      originalDocumentId: documentId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    delete (newDocumentData as any).id;

    // 3. Save to Firestore
    const newDocRef = await db.collection("documents").add(newDocumentData);

    const documentLink = `${APP_URL}?documentId=${newDocRef.id}`;

    // 4. Send Invitation Email
    await transporter.sendMail({
      from: '"Endorse App" <ebenezerbankole7@gmail.com>',
      to: recipientEmail,
      subject: "You have been invited to sign a document",
      text: `You have been invited to sign "${originalData?.name}".\n\nPlease click the link below to access your dashboard and sign the document:\n${documentLink}\n\nBest,\nEndorse Team`,
      html: `<div style="margin-bottom: 20px;"><img src="https://endorse.onrender.com/favicon.svg" alt="Endorse Logo" width="100" style="width: 100px; height: auto;" /></div><p>You have been invited to sign <strong>${originalData?.name}</strong>.</p><p>Please click the link below to access your dashboard and sign the document:</p><p><a href="${documentLink}">Go to Document</a></p><p>Best,<br>Endorse Team</p>`,
    });

    return { success: true, newDocumentId: newDocRef.id };

  } catch (error: any) {
    console.error("Invite Error:", error);
    // Ensure we return the specific error message from Nodemailer or Firestore
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    throw new functions.https.HttpsError("internal", errorMessage);
  }
});

// Function to handle bulk invites from Dashboard
export const sendSignerInvites = functions.https.onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
  }

  const data = request.data as SendSignerInvitesPayload;
  const { signers, documentName, uploaderName, documentId } = data;

  if (!signers || !Array.isArray(signers) || signers.length === 0) {
    throw new functions.https.HttpsError("invalid-argument", "No signers provided.");
  }

  const documentLink = documentId ? `${APP_URL}?documentId=${documentId}` : APP_URL;
  console.log(`Sending invite email with link: ${documentLink}`);

  const results = [];

  for (const signer of signers) {
    try {
      await transporter.sendMail({
        from: '"Endorse App" <ebenezerbankole7@gmail.com>',
        to: signer.email,
        subject: `${uploaderName} invited you to sign ${documentName}`,
        text: `Hello,\n\n${uploaderName} has invited you to sign the document "${documentName}".\n\nPlease click the link below to access your dashboard and sign the document:\n${documentLink}\n\nBest,\nEndorse Team`,
        html: `<div style="margin-bottom: 20px;"><img src="https://endorse.onrender.com/favicon.svg" alt="Endorse Logo" width="100" style="width: 100px; height: auto;" /></div><p>Hello,</p><p><strong>${uploaderName}</strong> has invited you to sign the document "<strong>${documentName}</strong>".</p><p>Please click the link below to access your dashboard and sign the document:</p><p><a href="${documentLink}">Go to Document</a></p><p>Best,<br>Endorse Team</p>`,
      });
      results.push({ email: signer.email, status: 'sent' });
    } catch (error: any) {
      console.error(`Failed to send email to ${signer.email}:`, error);
      results.push({ email: signer.email, status: 'failed', error: error.message });
    }
  }

  return { success: true, results };
});

// Function to send the signed document via email
export const sendDocument = functions.https.onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
  }

  const data = request.data as SendDocumentPayload;
  const { recipientEmail, pdfBase64, documentName } = data;
  const base64Content = pdfBase64.split(",")[1]; // Remove data:application/pdf;base64, prefix

  try {
    await transporter.sendMail({
      from: '"Endorse App" <ebenezerbankole7@gmail.com>',
      to: recipientEmail,
      subject: `Signed Document: ${documentName}`,
      text: `Please find attached the signed copy of ${documentName}.`,
      attachments: [
        {
          filename: `${documentName}.pdf`,
          content: base64Content,
          encoding: "base64",
        },
      ],
    });
    
    return { success: true };
  } catch (error: any) {
    console.error("Send Document Error:", error);
    throw new functions.https.HttpsError("internal", error.message || "Failed to send document.");
  }
});
