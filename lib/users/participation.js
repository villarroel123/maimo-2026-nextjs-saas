import { getDb } from "@/lib/firebase/firestore";
import { getProjectsWithFanProjects } from "@/lib/projects/projects";

function isDocumentId(value) {
  return typeof value === "string" && value.trim().length > 0 && !value.includes("/");
}

function toIsoDate(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.toDate?.().toISOString?.() || null;
}

function getPathPart(doc, collectionName) {
  const parts = doc.ref.path.split("/");
  const index = parts.indexOf(collectionName);
  return index >= 0 ? parts[index + 1] || "" : "";
}

function createEvent(project) {
  return {
    projectId: project.id,
    title: project.Titulo || project.Grupo || "Concierto",
    group: project.Grupo || "Grupo por confirmar",
    country: project.Pais || "Lugar a confirmar",
    date: project["Dia del concierto"] || "Fecha a confirmar",
    image: project.imagen || "",
    activities: [],
    latestAt: null,
  };
}

function addActivity(events, projectsById, projectId, activity) {
  const project = projectsById.get(projectId);
  if (!project) return;

  const event = events.get(projectId) || createEvent(project);
  const duplicate = event.activities.some((item) => (
    item.type === activity.type && item.detail === activity.detail
  ));

  if (!duplicate) event.activities.push(activity);
  if (activity.createdAt && (!event.latestAt || activity.createdAt > event.latestAt)) {
    event.latestAt = activity.createdAt;
  }
  events.set(projectId, event);
}

export async function getUserParticipationHistory(uid) {
  if (!isDocumentId(uid)) return [];

  try {
    const db = getDb();
    const [projects, votesSnapshot, votingCommentsSnapshot, ideasSnapshot, commentsSnapshot, repliesSnapshot] = await Promise.all([
      getProjectsWithFanProjects(),
      db.collectionGroup("fanprojectVotes").get(),
      db.collectionGroup("votingComments").get(),
      db.collectionGroup("ideas").get(),
      db.collectionGroup("comments").get(),
      db.collectionGroup("replies").get(),
    ]);
    const projectsById = new Map(projects.map((project) => [project.id, project]));
    const events = new Map();

    for (const vote of votesSnapshot.docs) {
      if (vote.id !== uid && vote.data().userId !== uid) continue;
      const projectId = getPathPart(vote, "proyectos");
      const project = projectsById.get(projectId);
      const selected = project?.subitems?.find((item) => item.id === vote.data().fanprojectId);
      addActivity(events, projectsById, projectId, {
        type: "vote",
        label: "Votaste",
        detail: selected?.titulo || "Participaste en la votación",
        createdAt: toIsoDate(vote.data().createdAt),
      });
    }

    for (const comment of votingCommentsSnapshot.docs) {
      if (comment.data().userId !== uid) continue;
      addActivity(events, projectsById, getPathPart(comment, "proyectos"), {
        type: "voting-comment",
        label: "Comentaste la votación",
        detail: comment.data().message || "Dejaste un comentario",
        createdAt: toIsoDate(comment.data().createdAt),
      });
    }

    for (const idea of ideasSnapshot.docs) {
      if (idea.data().userId !== uid) continue;
      addActivity(events, projectsById, getPathPart(idea, "proyectos"), {
        type: "idea",
        label: "Propusiste una idea",
        detail: idea.data().message || "Participaste con una propuesta",
        createdAt: toIsoDate(idea.data().createdAt),
      });
    }

    for (const comment of commentsSnapshot.docs) {
      if (comment.data().userId !== uid) continue;
      const projectId = getPathPart(comment, "proyectos");
      const fanprojectId = getPathPart(comment, "fanprojects");
      const fanproject = projectsById.get(projectId)?.subitems?.find((item) => item.id === fanprojectId);
      addActivity(events, projectsById, projectId, {
        type: "fanproject-comment",
        label: "Comentaste un fanproject",
        detail: fanproject?.titulo || comment.data().message || "Participaste en el fanproject",
        createdAt: toIsoDate(comment.data().createdAt),
      });
    }

    for (const reply of repliesSnapshot.docs) {
      if (reply.data().userId !== uid) continue;
      const projectId = getPathPart(reply, "proyectos");
      const fanprojectId = getPathPart(reply, "fanprojects");
      const fanproject = projectsById.get(projectId)?.subitems?.find((item) => item.id === fanprojectId);
      addActivity(events, projectsById, projectId, {
        type: "reply",
        label: "Respondiste",
        detail: fanproject?.titulo || reply.data().message || "Participaste en una conversación",
        createdAt: toIsoDate(reply.data().createdAt),
      });
    }

    return [...events.values()]
      .map((event) => ({
        ...event,
        activities: event.activities.sort((first, second) => String(second.createdAt || "").localeCompare(String(first.createdAt || ""))),
      }))
      .sort((first, second) => String(second.latestAt || "").localeCompare(String(first.latestAt || "")))
      .slice(0, 12);
  } catch (error) {
    console.error("Could not load user participation history:", error);
    return [];
  }
}
