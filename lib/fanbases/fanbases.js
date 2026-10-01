import { cache } from "react";
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/firestore";

const COLLECTION = "fanbases";
const MEMBERS_COLLECTION = "members";
const FOLLOWERS_COLLECTION = "followers";
const MEMBERSHIP_REQUESTS_COLLECTION = "membershipRequests";
const USERS_COLLECTION = "users";

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
    ownerId: normalizeText(data.ownerId || data.createdById, 128),
    ownerName: normalizeText(data.ownerName || data.createdByName, 80) || "Equipo Narabi",
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

function serializeMembershipRequest(doc, fanbaseId = null) {
  const data = doc.data();

  return {
    uid: doc.id,
    fanbaseId: fanbaseId || doc.ref.parent.parent?.id || "",
    displayName: normalizeText(data.displayName, 80) || "Fan de Narabi",
    email: normalizeText(data.email, 160),
    photoURL: normalizeText(data.photoURL, 500),
    status: data.status === "pending" ? "pending" : "pending",
    requestedAt: data.requestedAt?.toDate?.().toISOString() || null,
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
    organizador: "Administrador/a",
    integrante: "Integrante",
  };

  return labels[role] || labels.integrante;
}

export function canManageFanbase(role) {
  return role === "fundador" || role === "organizador";
}

export const getFanbases = cache(async function getFanbases() {
  const snapshot = await getDb().collection(COLLECTION).orderBy("name", "asc").get();
  return snapshot.docs.map(serializeFanbase);
});

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

export async function getFanbaseMembershipRequest(fanbaseId, uid) {
  if (!isDocumentId(fanbaseId) || !isDocumentId(uid)) return null;

  const snapshot = await getDb()
    .collection(COLLECTION)
    .doc(fanbaseId)
    .collection(MEMBERSHIP_REQUESTS_COLLECTION)
    .doc(uid)
    .get();

  return snapshot.exists ? serializeMembershipRequest(snapshot, fanbaseId) : null;
}

export async function getFanbaseMembershipRequests(fanbaseId) {
  if (!isDocumentId(fanbaseId)) return [];

  const snapshot = await getDb()
    .collection(COLLECTION)
    .doc(fanbaseId)
    .collection(MEMBERSHIP_REQUESTS_COLLECTION)
    .get();

  return snapshot.docs
    .map((doc) => serializeMembershipRequest(doc, fanbaseId))
    .sort((a, b) => String(a.requestedAt || "").localeCompare(String(b.requestedAt || "")));
}

