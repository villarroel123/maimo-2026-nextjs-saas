import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

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
const db = getFirestore(app);
const usersSnapshot = await db.collection("users").get();
const fanbasesSnapshot = await db.collection("fanbases").get();
const assignments = new Map();
let initializedUsers = 0;
let updatedFanbases = 0;

for (const userDocument of usersSnapshot.docs) {
  if (Array.isArray(userDocument.data().fanbases)) continue;

  await userDocument.ref.set({ fanbases: [] }, { merge: true });
  initializedUsers += 1;
}

for (const fanbaseDocument of fanbasesSnapshot.docs) {
  const fanbase = fanbaseDocument.data();
  const membersSnapshot = await fanbaseDocument.ref.collection("members").get();
  const managers = membersSnapshot.docs.filter((memberDocument) => {
    const role = memberDocument.data().role;
    return role === "fundador" || role === "organizador";
  });
  const founder = managers.find((memberDocument) => memberDocument.data().role === "fundador");
  const ownerId = founder?.id || fanbase.ownerId || fanbase.createdById || "";
  const ownerName = founder?.data().displayName || fanbase.ownerName || fanbase.createdByName || "";

  if (ownerId && !managers.some((memberDocument) => memberDocument.id === ownerId)) {
    managers.push({ id: ownerId, data: () => ({ displayName: ownerName, role: "fundador" }) });
  }

  for (const manager of managers) {
    if (!assignments.has(manager.id)) assignments.set(manager.id, new Set());
    assignments.get(manager.id).add(fanbaseDocument.id);
  }

  const ownership = {};
  if (ownerId) ownership.ownerId = ownerId;
  if (ownerName) ownership.ownerName = ownerName;

  if (Object.keys(ownership).length > 0) {
    await fanbaseDocument.ref.set({
      ...ownership,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    updatedFanbases += 1;
  }
}

for (const [uid, fanbaseIds] of assignments) {
  const userRef = db.collection("users").doc(uid);
  const userSnapshot = await userRef.get();
  const isGlobalAdmin = userSnapshot.data()?.user_type === "admin";

  await userRef.set({
    fanbases: FieldValue.arrayUnion(...fanbaseIds),
    ...(isGlobalAdmin ? {} : { user_type: "fanbase" }),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

console.log(JSON.stringify({
  assignedUsers: assignments.size,
  initializedUsers,
  totalFanbases: fanbasesSnapshot.size,
  totalUsers: usersSnapshot.size,
  updatedFanbases,
}));
