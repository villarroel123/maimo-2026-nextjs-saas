import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/firestore";

const COLLECTION = "fanbases";
const MEMBERS_COLLECTION = "members";
const FOLLOWERS_COLLECTION = "followers";

export const FANBASE_MEMBER_ROLES = ["fundador", "organizador", "integrante"];

function isDocumentId(value) {
  return typeof value === "string" && value.trim().length > 0 && !value.includes("/");
}

function normalizeText(value, maxLength = 160) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function serializeFanbase(doc) {
  const data = doc.data();

  return {
    id: doc.id,
    name: normalizeText(data.name, 80) || "Fanbase sin nombre",
    kpopGroup: normalizeText(data.kpopGroup, 80) || "Grupo de K-pop",
    country: normalizeText(data.country, 80),
    city: normalizeText(data.city, 80),
    description: normalizeText(data.description, 500),
    instagram: normalizeText(data.instagram, 120),
    createdById: normalizeText(data.createdById, 128),
    createdByName: normalizeText(data.createdByName, 80) || "Equipo Narabi",
    memberCount: Number.isFinite(data.memberCount) ? Math.max(0, data.memberCount) : 0,
    createdAt: data.createdAt?.toDate?.().toISOString() || null,
  };
}

function serializeMembership(doc) {
  const data = doc.data();
  const role = FANBASE_MEMBER_ROLES.includes(data.role) ? data.role : "integrante";

  return {
    uid: doc.id,
    displayName: normalizeText(data.displayName, 80) || "Fan de Narabi",
    photoURL: normalizeText(data.photoURL, 500),
    role,
    joinedAt: data.joinedAt?.toDate?.().toISOString() || null,
  };
}

function toFanbasePayload(data) {
  const name = normalizeText(data.name, 80);
  const kpopGroup = normalizeText(data.kpopGroup, 80);

  if (!name || !kpopGroup) {
    throw new Error("El nombre de la fanbase y el grupo de K-pop son obligatorios.");
  }

  return {
    name,
    kpopGroup,
    country: normalizeText(data.country, 80),
    city: normalizeText(data.city, 80),
    description: normalizeText(data.description, 500),
    instagram: normalizeText(data.instagram, 120).replace(/^@/, ""),
  };
}

export function getFanbaseRoleLabel(role) {
  const labels = {
    fundador: "Fundador/a",
    organizador: "Organizador/a",
    integrante: "Integrante",
  };

  return labels[role] || labels.integrante;
}

export async function getFanbases() {
  const snapshot = await getDb().collection(COLLECTION).orderBy("name", "asc").get();
  return snapshot.docs.map(serializeFanbase);
}

export async function getFanbase(id) {
  if (!isDocumentId(id)) return null;

  const snapshot = await getDb().collection(COLLECTION).doc(id).get();
  return snapshot.exists ? serializeFanbase(snapshot) : null;
}

export async function getFanbaseMembership(fanbaseId, uid) {
  if (!isDocumentId(fanbaseId) || !isDocumentId(uid)) return null;

  const snapshot = await getDb()
    .collection(COLLECTION)
    .doc(fanbaseId)
    .collection(MEMBERS_COLLECTION)
    .doc(uid)
    .get();

  return snapshot.exists ? serializeMembership(snapshot) : null;
}

export async function getFanbaseMembers(fanbaseId) {
  if (!isDocumentId(fanbaseId)) return [];

  const snapshot = await getDb()
    .collection(COLLECTION)
    .doc(fanbaseId)
    .collection(MEMBERS_COLLECTION)
    .orderBy("joinedAt", "asc")
    .get();

  return snapshot.docs.map(serializeMembership);
}

export async function getFanbaseFollowerCount(fanbaseId) {
  if (!isDocumentId(fanbaseId)) return 0;

  const snapshot = await getDb()
    .collection(COLLECTION)
    .doc(fanbaseId)
    .collection(FOLLOWERS_COLLECTION)
    .count()
    .get();

  return snapshot.data().count;
}

export async function isFollowingFanbase(fanbaseId, uid) {
  if (!isDocumentId(fanbaseId) || !isDocumentId(uid)) return false;

  const snapshot = await getDb()
    .collection(COLLECTION)
    .doc(fanbaseId)
    .collection(FOLLOWERS_COLLECTION)
    .doc(uid)
    .get();

  return snapshot.exists;
}

