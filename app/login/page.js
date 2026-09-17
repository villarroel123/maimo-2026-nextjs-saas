import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { getCurrentUser } from "@/lib/firebase/session";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <section className="grid min-h-[calc(100vh-65px)] place-items-center px-4 py-8 sm:px-5 sm:py-10">
        <LoginForm />
      </section>
    </main>
  );
}
