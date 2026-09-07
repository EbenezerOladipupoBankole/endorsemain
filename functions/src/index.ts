import { onCall, HttpsError, onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";
import * as crypto from "crypto";
import { defineSecret } from "firebase-functions/params";
import axios from "axios";
import { Stripe } from "stripe";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const mammoth = require("mammoth");
const { Document, Packer, Paragraph, TextRun } = require("docx");
const { PDFParse } = require("pdf-parse");

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

// --- WHATSAPP BUSINESS API CONFIGURATION ---
const whatsappAccessToken = defineSecret("WHATSAPP_ACCESS_TOKEN");
const whatsappPhoneNumberId = defineSecret("WHATSAPP_PHONE_NUMBER_ID");

// Escapes user-controlled strings before they're interpolated into HTML email
// bodies, since filenames/display names are attacker-controlled input.
function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;",
  }[c] as string));
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    // Try to get from Secret Manager, fallback to process.env for local emulator
    let user = "";
    let pass = "";
    
    try {
      user = gmailEmail.value();
      pass = gmailPassword.value();
    } catch (e) {
      user = process.env.GMAIL_EMAIL || "";
      pass = process.env.GMAIL_PASSWORD || "";
    }

    if (!user || !pass) {
      console.warn("Warning: GMAIL_EMAIL or GMAIL_PASSWORD is not set. Email features will fail.");
    }

    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });
  }
  return transporter;
}

const APP_URL = "https://e-ndorse.online"; // Updated to new custom domain

const ADMIN_EMAILS = ["bankoleebenezer111@gmail.com", "omakaoe@gmail.com", "ayindeenny112@gmail.com"];

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

interface AcceptInvitePayload {
  token: string;
}

// Function to invite a user to sign
export const inviteToSign = onCall({ secrets: [gmailEmail, gmailPassword], cors: true }, async (request) => {
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
    // 1. Get Original Document
    console.log("Fetching original document:", documentId);
    const docRef = db.collection("documents").doc(documentId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      console.error("Document not found:", documentId);
      throw new HttpsError("not-found", "Document not found.");
    }

    const originalData = docSnap.data();
    console.log("Original document data:", originalData);

    if (!isAdmin && originalData?.ownerEmail !== request.auth.token.email) {
      throw new HttpsError("permission-denied", "You do not have permission to invite signers for this document.");
    }

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
    console.log("Creating new document clone...");
    const newDocRef = await db.collection("documents").add(newDocumentData);
    console.log("New document created with ID:", newDocRef.id);

    // Increment document count for user
    console.log("Incrementing document count for user:", request.auth.uid);
    await userRef.set({ documentsSigned: admin.firestore.FieldValue.increment(1) }, { merge: true });

    const documentLink = `${APP_URL}/sign/${newDocRef.id}`;

    // 4. Send Invitation Email
    console.log("Sending invitation email to:", recipientEmail);
    const transporter = getTransporter();

    // Set a timeout for the mail sending to avoid hanging forever
    const mailOptions = {
      from: `"Endorse App" <${gmailEmail.value()}>`,
      to: recipientEmail,
      subject: "You have been invited to sign a document",
      text: `You have been invited to sign "${originalData?.name}".\n\nPlease click the link below to access your dashboard and sign the document:\n${documentLink}\n\nBest,\nEndorse Team`,
      html: `<div style="margin-bottom: 20px;"><img src="https://e-ndorse.online/favicon.svg" alt="Endorse Logo" width="100" style="width: 100px; height: auto;" /></div><p>You have been invited to sign <strong>${escapeHtml(originalData?.name)}</strong>.</p><p>Please click the link below to access your dashboard and sign the document:</p><p><a href="${documentLink}">Go to Document</a></p><p>Best,<br>Endorse Team</p>`,
    };

    await transporter.sendMail(mailOptions);
    console.log("Invitation email sent successfully.");

    return { success: true, newDocumentId: newDocRef.id };

  } catch (error: any) {
    console.error("Invite Error Exception:", error);
    // Ensure we return the specific error message
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    throw new HttpsError("unknown", errorMessage);
  }
});

