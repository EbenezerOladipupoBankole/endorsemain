import { onCall, HttpsError, onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";
import * as crypto from "crypto";
import { defineSecret } from "firebase-functions/params";
import axios from "axios";
import { Stripe } from "stripe";
const mammoth = require("mammoth");
const { Document, Packer, Paragraph, TextRun } = require("docx");
const pdfParse = require("pdf-parse");
import prisma from "./db";

const postgresUrl = defineSecret("POSTGRES_URL");

// Initialize Admin SDK
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// --- EMAIL CONFIGURATION ---
// For Gmail, use an App Password: https://myaccount.google.com/apppasswords
// Credentials are now stored securely using Firebase Secrets.
const gmailEmail = defineSecret("GMAIL_EMAIL");
const gmailPassword = defineSecret("GMAIL_PASSWORD");
const paystackSecretKeyTest = defineSecret("PAYSTACK_SECRET_KEY_TEST");
const paystackSecretKeyLive = defineSecret("PAYSTACK_SECRET_KEY_LIVE");
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  const email = gmailEmail.value();
  const password = gmailPassword.value();

  if (!email || !password) {
    console.error("GMAIL_EMAIL or GMAIL_PASSWORD secret is missing or empty.");
    throw new HttpsError("failed-precondition", "Email configuration is missing on the server.");
  }

  if (!transporter) {
    console.log("Creating nodemailer transporter for:", email);
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: email,
        pass: password,
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,   // 10 seconds
    });
  }
  return transporter;
}

const APP_URL = "https://e-ndorse.online"; // Updated to new custom domain

const ADMIN_EMAILS = ["bankoleebenezer111@gmail.com", "omakaoe@gmail.com"];

interface InvitePayload {
  documentId: string;
  recipientEmail: string;
}

interface SendDocumentPayload {
  recipientEmail: string;
  pdfBase64: string;
  documentName: string;
}

// Function to fetch documents for the logged-in user (PostgreSQL)
export const getUserDocuments = onCall({ secrets: [postgresUrl] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }

  try {
    const userEmail = request.auth.token.email;
    if (!userEmail) throw new HttpsError("invalid-argument", "Email required.");

    // 1. Get Owned Documents
    const ownedDocs = await prisma.document.findMany({
      where: { owner: { email: userEmail } },
      include: { recipients: true },
      orderBy: { createdAt: 'desc' }
    });

    // 2. Get Documents where user is a recipient (not owned)
    const receivedRecipients = await prisma.recipient.findMany({
      where: { 
        email: userEmail,
        document: { owner: { email: { not: userEmail } } } // Exclude self-owned
      },
      include: { 
        document: { 
          include: { owner: true, recipients: true } 
        } 
      }
    });

    const receivedDocs = receivedRecipients.map(r => ({ ...r.document, role: 'recipient' }));
    const ownedDocsWithRole = ownedDocs.map(d => ({ ...d, role: 'owner' }));

    const allDocs = [...ownedDocsWithRole, ...receivedDocs].sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return { success: true, documents: allDocs };
  } catch (error: any) {
    console.error("List Documents Error:", error);
    throw new HttpsError("internal", error.message || "Failed to list documents.");
  }
});

// Function to get summary stats (PostgreSQL)
export const getUserStats = onCall({ secrets: [postgresUrl] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }

  try {
    const userEmail = request.auth.token.email;
    if (!userEmail) throw new HttpsError("invalid-argument", "Email required.");

    const totalOwned = await prisma.document.count({
      where: { owner: { email: userEmail } }
    });

    const completed = await prisma.document.count({
      where: { owner: { email: userEmail }, status: 'COMPLETED' }
    });

    const pending = totalOwned - completed;

    return { total: totalOwned, signed: completed, pending };
  } catch (error: any) {
    console.error("Stats Error:", error);
    throw new HttpsError("internal", error.message || "Failed to fetch stats.");
  }
});

interface SendSignerInvitesPayload {
  signers: { email: string; role: string }[];
  documentName: string;
  uploaderName: string;
  pdfBase64: string;
}

interface AcceptInvitePayload {
  token: string;
}

