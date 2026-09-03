import { getDb } from "@/lib/firebase/firebase-admin";

const COLLECTION = "proyectos";

// Obtener todos los proyectos principales para la Home
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

// Obtener un proyecto específico junto con sus elementos de la subcolección
export async function getProjectWithDetails(projectId) {
  try {
    const db = getDb();
    
    // 1. Obtener documento principal del proyecto
    const projectDoc = await db.collection(COLLECTION).doc(projectId).get();
    if (!projectDoc.exists) return null;

    // 2. Obtener la subcolección interna de elementos
    const subitemsSnapshot = await db
      .collection(COLLECTION)
      .doc(projectId)
      .collection("proyectos")
      .get();
      
    const subitems = subitemsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      id: projectDoc.id,
      ...projectDoc.data(),
      subitems,
    };
  } catch (error) {
    console.error("Error fetching project details:", error);
    return null;
  }
}