// Function to handle bulk invites from Dashboard
export const sendSignerInvites = onCall({ secrets: [gmailEmail, gmailPassword], cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }

  const data = request.data as SendSignerInvitesPayload;
  const { signers, documentName, uploaderName, documentId } = data;

  if (!signers || !Array.isArray(signers) || signers.length === 0) {
    throw new HttpsError("invalid-argument", "No signers provided.");
  }

  // The signing link is always derived from documentId server-side — never
  // trust a client-supplied URL here, or this endpoint becomes an open
  // phishing relay (arbitrary link sent from the app's trusted mail account).
  const documentLink = documentId ? `${APP_URL}/sign/${documentId}` : APP_URL;
  console.log(`Sending invite email with link: ${documentLink}`);

  console.log(`Starting bulk invite for document: ${documentName}, ID: ${documentId}`);
  const results = [];

  for (const signer of signers) {
    try {
      console.log(`Sending invite email to: ${signer.email}`);
      await getTransporter().sendMail({
        from: `"Endorse App" <${gmailEmail.value()}>`,
        to: signer.email,
        subject: `${uploaderName} invited you to sign ${documentName}`,
        text: `Hello,\n\n${uploaderName} has invited you to sign the document "${documentName}".\n\nPlease click the link below to access your dashboard and sign the document:\n${documentLink}\n\nBest,\nEndorse Team`,
        html: `<div style="margin-bottom: 20px;"><img src="https://e-ndorse.online/favicon.svg" alt="Endorse Logo" width="100" style="width: 100px; height: auto;" /></div><p>Hello,</p><p><strong>${escapeHtml(uploaderName)}</strong> has invited you to sign the document "<strong>${escapeHtml(documentName)}</strong>".</p><p>Please click the link below to access your dashboard and sign the document:</p><p><a href="${documentLink}">Go to Document</a></p><p>Best,<br>Endorse Team</p>`,
      });
      console.log(`Invite sent successfully to: ${signer.email}`);
      results.push({ email: signer.email, status: 'sent' });
    } catch (error: any) {
      console.error(`Failed to send email to ${signer.email}:`, error);
      results.push({ email: signer.email, status: 'failed', error: error.message });
    }
  }

  return { success: true, results };
});

