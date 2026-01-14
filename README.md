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

## Configuration

### Firebase
Ensure you have initialized Firebase in your project and have the necessary permissions enabled in the Firebase Console (Auth, Firestore, Functions).

### Environment Variables
The backend functions currently use hardcoded credentials for Nodemailer in `functions/src/index.ts`. For production, it is highly recommended to switch to Firebase Environment Configuration.

## Running the Project

### Start Frontend
```bash
npm run dev
```
The application will start at `http://localhost:8080`.

### Deploy Backend
To deploy the Cloud Functions:
```bash
firebase deploy --only functions
```

## Build
To build the frontend for production:
```bash
npm run build
```