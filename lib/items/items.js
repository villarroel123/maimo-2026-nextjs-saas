import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/firestore"; //para conectar con la base de datos

const COLLECTION = "tickets";

function serializeItem(doc) { //esta función agarra esos datos crudos y los limpia, transformándolos en un objeto de JavaScript plano y seguro.
  const data = doc.data();

  return {
    id: doc.id,
    title: data.title || "",
    description: data.description || "",
    status: data.status || "pending",
    published: Boolean(data.published),
    imageUrl: data.imageUrl || "",
    imagePath: data.imagePath || "",
    userId: data.userId,
    createdAt: data.createdAt?.toDate?.().toISOString() || null,
    updatedAt: data.updatedAt?.toDate?.().toISOString() || null,
  };
}

export async function listUserItems(userId) {//muestra los items del user
  const snapshot = await getDb()
    .collection(COLLECTION)
    .where("userId", "==", userId)//que traiga los datos solo de ese user
    .get();

  return snapshot.docs
    .map(serializeItem)//por cada item llama la funcion de serializacion
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

export async function listPublishedItems() {//muestra los items publicados y no filtra por usuario, para la home
  const snapshot = await getDb()
    .collection(COLLECTION)
    .where("published", "==", true)
    .get();

  return snapshot.docs
    .map(serializeItem)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

export async function getUserItem(userId, itemId) {//busca un item en especifico por su id, pero evalua si le pertenece al user
  const doc = await getDb().collection(COLLECTION).doc(itemId).get();

  if (!doc.exists) {
    return null;
  }

  const item = serializeItem(doc);

  if (item.userId !== userId) {
    return null;
  }

  return item;
}

export async function getPublishedItem(itemId) {//para obtener un item público individual, para la vista de detalle pública (/items/[id] o /tickets/[id]
  const doc = await getDb().collection(COLLECTION).doc(itemId).get();

  if (!doc.exists) {
    return null;
  }

  const item = serializeItem(doc);

  return item.published ? item : null;
}
///-----------Crear un nuevo item--------------///
export async function createUserItem(userId, data) {
  const now = FieldValue.serverTimestamp();

  await getDb().collection(COLLECTION).add({
    userId,
    title: data.title,
    description: data.description,
    status: data.status,
    published: data.published,
    imageUrl: data.imageUrl,
    imagePath: data.imagePath,
    createdAt: now,
    updatedAt: now,
  });
}
////------------Actualizar y Eliminar-----------////
export async function updateUserItem(userId, itemId, data) {
  const docRef = getDb().collection(COLLECTION).doc(itemId);
  const doc = await docRef.get();

  if (!doc.exists || doc.data().userId !== userId) {
    throw new Error("Item not found.");
  }

  await docRef.update({
    title: data.title,
    description: data.description,
    status: data.status,
    published: data.published,
    imageUrl: data.imageUrl,
    imagePath: data.imagePath,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function deleteUserItem(userId, itemId) {
  const docRef = getDb().collection(COLLECTION).doc(itemId);
  const doc = await docRef.get();

  if (!doc.exists || doc.data().userId !== userId) {
    throw new Error("Item not found.");
  }

  await docRef.delete();
}
