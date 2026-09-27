"use server";

import {
  createConcertIdea,
  createConcertIdeaReply,
  toggleConcertIdeaReaction,
} from "@/lib/comments/concert-ideas";
import { getCurrentUser } from "@/lib/firebase/session";
import { getCurrentUserProfile } from "@/lib/users/users";

async function requireAuthor() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Iniciá sesión para participar.");

  const profile = await getCurrentUserProfile(user);
  return {
    userId: user.uid,
    authorName: profile?.displayName || user.name || user.email?.split("@")[0] || "Fan de Narabi",
  };
}

export async function publishConcertIdea(projectId, message) {
  const author = await requireAuthor();
  return createConcertIdea({ projectId, ...author, message });
}

export async function publishConcertIdeaReply(projectId, ideaId, message) {
  const author = await requireAuthor();
  return createConcertIdeaReply({ projectId, ideaId, ...author, message });
}

export async function reactToConcertIdea(projectId, ideaId, reaction) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Iniciá sesión para reaccionar.");

  return toggleConcertIdeaReaction({ projectId, ideaId, userId: user.uid, reaction });
}
