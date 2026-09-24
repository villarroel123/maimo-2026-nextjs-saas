import Link from "next/link";
import Image from "next/image";
import { Homemade_Apple } from "next/font/google";

import Hero from "@/components/Hero";

import HomeSearch from "@/components/home/HomeSearch";

import { getProjectsWithFanProjects } from "@/lib/projects/projects";

import { getFanProjectVotingConcerts } from "@/lib/votes/fanproject-votes";

import { getFanbases } from "@/lib/fanbases/fanbases";

import HorizontalSlider from "@/components/HorizontalSlider";

export const dynamic = "force-dynamic";

const homemadeApple = Homemade_Apple({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-homemade-apple",
});

export default async function Home() {
  const [projects, votingConcerts, fanbases] = await Promise.all([
    getProjectsWithFanProjects(),
    getFanProjectVotingConcerts(),
    getFanbases(),
  ]);
  const searchData = {
    concerts: projects.map((project) => ({
      key: `concert-${project.id}`,
      href: `/projects/${project.id}`,
      title: project.Titulo || "Concierto sin nombre",
      country: project.Pais || "",
      date: project["Dia del concierto"] || "",
      subtitle: [project.Pais, project["Dia del concierto"]].filter(Boolean).join(" · "),
    })),
    fanprojects: projects.flatMap((project) => (
      (project.subitems || []).map((fanproject) => ({
        key: `fanproject-${project.id}-${fanproject.id}`,
        href: `/projects/${project.id}/activities/${fanproject.id}`,
        title: fanproject.titulo || "Fanproject sin título",
        description: fanproject.descripcion || "",
        concertTitle: project.Titulo || "Concierto",
        subtitle: project.Titulo || "Concierto",
      }))
    )),
    fanbases: fanbases.map((fanbase) => ({
      key: `fanbase-${fanbase.id}`,
      href: `/fanbases/${fanbase.id}`,
      name: fanbase.name,
      kpopGroup: fanbase.kpopGroup,
      title: fanbase.kpopGroup || fanbase.name,
      subtitle: fanbase.name,
    })),
  };

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

      {/* Cómo funciona */}
      <section className="w-full bg-[#FDFDFF] px-4 py-14 text-center sm:px-6 sm:py-20 lg:px-8">
        <p className={`${homemadeApple.className} mx-auto  text-4xl text-[#823038] sm:text-5xl`}>
          Conoce mas sobre Narabi !
        </p>

        <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-6">
          <div className="flex flex-col items-center rounded-3xl bg-[#FFE4F3] px-6 py-8 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/70 text-3xl">
              📅
            </span>

            <h3 className="mt-5 text-sm uppercase tracking-[0.14em] text-[#0D1821]">
              Organizá
            </h3>

            <p className="mt-3 text-sm leading-6 text-[#0D1821]/70">
              Creá o sumate a fanprojects para tu próximo concierto y coordiná todo con la comunidad.
            </p>

            <Link
              href="/about"
              className="mt-6 inline-flex h-9 items-center justify-center rounded-full border border-[#0D1821]/20 bg-white px-4 text-xs font-semibold uppercase tracking-wide text-[#0D1821] transition hover:bg-[#0D1821] hover:text-white"
            >
              Conocé más
            </Link>
          </div>

          <div className="flex flex-col items-center rounded-3xl bg-[#B4D4EE] px-6 py-8 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/70 text-3xl">
              💌
            </span>

            <h3 className="mt-5 text-sm uppercase tracking-[0.14em] text-[#0D1821]">
              Votá
            </h3>

            <p className="mt-3 text-sm leading-6 text-[#0D1821]/70">
              Elegí entre las propuestas de fanprojects y decidí junto a otros fans qué se hace realidad.
            </p>

            <Link
              href="/about"
              className="mt-6 inline-flex h-9 items-center justify-center rounded-full border border-[#0D1821]/20 bg-white px-4 text-xs font-semibold uppercase tracking-wide text-[#0D1821] transition hover:bg-[#0D1821] hover:text-white"
            >
              Conocé más
            </Link>
          </div>

          <div className="flex flex-col items-center rounded-3xl bg-[#E1D8FD] px-6 py-8 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/70 text-3xl">
              🪄
            </span>

            <h3 className="mt-5 text-sm uppercase tracking-[0.14em] text-[#0D1821]">
              Participá
            </h3>

            <p className="mt-3 text-sm leading-6 text-[#0D1821]/70">
              Seguí el progreso, sumate a las actividades y disfrutá del resultado en el concierto.
            </p>

            <Link
              href="/about"
              className="mt-6 inline-flex h-9 items-center justify-center rounded-full border border-[#0D1821]/20 bg-white px-4 text-xs font-semibold uppercase tracking-wide text-[#0D1821] transition hover:bg-[#0D1821] hover:text-white"
            >
              Conocé más
            </Link>
          </div>
        </div>
      </section>
      <div className="bg-[#EEEEEE] w-screen">
              <Image
                src="/items/ondas_dos.png"
                alt=""
                width={1920}
                height={120}
                className="h-auto w-full"
              />
            </div>

      <HomeSearch searchData={searchData} />

      {/* Próximos conciertos */}
      <section className="w-full bg-linear-to-r from-[#FF9FD6] to-[#FFD670] px-4 sm:px-6 sm:py-10 lg:px-8">
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

                  <h3 className="mt-4 wrap-break-word text-xl font-semibold text-[#5C1F3A]">
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