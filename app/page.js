import Link from "next/link";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/firebase/session";
import { getProjects } from "@/lib/projects/projects";
import { getCurrentUserProfile } from "@/lib/users/users";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  const profile = user ? await getCurrentUserProfile(user) : null;
  const projects = await getProjects();

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar user={user} profile={profile} />

      <section className="mx-auto flex h-auto min-h-[300px] w-full max-w-6xl flex-col justify-center border-t border-zinc-800 px-4 py-8 sm:h-[300px] sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">
          Comunidad de Fans
        </p>
        <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-normal text-zinc-50 sm:text-5xl lg:text-6xl lg:leading-none">
          Organización de Conciertos
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400">
          Plataforma colaborativa para que los fans organicen actividades, proyectos y sorpresas para los próximos conciertos.
        </p>
        <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
          <Link
            className="inline-flex h-11 w-full items-center justify-center border border-cyan-400 bg-cyan-400 px-5 text-sm font-semibold text-zinc-950 transition hover:border-cyan-300 hover:bg-cyan-300 sm:w-auto"
            href={user ? "/dashboard" : "/login"}
          >
            {user ? "Ir al dashboard" : "Ingresar"}
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl border-t border-zinc-800 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">
              Próximos eventos
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-normal text-zinc-50">
              Conciertos disponibles
            </h2>
          </div>
          <span className="text-sm text-zinc-500">
            {projects.length} total
          </span>
        </div>

        {projects.length === 0 ? (
          <div className="border border-zinc-800 p-6 text-sm leading-6 text-zinc-400">
            No hay proyectos ni conciertos cargados.
          </div>
        ) : (
          <div className="grid gap-px overflow-hidden border border-zinc-800 bg-zinc-800 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <article className="min-w-0 bg-zinc-950 p-5 flex flex-col justify-between" key={project.id}>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="border border-cyan-900/70 px-2 py-1 text-xs uppercase tracking-[0.12em] text-cyan-300">
                      {project.Pais || "Global"}
                    </span>
                  </div>
                  <h3 className="mt-4 overflow-wrap-anywhere text-xl font-semibold text-zinc-100">
                    {project.Titulo}
                  </h3>
                  {project["Dia del concierto"] ? (
                    <p className="mt-2 text-sm font-medium text-zinc-400">
                      Fecha: {project["Dia del concierto"]}
                    </p>
                  ) : null}
                </div>
                <Link
                  className="mt-6 inline-flex h-10 w-full items-center justify-center border border-zinc-700 px-4 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900 sm:w-auto"
                  href={`/projects/${project.id}`}
                >
                  Ver actividades
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}