// --- AUDIT LOGGING HELPER ---
async function logAuditTrail(documentId: string, action: string, performedBy: string, details: any = {}) {
  try {
    // Attempt to find a user if it looks like a Firebase UID or email
    let userId: string | null = null;
    if (performedBy && performedBy.includes('@')) {
       const user = await prisma.user.findUnique({ where: { email: performedBy } });
       if (user) userId = user.id;
    }

    await prisma.auditLog.create({
      data: {
        documentId,
        action,
        userId,
        metadata: { ...details, performedBy },
      },
    });
  } catch (error) {
    console.error("Audit Log Error (Postgres):", error);
  }
}

// Function to invite a user to sign
export const inviteToSign = onCall({ secrets: [gmailEmail, gmailPassword, postgresUrl] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }

  const data = request.data as InvitePayload;
  const { documentId, recipientEmail } = data;

  if (!documentId || !recipientEmail) {
    throw new HttpsError("invalid-argument", "Missing required fields.");
  }

  const db = admin.firestore();

  // Check for free plan limits (3 documents)
  const userRef = db.collection("users").doc(request.auth.uid);
  const userSnap = await userRef.get();
  const userData = userSnap.data();
  const documentsSigned = userData?.documentsSigned || 0;
  const isPro = userData?.plan === "pro" || userData?.plan === "business";
  const isAdmin = request.auth.token.email && ADMIN_EMAILS.includes(request.auth.token.email);

  if (!isPro && !isAdmin && documentsSigned >= 3) {
    throw new HttpsError("resource-exhausted", "You have reached the limit of 3 free documents. Please upgrade to continue.");
  }

  console.log("inviteToSign called with data:", data);

  try {
    // 1. Get Original Document from Firestore (for now)
    console.log("Fetching original document:", documentId);
    const docRef = db.collection("documents").doc(documentId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      console.error("Document not found in Firestore:", documentId);
      throw new HttpsError("not-found", "Document not found.");
    }

    const originalData = docSnap.data();
    console.log("Original document data:", originalData);

    // 2. Sync / Upsert User in PostgreSQL
    const senderEmail = request.auth.token.email;
    if (!senderEmail) {
      console.error("Missing email in auth token");
      throw new HttpsError("invalid-argument", "User email is required for this operation.");
    }

    console.log("Upserting user in Postgres:", senderEmail);
    const postgresUser = await prisma.user.upsert({
      where: { email: senderEmail },
      update: { firebaseUid: request.auth.uid },
      create: { 
        email: senderEmail,
        firebaseUid: request.auth.uid,
        name: request.auth.token.name as string || senderEmail.split('@')[0],
      }
    });
    console.log("Postgres user synced:", postgresUser.id);

    // 3. Save Document and Recipient to PostgreSQL
    const newPgDoc = await prisma.document.create({
      data: {
        name: originalData?.name || "Untitled Document",
        fileUrl: originalData?.pdfBase64 || "", // Or storage URL
        ownerId: postgresUser.id,
        status: "pending",
        recipients: {
          create: {
            email: recipientEmail,
            status: "pending",
          }
        }
      },
      include: {
        recipients: true
      }
    });

    await logAuditTrail(newPgDoc.id, "DOCUMENT_INVITE_SENT", senderEmail, { recipientEmail });

    const pgRecipient = newPgDoc.recipients[0];
    const documentLink = `${APP_URL}/sign/${newPgDoc.id}?token=${pgRecipient.token}`;

    // 4. Send Invitation Email
    console.log("Sending invitation email to:", recipientEmail);
    const transporter = getTransporter();

    const mailOptions = {
      from: `"Endorse App" <${gmailEmail.value()}>`,
      to: recipientEmail,
      subject: "You have been invited to sign a document",
      text: `You have been invited to sign "${originalData?.name}".\n\nPlease click the link below to access your dashboard and sign the document:\n${documentLink}\n\nBest,\nEndorse Team`,
      html: `<div style="margin-bottom: 20px;"><img src="https://e-ndorse.online/favicon.svg" alt="Endorse Logo" width="100" style="width: 100px; height: auto;" /></div><p>You have been invited to sign <strong>${originalData?.name}</strong>.</p><p>Please click the link below to access your dashboard and sign the document:</p><p><a href="${documentLink}">Go to Document</a></p><p>Best,<br>Endorse Team</p>`,
    };

    await transporter.sendMail(mailOptions);
    console.log("Invitation email sent successfully.");

    return { 
      success: true, 
      newDocumentId: newPgDoc.id,
      recipientId: pgRecipient.id 
    };

  } catch (error: any) {
    console.error("Invite Error Exception:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    throw new HttpsError("internal", errorMessage);
  }
});

