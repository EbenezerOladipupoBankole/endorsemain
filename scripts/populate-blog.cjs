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

const blogPosts = [
  {
    id: "featured-1",
    category: "Product Updates",
    title: "New Feature: Bulk Send for Enterprise Teams",
    excerpt: "Efficiency just got an upgrade. Learn how to send hundreds of documents for signature in minutes with our new Bulk Send feature, designed for HR and Sales teams.",
    content: `# Streamlining Your Workflow with Bulk Send

In today's fast-paced business environment, efficiency is everything. That's why we're excited to announce our newest feature: **Bulk Send**.

Designed specifically for enterprise teams, HR departments, and sales organizations, Bulk Send allows you to distribute hundreds of documents for signature simultaneously with just a few clicks.

## Why Bulk Send?

Manually sending the same document to multiple recipients is time-consuming and prone to error. Whether you're onboarding a large group of new hires, updating company-wide policies, or launching a massive sales campaign, Bulk Send eliminates the repetitive manual work.

### Key Benefits:

*   **Save Time:** Reduce hours of manual data entry to minutes.
*   **Consistency:** Ensure every recipient receives the exact same version of the document.
*   **Real-time Tracking:** Monitor the signature status of all recipients from a single dashboard.
*   **Personalization:** Use merge fields to automatically personalize documents for each recipient.

## How It Works

1.  **Upload Your Template:** Start with a standard document template.
2.  **Import Your Recipient List:** Upload a CSV file containing recipient details (name, email, etc.).
3.  **Map Your Fields:** Align your CSV columns with the signature and text fields in your document.
4.  **Review and Send:** Preview a sample document and hit send to all recipients at once.

## Getting Started

Bulk Send is now available for all Enterprise plan customers. Check out our help center for a detailed guide on how to format your CSV files and launch your first bulk campaign.

*Efficiency just got an upgrade. Welcome to the future of document management.*`,
    date: "Oct 24, 2024",
    readTime: "4 min read",
    author: "Product Team",
    image: "bg-blue-500/5",
    createdAt: admin.firestore.Timestamp.fromDate(new Date("2024-10-24"))
  },
  {
    id: "static-1",
    category: "Compliance",
    title: "Understanding eIDAS and ESIGN: A Global Compliance Guide",
    excerpt: "Navigating the complex world of digital signature legality. We break down what you need to know about regulations in the US, EU, and beyond.",
    content: `# Digital Signature Legality: A Global Perspective

As businesses expand globally, understanding the legal landscape of digital signatures becomes crucial. Two of the most significant regulations are the **ESIGN Act** in the United States and **eIDAS** in the European Union.

## The ESIGN Act (USA)

Passed in 2000, the Electronic Signatures in Global and National Commerce Act (ESIGN) ensures that electronic signatures and records have the same legal standing as their paper-and-ink counterparts.

### Core Principles of ESIGN:
1.  **Intent to Sign:** The signer must demonstrate a clear intent to sign.
2.  **Consent to Do Business Electronically:** Parties must agree to use electronic records.
3.  **Association of Signature with Record:** The system must capture the process by which the signature was created.
4.  **Record Retention:** The electronic record must be accurately retained and accessible.

## eIDAS Regulation (EU)

The Electronic Identification, Authentication and Trust Services (eIDAS) regulation provides a predictable regulatory environment for electronic transactions across the EU.

### Types of Signatures under eIDAS:
*   **Simple Electronic Signature (SES):** Data in electronic form which is attached to or logically associated with other data in electronic form.
*   **Advanced Electronic Signature (AES):** Uniquely linked to the signer and capable of identifying them.
*   **Qualified Electronic Signature (QES):** An advanced signature created by a qualified signature creation device, based on a qualified certificate for electronic signatures.

## Why Compliance Matters

Using a compliant platform like Endorse ensures that your agreements are legally binding and enforceable in a court of law. We utilize audit trails and cryptographic hashing to prove the integrity and authenticity of every document signed on our platform.

*Consult with your legal counsel to understand specific requirements for your industry and jurisdiction.*`,
    date: "Oct 18, 2024",
    readTime: "7 min read",
    author: "Legal Team",
    image: "bg-purple-500/5",
    createdAt: admin.firestore.Timestamp.fromDate(new Date("2024-10-18"))
  },
  {
    id: "static-2",
    category: "Security",
    title: "How We Protect Your Data: SOC 2 & Encryption",
    excerpt: "Security is our top priority. A deep dive into our 256-bit encryption, audit trails, and why enterprise-grade security is non-negotiable.",
    content: `# Security First: Protecting Your Most Sensitive Documents

At Endorse, we understand that your documents contain sensitive information. Whether it's a multi-million dollar contract or a private HR record, security is built into every layer of our platform.

## 256-Bit AES Encryption

Every document uploaded to Endorse is encrypted at rest using Advanced Encryption Standard (AES) with 256-bit keys. This is the same level of encryption used by financial institutions and government agencies.

## SOC 2 Type II Compliance

We are proud to be SOC 2 Type II compliant. This means an independent auditor has verified that our security controls meet the highest industry standards for:
*   **Security:** Protection against unauthorized access.
*   **Availability:** Ensuring the system is available for use.
*   **Confidentiality:** Protecting information designated as confidential.

## Detailed Audit Trails

Every action taken on a document is recorded in a tamper-evident audit trail. This includes:
*   Document creation and uploads
*   Email notifications sent
*   Document viewing timestamps
*   IP addresses and browser information
*   Signature completion

This provides a clear chain of custody, ensuring that you always know exactly who touched your document and when.

## Multi-Factor Authentication (MFA)

We offer robust MFA options to ensure that only authorized users can access your account and sign sensitive documents.

*Security isn't just a feature; it's our promise to you.*`,
    date: "Oct 12, 2024",
    readTime: "5 min read",
    author: "Security Team",
    image: "bg-green-500/5",
    createdAt: admin.firestore.Timestamp.fromDate(new Date("2024-10-12"))
  },
  {
    id: "static-3",
    category: "Productivity",
    title: "5 Strategies to Close Deals Faster",
    excerpt: "Reduce friction in your sales cycle. Actionable tips for preparing contracts that get signed immediately, not next week.",
    content: `# Speed Up Your Sales Cycle: 5 Proven Strategies

The time between "yes" and a signed contract is the most vulnerable period in any sales cycle. Friction during this stage can lead to buyer's remorse or lost momentum. Here are five strategies to get your deals signed faster.

## 1. Use Templates for Speed

Don't start from scratch every time. Create standardized templates for your most common agreements. This reduces the time needed for internal review and ensures consistency.

## 2. Pre-Fill Recipient Information

Use the "Pre-fill" feature in Endorse to add known information (like company name or address) before sending the document. The less work your customer has to do, the faster they will sign.

## 3. Enable Automated Reminders

People are busy. Sometimes a contract sits in an inbox because it was simply forgotten. Enable automated reminders to gently nudge your signers every few days until the document is completed.

## 4. Mobile-First Signing Experience

Many decision-makers review and sign documents on the go. Ensure your signing platform provides a seamless experience on mobile devices. Endorse is optimized for mobile, allowing signatures with a simple tap and swipe.

## 5. Clear Call to Action

Ensure your email communication is clear. State exactly what needs to be signed and by when. A clear subject line and a concise message go a long way in prioritizing your document in a crowded inbox.

*Closing deals shouldn't be a hurdle. Streamline your process and watch your revenue grow.*`,
    date: "Oct 05, 2024",
    readTime: "3 min read",
    author: "Success Team",
    image: "bg-orange-500/5",
    createdAt: admin.firestore.Timestamp.fromDate(new Date("2024-10-05"))
  },
  {
    id: "static-4",
    category: "Engineering",
    title: "Building Scalable Real-Time Collaboration",
    excerpt: "A technical look at the WebSocket architecture behind Endorse's lightning-fast signature processing and live status updates.",
    content: `# Behind the Scenes: The Architecture of Real-Time Signing

Building a platform that handles thousands of concurrent signature events requires a robust and scalable architecture. Today, we're sharing a glimpse into the tech stack that powers Endorse.

## WebSocket Architecture

To provide live status updates—such as "Signer is viewing the document"—we leverage WebSockets. This allows for full-duplex communication between our servers and the client, eliminating the need for inefficient polling.

### Managing State at Scale

With thousands of active connections, state management becomes a challenge. We use a distributed Redis layer to track active sessions and broadcast events across our fleet of microservices.

## Microservices and Serverless

Our architecture is a hybrid of dedicated microservices for core logic and serverless functions for event-driven tasks (like generating PDF audit trails). This allows us to scale horizontally during peak usage periods without sacrificing performance.

## Cryptographic Integrity

When a signature is applied, we generate a cryptographic hash of the document. Any subsequent modification to the document will invalidate the hash, ensuring the integrity of the signed agreement. This process is handled by a dedicated security service that manages our HSM (Hardware Security Modules).

## Lessons Learned

Building for scale taught us that monitoring is key. We use distributed tracing to identify bottlenecks in the signature pipeline, ensuring that the "Sign" button remains responsive even under heavy load.

*Engineering at Endorse: Where security meets performance.*`,
    date: "Sep 28, 2024",
    readTime: "9 min read",
    author: "Engineering",
    image: "bg-red-500/5",
    createdAt: admin.firestore.Timestamp.fromDate(new Date("2024-09-28"))
  },
  {
    id: "static-5",
    category: "Case Study",
    title: "How a Fortune 500 Firm Digitized HR Onboarding",
    excerpt: "See how moving to digital signatures saved 1,000+ hours of administrative work annually for a global logistics company.",
    content: `# Case Study: Modernizing HR Onboarding at Scale

**The Challenge:**
A global logistics company with over 50,000 employees was struggling with a paper-based onboarding process. New hires were required to sign dozens of physical documents, which were then scanned, mailed, and manually filed. This led to delays, lost paperwork, and a poor candidate experience.

**The Solution:**
The firm implemented Endorse to digitize their entire HR workflow. They integrated our API with their existing Applicant Tracking System (ATS) to automate document generation.

**The Results:**
*   **1,000+ Hours Saved:** Annual administrative work related to onboarding was reduced by over 1,000 hours.
*   **Faster Time-to-Hire:** The average time to complete onboarding documents dropped from 5 days to 4 hours.
*   **Improved Compliance:** 100% of documents now include a verifiable audit trail, simplifying internal audits.
*   **Enhanced Experience:** New hires reported a much more professional and modern first impression of the company.

**Conclusion:**
By embracing digital signatures, this Fortune 500 firm transformed a bottleneck into a competitive advantage.

*Ready to transform your workflow? Contact our sales team for a custom demo.*`,
    date: "Sep 20, 2024",
    readTime: "7 min read",
    author: "Endorse Team",
    image: "bg-indigo-500/5",
    createdAt: admin.firestore.Timestamp.fromDate(new Date("2024-09-20"))
  }
];

async function populateBlogs() {
    try {
        console.log('Starting blog population...');
        
        for (const post of blogPosts) {
            console.log(`Adding post: ${post.title}`);
            await db.collection('blogs').doc(post.id).set(post);
        }
        
        console.log('Successfully populated all blog posts!');
    } catch (e) {
        console.error('Error populating blogs:', e.message);
    } finally {
        setTimeout(() => process.exit(0), 1000);
    }
}

populateBlogs();
