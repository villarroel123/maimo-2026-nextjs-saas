import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/firestore";
import { isFanProjectConfirmed, isFanProjectVotable } from "@/lib/projects/fanproject-status";
import { getProjectsWithFanProjects } from "@/lib/projects/projects";

const VOTES_SUBCOLLECTION = "fanprojectVotes";
const REACTIONS_SUBCOLLECTION = "votingReactions";
const VOTING_REACTIONS = ["like", "dislike"];

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

function buildReactionCounts(reactions) {
  return reactions.reduce(
    (counts, reaction) => {
      if (VOTING_REACTIONS.includes(reaction.reaction)) {
        counts[reaction.reaction] += 1;
      }

      return counts;
    },
    { like: 0, dislike: 0 },
  );
}

export async function getFanProjectVotingConcerts(uid) {
  const projects = await getProjectsWithFanProjects();

  const concerts = await Promise.all(
    projects.map(async (project) => {
      if (project.votacionCerradaAt) {
        return null;
      }

      const confirmedFanProject = project.subitems.some((fanproject) =>
        isFanProjectConfirmed(fanproject.estado),
      );
      const candidates = project.subitems.filter((fanproject) =>
        isFanProjectVotable(fanproject.estado),
      );

      if (confirmedFanProject || candidates.length === 0) {
        return null;
      }

      const projectRef = getDb().collection("proyectos").doc(project.id);
      const [votesSnapshot, reactionsSnapshot] = await Promise.all([
        projectRef.collection(VOTES_SUBCOLLECTION).get(),
        projectRef.collection(REACTIONS_SUBCOLLECTION).get(),
      ]);
      const votes = votesSnapshot.docs.map((doc) => ({
        userId: doc.id,
        ...doc.data(),
      }));
      const reactions = reactionsSnapshot.docs.map((doc) => ({
        userId: doc.id,
        ...doc.data(),
      }));
      const voteCounts = buildVoteCounts(votes);
      const reactionCounts = buildReactionCounts(reactions);

      return {
        ...project,
        candidates: candidates.map((fanproject) => ({
          ...fanproject,
          votes: voteCounts[fanproject.id] || 0,
        })),
        totalVotes: votes.length,
        userVote: uid ? votes.find((vote) => vote.userId === uid)?.fanprojectId || null : null,
        reactionCounts,
        userReaction: uid ? reactions.find((reaction) => reaction.userId === uid)?.reaction || null : null,
      };
    }),
  );

  return concerts.filter(Boolean);
}

export async function getFanProjectVoteSummary(project) {
  if (!project?.id || !Array.isArray(project.subitems)) {
    return null;
  }

  const votesSnapshot = await getDb()
    .collection("proyectos")
    .doc(project.id)
    .collection(VOTES_SUBCOLLECTION)
    .get();
  const votes = votesSnapshot.docs.map((doc) => doc.data());
  const voteCounts = buildVoteCounts(votes);
  const isClosed = Boolean(project.votacionCerradaAt);
  const winner = isClosed
    ? project.subitems.find((fanproject) => fanproject.id === project.votacionGanadoraId) || null
    : null;
  const candidates = project.subitems
    .filter((fanproject) => isFanProjectVotable(fanproject.estado))
    .map((fanproject) => ({
      ...fanproject,
      votes: voteCounts[fanproject.id] || 0,
    }));

  if (
    !isClosed &&
    (candidates.length === 0 || project.subitems.some((fanproject) => isFanProjectConfirmed(fanproject.estado)))
  ) {
    return null;
  }

  return {
    candidates,
    isClosed,
    totalVotes: votes.length,
    winner,
  };
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

    if (
      projectSnapshot.data().votacionCerradaAt ||
      fanprojects.some((fanproject) => isFanProjectConfirmed(fanproject.estado))
    ) {
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

export async function toggleFanProjectVotingReaction({ projectId, reaction, userId }) {
  if (!isValidId(projectId) || !isValidId(userId) || !VOTING_REACTIONS.includes(reaction)) {
    throw new Error("La reacción no es válida.");
  }

  const db = getDb();
  const projectRef = db.collection("proyectos").doc(projectId);
  const reactionRef = projectRef.collection(REACTIONS_SUBCOLLECTION).doc(userId);

  return db.runTransaction(async (transaction) => {
    const [projectSnapshot, currentReactionSnapshot] = await Promise.all([
      transaction.get(projectRef),
      transaction.get(reactionRef),
    ]);

    if (!projectSnapshot.exists || projectSnapshot.data().votacionCerradaAt) {
      throw new Error("La votación ya no está disponible.");
    }

    if (currentReactionSnapshot.exists && currentReactionSnapshot.data().reaction === reaction) {
      transaction.delete(reactionRef);
      return { reaction: null };
    }

    if (currentReactionSnapshot.exists) {
      transaction.update(reactionRef, {
        reaction,
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      transaction.create(reactionRef, {
        reaction,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return { reaction };
  });
}

export async function closeFanProjectVoting({ fanprojectId, projectId }) {
  if (![fanprojectId, projectId].every(isValidId)) {
    throw new Error("La votación no es válida.");
  }

  const db = getDb();
  const projectRef = db.collection("proyectos").doc(projectId);
  const selectedFanProjectRef = projectRef.collection("fanprojects").doc(fanprojectId);

  return db.runTransaction(async (transaction) => {
    const [projectSnapshot, fanprojectsSnapshot, selectedFanProjectSnapshot] = await Promise.all([
      transaction.get(projectRef),
      transaction.get(projectRef.collection("fanprojects")),
      transaction.get(selectedFanProjectRef),
    ]);

    if (!projectSnapshot.exists) {
      throw new Error("El concierto no existe.");
    }

    if (projectSnapshot.data().votacionCerradaAt) {
      throw new Error("La votación ya está cerrada.");
    }

    const fanprojects = fanprojectsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    const selectedFanProject = fanprojects.find((fanproject) => fanproject.id === fanprojectId);

    if (!selectedFanProject || !selectedFanProjectSnapshot.exists || !isFanProjectVotable(selectedFanProject.estado)) {
      throw new Error("Ese fanproject no está disponible para confirmar.");
    }

    if (fanprojects.some((fanproject) => isFanProjectConfirmed(fanproject.estado))) {
      throw new Error("Este concierto ya tiene un fanproject confirmado.");
    }

    transaction.update(selectedFanProjectRef, {
      estado: "en_preparacion",
      confirmedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.update(projectRef, {
      votacionCerradaAt: FieldValue.serverTimestamp(),
      votacionGanadoraId: fanprojectId,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { title: selectedFanProject.titulo };
  });
}