export async function getAllFanbaseMembershipRequests() {
  const snapshot = await getDb().collectionGroup(MEMBERSHIP_REQUESTS_COLLECTION).get();

  return snapshot.docs
    .map((doc) => serializeMembershipRequest(doc))
    .sort((a, b) => String(a.requestedAt || "").localeCompare(String(b.requestedAt || "")));
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

export async function getFanbaseFollowers(fanbaseId) {
  if (!isDocumentId(fanbaseId)) return [];

  const db = getDb();
  const snapshot = await db
    .collection(COLLECTION)
    .doc(fanbaseId)
    .collection(FOLLOWERS_COLLECTION)
    .get();

  if (snapshot.empty) return [];

  const profiles = await db.getAll(
    ...snapshot.docs.map((follower) => db.collection(USERS_COLLECTION).doc(follower.id)),
  );

  return snapshot.docs.map((follower, index) => {
    const data = profiles[index]?.exists ? profiles[index].data() : {};

    return {
      uid: follower.id,
      displayName: normalizeText(data.displayName, 80) || "Fan de Narabi",
      email: normalizeText(data.email, 160),
      photoURL: normalizeText(data.photoURL, 500),
      followedAt: follower.data().followedAt?.toDate?.().toISOString() || null,
    };
  });
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

export const getFanbasesForUser = cache(async function getFanbasesForUser(uid) {
  if (!isDocumentId(uid)) return [];

  const fanbases = await getFanbases();
  if (fanbases.length === 0) return [];

  const db = getDb();
  const membershipSnapshots = await db.getAll(
    ...fanbases.map((fanbase) => (
      db.collection(COLLECTION).doc(fanbase.id).collection(MEMBERS_COLLECTION).doc(uid)
    )),
  );
  const memberships = fanbases.map((fanbase, index) => ({
    fanbase,
    membership: membershipSnapshots[index]?.exists
      ? serializeMembership(membershipSnapshots[index])
      : null,
  }));

  return memberships
    .filter(({ membership }) => membership)
    .map(({ fanbase, membership }) => ({ ...fanbase, membership }));
});

export const getOrganizedFanbasesForUser = cache(async function getOrganizedFanbasesForUser(uid) {
  if (!isDocumentId(uid)) return [];

  const db = getDb();
  const userSnapshot = await db.collection(USERS_COLLECTION).doc(uid).get();
  const fanbaseIds = Array.isArray(userSnapshot.data()?.fanbases)
    ? [...new Set(userSnapshot.data().fanbases.filter(isDocumentId))]
    : [];

  if (fanbaseIds.length === 0) return [];

  const fanbaseSnapshots = await db.getAll(
    ...fanbaseIds.map((fanbaseId) => db.collection(COLLECTION).doc(fanbaseId)),
  );

  return fanbaseSnapshots.filter((snapshot) => snapshot.exists).map((snapshot) => ({
    ...serializeFanbase(snapshot),
    membership: {
      uid,
      role: snapshot.data().ownerId === uid || snapshot.data().createdById === uid
        ? "fundador"
        : "organizador",
    },
  }));
});

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
    ownerId: creator.uid,
    ownerName: creatorName,
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
  batch.set(db.collection(USERS_COLLECTION).doc(creator.uid), {
    fanbases: FieldValue.arrayUnion(fanbaseRef.id),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  await batch.commit();
  return { id: fanbaseRef.id, ...payload };
}

export async function requestFanbaseMembership({ fanbaseId, user }) {
  if (!isDocumentId(fanbaseId) || !user?.uid || !isDocumentId(user.uid)) {
    throw new Error("No se pudo enviar la solicitud a la fanbase.");
  }

  const db = getDb();
  const fanbaseRef = db.collection(COLLECTION).doc(fanbaseId);
  const memberRef = fanbaseRef.collection(MEMBERS_COLLECTION).doc(user.uid);
  const requestRef = fanbaseRef.collection(MEMBERSHIP_REQUESTS_COLLECTION).doc(user.uid);
  const displayName = normalizeText(user.displayName, 80) || "Fan de Narabi";
  const email = normalizeText(user.email, 160);
  const photoURL = normalizeText(user.photoURL, 500);

  return db.runTransaction(async (transaction) => {
    const [fanbaseSnapshot, memberSnapshot, requestSnapshot] = await Promise.all([
      transaction.get(fanbaseRef),
      transaction.get(memberRef),
      transaction.get(requestRef),
    ]);

    if (!fanbaseSnapshot.exists) throw new Error("La fanbase ya no está disponible.");
    if (memberSnapshot.exists) return { requested: false, reason: "already-member" };
    if (requestSnapshot.exists) return { requested: false, reason: "already-requested" };

    transaction.create(requestRef, {
      displayName,
      email,
      photoURL,
      status: "pending",
      requestedRole: "organizador",
      requestedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { requested: true };
  });
}

export async function approveFanbaseMembershipRequest({ fanbaseId, uid, role = "integrante" }) {
  if (!isDocumentId(fanbaseId) || !isDocumentId(uid)) {
    throw new Error("La solicitud seleccionada no es válida.");
  }

  const approvedRole = role === "organizador" ? "organizador" : "integrante";
  const db = getDb();
  const fanbaseRef = db.collection(COLLECTION).doc(fanbaseId);
  const requestRef = fanbaseRef.collection(MEMBERSHIP_REQUESTS_COLLECTION).doc(uid);
  const memberRef = fanbaseRef.collection(MEMBERS_COLLECTION).doc(uid);
  const userRef = db.collection(USERS_COLLECTION).doc(uid);

  return db.runTransaction(async (transaction) => {
    const [fanbaseSnapshot, requestSnapshot, memberSnapshot, userSnapshot] = await Promise.all([
      transaction.get(fanbaseRef),
      transaction.get(requestRef),
      transaction.get(memberRef),
      transaction.get(userRef),
    ]);

    if (!fanbaseSnapshot.exists) throw new Error("La fanbase ya no está disponible.");
    if (!requestSnapshot.exists) throw new Error("La solicitud ya fue revisada.");

    if (!memberSnapshot.exists) {
      const request = serializeMembershipRequest(requestSnapshot, fanbaseId);
      transaction.create(memberRef, {
        displayName: request.displayName,
        photoURL: request.photoURL,
        role: approvedRole,
        joinedAt: FieldValue.serverTimestamp(),
      });
      transaction.update(fanbaseRef, {
        memberCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    transaction.delete(requestRef);
    if (approvedRole === "organizador") {
      transaction.set(userRef, {
        user_type: userSnapshot.data()?.user_type === "admin" ? "admin" : "fanbase",
        fanbases: FieldValue.arrayUnion(fanbaseId),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    return { approved: !memberSnapshot.exists, role: approvedRole };
  });
}

export async function rejectFanbaseMembershipRequest({ fanbaseId, uid }) {
  if (!isDocumentId(fanbaseId) || !isDocumentId(uid)) {
    throw new Error("La solicitud seleccionada no es válida.");
  }

  const requestRef = getDb()
    .collection(COLLECTION)
    .doc(fanbaseId)
    .collection(MEMBERSHIP_REQUESTS_COLLECTION)
    .doc(uid);
  const snapshot = await requestRef.get();

  if (!snapshot.exists) return false;
  await requestRef.delete();
  return true;
}

export async function getFollowedFanbasesForUser(uid) {
  if (!isDocumentId(uid)) return [];

  const db = getDb();
  const fanbases = await getFanbases();

  const followedFanbases = await Promise.all(
    fanbases.map(async (fanbase) => {
      const follower = await db
        .collection(COLLECTION)
        .doc(fanbase.id)
        .collection(FOLLOWERS_COLLECTION)
        .doc(uid)
        .get();

      return follower.exists ? fanbase : null;
    }),
  );

  return followedFanbases.filter(Boolean);
}
