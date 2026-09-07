import Link from "next/link";
import { notFound } from "next/navigation";
import { getActivityDetails } from "@/lib/projects/projects";

export const dynamic = "force-dynamic";

export default async function ActivityDetailPage({ params }) {
  const { id, activityId } = await params;

  const activity = await getActivityDetails(id, activityId);

  if (!activity) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={`/projects/${id}`} className="text-sm text-cyan-400 hover:underline">
          &larr; Volver al proyecto
        </Link>
      </div>

      <span className="text-xs font-semibold uppercase tracking-widest text-cyan-300">
        Detalle de actividad
      </span>
      {/* Usamos activity.titulo */}
      <h1 className="text-3xl font-bold mt-2 text-zinc-50">{activity.titulo}</h1>
      
      {/* Usamos activity.descripcion */}
      <p className="text-base text-zinc-300 mt-4 leading-relaxed bg-zinc-900 p-5 rounded-xl border border-zinc-800">
        {activity.descripcion}
      </p>

      {/* Usamos activity.elementos */}
      {activity.elementos && activity.elementos.length > 0 ? (
        <div className="mt-6 border border-zinc-800 p-5 rounded-xl bg-zinc-900/50">
          <span className="text-xs font-medium text-cyan-300 uppercase tracking-wider">Elementos necesarios:</span>
          <ul className="list-disc list-inside mt-3 text-sm text-zinc-300 space-y-1">
            {activity.elementos.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </main>
  );
}