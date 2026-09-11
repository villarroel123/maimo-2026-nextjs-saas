import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/firestore";
import { getFavoriteKey } from "@/lib/favorites/favorite-key";

const USERS_COLLECTION = "users";
const PROJECTS_COLLECTION = "proyectos";

function isValidId(value) {
  return typeof value === "string" && value.trim().length > 0 && !value.includes("/");
}

function normalizeTarget(target) {
  const type = target?.type;
  const projectId = target?.projectId?.trim();
  const activityId = target?.activityId?.trim();

  if (!isValidId(projectId) || !["project", "fanproject"].includes(type)) {
    throw new Error("Invalid favorite target.");
  }

  if (type === "fanproject" && !isValidId(activityId)) {
    throw new Error("Invalid fanproject target.");
  }

  return { type, projectId, activityId: type === "fanproject" ? activityId : null };
}

function getFavoriteRef(uid, target) {
  return getDb()
    .collection(USERS_COLLECTION)
    .doc(uid)
    .collection("favorites")
    .doc(getFavoriteKey(target));
}

function serializeFavorite(doc) {
  const data = doc.data();

  return {
    id: doc.id,
    type: data.type,
    projectId: data.projectId,
    activityId: data.activityId || null,
    title: data.title || "Sin título",
    description: data.description || "",
    href: data.href || "/",
    image: data.image || "",
    createdAt: data.createdAt?.toDate?.().toISOString() || null,
  };
}

async function getFavoriteData(target) {
  const projectRef = getDb().collection(PROJECTS_COLLECTION).doc(target.projectId);
  const projectSnapshot = await projectRef.get();

  if (!projectSnapshot.exists) {
    throw new Error("Project not found.");
  }

  const project = projectSnapshot.data();

  if (target.type === "project") {
    return {
      ...target,
      title: project.Titulo || "Concierto sin título",
      description: [project.Pais, project["Dia del concierto"]].filter(Boolean).join(" • "),
      href: `/projects/${target.projectId}`,
      image: project.imagen || "",
    };
  }

  const activitySnapshot = await projectRef.collection("fanprojects").doc(target.activityId).get();

  if (!activitySnapshot.exists) {
    throw new Error("Fanproject not found.");
  }

  const activity = activitySnapshot.data();

  return {
    ...target,
    title: activity.titulo || "Fanproject sin título",
    description: project.Titulo || "Concierto",
    href: `/projects/${target.projectId}/activities/${target.activityId}`,
    image: "",
  };
}

export async function getFavoritesForUser(uid) {
  const snapshot = await getDb()
    .collection(USERS_COLLECTION)
    .doc(uid)
    .collection("favorites")
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map(serializeFavorite);
}

export async function toggleFavoriteForUser(uid, rawTarget) {
  const target = normalizeTarget(rawTarget);
  const favoriteRef = getFavoriteRef(uid, target);
  const existingFavorite = await favoriteRef.get();

  if (existingFavorite.exists) {
    await favoriteRef.delete();
    return false;
  }

  const favoriteData = await getFavoriteData(target);

  await favoriteRef.set({
    ...favoriteData,
    createdAt: FieldValue.serverTimestamp(),
  });

  return true;
}
