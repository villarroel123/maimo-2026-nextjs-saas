import { cache } from "react";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth } from "@/lib/firebase/admin";
import { getDb } from "@/lib/firebase/firestore";

const COLLECTION = "users";
export const USER_TYPES = ["user", "fanbase", "admin"];

function normalizeUserType(value) {
  return USER_TYPES.includes(value) ? value : "user";
}

function normalizeFanbaseIds(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id) => typeof id === "string" && id && !id.includes("/")))];
}

function serializeUser(doc) {
  const data = doc.data();

  return {
    uid: doc.id,
    email: data.email || "",
    displayName: data.displayName || "",
    photoURL: data.photoURL || "",
    provider: data.provider || "",
    user_type: normalizeUserType(data.user_type),
    fanbases: normalizeFanbaseIds(data.fanbases),
    email_notifications: data.email_notifications !== false,
    createdAt: data.createdAt?.toDate?.().toISOString() || null,
    updatedAt: data.updatedAt?.toDate?.().toISOString() || null,
    lastLoginAt: data.lastLoginAt?.toDate?.().toISOString() || null,
  };
}

export async function ensureUserProfile(decodedToken) {
  const userRef = getDb().collection(COLLECTION).doc(decodedToken.uid);

  await getDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(userRef);
    const now = FieldValue.serverTimestamp();

    if (!snapshot.exists) {
      transaction.set(userRef, {
        email: decodedToken.email || "",
        displayName: decodedToken.name || "",
        photoURL: decodedToken.picture || "",
        provider: decodedToken.firebase?.sign_in_provider || "",
        user_type: "user",
        fanbases: [],
        email_notifications: true,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      });
      return;
    }

    const existing = snapshot.data();

    transaction.update(userRef, {
      email: decodedToken.email || existing.email || "",
      displayName: existing.displayName || decodedToken.name || "",
      photoURL: existing.photoURL || decodedToken.picture || "",
      provider: decodedToken.firebase?.sign_in_provider || existing.provider || "",
      updatedAt: now,
      lastLoginAt: now,
    });
  });
}

export async function getUserProfile(uid) {
  const doc = await getDb().collection(COLLECTION).doc(uid).get();
  return doc.exists ? serializeUser(doc) : null;
}

export const getCurrentUserProfile = cache(async function getCurrentUserProfile(currentUser) {
  if (!currentUser) return null;

  const profile = await getUserProfile(currentUser.uid);
  if (profile) return profile;

  await ensureUserProfile(currentUser);
  return getUserProfile(currentUser.uid);
});

export async function isAdmin(uid) {
  const profile = await getUserProfile(uid);
  return profile?.user_type === "admin";
}

export async function listUserProfiles() {
  const snapshot = await getDb().collection(COLLECTION).get();

  return snapshot.docs
    .map(serializeUser)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

export async function createManagedUser(data) {
  const userRecord = await getAdminAuth().createUser({
    email: data.email,
    password: data.password,
    displayName: data.displayName,
  });
  const now = FieldValue.serverTimestamp();

  await getDb().collection(COLLECTION).doc(userRecord.uid).set({
    email: data.email,
    displayName: data.displayName,
    photoURL: "",
    provider: "password",
    user_type: normalizeUserType(data.user_type),
    fanbases: [],
    email_notifications: true,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: null,
  });
}

export async function updateUserProfile(uid, data) {
  if (typeof uid !== "string" || !uid.trim() || uid.includes("/")) {
    throw new Error("No se pudo identificar el perfil.");
  }

  const displayName = typeof data.displayName === "string" ? data.displayName.trim().slice(0, 50) : "";
  const photoURL = typeof data.photoURL === "string" ? data.photoURL.trim().slice(0, 300000) : "";

  if (!displayName) throw new Error("El nombre no puede estar vacío.");

  await getAdminAuth().updateUser(uid, { displayName });
  await getDb().collection(COLLECTION).doc(uid).set({
    displayName,
    photoURL,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

export async function updateManagedUser(uid, data) {
  const userRef = getDb().collection(COLLECTION).doc(uid);
  const doc = await userRef.get();

  if (!doc.exists) throw new Error("User profile not found.");

  await getAdminAuth().updateUser(uid, { displayName: data.displayName });
  await userRef.update({
    displayName: data.displayName,
    user_type: normalizeUserType(data.user_type),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function deleteManagedUser(uid) {
  await getDb().collection(COLLECTION).doc(uid).delete();

  try {
    await getAdminAuth().deleteUser(uid);
  } catch (error) {
    if (error.code !== "auth/user-not-found") throw error;
  }
}
