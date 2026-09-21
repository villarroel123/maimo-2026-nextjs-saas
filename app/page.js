import Link from "next/link";
import Image from "next/image";

import Hero from "@/components/Hero";

import { getProjects } from "@/lib/projects/projects";

import { getFanProjectVotingConcerts } from "@/lib/votes/fanproject-votes";

import { getFanbases } from "@/lib/fanbases/fanbases";

import HorizontalSlider from "@/components/HorizontalSlider";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [projects, votingConcerts, fanbases] = await Promise.all([
    getProjects(),
    getFanProjectVotingConcerts(),
    getFanbases(),
  ]);

  return (
    <main className="relative min-h-screen">
      <Hero />

      <div className="relative h-[3em] w-full overflow-hidden bg-[#823038]">
        <div className="narabi-track flex h-full w-max">
          {Array.from({ length: 28 }).map((_, i) => (
            <div
              key={i}
              className="flex h-full w-55 shrink-0 items-center justify-center"
            >
              <span className="font-sans uppercase tracking-wide text-[#FFE4F3]">
                narabi
              </span>

              <span className="ml-15 font-sans uppercase tracking-wide text-[#FFE4F3]">
                ˚｡𖦹 ⋆｡°
              </span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .narabi-track {
          animation: narabi-scroll 30s linear infinite;
        }

        @keyframes narabi-scroll {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(-50%);
          }
        }
      `}</style>

      {/* Próximos conciertos */}
      <section className="w-full bg-gradient-to-r from-[#FF9FD6] to-[#FFD670] px-4 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C0567A]">
              Próximos conciertos
            </p>

            <h2 className="mt-3 text-5xl font-semibold text-[#FDFDFF]">
              Conciertos disponibles !
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
              <article
                className="flex w-[86%] shrink-0 snap-start flex-col justify-between border border-[#F2B8CF] bg-white p-5 sm:w-[calc((100%-1rem)/2)] xl:w-[calc((100%-2rem)/3)]"
                key={project.id}
              >
                <div>
                  <div className="relative mb-4 h-48 w-full overflow-hidden rounded-xl bg-[#EEEEEE]">
                    <img
                      src={project.imagen || "/projects/placeholder.jpg"}
                      alt={project.Titulo}
                      className="h-full w-full object-cover"
                    />

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
                </div>
              </article>
            ))}
          </HorizontalSlider>
        )}
      </section>

      {/* Fanbases */}
      <section className="w-full bg-[#0D1821] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#F2B8CF]">
            Comunidad Narabi
          </p>
          <h2 className="mt-3 text-[#EEEEEE]">Fanbases</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#EEEEEE]/70">
            Conocé las comunidades que hacen posibles los fanprojects de cada grupo.
          </p>

          {fanbases.length === 0 ? (
            <p className="mx-auto mt-8 max-w-xl rounded-2xl border border-[#EEEEEE]/20 px-5 py-4 text-sm text-[#EEEEEE]/75">
              Próximamente vas a poder conocer a las fanbases de la comunidad.
            </p>
          ) : (
            <>
              <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-10">
                {fanbases.slice(0, 3).map((fanbase) => (
                  <Link
                    className="group flex flex-col items-center rounded-3xl px-4 py-3 text-center outline-none transition focus-visible:ring-2 focus-visible:ring-[#F2B8CF] focus-visible:ring-offset-4 focus-visible:ring-offset-[#0D1821]"
                    href={`/fanbases/${fanbase.id}`}
                    key={fanbase.id}
                  >
                    <span className="relative block size-28 overflow-hidden rounded-full border-2 border-[#EEEEEE]/70 bg-[#823038] shadow-[0_16px_30px_-16px_rgba(0,0,0,0.9)] transition duration-300 group-hover:scale-105 group-hover:border-[#F2B8CF] sm:size-32">
                      <Image
                        alt={`Imagen temporal de la fanbase de ${fanbase.kpopGroup}`}
                        className="h-full w-full object-cover object-[78%_85%] grayscale transition duration-300 group-hover:scale-110 group-hover:grayscale-0"
                        fill
                        sizes="(min-width: 640px) 8rem, 7rem"
                        src="/items/hero_one.jpg"
                      />
                    </span>
                    <h3 className="mt-4 text-lg text-[#EEEEEE] transition group-hover:text-[#F2B8CF]">
                      {fanbase.kpopGroup}
                    </h3>
                  </Link>
                ))}
              </div>

              <Link
                className="mt-9 inline-flex h-10 items-center justify-center rounded-full border border-[#EEEEEE]/70 px-5 text-sm font-semibold text-[#EEEEEE] transition hover:border-[#F2B8CF] hover:bg-[#F2B8CF] hover:text-[#0D1821]"
                href="/fanbases"
              >
                Ver más
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Votaciones */}
      <section className="w-full bg-[#FDFDFF] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
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
            <Link
              className="inline-flex h-10 items-center justify-center rounded-full bg-[#5C1F3A] px-4 text-sm font-semibold text-white transition hover:bg-[#7a2a4d]"
              href="/votaciones"
            >
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
              <article
                className="w-[86%] shrink-0 snap-start border border-[#F2B8CF] bg-white p-5 sm:w-[calc((100%-1rem)/2)] xl:w-[calc((100%-2rem)/3)]"
                key={concert.id}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#C0567A]">
                  {concert.Pais || "Global"} ·{" "}
                  {concert["Dia del concierto"] || "Fecha a confirmar"}
                </p>

                <h3 className="mt-3 break-words text-xl font-semibold text-[#5C1F3A]">
                  {concert.Titulo}
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#8A5468]">
                  {concert.candidates.length} fanproject
                  {concert.candidates.length === 1 ? "" : "s"} propuesto
                  {concert.candidates.length === 1 ? "" : "s"}.
                </p>

                <Link
                  className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-[#5C1F3A] px-4 text-sm font-semibold text-white transition hover:bg-[#7a2a4d]"
                  href="/votaciones"
                >
                  Ver y votar
                </Link>
              </article>
            ))}
          </HorizontalSlider>
        )}
      </section>
      <pre
        className="
          pointer-events-none
          absolute
          left-[110em]
          top-[150em]
          z-9999
          -translate-x-1/2
          whitespace-pre
          text-[10px]
          leading-1.5
          text-[#823038]
        "
      >
{`⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⢿⡀⠀⠀⠀⠀⣤⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣤⣤⣤⣀⣴⠏⠸⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⣦⡄⠈⠀⠀⠉⢙⣿⡿⠃⠀⠀⠠⠄⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠶⠀⠀⠀⣰⡏⠀⣀⠀⠸⡏⠁⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⡴⠟⠛⢷⣤⣧⠀⠀⠰⣶⣿⣀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠁⠀⠀⠀⠀⠈⠋⠀⠀⠘⠛⠿⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣤⣤⣄⣀⣀⡀⠀⠀⠀⠀⡀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠰⠀⠀⠀⠀⠀⣿⠛⠛⠿⠿⣿⣿⣷⡄⠀⠀⠁
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⡀⣸⡏⠀⠀⠀⠀⠀⣼⡿⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⠁⠀⢀⣀⠀⢀⣿⠃⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⠿⠿⢿⣿⣷⣶⡆⠀⠘⠿⠿⠋⠀⠀⢿⣿⣿⣿⡏⠀⠀⠀⠘⠀
⠀⠀⠀⠀⠀⠀⠀⠀⢠⡟⠀⠀⠀⠀⠀⣸⡇⠀⠀⠀⠀⠀⠀⠀⠈⠛⠛⠋⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⣾⠃⠀⠀⠀⠀⠀⣿⡇⠀⠀⠀⠀⠀⠀⢀⡄⠀⠀⠀⠀⠀⢀⡀⠀⠀
⠀⠀⠀⠀⠀⣴⣶⣾⡏⠀⠀⠀⢀⠀⢸⣿⠀⠀⠀⠀⠀⢿⡲⠋⣧⣀⡀⠀⠘⡗⠛⣇⡀⠀
⠀⠀⠀⠀⠀⠻⢿⡿⠃⠀⠀⢾⣿⣿⣿⠃⠀⠀⣄⠀⢀⣼⡥⣄⣶⠋⠁⠀⠛⠒⣶⠋⠉⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠙⠋⠁⠀⠀⢰⣿⡄⠀⠀⠀⠈⠀⠀⡀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⡏⢿⡄⠀⠀⠀⠀⠘⣶⣿⠤⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⢀⠀⠀⠚⠀⢀⣀⣠⣤⡤⠿⠀⠈⟟⠛⢛⣿⠟⠀⠁⠉⠀⠀⠀⠀⠀⠀
⠀⠈⠁⠀⠀⢦⣤⣿⣀⡀⠀⠀⠀⠉⠻⢦⣄⡀⠀⠀⠀⢰⡟⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⣀⡄⠀⠀⠀⢰⠿⢿⡋⠁⠀⢀⡀⠀⠀⠀⣸⠃⢀⣤⣄⡈⣷⡀⠀⠀⠃⠀⠀⠀⠀⠀⠀⠀
⠛⠟⠀⠀⠀⠀⠀⠈⠁⠀⠀⠀⠁⠀⠀⠀⣿⡴⠟⠁⠉⠛⠾⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀`}
      </pre>
    </main>
  );
}
