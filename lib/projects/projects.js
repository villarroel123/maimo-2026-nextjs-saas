import { getFirestore } from "firebase-admin/firestore";
import { getAdminApp } from "@/lib/firebase/admin";

const COLLECTION = "proyectos";

function getDb() {
  getAdminApp();
  return getFirestore();
}

export async function getProjects() {
  try {
    const snapshot = await getDb().collection(COLLECTION).get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}

export async function getProjectWithDetails(id) {
  try {
    const db = getDb();
    const docRef = db.collection(COLLECTION).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      console.log("El concierto principal no existe con ID:", id);
      return null;
    }

    const subitemsSnapshot = await docRef.collection("fanprojects").get();
    
    // 👇 Agrega esto para ver en tu terminal si encuentra documentos o si está vacío
    console.log(`Buscando subcolección 'fanprojects' en proyecto ${id}. Encontrados:`, subitemsSnapshot.size);

    const subitems = subitemsSnapshot.docs.map((subDoc) => {
      console.log("Documento de actividad encontrado:", subDoc.id, subDoc.data());
      return {
        id: subDoc.id,
        ...subDoc.data(),
      };
    });

    return {
      id: docSnap.id,
      ...docSnap.data(),
      subitems,
    };
  } catch (error) {
    console.error("Error fetching project details:", error);
    return null;
  }
}

// 2. Función para el detalle individual de cada actividad
export async function getActivityDetails(projectId, activityId) {
  if (!projectId || !activityId) {
    console.error("IDs inválidos recibidos:", { projectId, activityId });
    return null;
  }

  try {
    const db = getDb();
    const docSnap = await db
      .collection(COLLECTION)
      .doc(projectId)
      .collection("fanprojects") 
      .doc(activityId)
      .get();

    if (!docSnap.exists) return null;

    return {
      id: docSnap.id,
      ...docSnap.data(),
    };
  } catch (error) {
    console.error("Error fetching activity details:", error);
    return null;
  }
}