import Link from "next/link";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import { getCurrentUser } from "@/lib/firebase/session";
import { getProjects } from "@/lib/projects/projects";
import { getCurrentUserProfile } from "@/lib/users/users";
import FavoriteButton from "@/components/favorites/FavoriteButton";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  const profile = user ? await getCurrentUserProfile(user) : null;
  const projects = await getProjects();

  return (
    <main className="min-h-screen bg-[#FDFDFF] text-[#823038]">
      <Navbar user={user} profile={profile} />

      <Hero />

      <section className="mx-auto mt-10 w-full max-w-6xl px-4 py-8 sm:mt-16 sm:px-6 sm:py-10 lg:px-8 bg-[#FFE4F3]">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C0567A]">
              Próximos conciertos
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-normal text-[#5C1F3A]">
              Conciertos disponibles
            </h2>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="border border-[#F2B8CF] bg-white/60 p-6 text-sm leading-6 text-[#8A5468]">
            No hay proyectos ni conciertos cargados.
          </div>
        ) : (
          <div className="grid gap-px overflow-hidden border border-[#F2B8CF] bg-[#F2B8CF] sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <article className="min-w-0 bg-white p-5 flex flex-col justify-between" key={project.id}>
                <div>
                  {/* Contenedor de la imagen */}
                  <div className="relative w-full h-48 mb-4 overflow-hidden rounded-xl bg-[#FFE4F3]">
                    <img
                      src={project.imagen || "/projects/placeholder.jpg"}
                      alt={project.Titulo}
                      className="w-full h-full object-cover"
                    />
                    {/* Etiqueta de fecha tipo calendario */}
                    {project["Dia del concierto"] ? (
                      <span className="absolute left-3 top-3 rounded-lg bg-white/90 px-3 py-1 text-xs font-semibold text-[#5C1F3A] shadow-sm">
                        {project["Dia del concierto"]}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="border border-[#F2B8CF] px-2 py-1 text-xs uppercase tracking-[0.12em] text-[#C0567A]">
                      {project.Pais || "Global"}
                    </span>
                  </div>
                  <h3 className="mt-4 break-words text-xl font-semibold text-[#5C1F3A]">
                    {project.Titulo}
                  </h3>
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link
                    className="inline-flex h-10 items-center justify-center rounded-full bg-[#5C1F3A] px-4 text-sm font-semibold text-white transition hover:bg-[#7a2a4d]"
                    href={`/projects/${project.id}`}
                  >
                    Ver fanprojects
                  </Link>
                  <FavoriteButton target={{ type: "project", projectId: project.id }} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      
      <Footer />
    </main>
  );
}
