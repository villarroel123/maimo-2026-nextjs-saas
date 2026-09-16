import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/firestore";
import { isFanProjectConfirmed, isFanProjectVotable } from "@/lib/projects/fanproject-status";
import { getProjectsWithFanProjects } from "@/lib/projects/projects";

const VOTES_SUBCOLLECTION = "fanprojectVotes";

function isValidId(value) {
  return typeof value === "string" && value.trim().length > 0 && !value.includes("/");
}

function buildVoteCounts(votes) {
  return votes.reduce((counts, vote) => {
    if (isValidId(vote.fanprojectId)) {
      counts[vote.fanprojectId] = (counts[vote.fanprojectId] || 0) + 1;
    }

    return counts;
  }, {});
}

export async function getFanProjectVotingConcerts(uid) {
  const projects = await getProjectsWithFanProjects();

  const concerts = await Promise.all(
    projects.map(async (project) => {
      const confirmedFanProject = project.subitems.some((fanproject) =>
        isFanProjectConfirmed(fanproject.estado),
      );
      const candidates = project.subitems.filter((fanproject) =>
        isFanProjectVotable(fanproject.estado),
      );

      if (confirmedFanProject || candidates.length === 0) {
        return null;
      }

      const votesSnapshot = await getDb()
        .collection("proyectos")
        .doc(project.id)
        .collection(VOTES_SUBCOLLECTION)
        .get();
      const votes = votesSnapshot.docs.map((doc) => ({
        userId: doc.id,
        ...doc.data(),
      }));
      const voteCounts = buildVoteCounts(votes);

      return {
        ...project,
        candidates: candidates.map((fanproject) => ({
          ...fanproject,
          votes: voteCounts[fanproject.id] || 0,
        })),
        totalVotes: votes.length,
        userVote: uid ? votes.find((vote) => vote.userId === uid)?.fanprojectId || null : null,
      };
    }),
  );

  return concerts.filter(Boolean);
}

export async function getConfirmedFanProjectConcerts() {
  const projects = await getProjectsWithFanProjects();

  return projects
    .map((project) => ({
      ...project,
      fanprojects: project.subitems.filter((fanproject) =>
        isFanProjectConfirmed(fanproject.estado),
      ),
    }))
    .filter((project) => project.fanprojects.length > 0);
}

export async function submitFanProjectVote({ fanprojectId, projectId, userId }) {
  if (![fanprojectId, projectId, userId].every(isValidId)) {
    throw new Error("La votación no es válida.");
  }

  const db = getDb();
  const projectRef = db.collection("proyectos").doc(projectId);
  const voteRef = projectRef.collection(VOTES_SUBCOLLECTION).doc(userId);

  return db.runTransaction(async (transaction) => {
    const [projectSnapshot, fanprojectsSnapshot, existingVoteSnapshot] = await Promise.all([
      transaction.get(projectRef),
      transaction.get(projectRef.collection("fanprojects")),
      transaction.get(voteRef),
    ]);

    if (!projectSnapshot.exists) {
      throw new Error("El concierto no existe.");
    }

    const fanprojects = fanprojectsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    const selectedFanProject = fanprojects.find((fanproject) => fanproject.id === fanprojectId);

    if (!selectedFanProject || !isFanProjectVotable(selectedFanProject.estado)) {
      throw new Error("Ese fanproject ya no está disponible para votar.");
    }

    if (fanprojects.some((fanproject) => isFanProjectConfirmed(fanproject.estado))) {
      throw new Error("La votación de este concierto ya finalizó.");
    }

    if (existingVoteSnapshot.exists) {
      return { alreadyVoted: true };
    }

    transaction.create(voteRef, {
      fanprojectId,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { alreadyVoted: false };
  });
}
