import { getCurrentUser } from "@/lib/firebase/session";
import { getCurrentUserProfile } from "@/lib/users/users";

export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized.");
  }

  const profile = await getCurrentUserProfile(user);

  if (profile?.user_type !== "admin") {
    throw new Error("Forbidden.");
  }

  return user;
}

export async function requireFanbaseAdmin(fanbaseId) {
  const user = await getCurrentUser();

  if (!user) throw new Error("Unauthorized.");

  const profile = await getCurrentUserProfile(user);
  const isFanbaseAdmin = profile?.user_type === "fanbase" &&
    profile.fanbases?.includes(fanbaseId);

  if (profile?.user_type !== "admin" && !isFanbaseAdmin) {
    throw new Error("Forbidden.");
  }

  return user;
}
