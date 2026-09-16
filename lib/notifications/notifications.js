import { FieldValue } from "firebase-admin/firestore";
import { sendNotificationEmail } from "@/lib/email/resend";
import { getDb } from "@/lib/firebase/firestore";
import { getUserProfile } from "@/lib/users/users";

const USERS_COLLECTION = "users";

function isValidId(value) {
  return typeof value === "string" && value.trim().length > 0 && !value.includes("/");
}

function serializeNotification(doc) {
  const data = doc.data();

  return {
    id: doc.id,
    title: data.title || "Actualización",
    message: data.message || "Hay una actualización disponible.",
    href: data.href || "/",
    read: data.read === true,
    createdAt: data.createdAt?.toDate?.().toISOString() || null,
  };
}

export async function getNotificationsForUser(uid) {
  const snapshot = await getDb()
    .collection(USERS_COLLECTION)
    .doc(uid)
    .collection("notifications")
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();

  return snapshot.docs.map(serializeNotification);
}

export async function hasUnreadNotificationsForUser(uid) {
  const snapshot = await getDb()
    .collection(USERS_COLLECTION)
    .doc(uid)
    .collection("notifications")
    .where("read", "==", false)
    .limit(1)
    .get();

  return !snapshot.empty;
}

export async function markNotificationAsRead(uid, notificationId) {
  if (!isValidId(notificationId)) {
    throw new Error("Invalid notification.");
  }

  await getDb()
    .collection(USERS_COLLECTION)
    .doc(uid)
    .collection("notifications")
    .doc(notificationId)
    .update({ read: true, readAt: FieldValue.serverTimestamp() });
}

export async function updateEmailNotificationPreference(uid, enabled) {
  await getDb().collection(USERS_COLLECTION).doc(uid).set({
    email_notifications: Boolean(enabled),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

async function getFavoriteRecipientProfiles(projectId) {
  const favoriteSnapshot = await getDb()
    .collectionGroup("favorites")
    .where("projectId", "==", projectId)
    .get();

  const userIds = new Set(
    favoriteSnapshot.docs
      .map((doc) => doc.ref.parent.parent?.id)
      .filter(Boolean),
  );

  const profiles = await Promise.all(
    [...userIds].map((uid) => getUserProfile(uid)),
  );

  return profiles.filter(Boolean);
}

export async function notifyFavoriteUsers({ projectId, title, message, href }) {
  const recipients = await getFavoriteRecipientProfiles(projectId);

  const deliveries = recipients.map(async (recipient) => {
    await getDb()
      .collection(USERS_COLLECTION)
      .doc(recipient.uid)
      .collection("notifications")
      .add({
        title,
        message,
        href,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });

    if (recipient.email_notifications !== false && recipient.email) {
      await sendNotificationEmail({
        to: recipient.email,
        subject: title,
        message,
        href,
      });
    }
  });

  const results = await Promise.allSettled(deliveries);

  results
    .filter((result) => result.status === "rejected")
    .forEach((result) => console.error("Could not deliver a notification:", result.reason));

  return recipients.length;
}
