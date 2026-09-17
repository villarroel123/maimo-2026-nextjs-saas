import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/firestore";

const PROJECTS_COLLECTION = "proyectos";
const FANPROJECTS_COLLECTION = "fanprojects";
const COMMENTS_COLLECTION = "comments";
const REPLIES_COLLECTION = "replies";
const MAX_COMMENT_LENGTH = 500;

function isDocumentId(value) {
  return typeof value === "string" && value.trim().length > 0 && !value.includes("/");
}

function getFanprojectReference(projectId, fanprojectId) {
  return getDb()
    .collection(PROJECTS_COLLECTION)
    .doc(projectId)
    .collection(FANPROJECTS_COLLECTION)
    .doc(fanprojectId);
}

function serializeMessage(doc) {
  const data = doc.data();

  return {
    id: doc.id,
    authorName:
      typeof data.authorName === "string" && data.authorName.trim()
        ? data.authorName
        : "Fan de Narabi",
    message: typeof data.message === "string" ? data.message : "",
    createdAt: data.createdAt?.toDate?.().toISOString() ?? null,
  };
}

export async function getFanprojectComments(projectId, fanprojectId) {
  if (!isDocumentId(projectId) || !isDocumentId(fanprojectId)) {
    return [];
  }

  const snapshot = await getFanprojectReference(projectId, fanprojectId)
    .collection(COMMENTS_COLLECTION)
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();

  const comments = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const comment = serializeMessage(doc);

      if (!comment.message.trim()) {
        return null;
      }

      const repliesSnapshot = await doc.ref
        .collection(REPLIES_COLLECTION)
        .orderBy("createdAt", "asc")
        .limit(50)
        .get();

      return {
        ...comment,
        replies: repliesSnapshot.docs
          .map(serializeMessage)
          .filter((reply) => reply.message.trim()),
      };
    }),
  );

  return comments.filter(Boolean);
}

export async function createFanprojectComment({
  projectId,
  fanprojectId,
  userId,
  authorName,
  message,
}) {
  if (
    !isDocumentId(projectId) ||
    !isDocumentId(fanprojectId) ||
    !isDocumentId(userId)
  ) {
    throw new Error("El comentario no se pudo asociar al fanproject.");
  }

  const normalizedMessage = typeof message === "string" ? message.trim() : "";

  if (!normalizedMessage || normalizedMessage.length > MAX_COMMENT_LENGTH) {
    throw new Error("El comentario debe tener entre 1 y 500 caracteres.");
  }

  const normalizedAuthorName =
    typeof authorName === "string" && authorName.trim()
      ? authorName.trim().slice(0, 80)
      : "Fan de Narabi";
  const db = getDb();
  const fanprojectRef = getFanprojectReference(projectId, fanprojectId);
  const commentRef = fanprojectRef.collection(COMMENTS_COLLECTION).doc();

  await db.runTransaction(async (transaction) => {
    const fanprojectSnapshot = await transaction.get(fanprojectRef);

    if (!fanprojectSnapshot.exists) {
      throw new Error("El fanproject ya no está disponible.");
    }

    transaction.create(commentRef, {
      userId,
      authorName: normalizedAuthorName,
      message: normalizedMessage,
      createdAt: FieldValue.serverTimestamp(),
    });
  });
}

export async function createFanprojectReply({
  projectId,
  fanprojectId,
  commentId,
  userId,
  authorName,
  message,
}) {
  if (
    !isDocumentId(projectId) ||
    !isDocumentId(fanprojectId) ||
    !isDocumentId(commentId) ||
    !isDocumentId(userId)
  ) {
    throw new Error("La respuesta no se pudo asociar al comentario.");
  }

  const normalizedMessage = typeof message === "string" ? message.trim() : "";

  if (!normalizedMessage || normalizedMessage.length > MAX_COMMENT_LENGTH) {
    throw new Error("La respuesta debe tener entre 1 y 500 caracteres.");
  }

  const normalizedAuthorName =
    typeof authorName === "string" && authorName.trim()
      ? authorName.trim().slice(0, 80)
      : "Fan de Narabi";
  const db = getDb();
  const fanprojectRef = getFanprojectReference(projectId, fanprojectId);
  const commentRef = fanprojectRef.collection(COMMENTS_COLLECTION).doc(commentId);
  const replyRef = commentRef.collection(REPLIES_COLLECTION).doc();

  await db.runTransaction(async (transaction) => {
    const fanprojectSnapshot = await transaction.get(fanprojectRef);
    const commentSnapshot = await transaction.get(commentRef);

    if (!fanprojectSnapshot.exists || !commentSnapshot.exists) {
      throw new Error("El comentario ya no está disponible.");
    }

    transaction.create(replyRef, {
      userId,
      authorName: normalizedAuthorName,
      message: normalizedMessage,
      createdAt: FieldValue.serverTimestamp(),
    });
  });
}
