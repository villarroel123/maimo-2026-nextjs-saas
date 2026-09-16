"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { submitFanProjectVote } from "@/lib/votes/fanproject-votes";

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
