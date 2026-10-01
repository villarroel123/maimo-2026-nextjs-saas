import { randomBytes } from "node:crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const email = process.argv[2] || "fanbase@narabi.com";
const displayName = process.argv[3] || "Fanbase";

function formatPrivateKey(value) {
  return String(value || "").trim().replace(/^["']|["']$/g, "").replace(/\\n/g, "\n");
}

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

if (!projectId || !clientEmail || !privateKey) {
  throw new Error("Faltan las variables de Firebase Admin.");
}

const app = getApps()[0] || initializeApp({
  credential: cert({ projectId, clientEmail, privateKey }),
});
const auth = getAuth(app);
const db = getFirestore(app);
let userRecord;
let temporaryPassword = null;
let created = false;

try {
  userRecord = await auth.getUserByEmail(email);
  userRecord = await auth.updateUser(userRecord.uid, { displayName });
} catch (error) {
  if (error?.code !== "auth/user-not-found") throw error;

  temporaryPassword = `Narabi-${randomBytes(9).toString("base64url")}!`;
  userRecord = await auth.createUser({ email, displayName, password: temporaryPassword });
  created = true;
}

const userRef = db.collection("users").doc(userRecord.uid);
const snapshot = await userRef.get();
const now = FieldValue.serverTimestamp();

await userRef.set({
  email,
  displayName,
  photoURL: snapshot.data()?.photoURL || "",
  provider: snapshot.data()?.provider || "password",
  user_type: "fanbase",
  fanbases: Array.isArray(snapshot.data()?.fanbases) ? snapshot.data().fanbases : [],
  email_notifications: snapshot.data()?.email_notifications !== false,
  createdAt: snapshot.data()?.createdAt || now,
  updatedAt: now,
  lastLoginAt: snapshot.data()?.lastLoginAt || null,
}, { merge: true });

console.log(JSON.stringify({
  created,
  displayName,
  email,
  temporaryPassword,
  uid: userRecord.uid,
}));
