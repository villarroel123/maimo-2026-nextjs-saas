import Link from "next/link";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import { getCurrentUser } from "@/lib/firebase/session";
import { getProjects } from "@/lib/projects/projects";
import { getCurrentUserProfile } from "@/lib/users/users";
import FavoriteButton from "@/components/favorites/FavoriteButton";
import { hasUnreadNotificationsForUser } from "@/lib/notifications/notifications";
import { getConfirmedFanProjectConcerts, getFanProjectVotingConcerts } from "@/lib/votes/fanproject-votes";
import HorizontalSlider from "@/components/HorizontalSlider";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  const [profile, projects, hasUnreadNotifications, confirmedConcerts, votingConcerts] = await Promise.all([
    user ? getCurrentUserProfile(user) : null,
    getProjects(),
    user ? hasUnreadNotificationsForUser(user.uid) : false,
    getConfirmedFanProjectConcerts(),
    getFanProjectVotingConcerts(),
  ]);

  return (
    <main className="min-h-screen bg-[#FDFDFF] text-[#823038]">
      <Navbar hasUnreadNotifications={hasUnreadNotifications} user={user} profile={profile} />

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
          <HorizontalSlider label="conciertos disponibles">
            {projects.map((project) => (
              <article className="flex w-[86%] shrink-0 snap-start flex-col justify-between border border-[#F2B8CF] bg-white p-5 sm:w-[calc((100%-1rem)/2)] xl:w-[calc((100%-2rem)/3)]" key={project.id}>
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
          </HorizontalSlider>
        )}
      </section>

      <section className="mx-auto mt-10 w-full max-w-6xl bg-[#FFE4F3] px-4 py-8 sm:mt-16 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C0567A]">
            Próximos conciertos
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-normal text-[#5C1F3A]">
            Fanprojects confirmados
          </h2>
        </div>

        {confirmedConcerts.length === 0 ? (
          <div className="border border-[#F2B8CF] bg-white/60 p-6 text-sm leading-6 text-[#8A5468]">
            Todavía no hay fanprojects confirmados para los próximos conciertos.
          </div>
        ) : (
          <HorizontalSlider label="fanprojects confirmados">
            {confirmedConcerts.map((concert) => (
              <article className="w-[86%] shrink-0 snap-start rounded-2xl border border-[#F2B8CF] bg-white p-5 sm:w-[calc((100%-1rem)/2)] xl:w-[calc((100%-2rem)/3)]" key={concert.id}>
                <div className="flex items-center justify-between gap-3 border-b border-[#FCE7F0] pb-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-[#5C1F3A]">{concert.Titulo}</p>
                    <p className="mt-1 text-xs text-[#8A5468]">{concert["Dia del concierto"] || "Fecha a confirmar"}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#E9F8EE] px-2.5 py-1 text-xs font-semibold text-[#287142]">
                    Confirmados
                  </span>
                </div>

                <div className="divide-y divide-[#FCE7F0]">
                  {concert.fanprojects.map((fanproject) => (
                    <Link
                      className="group flex items-center justify-between gap-3 py-3 transition hover:text-[#C0567A]"
                      href={`/projects/${concert.id}/activities/${fanproject.id}`}
                      key={fanproject.id}
                    >
                      <span className="min-w-0 truncate text-sm font-medium text-[#5C1F3A] group-hover:text-[#C0567A]">
                        {fanproject.titulo}
                      </span>
                      <span aria-hidden="true" className="text-[#C0567A]">→</span>
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </HorizontalSlider>
        )}
      </section>

      <section className="mx-auto mt-10 w-full max-w-6xl px-4 py-8 sm:mt-16 sm:px-6 sm:py-10 lg:px-8 bg-[#FFE4F3]">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C0567A]">
              Próximos conciertos
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-normal text-[#5C1F3A]">
              Votaciones para próximos conciertos
            </h2>
          </div>
          {votingConcerts.length > 0 ? (
            <Link className="inline-flex h-10 items-center justify-center rounded-full bg-[#5C1F3A] px-4 text-sm font-semibold text-white transition hover:bg-[#7a2a4d]" href="/votaciones">
              Ver todas las votaciones
            </Link>
          ) : null}
        </div>

        {votingConcerts.length === 0 ? (
          <div className="border border-[#F2B8CF] bg-white/60 p-6 text-sm leading-6 text-[#8A5468]">
            No hay votaciones activas en este momento.
          </div>
        ) : (
          <HorizontalSlider label="votaciones para próximos conciertos">
            {votingConcerts.map((concert) => (
              <article className="w-[86%] shrink-0 snap-start border border-[#F2B8CF] bg-white p-5 sm:w-[calc((100%-1rem)/2)] xl:w-[calc((100%-2rem)/3)]" key={concert.id}>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#C0567A]">
                  {concert.Pais || "Global"} · {concert["Dia del concierto"] || "Fecha a confirmar"}
                </p>
                <h3 className="mt-3 break-words text-xl font-semibold text-[#5C1F3A]">{concert.Titulo}</h3>
                <p className="mt-2 text-sm leading-6 text-[#8A5468]">
                  {concert.candidates.length} fanproject{concert.candidates.length === 1 ? "" : "s"} propuesto{concert.candidates.length === 1 ? "" : "s"}.
                </p>
                <Link className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-[#5C1F3A] px-4 text-sm font-semibold text-white transition hover:bg-[#7a2a4d]" href="/votaciones">
                  Ver y votar
                </Link>
              </article>
            ))}
          </HorizontalSlider>
        )}
      </section>
      
      <Footer />
    </main>
  );
}
