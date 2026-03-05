import { initializeApp } from "firebase/app";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validate that all Firebase config values are present
for (const [key, value] of Object.entries(firebaseConfig)) {
  if (value === undefined) {
    throw new Error(
      `Firebase config error: Missing environment variable for ${key}. Please check your .env file.`
    );
  }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log("Firebase initialized:", app);

// Initialize Cloud Functions and get a reference to the service
export const analytics = getAnalytics(app);
export const functions = getFunctions(app, "us-central1");
// Connect to emulator in development
if (window.location.hostname === "localhost") {
  connectFunctionsEmulator(functions, "localhost", 5001);
  console.log("Connected to Functions emulator");
}

export const auth = getAuth(app);
export const db = getFirestore(app);

export { app };