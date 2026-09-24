import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectWithDetails } from "@/lib/projects/projects";
import { getFanProjectStatus } from "@/lib/projects/fanproject-status";
import { getFanprojectImage } from "@/lib/projects/fanproject-image";
import CircleArrowIcon from "@/components/icons/CircleArrowIcon";
import VenueInfo from "@/components/venues/VenueInfo";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }) {
  const { id } = await params;
  const project = await getProjectWithDetails(id);

  if (!project) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#FDFDFF] text-[#823038] p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#C0567A] hover:underline">
          <CircleArrowIcon direction="left" className="size-4" />
          Volver al inicio
        </Link>
      </div>

      <span className="text-xs font-semibold uppercase tracking-widest text-[#C0567A]">
        {project.Pais || "Global"} • {project["Dia del concierto"]}
      </span>
      <VenueInfo manualName={project.venueManualName || ""} placeId={project.venuePlaceId || ""} />
      {project.Ubicacion ? (
        <p className="mt-2 text-sm text-[#8A5468]">Punto de encuentro: {project.Ubicacion}</p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl font-bold text-[#5C1F3A]">{project.Titulo}</h1>
      </div>

      <h2 className="mt-10 text-xl font-semibold text-[#5C1F3A] border-b border-[#F2B8CF] pb-2">
        Fanprojects del concierto
      </h2>

      <div className="mt-6 space-y-4">
        {project.subitems.length === 0 ? (
          <p className="text-sm text-[#8A5468]">No hay actividades cargadas para este concierto todavía.</p>
        ) : (
          project.subitems.map((sub) => {
            const status = getFanProjectStatus(sub.estado);
            const image = getFanprojectImage(sub, project);

            return (
              <article
                key={sub.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[#F2B8CF] bg-white shadow-[0_16px_34px_-30px_rgba(92,31,58,0.7)] transition duration-200 hover:border-[#D985A5] hover:shadow-[0_20px_35px_-28px_rgba(92,31,58,0.45)] sm:flex-row"
              >
                <div className="h-40 shrink-0 overflow-hidden bg-[#FFE4F3] sm:h-auto sm:w-56">
                  <img
                    src={image}
                    alt={`Imagen de ${sub.titulo}`}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
                  <div>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${status.badgeClassName}`}>
                      {status.label}
                    </span>
                    <h3 className="mt-3 text-lg font-bold text-[#5C1F3A]">{sub.titulo}</h3>
                    {(sub.authorName || sub.fanbaseName) ? (
                      <p className="mt-2 text-sm text-[#8A5468]">
                        Por {sub.authorName || "la comunidad"}
                        {sub.fanbaseName ? (
                          <>
                            {" · "}
                            <Link className="font-semibold text-[#B53E66] hover:underline" href={`/fanbases/${sub.fanbaseId}`}>
                              {sub.fanbaseName}
                            </Link>
                          </>
                        ) : null}
                      </p>
                    ) : null}
                  </div>
                  <Link
                    href={`/projects/${project.id}/activities/${sub.id}`}
                    className="shrink-0 rounded-full bg-[#5C1F3A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#7A2A4D]"
                  >
                    Ver más
                  </Link>
                </div>
              </article>
            );
          })
        )}
      </div>
    </main>
  );
}
