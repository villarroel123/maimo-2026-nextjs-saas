import { redirect } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/firebase/session";
import { listUserTickets } from "@/lib/tickets/tickets";
import { getCurrentUserProfile, listUserProfiles } from "@/lib/users/users";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const items = await listUserTickets(user.uid);
  const profile = await getCurrentUserProfile(user);
  const isAdmin = profile?.user_type === "admin";
  const users = isAdmin ? await listUserProfiles() : [];

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar user={user} profile={profile} />
      <header className="mx-auto flex w-full max-w-6xl flex-col gap-5 border-b border-zinc-800 px-4 py-7 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">
            Ruta protegida
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-zinc-50 sm:text-5xl lg:text-6xl">
            Dashboard
          </h1>
        </div>
      </header>

      <section className="mx-auto mt-7 grid w-[calc(100%-2rem)] max-w-6xl grid-cols-1 gap-px overflow-hidden border border-zinc-800 bg-zinc-800 sm:w-[calc(100%-3rem)] md:grid-cols-3 lg:w-[calc(100%-4rem)]">
        <article className="min-w-0 bg-zinc-950 p-5">
          <span className="block text-sm text-zinc-500">Usuario</span>
          <strong className="mt-3 block overflow-wrap-anywhere text-base font-semibold text-zinc-100">
            {user.email || "Sin email"}
          </strong>
        </article>
        <article className="min-w-0 bg-zinc-950 p-5">
          <span className="block text-sm text-zinc-500">UID</span>
          <strong className="mt-3 block overflow-wrap-anywhere font-mono text-sm font-medium text-zinc-200">
            {user.uid}
          </strong>
        </article>
        <article className="min-w-0 bg-zinc-950 p-5">
          <span className="block text-sm text-zinc-500">Tipo</span>
          <strong className="mt-3 block overflow-wrap-anywhere text-base font-semibold text-zinc-100">
            {profile?.user_type || "user"}
          </strong>
        </article>
      </section>

      <section className="mx-auto mt-7 grid w-[calc(100%-2rem)] max-w-6xl gap-px overflow-hidden border border-zinc-800 bg-zinc-800 sm:w-[calc(100%-3rem)] lg:w-[calc(100%-4rem)] lg:grid-cols-2">
        <div className="bg-zinc-950 p-5">
          <span className="block text-sm text-zinc-500">Items propios</span>
          <strong className="mt-3 block text-3xl font-semibold text-zinc-100">
            {items.length}
          </strong>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Documentos de Firestore filtrados por el usuario autenticado.
          </p>
          <Link
            className="mt-5 inline-flex h-10 w-full items-center justify-center border border-cyan-400 bg-cyan-400 px-4 text-sm font-semibold text-zinc-950 transition hover:border-cyan-300 hover:bg-cyan-300 sm:w-auto"
            href="/dashboard/tickets"
          >
            Ver items
          </Link>
        </div>

        {isAdmin ? (
          <div className="bg-zinc-950 p-5">
            <span className="block text-sm text-zinc-500">
              Usuarios registrados
            </span>
            <strong className="mt-3 block text-3xl font-semibold text-zinc-100">
              {users.length}
            </strong>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Gestion de perfiles de usuario disponible para cuentas admin.
            </p>
            <Link
              className="mt-5 inline-flex h-10 w-full items-center justify-center border border-zinc-700 bg-transparent px-4 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900 sm:w-auto"
              href="/dashboard/users"
            >
              Gestionar usuarios
            </Link>
          </div>
        ) : null}
      </section>
      <Footer />
    </main>
  );
}
