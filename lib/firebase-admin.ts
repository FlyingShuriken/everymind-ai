import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { env } from "@/lib/env";

const app = getApps().length
  ? getApps()[0]!
  : initializeApp({
      credential: cert(JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_KEY)),
      storageBucket: env.FIREBASE_STORAGE_BUCKET,
    });

export const db = getFirestore(app);
export const bucket = getStorage(app).bucket();
