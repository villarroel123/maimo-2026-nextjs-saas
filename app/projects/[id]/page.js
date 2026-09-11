import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectWithDetails } from "@/lib/projects/projects";

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
        <Link href="/" className="text-sm text-[#C0567A] hover:underline">
          &larr; Volver al inicio
        </Link>
      </div>

      <span className="text-xs font-semibold uppercase tracking-widest text-[#C0567A]">
        {project.Pais || "Global"} • {project["Dia del concierto"]}
      </span>
      <h1 className="text-4xl font-bold mt-2 text-[#5C1F3A]">{project.Titulo}</h1>

      <h2 className="mt-10 text-xl font-semibold text-[#5C1F3A] border-b border-[#F2B8CF] pb-2">
        Actividades del evento
      </h2>

      <div className="mt-6 space-y-4">
        {project.subitems.length === 0 ? (
          <p className="text-sm text-[#8A5468]">No hay actividades cargadas para este concierto todavía.</p>
        ) : (
          project.subitems.map((sub) => (
            <div key={sub.id} className="border border-[#F2B8CF] p-5 rounded-xl bg-[#FFE4F3]">
              <Link 
                href={`/projects/${project.id}/activities/${sub.id}`}
                className="text-lg font-semibold text-[#C0567A] hover:underline block"
              >
                {sub.titulo}
              </Link>

              <p className="text-sm text-[#8A5468] mt-2 leading-relaxed">{sub.descripcion}</p>
              
              {sub.elementos && sub.elementos.length > 0 ? (
                <div className="mt-4 pt-4 border-t border-[#F2B8CF]">
                  <span className="text-xs font-medium text-[#C0567A] uppercase tracking-wider">Elementos necesarios:</span>
                  <ul className="list-disc list-inside mt-2 text-sm text-[#8A5468] space-y-1">
                    {sub.elementos.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </main>
  );
}