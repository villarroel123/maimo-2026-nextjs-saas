import { getFirestore } from "firebase-admin/firestore";
import { getAdminApp } from "@/lib/firebase/admin";
import { DEFAULT_FANPROJECT_STATUS, getFanProjectStatus } from "@/lib/projects/fanproject-status";
import { parseSectorInstructions } from "@/lib/projects/sector-instructions";
import { DEFAULT_FANPROJECT_IMAGE } from "@/lib/projects/fanproject-image";

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

export async function getProject(id) {
  if (typeof id !== "string" || !id || id.includes("/")) return null;

  const snapshot = await getDb().collection(COLLECTION).doc(id).get();
  return snapshot.exists ? { id: snapshot.id, ...snapshot.data() } : null;
}

function normalizeVenue(data) {
  const venuePlaceId = typeof data.venuePlaceId === "string" ? data.venuePlaceId.trim().slice(0, 512) : "";
  const venueManualName = venuePlaceId
    ? ""
    : typeof data.venueManualName === "string" ? data.venueManualName.trim().slice(0, 160) : "";

  return { venuePlaceId, venueManualName };
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

export async function getRelatedFanProjects(projectId, activityId) {
  if (!projectId || !activityId) {
    return [];
  }

  try {
    const snapshot = await getDb()
      .collection(COLLECTION)
      .doc(projectId)
      .collection("fanprojects")
      .get();

    return snapshot.docs
      .filter((doc) => doc.id !== activityId)
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  } catch (error) {
    console.error("Error fetching related fanprojects:", error);
    return [];
  }
}

export async function createProject(data) {
  try {
    const db = getDb();
    const venue = normalizeVenue(data);
    const docRef = await db.collection(COLLECTION).add({
      Titulo: data.titulo,
      Pais: data.pais,
      "Dia del concierto": data.fecha,
      Ubicacion: data.ubicacion || "",
      ...venue,
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
    const author = data.author || {};
    const fanbase = data.fanbase || null;
    const docRef = await subRef.add({
      titulo: data.titulo,
      descripcion: data.descripcion,
      elementos: data.elementos ? data.elementos.split(",").map(item => item.trim()) : [],
      imagen: DEFAULT_FANPROJECT_IMAGE,
      estado: getFanProjectStatus(data.estado).value,
      instruccionesPorSector: parseSectorInstructions(data.instruccionesPorSector),
      authorId: typeof author.uid === "string" ? author.uid : "",
      authorName: typeof author.name === "string" && author.name.trim() ? author.name.trim() : "Fan de Narabi",
      authorPhotoURL: typeof author.photoURL === "string" ? author.photoURL.trim() : "",
      fanbaseId: typeof fanbase?.id === "string" ? fanbase.id : "",
      fanbaseName: typeof fanbase?.name === "string" ? fanbase.name : "",
      fanbaseKpopGroup: typeof fanbase?.kpopGroup === "string" ? fanbase.kpopGroup : "",
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
    const venue = normalizeVenue(data);
    const projectRef = db.collection(COLLECTION).doc(projectId);
    const projectSnapshot = await projectRef.get();

    if (!projectSnapshot.exists) {
      return { success: false, error: "El concierto no existe." };
    }

    const previousProject = projectSnapshot.data();
    const changes = [];

    if ((previousProject["Dia del concierto"] || "") !== data.fecha) {
      changes.push("fecha y horario");
    }

    if (
      (previousProject.Pais || "") !== data.pais ||
      (previousProject.Ubicacion || "") !== (data.ubicacion || "")
    ) {
      changes.push("ubicación");
    }

    if (
      (previousProject.venuePlaceId || "") !== venue.venuePlaceId ||
      (previousProject.venueManualName || "") !== venue.venueManualName
    ) {
      changes.push("recinto");
    }

    await projectRef.update({
      Titulo: data.titulo,
      Pais: data.pais,
      "Dia del concierto": data.fecha,
      Ubicacion: data.ubicacion || "",
      ...venue,
      imagen: data.imagen || "", // 👈 Nuevo campo
      updatedAt: new Date().toISOString()
    });
    return { success: true, changes, title: data.titulo };
  } catch (error) {
    console.error("Error al actualizar proyecto:", error);
    return { success: false, error: error.message };
  }
}

export async function updateFanProject(projectId, activityId, data) {
  try {
    const db = getDb();
    const activityRef = db
      .collection(COLLECTION)
      .doc(projectId)
      .collection("fanprojects")
      .doc(activityId);
    const activitySnapshot = await activityRef.get();

    if (!activitySnapshot.exists) {
      return { success: false, error: "El fanproject no existe." };
    }

    const previousStatus = getFanProjectStatus(activitySnapshot.data().estado).value;
    const nextStatus = getFanProjectStatus(data.estado || DEFAULT_FANPROJECT_STATUS);
    const hasFanbaseUpdate = Object.prototype.hasOwnProperty.call(data, "fanbase");
    const fanbase = data.fanbase || null;

    await activityRef
      .update({
      titulo: data.titulo,
      descripcion: data.descripcion,
      elementos: data.elementos ? data.elementos.split(",").map(item => item.trim()) : [],
      estado: nextStatus.value,
      instruccionesPorSector: parseSectorInstructions(data.instruccionesPorSector),
      ...(hasFanbaseUpdate ? {
        fanbaseId: typeof fanbase?.id === "string" ? fanbase.id : "",
        fanbaseName: typeof fanbase?.name === "string" ? fanbase.name : "",
        fanbaseKpopGroup: typeof fanbase?.kpopGroup === "string" ? fanbase.kpopGroup : "",
      } : {}),
      updatedAt: new Date().toISOString()
      });
    return {
      success: true,
      statusChanged: previousStatus !== nextStatus.value,
      statusLabel: nextStatus.label,
      title: data.titulo,
    };
  } catch (error) {
    console.error("Error al actualizar la actividad:", error);
    return { success: false, error: error.message };
  }
}

export async function getProjectsWithFanProjects() {
  const projects = await getProjects();

  return Promise.all(
    projects.map(async (project) => {
      const snapshot = await getDb()
        .collection(COLLECTION)
        .doc(project.id)
        .collection("fanprojects")
        .get();

      return {
        ...project,
        subitems: snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })),
      };
    }),
  );
}
