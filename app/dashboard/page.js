import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/firebase/session";
import { getProjects } from "@/lib/projects/projects";
import { getCurrentUserProfile, listUserProfiles } from "@/lib/users/users";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [projects, profile] = await Promise.all([
    getProjects(),
    getCurrentUserProfile(user),
  ]);
  const isAdmin = profile?.user_type === "admin";
  const users = isAdmin ? await listUserProfiles() : [];

  return (
    <main className="min-h-screen bg-[#FDFDFF] text-[#823038]">
      <header className="mx-auto flex w-full max-w-6xl flex-col gap-5 border-b border-[#F2B8CF] px-4 py-7 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C0567A]">
            Panel de control
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-[#5C1F3A] sm:text-5xl lg:text-6xl">
            Dashboard
          </h1>
        </div>
      </header>

      <section className="mx-auto mt-7 grid w-[calc(100%-2rem)] max-w-6xl gap-px overflow-hidden border border-[#F2B8CF] bg-[#F2B8CF] sm:w-[calc(100%-3rem)] lg:w-[calc(100%-4rem)] lg:grid-cols-2">
        <div className="bg-white p-5">
          <span className="block text-sm text-[#8A5468]">Conciertos registrados</span>
          <strong className="mt-3 block text-3xl font-semibold text-[#5C1F3A]">
            {projects.length}
          </strong>
          <p className="mt-3 text-sm leading-6 text-[#8A5468]">
            Listado general de proyectos y conciertos activos en la plataforma.
          </p>
          <Link
            className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-full bg-[#5C1F3A] px-4 text-sm font-semibold text-white transition hover:bg-[#7a2a4d] sm:w-auto"
            href="/dashboard/projects"
          >
            Ver conciertos
          </Link>
        </div>

        {isAdmin ? (
          <div className="bg-white p-5 flex flex-col justify-between">
            <div>
              <span className="block text-sm text-[#8A5468]">
                Usuarios registrados y Acciones
              </span>
              <strong className="mt-3 block text-3xl font-semibold text-[#5C1F3A]">
                {users.length}
              </strong>
              <p className="mt-3 text-sm leading-6 text-[#8A5468]">
                Gestión de perfiles y creación rápida de contenido para administradores.
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                className="inline-flex h-10 items-center justify-center rounded-full border border-[#F2B8CF] bg-white px-4 text-sm font-semibold text-[#5C1F3A] transition hover:border-[#C0567A] hover:bg-[#FFE4F3]"
                href="/dashboard/users"
              >
                Gestionar usuarios
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center rounded-full border border-[#F2B8CF] bg-white px-4 text-sm font-semibold text-[#5C1F3A] transition hover:border-[#C0567A] hover:bg-[#FFE4F3]"
                href="/dashboard/fanbases"
              >
                Gestionar fanbases
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center rounded-full bg-[#5C1F3A] px-4 text-sm font-semibold text-white transition hover:bg-[#7a2a4d]"
                href="/dashboard/projects/new"
              >
                + Nuevo Concierto
              </Link>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
