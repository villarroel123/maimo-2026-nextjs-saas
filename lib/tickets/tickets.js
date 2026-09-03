import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/firestore"; //para conectar con la base de datos

const COLLECTION = "tickets";
function serializeTicket(doc) {  //esta función agarra esos datos crudos y los limpia, transformándolos en un objeto de JavaScript plano y seguro.
  const data = doc.data();

  return {
    id: doc.id,
    title: data.title || "", 
    artist: data.artist || "",
    venue: data.venue || "",
    eventDate: data.eventDate || "", 
    sector: data.sector || "",
    originalPrice: Number(data.originalPrice) || 0,
    resalePrice: Number(data.resalePrice) || 0,
    reasonForSale: data.reasonForSale || "",
    description: data.description || "",
    status: data.status || "available",
    published: Boolean(data.published),
    imageUrl: data.imageUrl || "",
    imagePath: data.imagePath || "",
    userId: data.userId, // <--- CORREGIDO: estaba como doc.userId
    createdAt: data.createdAt?.toDate?.().toISOString() || null,
    updatedAt: data.updatedAt?.toDate?.().toISOString() || null,
  };
}
export async function listUserTickets(userId) {//muestra los items del user
  const snapshot = await getDb()
    .collection(COLLECTION)
    .where("userId", "==", userId)//que traiga los datos solo de ese user
    .get();

  return snapshot.docs
    .map(serializeTicket)//por cada item llama la funcion de serializacion
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

export async function listPublishedTickets() {//muestra los items publicados y no filtra por usuario, para la home
  const snapshot = await getDb()
    .collection(COLLECTION)
    .where("published", "==", true)
    .get();

  return snapshot.docs
    .map(serializeTicket)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

export async function getUserTicket(userId, ticketId) {//busca un item en especifico por su id, pero evalua si le pertenece al user
  const doc = await getDb().collection(COLLECTION).doc(ticketId).get();

  if (!doc.exists) {
    return null;
  }

  const ticket = serializeTicket(doc);

  if (ticket.userId !== userId) {
    return null;
  }

  return ticket;
}

export async function getPublishedTicket(ticketId) {//para obtener un item público individual, para la vista de detalle pública (/items/[id] o /tickets/[id]
  const doc = await getDb().collection(COLLECTION).doc(ticketId).get();
  if (!doc.exists) return null;
  const ticket = serializeTicket(doc);
  return ticket.published ? ticket : null;
}
///-----------Crear un nuevo item--------------///
export async function createUserTicket(userId, data) {
  const originalPrice = Number(data.originalPrice) || 0;
  const resalePrice = Number(data.resalePrice) || 0;
  // el precio de reventa nunca puede ser mayor al precio original.
  if (resalePrice > originalPrice) {
    throw new Error("El precio de reventa no puede superar el valor nominal original de la entrada.");
  }

  const now = FieldValue.serverTimestamp();

  await getDb().collection(COLLECTION).add({
    userId,
    title: data.title,
    artist: data.artist || "",
    venue: data.venue || "",
    eventDate: data.eventDate || "",
    sector: data.sector || "",
    originalPrice,
    resalePrice,
    reasonForSale: data.reasonForSale || "",
    description: data.description || "",
    status: "available",
    published: Boolean(data.published),
    imageUrl: data.imageUrl || "",
    imagePath: data.imagePath || "",
    createdAt: now,
    updatedAt: now,
  });
}
////------------Actualizar y Eliminar-----------////
export async function updateUserTicket(userId, ticketId, data) {
  const docRef = getDb().collection(COLLECTION).doc(ticketId);
  const doc = await docRef.get();

  if (!doc.exists || doc.data().userId !== userId) {
    throw new Error("Ticket not found.");
  }

  const originalPrice = Number(data.originalPrice) || 0;
  const resalePrice = Number(data.resalePrice) || 0;

  if (resalePrice > originalPrice) {
    throw new Error("El precio de reventa no puede superar el valor nominal original.");
  }

  await docRef.update({
    title: data.title,
    artist: data.artist || "",
    venue: data.venue || "",
    eventDate: data.eventDate || "",
    sector: data.sector || "",
    originalPrice,
    resalePrice,
    reasonForSale: data.reasonForSale || "",
    description: data.description || "",
    published: Boolean(data.published),
    imageUrl: data.imageUrl || "",
    imagePath: data.imagePath || "",
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function deleteUserTicket(userId, ticketId) {
  const docRef = getDb().collection(COLLECTION).doc(ticketId);
  const doc = await docRef.get();

  if (!doc.exists || doc.data().userId !== userId) {
    throw new Error("Ticket not found.");
  }

  await docRef.delete();
}
