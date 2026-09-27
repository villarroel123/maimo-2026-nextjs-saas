import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/firestore";

const PROJECTS_COLLECTION = "proyectos";
const IDEAS_COLLECTION = "ideas";
const REPLIES_COLLECTION = "replies";
const REACTIONS_COLLECTION = "reactions";
const MAX_MESSAGE_LENGTH = 500;
const REACTIONS = ["like", "dislike"];

function isDocumentId(value) {
  return typeof value === "string" && value.trim().length > 0 && !value.includes("/");
}

function normalizeMessage(message) {
  const value = typeof message === "string" ? message.trim() : "";
  if (!value || value.length > MAX_MESSAGE_LENGTH) {
    throw new Error("El mensaje debe tener entre 1 y 500 caracteres.");
  }
  return value;
}

function normalizeAuthorName(authorName) {
  return typeof authorName === "string" && authorName.trim()
    ? authorName.trim().slice(0, 80)
    : "Fan de Narabi";
}

function getProjectRef(projectId) {
  return getDb().collection(PROJECTS_COLLECTION).doc(projectId);
}

function formatMessageDate(value) {
  if (!value) return "Recién publicado";

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(value));
}

function serializeMessage(doc) {
  const data = doc.data();
  const createdAt = data.createdAt?.toDate?.().toISOString() || null;
  return {
    id: doc.id,
    authorName: normalizeAuthorName(data.authorName),
    message: typeof data.message === "string" ? data.message : "",
    createdAt,
    createdAtLabel: formatMessageDate(createdAt),
  };
}

export async function getConcertIdeas(projectId, userId) {
  if (!isDocumentId(projectId)) return [];

  const snapshot = await getProjectRef(projectId)
    .collection(IDEAS_COLLECTION)
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();

  const ideas = await Promise.all(snapshot.docs.map(async (doc) => {
    const [repliesSnapshot, reactionSnapshot] = await Promise.all([
      doc.ref.collection(REPLIES_COLLECTION).orderBy("createdAt", "asc").limit(50).get(),
      isDocumentId(userId)
        ? doc.ref.collection(REACTIONS_COLLECTION).doc(userId).get()
        : null,
    ]);
    const data = doc.data();

    return {
      ...serializeMessage(doc),
      likeCount: Number.isFinite(data.likeCount) ? Math.max(0, data.likeCount) : 0,
      dislikeCount: Number.isFinite(data.dislikeCount) ? Math.max(0, data.dislikeCount) : 0,
      userReaction: reactionSnapshot?.exists ? reactionSnapshot.data().reaction : null,
      replies: repliesSnapshot.docs.map(serializeMessage).filter((reply) => reply.message.trim()),
    };
  }));

  return ideas.filter((idea) => idea.message.trim());
}

export async function createConcertIdea({ projectId, userId, authorName, message }) {
  if (!isDocumentId(projectId) || !isDocumentId(userId)) {
    throw new Error("No se pudo asociar la idea al concierto.");
  }

  const normalizedMessage = normalizeMessage(message);
  const db = getDb();
  const projectRef = getProjectRef(projectId);
  const ideaRef = projectRef.collection(IDEAS_COLLECTION).doc();

  await db.runTransaction(async (transaction) => {
    const projectSnapshot = await transaction.get(projectRef);
    if (!projectSnapshot.exists) throw new Error("El concierto ya no está disponible.");

    transaction.create(ideaRef, {
      userId,
      authorName: normalizeAuthorName(authorName),
      message: normalizedMessage,
      likeCount: 0,
      dislikeCount: 0,
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  const createdAt = new Date().toISOString();
  return {
    id: ideaRef.id,
    authorName: normalizeAuthorName(authorName),
    message: normalizedMessage,
    createdAt,
    createdAtLabel: formatMessageDate(createdAt),
    likeCount: 0,
    dislikeCount: 0,
    userReaction: null,
    replies: [],
  };
}

export async function createConcertIdeaReply({ projectId, ideaId, userId, authorName, message }) {
  if (![projectId, ideaId, userId].every(isDocumentId)) {
    throw new Error("No se pudo asociar la respuesta a la idea.");
  }

  const normalizedMessage = normalizeMessage(message);
  const db = getDb();
  const ideaRef = getProjectRef(projectId).collection(IDEAS_COLLECTION).doc(ideaId);
  const replyRef = ideaRef.collection(REPLIES_COLLECTION).doc();

  await db.runTransaction(async (transaction) => {
    const ideaSnapshot = await transaction.get(ideaRef);
    if (!ideaSnapshot.exists) throw new Error("La idea ya no está disponible.");

    transaction.create(replyRef, {
      userId,
      authorName: normalizeAuthorName(authorName),
      message: normalizedMessage,
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  const createdAt = new Date().toISOString();
  return {
    id: replyRef.id,
    authorName: normalizeAuthorName(authorName),
    message: normalizedMessage,
    createdAt,
    createdAtLabel: formatMessageDate(createdAt),
  };
}

export async function toggleConcertIdeaReaction({ projectId, ideaId, userId, reaction }) {
  if (![projectId, ideaId, userId].every(isDocumentId) || !REACTIONS.includes(reaction)) {
    throw new Error("La reacción no es válida.");
  }

  const db = getDb();
  const ideaRef = getProjectRef(projectId).collection(IDEAS_COLLECTION).doc(ideaId);
  const reactionRef = ideaRef.collection(REACTIONS_COLLECTION).doc(userId);

  return db.runTransaction(async (transaction) => {
    const [ideaSnapshot, reactionSnapshot] = await Promise.all([
      transaction.get(ideaRef),
      transaction.get(reactionRef),
    ]);
    if (!ideaSnapshot.exists) throw new Error("La idea ya no está disponible.");

    const previous = reactionSnapshot.exists ? reactionSnapshot.data().reaction : null;
    const next = previous === reaction ? null : reaction;
    const likeChange = Number(next === "like") - Number(previous === "like");
    const dislikeChange = Number(next === "dislike") - Number(previous === "dislike");

    if (next) {
      transaction.set(reactionRef, {
        reaction: next,
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      transaction.delete(reactionRef);
    }

    transaction.update(ideaRef, {
      likeCount: FieldValue.increment(likeChange),
      dislikeCount: FieldValue.increment(dislikeChange),
    });

    return {
      reaction: next,
      likeCount: Math.max(0, (ideaSnapshot.data().likeCount || 0) + likeChange),
      dislikeCount: Math.max(0, (ideaSnapshot.data().dislikeCount || 0) + dislikeChange),
    };
  });
}
