import {
  httpsCallable as firebaseHttpsCallable,
  httpsCallableFromURL,
  type Functions,
  type HttpsCallable,
  type HttpsCallableOptions,
} from "firebase/functions";

/**
 * Base URL of the self-hosted API server (see functions/server). When set, every
 * callable goes there instead of Firebase Cloud Functions, so the app works on the
 * free Spark plan. The server speaks the same callable protocol, so auth, payloads
 * and error codes (e.g. "functions/resource-exhausted") behave exactly the same.
 */
const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "");

export function httpsCallable<RequestData = unknown, ResponseData = unknown>(
  functions: Functions,
  name: string,
  options?: HttpsCallableOptions,
): HttpsCallable<RequestData, ResponseData> {
  return API_URL
    ? httpsCallableFromURL<RequestData, ResponseData>(functions, `${API_URL}/${name}`, options)
    : firebaseHttpsCallable<RequestData, ResponseData>(functions, name, options);
}
