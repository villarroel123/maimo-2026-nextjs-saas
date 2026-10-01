import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getCurrentUserProfile } from "@/lib/users/users";

export default async function DashboardLayout({ children }) {
  const user = await getCurrentUser();

  if (!user) redirect("/login?next=/dashboard");

  const profile = await getCurrentUserProfile(user);

  if (profile?.user_type !== "admin" && profile?.user_type !== "fanbase") redirect("/profile");

  return children;
}
