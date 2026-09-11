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