// Function to handle bulk invites from Dashboard
export const sendSignerInvites = onCall({ secrets: [gmailEmail, gmailPassword, postgresUrl] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }

  const data = request.data as SendSignerInvitesPayload;
  const { signers, documentName, uploaderName, pdfBase64 } = data;

  if (!signers || !Array.isArray(signers) || signers.length === 0) {
    throw new HttpsError("invalid-argument", "No signers provided.");
  }

  const senderEmail = request.auth.token.email;
  if (!senderEmail) throw new HttpsError("invalid-argument", "Sender email required.");

  console.log("Starting sendSignerInvites for:", senderEmail);

  try {
    // 1. Sync User in Postgres
    console.log("Upserting user...");
    const postgresUser = await prisma.user.upsert({
      where: { email: senderEmail },
      update: { firebaseUid: request.auth.uid },
      create: { 
        email: senderEmail,
        firebaseUid: request.auth.uid,
        name: uploaderName || senderEmail.split('@')[0],
      }
    });
    console.log("User upserted:", postgresUser.id);

    // 2. Save Document to Postgres
    console.log("Creating document in Postgres...");
    const newPgDoc = await prisma.document.create({
      data: {
        name: documentName || "Untitled Document",
        fileUrl: pdfBase64 || "", // In prod, upload to storage first
        ownerId: postgresUser.id,
        status: "pending",
        recipients: {
          create: signers.map(s => ({
            email: s.email,
            name: s.email.split('@')[0],
            status: "pending",
          }))
        }
      },
      include: {
        recipients: true
      }
    });
    console.log("Document created:", newPgDoc.id);

    await logAuditTrail(newPgDoc.id, "DOCUMENT_CREATED", senderEmail, { totalSigners: signers.length });

    console.log(`Starting bulk invite for document: ${documentName}, ID: ${newPgDoc.id}`);
    const results = [];

    for (const pgRecipient of newPgDoc.recipients) {
      try {
        const documentLink = `${APP_URL}/sign/${newPgDoc.id}?token=${pgRecipient.token}`;
        console.log(`Sending invite email to: ${pgRecipient.email} with link: ${documentLink}`);
        
        await getTransporter().sendMail({
          from: `"Endorse App" <${gmailEmail.value()}>`,
          to: pgRecipient.email,
          subject: `${uploaderName} invited you to sign ${documentName}`,
          text: `Hello,\n\n${uploaderName} has invited you to sign the document "${documentName}".\n\nPlease click the link below to sign the document:\n${documentLink}\n\nBest,\nEndorse Team`,
          html: `<div style="margin-bottom: 20px;"><img src="https://e-ndorse.online/favicon.svg" alt="Endorse Logo" width="100" style="width: 100px; height: auto;" /></div><p>Hello,</p><p><strong>${uploaderName}</strong> has invited you to sign the document "<strong>${documentName}</strong>".</p><p>Please click the link below to sign the document:</p><p><a href="${documentLink}">Go to Document</a></p><p>Best,<br>Endorse Team</p>`,
        });
        
        results.push({ email: pgRecipient.email, status: 'sent' });
      } catch (error: any) {
        console.error(`Failed to send email to ${pgRecipient.email}:`, error);
        results.push({ email: pgRecipient.email, status: 'failed', error: error.message });
      }
    }

    return { success: true, results, documentId: newPgDoc.id };
  } catch (error: any) {
    console.error("Bulk Invite Error:", error);
    throw new HttpsError("internal", error.message || "Failed to process invitations.");
  }
});

