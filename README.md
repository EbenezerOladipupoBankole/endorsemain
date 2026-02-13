# Endorse App

A document signing and endorsement application built with React, Vite, Firebase, and Tailwind CSS.

## Features

- **Document Management**: Upload and manage documents for signing.
- **Digital Signatures**: Sign documents directly within the application using signature pads.
- **Email Invitations**: Invite users to sign documents via email notifications.
- **PDF Handling**: View, sign, and generate PDFs.
- **Secure Authentication**: User authentication powered by Firebase.

## Tech Stack

- **Frontend**: React, Vite, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Firebase Cloud Functions, Node.js
- **Database**: Cloud Firestore
- **Email Service**: Nodemailer (Gmail integration)

## Prerequisites

- Node.js (v18 or higher recommended)
- npm
- Firebase CLI (`npm install -g firebase-tools`)

## Installation

1. **Install Frontend Dependencies**
   ```bash
   npm install
   ```

2. **Install Backend Dependencies**
   ```bash
   cd functions
   npm install
   cd ..
   ```

## Configuration & Secrets

### 1. Local Development Secrets
To run the backend locally with payment features (Paystack/Stripe), you must create a `.secret.local` file in the `functions/` directory.

**File:** `functions/.secret.local`
```env
PAYSTACK_SECRET_KEY_TEST=sk_test_...
PAYSTACK_SECRET_KEY_LIVE=sk_live_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
GMAIL_EMAIL=your-email@gmail.com
GMAIL_PASSWORD=your-app-password
```
> **Note:** This file is ignored by git for security.

### 2. Production Secrets (Firebase)
For the live backend to work, you must set these secrets in Firebase Cloud:

```bash
firebase functions:secrets:set PAYSTACK_SECRET_KEY_LIVE
firebase functions:secrets:set PAYSTACK_SECRET_KEY_TEST
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
firebase functions:secrets:set GMAIL_EMAIL
firebase functions:secrets:set GMAIL_PASSWORD
```

---

## Running the Project Locally

### 1. Start the Backend (Functions Emulator)
This runs the server-side code (payments, emails) locally.
```bash
cd functions
npm run serve
# Runs on http://localhost:5001
```

### 2. Start the Frontend (React)
Opens the UI in your browser.
```bash
npm run dev
# Runs on http://localhost:5173 (or similar)
```

---

## Deployment

### ⚠️ IMPORTANT: You have two deployment targets

1. **Backend (Firebase Functions)**
   - Deploys the server logic (API, Email, Payments).
   - **Command:**
     ```bash
     firebase deploy --only functions
     ```
   - *Run this whenever you change code in the `functions/` folder.*

2. **Frontend (Live Website)**
   - **Target 1: GitHub Pages (www.e-ndorse.online)**
     - This is where your custom domain points.
     - **Command:**
       ```bash
       npm run deploy
       ```
     - *Run this to update the UI on your custom domain.*

   - **Target 2: Firebase Hosting (endorse-app.web.app)**
     - This is the default Firebase URL.
     - **Command:**
       ```bash
       npm run build
       firebase deploy --only hosting
       ```

### Summary table
| Component | URL | Command to Update |
|-----------|-----|-------------------|
| **Backend** | (Internal API) | `firebase deploy --only functions` |
| **Live Site** | **www.e-ndorse.online** | `npm run deploy` |
| **Test Site** | endorse-app.web.app | `firebase deploy --only hosting` |

## Build
To build the frontend for production:
```bash
npm run build
```