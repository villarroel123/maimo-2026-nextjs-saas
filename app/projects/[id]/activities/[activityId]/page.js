import Link from "next/link";
import { notFound } from "next/navigation";
import { getActivityDetails } from "@/lib/projects/projects";
import { getFanProjectStatus } from "@/lib/projects/fanproject-status";
import { getSectorInstructions } from "@/lib/projects/sector-instructions";

export const dynamic = "force-dynamic";

export default async function ActivityDetailPage({ params }) {
  const { id, activityId } = await params;

  const activity = await getActivityDetails(id, activityId);

  if (!activity) {
    notFound();
  }

  const status = getFanProjectStatus(activity.estado);
  const instruccionesPorSector = getSectorInstructions(activity.instruccionesPorSector);

  return (
    <main className="min-h-screen bg-[#FDFDFF] text-[#823038] p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={`/projects/${id}`} className="text-sm text-[#C0567A] hover:underline">
          &larr; Volver al proyecto
        </Link>
      </div>

      <span className="text-xs font-semibold uppercase tracking-widest text-[#C0567A]">
        Detalle de actividad
      </span>
      <span className={`ml-3 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${status.badgeClassName}`}>
        {status.label}
      </span>
      {/* Usamos activity.titulo */}
      <h1 className="text-3xl font-bold mt-2 text-[#5C1F3A]">{activity.titulo}</h1>
      
      {/* Usamos activity.descripcion */}
      <p className="text-base text-[#8A5468] mt-4 leading-relaxed bg-white p-5 rounded-xl border border-[#F2B8CF]">
        {activity.descripcion}
      </p>

      {/* Usamos activity.elementos */}
      {activity.elementos && activity.elementos.length > 0 ? (
        <div className="mt-6 border border-[#F2B8CF] p-5 rounded-xl bg-[#FFE4F3]">
          <span className="text-xs font-medium text-[#C0567A] uppercase tracking-wider">Elementos necesarios:</span>
          <ul className="list-disc list-inside mt-3 text-sm text-[#8A5468] space-y-1">
            {activity.elementos.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {instruccionesPorSector.length > 0 ? (
        <section className="mt-6 border border-[#F2B8CF] p-5 rounded-xl bg-white">
          <h2 className="text-xs font-medium text-[#C0567A] uppercase tracking-wider">
            Instrucciones por sector
          </h2>
          <div className="mt-3 space-y-3">
            {instruccionesPorSector.map(({ sector, instruccion }) => (
              <div key={`${sector}-${instruccion}`} className="rounded-lg border border-[#F2B8CF] bg-[#FFE4F3] p-4">
                <h3 className="text-sm font-semibold text-[#5C1F3A]">{sector}</h3>
                <p className="mt-1 text-sm leading-relaxed text-[#8A5468]">{instruccion}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
