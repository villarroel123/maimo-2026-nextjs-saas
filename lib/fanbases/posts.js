import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/firestore";

const FANBASE_COLLECTION = "fanbases";
const POSTS_COLLECTION = "posts";

export const FANBASE_POST_CATEGORIES = {
  aviso: "Aviso",
  merch: "Merch",
  tutorial: "Tutorial",
};

function isDocumentId(value) {
  return typeof value === "string" && value.trim().length > 0 && !value.includes("/");
}

function normalizeText(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeLink(value) {
  const raw = normalizeText(value, 500);
  if (!raw) return "";

  try {
    const url = new URL(raw);
    if (url.protocol === "https:" || url.protocol === "http:") return url.toString();
  } catch {
    // El mensaje de validación se muestra abajo.
  }

  throw new Error("El enlace debe comenzar con https:// o http://.");
}

function toPostPayload(data) {
  const title = normalizeText(data.title, 120);
  const body = normalizeText(data.body, 2000);
  if (!title || !body) {
    throw new Error("El título y el contenido de la publicación son obligatorios.");
  }

  return {
    title,
    body,
    category: FANBASE_POST_CATEGORIES[data.category] ? data.category : "aviso",
    linkUrl: normalizeLink(data.linkUrl),
  };
}

function serializePost(doc) {
  const data = doc.data();

  return {
    id: doc.id,
    title: normalizeText(data.title, 120),
    body: normalizeText(data.body, 2000),
    category: FANBASE_POST_CATEGORIES[data.category] ? data.category : "aviso",
    linkUrl: normalizeLink(data.linkUrl || ""),
    authorName: normalizeText(data.authorName, 80) || "Equipo de la fanbase",
    createdAt: data.createdAt?.toDate?.().toISOString() || null,
    updatedAt: data.updatedAt?.toDate?.().toISOString() || null,
    updatedByName: normalizeText(data.updatedByName, 80),
  };
}

export async function getFanbasePosts(fanbaseId) {
  if (!isDocumentId(fanbaseId)) return [];

  const snapshot = await getDb()
    .collection(FANBASE_COLLECTION)
    .doc(fanbaseId)
    .collection(POSTS_COLLECTION)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map(serializePost);
}

export async function createFanbasePost({ fanbaseId, author, data }) {
  if (!isDocumentId(fanbaseId) || !isDocumentId(author?.uid)) {
    throw new Error("No se pudo identificar la fanbase o la persona que publica.");
  }

  const fanbaseRef = getDb().collection(FANBASE_COLLECTION).doc(fanbaseId);
  const fanbase = await fanbaseRef.get();
  if (!fanbase.exists) throw new Error("La fanbase ya no está disponible.");

  const postRef = await fanbaseRef.collection(POSTS_COLLECTION).add({
    ...toPostPayload(data),
    authorId: author.uid,
    authorName: normalizeText(author.displayName, 80) || "Equipo de la fanbase",
    createdAt: FieldValue.serverTimestamp(),
  });

  return postRef.id;
}

export async function updateFanbasePost({ fanbaseId, postId, editor, data }) {
  if (!isDocumentId(fanbaseId) || !isDocumentId(postId) || !isDocumentId(editor?.uid)) {
    throw new Error("No se pudo identificar la publicación o la persona que la edita.");
  }

  const fanbaseRef = getDb().collection(FANBASE_COLLECTION).doc(fanbaseId);
  const postRef = fanbaseRef.collection(POSTS_COLLECTION).doc(postId);
  const [fanbase, post] = await Promise.all([fanbaseRef.get(), postRef.get()]);
  if (!fanbase.exists || !post.exists) {
    throw new Error("La publicación ya no está disponible.");
  }

  await postRef.update({
    ...toPostPayload(data),
    updatedAt: FieldValue.serverTimestamp(),
    updatedById: editor.uid,
    updatedByName: normalizeText(editor.displayName, 80) || "Integrante de la fanbase",
  });
}

export async function deleteFanbasePost(fanbaseId, postId) {
  if (!isDocumentId(fanbaseId) || !isDocumentId(postId)) {
    throw new Error("La publicación no es válida.");
  }

  await getDb()
    .collection(FANBASE_COLLECTION)
    .doc(fanbaseId)
    .collection(POSTS_COLLECTION)
    .doc(postId)
    .delete();
}