export const inviteTeamMember = onCall({ secrets: [gmailEmail, gmailPassword, postgresUrl] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }

  const { inviteEmail: toEmail, role } = request.data as { inviteEmail: string; role: string };
  const senderEmail = request.auth.token.email;
  if (!senderEmail) throw new HttpsError("invalid-argument", "Sender email required.");

  try {
    // 1. Get/Sync inviter info in Postgres
    const inviter = await prisma.user.upsert({
      where: { email: senderEmail },
      update: { firebaseUid: request.auth.uid },
      create: { 
        email: senderEmail, 
        firebaseUid: request.auth.uid,
        name: request.auth.token.name as string || senderEmail.split('@')[0]
      }
    });

    const isAdmin = ADMIN_EMAILS.includes(senderEmail);
    if (inviter.planType !== "business" && !isAdmin) {
      throw new HttpsError("permission-denied", "Only Business plan users can invite team members.");
    }

    // 2. Find or create the inviter's team
    let team = await prisma.team.findFirst({
      where: { ownerId: inviter.id }
    });

    if (!team) {
      team = await prisma.team.create({
        data: {
          name: inviter.companyName || `${inviter.name}'s Team`,
          ownerId: inviter.id,
          members: {
            create: {
              userId: inviter.id,
              role: 'admin'
            }
          }
        }
      });
    }

    // 3. Create or find the invitee User record
    const invitee = await prisma.user.upsert({
      where: { email: toEmail },
      update: {},
      create: { 
        email: toEmail,
        name: toEmail.split('@')[0],
      }
    });

    // 4. Add invitee to Team (Pending status usually handled by membership check or a separate invite table)
    // For simplicity, we'll add them as a 'member' but you might want a 'status' field in TeamMember
    const existingMember = await prisma.teamMember.findFirst({
      where: { teamId: team.id, userId: invitee.id }
    });

    if (!existingMember) {
      await prisma.teamMember.create({
        data: {
          teamId: team.id,
          userId: invitee.id,
          role: role || 'member'
        }
      });
    }

    // 5. Send email
    const inviteLink = `${APP_URL}/dashboard`; // Simplified link for now
    await getTransporter().sendMail({
      from: `"Endorse Team" <${gmailEmail.value()}>`,
      to: toEmail,
      subject: `You've been invited to join ${team.name} on Endorse`,
      html: `
        <div style="margin-bottom: 20px;"><img src="https://e-ndorse.online/favicon.svg" alt="Endorse Logo" width="100" /></div>
        <p>Hello,</p>
        <p><strong>${senderEmail}</strong> has invited you to join their team **${team.name}** on Endorse.</p>
        <p><a href="${inviteLink}">Access Dashboard</a></p>
        <p>If you don't have an account, please sign up using this email address.</p>
        <p>Best,<br>Endorse Team</p>
      `,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Invite Team Error:", error);
    throw new HttpsError("internal", error.message || "Failed to send team invite.");
  }
});

export const acceptTeamInvite = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in to accept an invite.");
  }
  const { uid, email } = request.auth.token;
  const { token } = request.data as AcceptInvitePayload;

  const db = admin.firestore();
  const invitesRef = db.collection('invites');
  const inviteQuery = await invitesRef.where('token', '==', token).where('toEmail', '==', email).limit(1).get();

  if (inviteQuery.empty) {
    throw new HttpsError('not-found', 'Invitation not found, is invalid, or is for another email address.');
  }

  const inviteDoc = inviteQuery.docs[0];
  const inviteData = inviteDoc.data();

  if (inviteData.status !== 'pending') {
    throw new HttpsError('already-exists', 'This invitation has already been accepted.');
  }

  const { teamId, role } = inviteData;

  const batch = db.batch();

  const memberRef = db.collection('teams').doc(teamId).collection('members').doc(uid);
  batch.set(memberRef, { email, role, status: 'active', addedAt: admin.firestore.FieldValue.serverTimestamp() });

  const userRef = db.collection('users').doc(uid);
  batch.set(userRef, { teamId, plan: 'business' }, { merge: true });

  batch.update(inviteDoc.ref, { status: 'accepted', acceptedAt: admin.firestore.FieldValue.serverTimestamp(), acceptedByUid: uid });

  await batch.commit();

  return { success: true, message: 'Team joined successfully.' };
});

