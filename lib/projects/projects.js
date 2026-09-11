import { getFirestore } from "firebase-admin/firestore";
import { getAdminApp } from "@/lib/firebase/admin";
import { DEFAULT_FANPROJECT_STATUS, getFanProjectStatus } from "@/lib/projects/fanproject-status";
import { parseSectorInstructions } from "@/lib/projects/sector-instructions";

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
export async function createProject(data) {
  try {
    const db = getDb();
    const docRef = await db.collection(COLLECTION).add({
      Titulo: data.titulo,
      Pais: data.pais,
      "Dia del concierto": data.fecha,
      imagen: data.imagen || "", 
      createdAt: new Date().toISOString()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error al crear proyecto:", error);
    return { success: false, error: error.message };
  }
}

export async function createFanProject(projectId, data) {
  try {
    const db = getDb();
    const subRef = db.collection(COLLECTION).doc(projectId).collection("fanprojects");
    const docRef = await subRef.add({
      titulo: data.titulo,
      descripcion: data.descripcion,
      elementos: data.elementos ? data.elementos.split(",").map(item => item.trim()) : [],
      estado: getFanProjectStatus(data.estado).value,
      instruccionesPorSector: parseSectorInstructions(data.instruccionesPorSector),
      createdAt: new Date().toISOString()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error al crear actividad:", error);
    return { success: false, error: error.message };
  }
}
export async function deleteProject(projectId) {
  try {
    const db = getDb();
    
    await db.collection(COLLECTION).doc(projectId).delete();
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar el proyecto:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteFanProject(projectId, activityId) {
  try {
    const db = getDb();
    await db
      .collection(COLLECTION)
      .doc(projectId)
      .collection("fanprojects")
      .doc(activityId)
      .delete();
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar la actividad:", error);
    return { success: false, error: error.message };
  }
}

export async function updateProject(projectId, data) {
  try {
    const db = getDb();
    await db.collection(COLLECTION).doc(projectId).update({
      Titulo: data.titulo,
      Pais: data.pais,
      "Dia del concierto": data.fecha,
      imagen: data.imagen || "", // 👈 Nuevo campo
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar proyecto:", error);
    return { success: false, error: error.message };
  }
}

export async function updateFanProject(projectId, activityId, data) {
  try {
    const db = getDb();
    await db
      .collection(COLLECTION)
      .doc(projectId)
      .collection("fanprojects")
      .doc(activityId)
      .update({
      titulo: data.titulo,
      descripcion: data.descripcion,
      elementos: data.elementos ? data.elementos.split(",").map(item => item.trim()) : [],
      estado: getFanProjectStatus(data.estado || DEFAULT_FANPROJECT_STATUS).value,
      instruccionesPorSector: parseSectorInstructions(data.instruccionesPorSector),
      updatedAt: new Date().toISOString()
      });
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar la actividad:", error);
    return { success: false, error: error.message };
  }
}
