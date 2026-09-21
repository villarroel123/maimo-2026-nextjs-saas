import Link from "next/link";
import Hero from "@/components/Hero";
import { getProjects } from "@/lib/projects/projects";
import { getFanProjectVotingConcerts } from "@/lib/votes/fanproject-votes";
import HorizontalSlider from "@/components/HorizontalSlider";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [projects, votingConcerts] = await Promise.all([
    getProjects(),
    getFanProjectVotingConcerts(),
  ]);

  return (
    <main className="min-h-screen bg-[#EEEEEE] text-[#0D1821]">
      <Hero />

      
<div
  className="relative mt-0 h-[3em] w-full overflow-hidden"
  style={{ backgroundColor: "#823038" }}
>
  <div className="narabi-track flex h-full w-max">
    {Array.from({ length: 28 }).map((_, i) => (
      <div
        key={i}
        className="flex h-full w-55 shrink-0 items-center justify-center"
      >
        <span className="font-sans uppercase tracking-wide text-[#FFE4F3]">
          narabi 
        </span>
        <span className="font-sans uppercase tracking-wide text-[#FFE4F3] ml-15">
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



      <section className="mx-auto mt-10 w-full max-w-6xl px-4 py-8 sm:mt-16 sm:px-6 sm:py-10 lg:px-8 bg-gradient-to-r from-[#FF9FD6] to-[#FFD670] ">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C0567A]">
              Próximos conciertos
            </p>
            <h2 className="mt-3 text-5xl font-semibold  text-[#5C1F3A]">
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
              <article
                className="flex w-[86%] shrink-0 snap-start flex-col justify-between border border-[#F2B8CF] bg-white p-5 sm:w-[calc((100%-1rem)/2)] xl:w-[calc((100%-2rem)/3)]"
                key={project.id}
              >
                <div>
                  {/* Contenedor de la imagen */}
                  <div className="relative mb-4 h-48 w-full overflow-hidden rounded-xl bg-[#EEEEEE]">
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
    </main>
  );
}