export const acceptTeamInvite = onCall({ cors: true }, async (request) => {
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
export const sendDocument = onCall({ secrets: [gmailEmail, gmailPassword], cors: true }, async (request) => {
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
  cors: true
}, async (request) => {
  const { files, targetFormat, toolId, password } = request.data as {
    files: { base64: string, name: string, type: string }[];
    targetFormat: string;
    toolId: string;
    password?: string;
  };

  if (!files || files.length === 0) {
    throw new HttpsError("invalid-argument", "Missing files.");
  }

  console.log(`Starting conversion tool: ${toolId}, Target: ${targetFormat}, Files: ${files.length}`);

  try {
    const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");

    // --- MODE: MERGE PDF ---
    if (toolId === "merge-pdf") {
      console.log("Mode: Merge PDF");
      const mergedPdf = await PDFDocument.create();
      for (const fileObj of files) {
        const pdfBytes = Buffer.from(fileObj.base64, "base64");
        const pdf = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      const pdfBase64 = await mergedPdf.saveAsBase64();
      return { pdfBase64 };
    }

    // --- MODE: LOCK PDF (PASSWORD) ---
    if (toolId === "lock-pdf") {
      console.log("Mode: Protect PDF with password:", password ? "Yes" : "No");
      throw new HttpsError("unimplemented", "Password protection is coming soon in the Pro version.");
    }

    const firstFile = files[0];
    const buffer = Buffer.from(firstFile.base64, "base64");
    const filename = firstFile.name;
    const mimeType = firstFile.type;

    // --- MODE 1: IMAGE TO PDF ---
    if (mimeType.startsWith("image/") || (filename.match(/\.(jpg|jpeg|png)$/i) && targetFormat === "pdf")) {
      console.log("Mode: Image to PDF");
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
      const mammothLib = (mammoth as any).default || mammoth;
      const result = await mammothLib.extractRawText({ buffer });
      const text = result.value;

      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const lines = text.split("\n");
      let page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      const fontSize = 11;
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
          try {
            const textWidth = font.widthOfTextAtSize(testLine, fontSize);
            if (textWidth > width - (margin * 2)) {
              if (currentLine) {
                page.drawText(currentLine.trim(), { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
                y -= fontSize * 1.4;
              }
              currentLine = word + " ";
              if (y < margin + fontSize) {
                page = pdfDoc.addPage();
                y = height - margin;
              }
            } else {
              currentLine = testLine;
            }
          } catch (e) {
            currentLine += "? ";
          }
        }
        if (currentLine.trim()) {
          page.drawText(currentLine.trim(), { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
          y -= fontSize * 1.4;
        }
      }

      const pdfBase64 = await pdfDoc.saveAsBase64();
      return { pdfBase64 };
    }

    // --- MODE 3: PDF TO WORD ---
    if (targetFormat === "docx" && (mimeType === "application/pdf" || filename.toLowerCase().endsWith(".pdf"))) {
      console.log("Mode: PDF to Word");
      let data;
      try {
        const parser = new PDFParse({ data: buffer });
        data = await parser.getText();
      } catch (e: any) {
        console.error("PDF Parse Error:", e);
        throw new Error("Could not read the PDF file. It might be password-protected or corrupted.");
      }

      const text = data.text || "";
      console.log(`Extracted text length: ${text.length} chars`);

      if (text.trim().length < 5) {
        throw new Error("This PDF seems to be an image or scanned document. We couldn't extract enough editable text to create a Word document.");
      }

      // Clean text to remove control characters that might break XML in docx
      const cleanedText = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

      const doc = new Document({
        sections: [{
          properties: {},
          children: cleanedText.split("\n")
            .map((l: string) => l.trim())
            .filter((l: string) => l.length > 0)
            .map((line: string) => {
              return new Paragraph({
                children: [new TextRun({ text: line, size: 24 })],
                spacing: { after: 200 }
              });
            }),
        }],
      });

      console.log("Packing docx document...");
      try {
        const docBuffer = await Packer.toBuffer(doc);
        console.log(`Docx packed, size: ${docBuffer.length} bytes`);
        return { fileBase64: docBuffer.toString("base64") };
      } catch (e: any) {
        console.error("Docx Packer Error:", e);
        throw new Error("Failed to generate the Word file. The document content might be too complex.");
      }
    }

    // --- MODE 4: PDF TO IMAGE ---
    if (targetFormat === "jpg" && (mimeType === "application/pdf" || filename.toLowerCase().endsWith(".pdf"))) {
       // PDF to Image is still complex in Cloud Functions without native dependencies.
       throw new HttpsError("unimplemented", "PDF to Image requires a higher-tier processing engine. This feature is coming soon.");
    }

    throw new HttpsError("unimplemented", `Conversion tool ${toolId} is not fully implemented.`);

  } catch (error: any) {
    console.error("Conversion Error Exception:", error);
    throw new HttpsError("internal", error.message || "Failed to convert document.");
  }
});

// --- PAYMENT INTEGRATIONS ---

// 1. Paystack Integration
export const initializePaystackPayment = onCall({ secrets: [paystackSecretKeyTest, paystackSecretKeyLive], cors: true }, async (request) => {
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
export const initializeStripeSession = onCall({ secrets: [stripeSecretKey], cors: true }, async (request) => {
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

    const signatureHeader = req.headers["x-paystack-signature"];
    const hashBuf = Buffer.from(hash, "utf8");
    const sigBuf = Buffer.from(typeof signatureHeader === "string" ? signatureHeader : "", "utf8");
    const signatureValid = hashBuf.length === sigBuf.length && crypto.timingSafeEqual(hashBuf, sigBuf);

    if (!signatureValid) {
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
export const manageStripeSubscription = onCall({ secrets: [stripeSecretKey], cors: true }, async (request) => {
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

export const managePaystackSubscription = onCall({ cors: true }, async (request) => {
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

export const removeTeamMember = onCall({ cors: true }, async (request) => {
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

// --- POSTGRES / PRISMA FUNCTIONS ---

export const getUserStats = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }

  const email = request.auth.token.email;
  if (!email) {
    throw new HttpsError("invalid-argument", "User email not found.");
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        _count: {
          select: { ownedDocuments: true }
        }
      }
    });

    if (!user) {
      return { total: 0, signed: 0, pending: 0 };
    }

    const total = user._count.ownedDocuments;
    const signedCount = await prisma.document.count({
      where: { ownerId: user.id, status: "completed" }
    });
    const pendingCount = await prisma.document.count({
      where: { ownerId: user.id, status: "pending" }
    });

    return {
      total,
      signed: signedCount,
      pending: pendingCount
    };
  } catch (error: any) {
    console.error("Prisma Stats Error:", error);
    throw new HttpsError("internal", error.message || "Failed to fetch stats from Postgres.");
  }
});

export const getUserDocuments = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }

  const email = request.auth.token.email;
  if (!email) {
    throw new HttpsError("invalid-argument", "User email not found.");
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return { documents: [] };
    }

    const documents = await prisma.document.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return { documents };
  } catch (error: any) {
    console.error("Prisma Documents Error:", error);
    throw new HttpsError("internal", error.message || "Failed to fetch documents from Postgres.");
  }
});

export const deleteDocument = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }

  const { documentId } = request.data as { documentId: string };
  if (!documentId) {
    throw new HttpsError("invalid-argument", "Missing documentId.");
  }

  const email = request.auth.token.email;
  if (!email) {
    throw new HttpsError("invalid-argument", "User email not found.");
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new HttpsError("not-found", "User not found in database.");
    }

    // Verify ownership
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      // If not found in Postgres, maybe it's in Firestore? 
      // But the frontend only lists Postgres docs now.
      throw new HttpsError("not-found", "Document not found.");
    }

    if (document.ownerId !== user.id) {
      throw new HttpsError("permission-denied", "You do not have permission to delete this document.");
    }

    // Delete the document (Cascade will handle Recipients, Signatures, etc. as defined in schema)
    await prisma.document.delete({
      where: { id: documentId }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Delete Document Error:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message || "Failed to delete document from Postgres.");
  }
});

// --- TEAM MANAGEMENT (FIRESTORE) ---

export const createTeam = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }
  const { teamName } = request.data as { teamName: string };
  if (!teamName) {
    throw new HttpsError("invalid-argument", "Missing team name.");
  }

  const db = admin.firestore();
  const uid = request.auth.uid;
  const email = request.auth.token.email;

  const userRef = db.collection('users').doc(uid);
  const userDoc = await userRef.get();
  
  if (userDoc.exists && userDoc.data()?.teamId) {
    throw new HttpsError("already-exists", "You are already part of a team.");
  }

  const batch = db.batch();

  // Create team document
  const teamRef = db.collection('teams').doc();
  const teamId = teamRef.id;

  batch.set(teamRef, {
    name: teamName,
    ownerId: uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // Add owner to team members
  const memberRef = teamRef.collection('members').doc(uid);
  batch.set(memberRef, {
    email,
    role: 'admin',
    status: 'active',
    addedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // Update user profile with teamId
  batch.set(userRef, { teamId }, { merge: true });

  await batch.commit();

  return { success: true, teamId };
});

export const inviteTeamMember = onCall({ 
  secrets: [gmailEmail, gmailPassword],
  cors: true
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }

  const { inviteEmail, role = 'member' } = request.data as { inviteEmail: string; role: string };
  if (!inviteEmail) {
    throw new HttpsError("invalid-argument", "Missing invite email.");
  }

  const db = admin.firestore();
  
  // Get current user's teamId
  const userProfileSnap = await db.collection('users').doc(request.auth.uid).get();
  const teamId = userProfileSnap.data()?.teamId;

  if (!teamId) {
    throw new HttpsError("failed-precondition", "You are not part of a team. Please create one first.");
  }

  try {
    const token = crypto.randomBytes(32).toString('hex');
    
    await db.collection('invites').add({
      teamId,
      toEmail: inviteEmail,
      role,
      token,
      status: 'pending',
      invitedBy: request.auth.token.email || request.auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const inviteLink = `${APP_URL}/auth?mode=signup&inviteToken=${token}`;
    
    const transporter = getTransporter();
    let fromAddress = "noreply@e-ndorse.online";
    try {
      fromAddress = process.env.GMAIL_EMAIL || gmailEmail.value();
    } catch (e) {
      console.warn("Using fallback from address");
    }

    await transporter.sendMail({
      from: `"Endorse Team" <${fromAddress}>`,
      to: inviteEmail,
      subject: "You've been invited to join a team on Endorse",
      html: `<p>You have been invited to join a team on Endorse.</p><p>Click the link below to accept the invitation:</p><a href="${inviteLink}">Join Team</a>`
    });

    return { success: true };
  } catch (error: any) {
    console.error("Invite Team Member Error:", error);
    // Return a structured error to the client
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("unknown", error.message || "Failed to send team invitation.");
  }
});

// =============================================================================
// --- WHATSAPP SIGNING CHANNEL ---
// =============================================================================

/**
 * Helper: send a WhatsApp message via Meta Cloud API.
 * Uses a template for the initial invite, plain text for OTP.
 */
async function sendWhatsAppMessage(
  accessToken: string,
  phoneNumberId: string,
  toPhone: string,
  payload: Record<string, unknown>
): Promise<void> {
  await axios.post(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
    { messaging_product: "whatsapp", to: toPhone, ...payload },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );
}

// ---- 1. sendWhatsAppInvites ----
// Callable from the Dashboard when signer channel = 'whatsapp'
export const sendWhatsAppInvites = onCall(
  { secrets: [whatsappAccessToken, whatsappPhoneNumberId], cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be logged in.");
    }

    const { signers, documentName, uploaderName, pdfBase64 } = request.data as {
      signers: { name: string; phone: string }[];
      documentName: string;
      uploaderName: string;
      pdfBase64: string;
    };

    if (!signers || signers.length === 0) {
      throw new HttpsError("invalid-argument", "No WhatsApp signers provided.");
    }

    const db = admin.firestore();
    let waToken = "";
    let waPhoneId = "";
    try {
      waToken = whatsappAccessToken.value();
      waPhoneId = whatsappPhoneNumberId.value();
    } catch (e) {
      waToken = process.env.WHATSAPP_ACCESS_TOKEN || "";
      waPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
    }

    const results: { phone: string; status: string; docId?: string; error?: string }[] = [];

    for (const signer of signers) {
      try {
        // 1. Persist document to Firestore
        const docRef = await db.collection("documents").add({
          name: documentName,
          pdfBase64,
          status: "pending",
          channel: "whatsapp",
          recipientPhone: signer.phone,
          recipientName: signer.name,
          ownerEmail: request.auth!.token.email || "",
          uploaderName,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          deliveryStatus: "pending",
        });

        const signingLink = `${APP_URL}/sign/${docRef.id}`;

        // 2. Send WhatsApp message
        if (waToken && waPhoneId) {
          try {
            // Attempt approved template first
            await sendWhatsAppMessage(waToken, waPhoneId, signer.phone, {
              type: "template",
              template: {
                name: "document_signing_invite",
                language: { code: "en_US" },
                components: [
                  {
                    type: "body",
                    parameters: [
                      { type: "text", text: signer.name },
                      { type: "text", text: uploaderName },
                      { type: "text", text: documentName },
                      { type: "text", text: signingLink },
                    ],
                  },
                ],
              },
            });
          } catch (templateErr: any) {
            // Template not approved yet — fall back to plain text
            console.warn("Template send failed, falling back to text:", templateErr?.response?.data || templateErr.message);
            await sendWhatsAppMessage(waToken, waPhoneId, signer.phone, {
              type: "text",
              text: {
                body: `Hi ${signer.name},\n\n${uploaderName} has invited you to sign *${documentName}* on Endorse.\n\nClick the link below to view and sign:\n${signingLink}\n\nThis link is unique to you. Do not share it.`,
              },
            });
          }
          // 3. Mark as sent
          await docRef.update({ deliveryStatus: "sent" });
        } else {
          console.warn("WhatsApp credentials not configured — skipping message send.");
        }

        results.push({ phone: signer.phone, status: "sent", docId: docRef.id });
      } catch (err: any) {
        console.error(`WhatsApp invite failed for ${signer.phone}:`, err?.response?.data || err.message);
        results.push({ phone: signer.phone, status: "failed", error: err.message });
      }
    }

    return { success: true, results };
  }
);

// ---- 2. sendWhatsAppOTP ----
// Callable from the signing verification page when recipient opens /sign/:id
export const sendWhatsAppOTP = onCall(
  { secrets: [whatsappAccessToken, whatsappPhoneNumberId], cors: true },
  async (request) => {
    const { documentId, phone } = request.data as { documentId: string; phone: string };

    if (!documentId || !phone) {
      throw new HttpsError("invalid-argument", "Missing documentId or phone.");
    }

    const db = admin.firestore();

    // Validate document exists and phone matches
    const docSnap = await db.collection("documents").doc(documentId).get();
    if (!docSnap.exists) {
      throw new HttpsError("not-found", "Document not found.");
    }
    const docData = docSnap.data()!;
    if (docData.channel !== "whatsapp") {
      throw new HttpsError("failed-precondition", "This document is not a WhatsApp-channel document.");
    }
    const normalise = (p: string) => p.replace(/[\s\-().+]/g, "");
    if (normalise(docData.recipientPhone) !== normalise(phone)) {
      throw new HttpsError("permission-denied", "Phone number does not match the invited recipient.");
    }

    // Rate-limit: no resend within 60 seconds
    const otpRef = db.collection("whatsapp_otps").doc(documentId);
    const existingOtp = await otpRef.get();
    if (existingOtp.exists) {
      const data = existingOtp.data()!;
      const createdAt: admin.firestore.Timestamp = data.createdAt;
      const secondsSince = (Date.now() - createdAt.toMillis()) / 1000;
      if (secondsSince < 60) {
        throw new HttpsError("resource-exhausted", "Please wait before requesting a new OTP.");
      }
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + 5 * 60 * 1000);

    await otpRef.set({
      otp,
      expiresAt,
      attempts: 0,
      phone,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    let waToken = "";
    let waPhoneId = "";
    try {
      waToken = whatsappAccessToken.value();
      waPhoneId = whatsappPhoneNumberId.value();
    } catch (e) {
      waToken = process.env.WHATSAPP_ACCESS_TOKEN || "";
      waPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
    }

    if (waToken && waPhoneId) {
      await sendWhatsAppMessage(waToken, waPhoneId, phone, {
        type: "text",
        text: {
          body: `Your Endorse verification code is: *${otp}*\n\nThis code expires in 5 minutes. Do not share it with anyone.`,
        },
      });
    } else {
      // Dev/emulator mode: log OTP so developer can test without real credentials
      console.log(`[DEV MODE] WhatsApp OTP for ${phone}: ${otp}`);
    }

    return { success: true };
  }
);

// ---- 3. verifyWhatsAppOTP ----
// Callable from the OTP verification page; returns a custom Firebase auth token on success
export const verifyWhatsAppOTP = onCall({ cors: true }, async (request) => {
  const { documentId, otp } = request.data as { documentId: string; otp: string };

  if (!documentId || !otp) {
    throw new HttpsError("invalid-argument", "Missing documentId or otp.");
  }

  const db = admin.firestore();
  const otpRef = db.collection("whatsapp_otps").doc(documentId);
  const otpSnap = await otpRef.get();

  if (!otpSnap.exists) {
    throw new HttpsError("not-found", "No OTP found. Please request a new one.");
  }

  const otpData = otpSnap.data()!;
  const { otp: storedOtp, expiresAt, attempts } = otpData;

  // Check attempt limit (max 5)
  if (attempts >= 5) {
    throw new HttpsError("resource-exhausted", "Too many failed attempts. Please request a new OTP.");
  }

  // Check expiry
  const expiry = (expiresAt as admin.firestore.Timestamp).toMillis();
  if (Date.now() > expiry) {
    await otpRef.delete();
    throw new HttpsError("deadline-exceeded", "OTP has expired. Please request a new one.");
  }

  // Verify OTP
  if (otp.trim() !== storedOtp) {
    await otpRef.update({ attempts: admin.firestore.FieldValue.increment(1) });
    const remaining = 4 - attempts;
    throw new HttpsError(
      "unauthenticated",
      remaining > 0
        ? `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
        : "Too many failed attempts. Please request a new OTP."
    );
  }

  // Valid OTP — clean up and mint custom auth token for the recipient
  await otpRef.delete();

  // Update document status to 'viewed'
  await db.collection("documents").doc(documentId).update({
    deliveryStatus: "viewed",
    viewedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Custom token UID is scoped per-document to avoid collisions with real users
  const customToken = await admin.auth().createCustomToken(`whatsapp-signer-${documentId}`, {
    documentId,
    signerType: "whatsapp",
  });

  return { success: true, customToken };
});

// ---- 4. whatsappWebhook ----
// Public HTTP endpoint — handles Meta webhook verification + delivery status updates
export const whatsappWebhook = onRequest(
  { secrets: [whatsappAccessToken], cors: false },
  async (req, res) => {
    const VERIFY_TOKEN = "endorse_whatsapp_verify"; // Must match the token set in Meta dashboard

    // --- GET: Hub challenge verification (one-time setup) ---
    if (req.method === "GET") {
      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];

      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("WhatsApp webhook verified successfully.");
        res.status(200).send(challenge);
      } else {
        console.warn("WhatsApp webhook verification failed.");
        res.status(403).send("Forbidden");
      }
      return;
    }

    // --- POST: Incoming webhook events ---
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    try {
      const body = req.body;
      const entry = body?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      // Handle message status updates (sent → delivered → read)
      if (value?.statuses) {
        const db = admin.firestore();
        for (const status of value.statuses) {
          const { status: deliveryStatus, recipient_id: recipientPhone } = status;
          console.log(`WhatsApp status update — ${recipientPhone}: ${deliveryStatus}`);

          // Find matching document(s) by recipientPhone
          const docs = await db
            .collection("documents")
            .where("channel", "==", "whatsapp")
            .where("recipientPhone", "==", recipientPhone)
            .where("deliveryStatus", "in", ["pending", "sent", "delivered"])
            .limit(5)
            .get();

          const batch = db.batch();
          docs.forEach((d) => {
            batch.update(d.ref, {
              deliveryStatus,
              [`${deliveryStatus}At`]: admin.firestore.FieldValue.serverTimestamp(),
            });
          });
          await batch.commit();
        }
      }

      res.status(200).json({ received: true });
    } catch (err: any) {
      console.error("WhatsApp webhook processing error:", err);
      res.status(200).json({ received: true }); // Always 200 to Meta to prevent retries
    }
  }
);
