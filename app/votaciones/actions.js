"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createVotingComment } from "@/lib/comments/voting-comments";
import { getCurrentUser } from "@/lib/firebase/session";
import { getCurrentUserProfile } from "@/lib/users/users";
import {
  submitFanProjectVote,
  toggleFanProjectVotingReaction,
} from "@/lib/votes/fanproject-votes";

function getSafeId(formData, name) {
  const value = String(formData.get(name) || "").trim();
  return value && !value.includes("/") ? value : "";
}

export async function castFanProjectVote(formData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/votaciones");
  }

  const projectId = getSafeId(formData, "projectId");
  const fanprojectId = getSafeId(formData, "fanprojectId");

  if (!projectId || !fanprojectId) {
    redirect("/votaciones?status=invalid");
  }

  try {
    const result = await submitFanProjectVote({
      projectId,
      fanprojectId,
      userId: user.uid,
    });

    revalidatePath("/");
    revalidatePath("/votaciones");
    redirect(`/votaciones?status=${result.alreadyVoted ? "already-voted" : "voted"}`);
  } catch (error) {
    console.error("Could not cast fanproject vote:", error);
    redirect("/votaciones?status=unavailable");
  }
}

export async function addVotingComment(formData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/votaciones");
  }

  const projectId = getSafeId(formData, "projectId");

  if (!projectId) {
    redirect("/votaciones?status=comment-invalid");
  }

  const commentAnchor = `comentarios-${projectId}`;

  try {
    const profile = await getCurrentUserProfile(user);
    const authorName =
      profile?.displayName ||
      user.name ||
      user.email?.split("@")[0] ||
      "Fan de Narabi";

    await createVotingComment({
      projectId,
      userId: user.uid,
      authorName,
      message: formData.get("comment"),
    });

    revalidatePath("/votaciones");
    redirect(`/votaciones?status=commented#${commentAnchor}`);
  } catch (error) {
    console.error("Could not add a comment to a voting:", error);
    redirect(`/votaciones?status=comment-unavailable#${commentAnchor}`);
  }
}

export async function toggleVotingReaction(formData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/votaciones");
  }

  const projectId = getSafeId(formData, "projectId");
  const reaction = String(formData.get("reaction") || "").trim();

  if (!projectId || !["like", "dislike"].includes(reaction)) {
    redirect("/votaciones?status=reaction-invalid");
  }

  try {
    await toggleFanProjectVotingReaction({ projectId, reaction, userId: user.uid });
    revalidatePath("/votaciones");
    redirect(`/votaciones?status=reacted#votacion-${projectId}`);
  } catch (error) {
    console.error("Could not update voting reaction:", error);
    redirect(`/votaciones?status=reaction-unavailable#votacion-${projectId}`);
  }
}
