// api/_firebaseAdmin.js
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth as getAdminAuth } from "firebase-admin/auth";

// Only initialize once (serverless functions may run multiple times)
const app =
  getApps()[0] ||
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,      // e.g. "chronicrelief-1e8ef"
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,  // e.g. "firebase-adminsdk-...@...iam.gserviceaccount.com"
      // Convert escaped \n in env var back to real newlines
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });

export const db = getFirestore(app);
export const adminAuth = getAdminAuth(app);
