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
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailEmail.value(),
        pass: gmailPassword.value(),
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,   // 10 seconds
    });
  }
  return transporter;
}

const APP_URL = "https://e-ndorse.online"; // Updated to new custom domain

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
export const inviteToSign = onCall({ secrets: [gmailEmail, gmailPassword] }, async (request) => {
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
  const isAdmin = request.auth.token.email === "bankoleebenezer111@gmail.com";

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
      from: '"Endorse App" <ebenezerbankole7@gmail.com>',
      to: recipientEmail,
      subject: "You have been invited to sign a document",
      text: `You have been invited to sign "${originalData?.name}".\n\nPlease click the link below to access your dashboard and sign the document:\n${documentLink}\n\nBest,\nEndorse Team`,
      html: `<div style="margin-bottom: 20px;"><img src="https://e-ndorse.online/favicon.svg" alt="Endorse Logo" width="100" style="width: 100px; height: auto;" /></div><p>You have been invited to sign <strong>${originalData?.name}</strong>.</p><p>Please click the link below to access your dashboard and sign the document:</p><p><a href="${documentLink}">Go to Document</a></p><p>Best,<br>Endorse Team</p>`,
    };

    await transporter.sendMail(mailOptions);
    console.log("Invitation email sent successfully.");

    return { success: true, newDocumentId: newDocRef.id };

  } catch (error: any) {
    console.error("Invite Error Exception:", error);
    // Ensure we return the specific error message
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    throw new HttpsError("internal", errorMessage);
  }
});

// Function to handle bulk invites from Dashboard
export const sendSignerInvites = onCall({ secrets: [gmailEmail, gmailPassword] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }

  const data = request.data as SendSignerInvitesPayload;
  const { signers, documentName, uploaderName, documentId } = data;

  if (!signers || !Array.isArray(signers) || signers.length === 0) {
    throw new HttpsError("invalid-argument", "No signers provided.");
  }

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  const customLink = (data as any).signingLink;
  const documentLink = customLink || (documentId ? `${APP_URL}/sign/${documentId}` : APP_URL);
  console.log(`Sending invite email with link: ${documentLink}`);

  console.log(`Starting bulk invite for document: ${documentName}, ID: ${documentId}`);
  const results = [];

  for (const signer of signers) {
    try {
      console.log(`Sending invite email to: ${signer.email}`);
      await getTransporter().sendMail({
        from: '"Endorse App" <ebenezerbankole7@gmail.com>',
        to: signer.email,
        subject: `${uploaderName} invited you to sign ${documentName}`,
        text: `Hello,\n\n${uploaderName} has invited you to sign the document "${documentName}".\n\nPlease click the link below to access your dashboard and sign the document:\n${documentLink}\n\nBest,\nEndorse Team`,
        html: `<div style="margin-bottom: 20px;"><img src="https://e-ndorse.online/favicon.svg" alt="Endorse Logo" width="100" style="width: 100px; height: auto;" /></div><p>Hello,</p><p><strong>${uploaderName}</strong> has invited you to sign the document "<strong>${documentName}</strong>".</p><p>Please click the link below to access your dashboard and sign the document:</p><p><a href="${documentLink}">Go to Document</a></p><p>Best,<br>Endorse Team</p>`,
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
