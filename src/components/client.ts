import { initializeApp } from "firebase/app";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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

// Analytics loads Google's tracker (~175 KB), so start it on the visitor's first interaction
// (or after 8 s), keeping it off the critical path for the first screen.
const startAnalytics = () => {
  import("firebase/analytics")
    .then(({ getAnalytics, isSupported }) => isSupported().then((ok) => ok && getAnalytics(app)))
    .catch(() => {});
};
if (typeof window !== "undefined") {
  const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    events.forEach((e) => window.removeEventListener(e, start));
    startAnalytics();
  };
  events.forEach((e) => window.addEventListener(e, start, { once: true, passive: true }));
  setTimeout(start, 8000);
}

// Initialize Cloud Functions and get a reference to the service
export const functions = getFunctions(app, "us-central1");
// Connect to emulator in development
// Disabled: using production Firebase instead
// if (window.location.hostname === "localhost") {
//   connectFunctionsEmulator(functions, "localhost", 5001);
//   console.log("Connected to Functions emulator");
// }

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Connect to Auth and Firestore emulators in development
// Disabled: using production Firebase instead
// if (window.location.hostname === "localhost") {
//   connectAuthEmulator(auth, "http://localhost:9099");
//   connectFirestoreEmulator(db, "localhost", 8082);
//   console.log("Connected to Auth and Firestore emulators");
// }

export { app };