// Function to send the signed document via email
export const sendDocument = onCall({ secrets: [gmailEmail, gmailPassword] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }

  const data = request.data as SendDocumentPayload;
  const { recipientEmail, pdfBase64, documentName } = data;
  const base64Content = pdfBase64.split(",")[1]; // Remove data:application/pdf;base64, prefix

  try {
    await getTransporter().sendMail({
      from: `"Endorse App" <${gmailEmail.value()}>`,
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
    throw new HttpsError("internal", error.message || "Failed to send document.");
  }
});

// Function to convert documents between formats
export const convertDocument = onCall({
  memory: "1GiB",
  timeoutSeconds: 300,
}, async (request) => {
  const { file, filename, mimeType, targetFormat } = request.data as {
    file: string;
    filename: string;
    mimeType: string;
    targetFormat: string;
  };

  if (!file || !filename) {
    throw new HttpsError("invalid-argument", "Missing file or filename.");
  }

  console.log(`Starting conversion for file: ${filename}, from: ${mimeType}, to: ${targetFormat}`);

  try {
    const buffer = Buffer.from(file, "base64");
    console.log(`Buffer size: ${buffer.length} bytes`);

    // --- MODE 1: IMAGE TO PDF ---
    if (mimeType.startsWith("image/") || (filename.match(/\.(jpg|jpeg|png)$/i) && targetFormat === "pdf")) {
      console.log("Mode: Image to PDF");
      const { PDFDocument } = await import("pdf-lib");
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();

      let image;
      if (mimeType === "image/png" || filename.toLowerCase().endsWith(".png")) {
        image = await pdfDoc.embedPng(buffer);
      } else {
        image = await pdfDoc.embedJpg(buffer);
      }

      const dims = image.scaleToFit(width - 100, height - 100);
      page.drawImage(image, {
        x: (width - dims.width) / 2,
        y: (height - dims.height) / 2,
        width: dims.width,
        height: dims.height,
      });

      const pdfBase64 = await pdfDoc.saveAsBase64();
      return { pdfBase64 };
    }

    // --- MODE 2: WORD TO PDF ---
    if (filename.match(/\.(doc|docx)$/i) || mimeType.includes("word")) {
      console.log("Mode: Word to PDF");
      const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");
      const mammothLib = (mammoth as any).default || mammoth;
      const result = await mammothLib.extractRawText({ buffer });
      const text = result.value;

      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const lines = text.split("\n");
      let page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      const fontSize = 12;
      const margin = 50;
      let y = height - margin;

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine && line !== "") continue;

        if (y < margin + fontSize) {
          page = pdfDoc.addPage();
          y = height - margin;
        }

        const words = trimmedLine.split(/\s+/);
        let currentLine = "";

        for (const word of words) {
          const testLine = currentLine + word + " ";
          const textWidth = font.widthOfTextAtSize(testLine, fontSize);

          if (textWidth > width - (margin * 2)) {
            if (currentLine) {
              page.drawText(currentLine.trim(), { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
              y -= fontSize * 1.5;
            }
            currentLine = word + " ";
            if (y < margin + fontSize) {
              page = pdfDoc.addPage();
              y = height - margin;
            }
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine.trim()) {
          page.drawText(currentLine.trim(), { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
          y -= fontSize * 1.5;
        }
      }

      const pdfBase64 = await pdfDoc.saveAsBase64();
      return { pdfBase64 };
    }

    // --- MODE 3: PDF TO WORD ---
    if (targetFormat === "docx" && (mimeType === "application/pdf" || filename.toLowerCase().endsWith(".pdf"))) {
      console.log("Mode: PDF to Word");
      const data = await pdfParse(buffer);
      const text = data.text || "";
      console.log(`Extracted text length: ${text.length} chars`);

      // Clean text to remove control characters that might break XML in docx
      const cleanedText = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

      const doc = new Document({
        sections: [{
          properties: {},
          children: cleanedText.split("\n").map((line: string) => {
            const l = line.trim();
            if (!l) return new Paragraph({ children: [] });
            return new Paragraph({
              children: [new TextRun(l)],
            });
          }),
        }],
      });

      console.log("Packing docx document...");
      const docBuffer = await Packer.toBuffer(doc);
      console.log(`Docx packed, size: ${docBuffer.length} bytes`);
      return { fileBase64: docBuffer.toString("base64") };
    }

    // --- MODE 4: PDF TO IMAGE ---
    if (targetFormat === "jpg" && (mimeType === "application/pdf" || filename.toLowerCase().endsWith(".pdf"))) {
      console.log("Mode: PDF to Image - Currently Disabled for Maintenance");
      throw new HttpsError("unimplemented", "PDF to Image is currently under maintenance. Please try Word or Image conversion.");
      /*
      // @ts-ignore
      const pdfImgConvert = require("pdf-img-convert");
      const images = await pdfImgConvert.convert(buffer, {
        width: 1200,
        page_numbers: [1]
      });
      const imageBuffer = Buffer.from(images[0]);
      return { fileBase64: imageBuffer.toString("base64") };
      */
    }

    // --- UNSUPPORTED MODES ---
    throw new HttpsError(
      "unimplemented",
      `Conversion from ${mimeType} to ${targetFormat} is not yet supported.`
    );

  } catch (error: any) {
    console.error("Conversion Error Exception:", error);
    throw new HttpsError("internal", error.message || "Failed to convert document.");
  }
});

// --- PAYMENT INTEGRATIONS ---

// 1. Paystack Integration
export const initializePaystackPayment = onCall({ secrets: [paystackSecretKeyTest, paystackSecretKeyLive] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }

  const { email, amount, planId, callbackUrl, mode } = request.data;

  const isLiveMode = mode === 'live';
  // Use secret.value() if available, otherwise fallback to process.env (for local dev)
  const secretKey = isLiveMode
    ? (paystackSecretKeyLive.value() || process.env.PAYSTACK_SECRET_KEY_LIVE)
    : (paystackSecretKeyTest.value() || process.env.PAYSTACK_SECRET_KEY_TEST);

  console.log(`[Payment Init] Mode: ${mode}, IsLive: ${isLiveMode}`);
  const keyPrefix = secretKey ? secretKey.substring(0, 15) : "UNDEFINED";
  console.log(`[Payment Init] Secret Key Prefix: ${keyPrefix}...`); // Logs first 15 chars to check sk_live vs sk_test

  if (!secretKey) {
    console.error("Missing Paystack Secret Key. Mode:", mode);
    throw new HttpsError("failed-precondition", "Payment configuration is missing.");
  }

  try {
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        // The amount is converted from USD to NGN (at a rate of 1600) and then to kobo.
        // For live transactions, you may want a dynamic exchange rate.
        amount: Math.round(parseFloat(amount) * 100 * 1600),
        callback_url: callbackUrl,
        metadata: {
          planId,
          userId: request.auth.uid,
          email,
          mode: isLiveMode ? 'live' : 'test'
        },
      },
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.data; // Includes authorization_url and reference
  } catch (error: any) {
    console.error("Paystack Init Error Details:", error.response?.data || error.message);
    throw new HttpsError("internal", `Failed to initialize Paystack payment: ${error.response?.data?.message || error.message}`);
  }
});

// 2. Stripe Integration
export const initializeStripeSession = onCall({ secrets: [stripeSecretKey] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }

  const { planId, amount, successUrl, cancelUrl } = request.data;
  const stripe = new Stripe(stripeSecretKey.value(), { apiVersion: "2023-10-16" as any });

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${planId.toUpperCase()} Plan Subscription`,
              description: `Upgrade to ${planId} plan on Endorse`,
            },
            unit_amount: Math.round(parseFloat(amount) * 100), // amount in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment", // Use 'subscription' for recurring
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: request.auth.token.email,
      metadata: {
        planId,
        userId: request.auth.uid,
      },
    });

    return { sessionId: session.id, url: session.url };
  } catch (error: any) {
    console.error("Stripe Session Error:", error);
    throw new HttpsError("internal", error.message);
  }
});

// 3. Webhook to handle successful payments (Generic for both if possible, or separate)
export const handlePaymentWebhook = onRequest({ secrets: [stripeSecretKey, stripeWebhookSecret, paystackSecretKeyTest, paystackSecretKeyLive] }, async (req, res) => {
  const db = admin.firestore();

  // Stripe Webhook Logic
  if (req.headers["stripe-signature"]) {
    const stripe = new Stripe(stripeSecretKey.value(), { apiVersion: "2023-10-16" as any });
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        req.headers["stripe-signature"] as string,
        stripeWebhookSecret.value()
      );
    } catch (err: any) {
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const { userId, planId } = session.metadata || {};

      if (userId && planId) {
        await db.collection("users").doc(userId).set({
          plan: planId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }
    }
  }

  // Paystack Webhook Logic
  else if (req.headers["x-paystack-signature"]) {
    // Verify signature then update
    const secret = req.body.data?.metadata?.mode === 'live' ? paystackSecretKeyLive.value() : paystackSecretKeyTest.value();

    const hash = crypto.createHmac("sha512", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      res.status(400).send("Invalid Paystack signature");
      return;
    }

    const event = req.body;
    if (event.event === "charge.success") {
      const { userId, planId } = event.data.metadata || {};
      if (userId && planId) {
        await db.collection("users").doc(userId).set({
          plan: planId,
          paymentProvider: "paystack",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          // Clear stripe ID if they switch to paystack
          stripeCustomerId: null,
        }, { merge: true });
      }
    }
  }

  res.json({ received: true });
});

// 4. Billing Management
export const manageStripeSubscription = onCall({ secrets: [stripeSecretKey] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }

  const { returnUrl } = request.data;
  const stripe = new Stripe(stripeSecretKey.value(), { apiVersion: "2025-01-27v2" as any });

  try {
    // We need to find or create a Stripe customer ID associated with this user
    const db = admin.firestore();
    const userDoc = await db.collection("users").doc(request.auth.uid).get();
    const userData = userDoc.data();

    let customerId = userData?.stripeCustomerId;

    if (!customerId) {
      // Create a new customer if they don't have one
      const customer = await stripe.customers.create({
        email: request.auth.token.email,
        metadata: { userId: request.auth.uid }
      });
      customerId = customer.id;
      await db.collection("users").doc(request.auth.uid).update({ stripeCustomerId: customerId });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || APP_URL,
    });

    return { url: portalSession.url };
  } catch (error: any) {
    console.error("Stripe Portal Error:", error);
    throw new HttpsError("internal", error.message);
  }
});

export const managePaystackSubscription = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }

  // Paystack doesn't have a hosted portal like Stripe. 
  // We can return a URL to a custom page or simply inform the user.
  return {
    url: "https://dashboard.paystack.com", // Or a link to your support/custom billing page
    message: "Paystack subscription management is handled via your dashboard or contact support."
  };
});

interface RemoveMemberPayload {
  teamId: string;
  memberId: string;
}

export const removeTeamMember = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }
  const { uid: removerUid } = request.auth.token;
  const { teamId, memberId } = request.data as RemoveMemberPayload;

  const db = admin.firestore();
  const memberRef = db.collection('teams').doc(teamId).collection('members').doc(memberId);
  const removerRef = db.collection('teams').doc(teamId).collection('members').doc(removerUid);

  const removerDoc = await removerRef.get();
  if (!removerDoc.exists || removerDoc.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'You must be an admin to remove members.');
  }

  if (removerUid === memberId) {
    const membersQuery = await db.collection('teams').doc(teamId).collection('members')
      .where('role', '==', 'admin').get();
    if (membersQuery.size <= 1) {
      throw new HttpsError('failed-precondition', 'You cannot remove the last admin of the team.');
    }
  }

  const batch = db.batch();
  batch.delete(memberRef);

  const userRef = db.collection('users').doc(memberId);
  batch.update(userRef, { teamId: admin.firestore.FieldValue.delete() });

  await batch.commit();

  return { success: true, message: 'Member removed.' };
});

// --- FIRESTORE TRIGGERS FOR AUDIT TRAIL ---

/*
export const auditDocumentCreated = onDocumentCreated("documents/{docId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;
  const data = snapshot.data();
  const docId = event.params.docId;
  const createdBy = data.ownerEmail || "unknown";

  await logAuditTrail(docId, "Document Created", createdBy, {
    name: data.name,
    status: data.status,
  });
});

export const auditDocumentUpdated = onDocumentUpdated("documents/{docId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;
  const beforeData = snapshot.before.data();
  const afterData = snapshot.after.data();
  const docId = event.params.docId;

  // Track status changes
  if (beforeData.status !== afterData.status) {
    await logAuditTrail(docId, `Status Updated: ${afterData.status}`, "system/user", {
      from: beforeData.status,
      to: afterData.status,
    });
  }

  // Track signing
  if (!beforeData.signedAt && afterData.signedAt) {
    await logAuditTrail(docId, "Document Signed", afterData.ownerEmail || "unknown", {
      signedAt: afterData.signedAt,
    });
  }
});

export const auditDocumentDeleted = onDocumentDeleted("documents/{docId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;
  const data = snapshot.data();
  const docId = event.params.docId;

  await logAuditTrail(docId, "Document Deleted", "system/user", {
    name: data.name,
  });
});
*/
// Function to fetch document details for signing (PostgreSQL)
export const getDocumentForSigning = onCall({ secrets: [postgresUrl] }, async (request) => {
  const { documentId, token } = request.data as { documentId: string; token?: string };

  if (!documentId) {
    throw new HttpsError("invalid-argument", "Missing documentId.");
  }

  try {
    const pgDoc = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        recipients: true,
        fields: true,
      }
    });

    if (!pgDoc) {
      throw new HttpsError("not-found", "Document not found.");
    }

    // Security check: if a token is provided, verify it belongs to a recipient
    if (token) {
      const recipient = pgDoc.recipients.find((r: any) => r.token === token);
      if (!recipient) {
        throw new HttpsError("permission-denied", "Invalid access token.");
      }
      
      // Mark as viewed if not already
      if (!recipient.viewedAt) {
        await prisma.recipient.update({
          where: { id: recipient.id },
          data: { viewedAt: new Date(), status: 'VIEWED' }
        });

        await prisma.auditLog.create({
          data: {
            documentId: pgDoc.id,
            action: 'DOCUMENT_VIEWED',
            metadata: { recipientEmail: recipient.email }
          }
        });
      }
    }

    return { success: true, document: pgDoc };
  } catch (error: any) {
    console.error("Get Document Error:", error);
    throw new HttpsError("internal", error.message || "Failed to fetch document.");
  }
});

// Function to submit a signature (PostgreSQL)
export const submitSignature = onCall({ secrets: [postgresUrl] }, async (request) => {
  const { documentId, recipientId, signatureImageUrl, ipAddress, userAgent } = request.data as {
    documentId: string;
    recipientId: string;
    signatureImageUrl: string;
    ipAddress?: string;
    userAgent?: string;
  };

  if (!documentId || !recipientId || !signatureImageUrl) {
    throw new HttpsError("invalid-argument", "Missing required fields.");
  }

  try {
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Create signature record
      await tx.signature.create({
        data: {
          documentId,
          recipientId,
          signatureImageUrl,
          ipAddress,
          userAgent,
        }
      });

      // 2. Update recipient status
      await tx.recipient.update({
        where: { id: recipientId },
        data: { 
          status: 'SIGNED',
          signedAt: new Date()
        }
      });

    // 3. Log Audit Trail
    await logAuditTrail(documentId, 'DOCUMENT_SIGNED', recipientId);

      // 4. Check if all recipients have signed
      const allRecipients = await tx.recipient.findMany({
        where: { documentId }
      });

      const allSigned = allRecipients.every((r: any) => r.status === 'SIGNED');

      if (allSigned) {
        await tx.document.update({
          where: { id: documentId },
          data: { 
            status: 'COMPLETED',
            completedAt: new Date()
          }
        });

        await logAuditTrail(documentId, 'DOCUMENT_COMPLETED', 'system');
      }

      return { success: true, allSigned };
    });

    return result;
  } catch (error: any) {
    console.error("Submit Signature Error:", error);
    throw new HttpsError("internal", error.message || "Failed to submit signature.");
  }
});
