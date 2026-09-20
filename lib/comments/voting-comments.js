import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/firestore";

const PROJECTS_COLLECTION = "proyectos";
const COMMENTS_COLLECTION = "votingComments";
const MAX_COMMENT_LENGTH = 500;

function isDocumentId(value) {
  return typeof value === "string" && value.trim().length > 0 && !value.includes("/");
}

function getVotingCommentsReference(projectId) {
  return getDb()
    .collection(PROJECTS_COLLECTION)
    .doc(projectId)
    .collection(COMMENTS_COLLECTION);
}

function serializeComment(doc) {
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

export async function getVotingComments(projectId) {
  if (!isDocumentId(projectId)) {
    return [];
  }

  const snapshot = await getVotingCommentsReference(projectId)
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();

  return snapshot.docs
    .map(serializeComment)
    .filter((comment) => comment.message.trim());
}

export async function createVotingComment({ projectId, userId, authorName, message }) {
  if (!isDocumentId(projectId) || !isDocumentId(userId)) {
    throw new Error("El comentario no se pudo asociar a la votación.");
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
  const projectRef = db.collection(PROJECTS_COLLECTION).doc(projectId);
  const commentRef = getVotingCommentsReference(projectId).doc();

  await db.runTransaction(async (transaction) => {
    const projectSnapshot = await transaction.get(projectRef);

    if (!projectSnapshot.exists || projectSnapshot.data().votacionCerradaAt) {
      throw new Error("La votación ya no está disponible para comentarios.");
    }

    transaction.create(commentRef, {
      userId,
      authorName: normalizedAuthorName,
      message: normalizedMessage,
      createdAt: FieldValue.serverTimestamp(),
    });
  });
}
