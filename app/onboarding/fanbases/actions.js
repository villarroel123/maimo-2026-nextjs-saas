"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { followFanbase, getFanbases } from "@/lib/fanbases/fanbases";

function getSafeNext(value) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")
    ? value
    : "/";
}

export async function saveFollowedFanbases(formData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=%2Fonboarding%2Ffanbases");

  const selectedIds = [...new Set(formData.getAll("fanbaseId").filter((id) => typeof id === "string"))];
  if (selectedIds.length === 0) redirect("/onboarding/fanbases?error=choose-one");

  const fanbases = await getFanbases();
  const validIds = new Set(fanbases.map((fanbase) => fanbase.id));
  if (selectedIds.some((id) => !validIds.has(id))) redirect("/onboarding/fanbases?error=invalid");

  await Promise.all(selectedIds.map((id) => followFanbase(id, user.uid)));
  redirect(getSafeNext(formData.get("next")));
}