export async function followFanbase(fanbaseId, uid) {
  if (!isDocumentId(fanbaseId) || !isDocumentId(uid)) {
    throw new Error("No se pudo identificar la fanbase o la persona que la sigue.");
  }

  const db = getDb();
  const fanbaseRef = db.collection(COLLECTION).doc(fanbaseId);
  const followerRef = fanbaseRef.collection(FOLLOWERS_COLLECTION).doc(uid);

  return db.runTransaction(async (transaction) => {
    const [fanbaseSnapshot, followerSnapshot] = await Promise.all([
      transaction.get(fanbaseRef),
      transaction.get(followerRef),
    ]);

    if (!fanbaseSnapshot.exists) throw new Error("La fanbase ya no está disponible.");
    if (followerSnapshot.exists) return false;

    transaction.create(followerRef, { followedAt: FieldValue.serverTimestamp() });
    return true;
  });
}

export async function unfollowFanbase(fanbaseId, uid) {
  if (!isDocumentId(fanbaseId) || !isDocumentId(uid)) {
    throw new Error("No se pudo identificar la fanbase o la persona que la sigue.");
  }

  const followerRef = getDb()
    .collection(COLLECTION)
    .doc(fanbaseId)
    .collection(FOLLOWERS_COLLECTION)
    .doc(uid);

  return getDb().runTransaction(async (transaction) => {
    const followerSnapshot = await transaction.get(followerRef);
    if (!followerSnapshot.exists) return false;

    transaction.delete(followerRef);
    return true;
  });
}

export async function getFanbasesForUser(uid) {
  if (!isDocumentId(uid)) return [];

  const fanbases = await getFanbases();
  const memberships = await Promise.all(
    fanbases.map(async (fanbase) => ({
      fanbase,
      membership: await getFanbaseMembership(fanbase.id, uid),
    })),
  );

  return memberships
    .filter(({ membership }) => membership)
    .map(({ fanbase, membership }) => ({ ...fanbase, membership }));
}

export async function getOrganizedFanbasesForUser(uid) {
  const fanbases = await getFanbasesForUser(uid);
  return fanbases.filter(({ membership }) => (
    membership.role === "fundador" || membership.role === "organizador"
  ));
}

export async function createFanbase({ creator, data }) {
  if (!creator?.uid || !isDocumentId(creator.uid)) {
    throw new Error("No se pudo identificar a la persona que crea la fanbase.");
  }

  const db = getDb();
  const fanbaseRef = db.collection(COLLECTION).doc();
  const payload = toFanbasePayload(data);
  const creatorName = normalizeText(creator.displayName, 80) || "Fan de Narabi";
  const creatorPhotoURL = normalizeText(creator.photoURL, 500);
  const batch = db.batch();

  batch.set(fanbaseRef, {
    ...payload,
    createdById: creator.uid,
    createdByName: creatorName,
    memberCount: 1,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  batch.set(fanbaseRef.collection(MEMBERS_COLLECTION).doc(creator.uid), {
    displayName: creatorName,
    photoURL: creatorPhotoURL,
    role: "fundador",
    joinedAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
  return { id: fanbaseRef.id, ...payload };
}

export async function joinFanbase({ fanbaseId, user }) {
  if (!isDocumentId(fanbaseId) || !user?.uid || !isDocumentId(user.uid)) {
    throw new Error("No se pudo asociar la membresía a la fanbase.");
  }

  const db = getDb();
  const fanbaseRef = db.collection(COLLECTION).doc(fanbaseId);
  const memberRef = fanbaseRef.collection(MEMBERS_COLLECTION).doc(user.uid);
  const displayName = normalizeText(user.displayName, 80) || "Fan de Narabi";
  const photoURL = normalizeText(user.photoURL, 500);

  return db.runTransaction(async (transaction) => {
    const [fanbaseSnapshot, memberSnapshot] = await Promise.all([
      transaction.get(fanbaseRef),
      transaction.get(memberRef),
    ]);

    if (!fanbaseSnapshot.exists) {
      throw new Error("La fanbase ya no está disponible.");
    }

    if (memberSnapshot.exists) {
      return { joined: false, membership: serializeMembership(memberSnapshot) };
    }

    transaction.create(memberRef, {
      displayName,
      photoURL,
      role: "integrante",
      joinedAt: FieldValue.serverTimestamp(),
    });
    transaction.update(fanbaseRef, {
      memberCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { joined: true, membership: { uid: user.uid, displayName, photoURL, role: "integrante" } };
  });
}
