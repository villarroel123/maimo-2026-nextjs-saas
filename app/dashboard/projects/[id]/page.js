import Link from "next/link";
import { redirect } from "next/navigation";
import { getProjectWithDetails, deleteFanProject } from "@/lib/projects/projects";
import { getCurrentUser } from "@/lib/firebase/session";
import { getCurrentUserProfile } from "@/lib/users/users";
import DeleteActivityButton from "@/components/DeleteActivityButton";
import { getFanProjectStatus } from "@/lib/projects/fanproject-status";

export const dynamic = "force-dynamic";

export default async function AdminProjectDetailPage({ params }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getCurrentUserProfile(user);
  if (profile?.user_type !== "admin") redirect("/dashboard");

  const project = await getProjectWithDetails(id);
  if (!project) redirect("/dashboard");

  async function handleDeleteActivity(formData) {
    "use server";
    const projId = formData.get("projectId");
    const actId = formData.get("activityId");
    await deleteFanProject(projId, actId);
    redirect(`/dashboard/projects/${projId}`);
  }

  return (
    <main className="min-h-screen bg-[#FDFDFF] text-[#823038] p-8 max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/dashboard" className="text-sm text-[#C0567A] hover:underline">
          &larr; Volver al Dashboard
        </Link>
        <Link
          href={`/dashboard/projects/${project.id}/activities/new`}
          className="text-xs bg-[#5C1F3A] text-white font-semibold px-4 py-2 rounded-lg hover:bg-[#7a2a4d] transition"
        >
          + Nueva Actividad
        </Link>
      </div>

      {/* Tarjeta principal del Concierto con su respectivo botón de Editar Proyecto */}
      <div className="border border-[#F2B8CF] bg-[#FFE4F3] p-6 rounded-2xl mb-8 flex justify-between items-start">
        <div>
          <span className="text-xs font-semibold text-[#C0567A] uppercase tracking-wider">
            {project.Pais || "Global"} • {project["Dia del concierto"]}
          </span>
          <h1 className="text-3xl font-bold text-[#5C1F3A] mt-2">{project.Titulo}</h1>
        </div>
        <Link
          href={`/dashboard/projects/${project.id}/edit`}
          className="text-xs bg-white hover:bg-[#f9d4e6] text-[#5C1F3A] px-3 py-2 rounded-lg transition font-medium border border-[#F2B8CF] shrink-0"
        >
          Editar Concierto
        </Link>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-bold text-[#5C1F3A]">Gestión de Actividades</h2>
      </div>

      <div className="space-y-3">
        {!project.subitems || project.subitems.length === 0 ? (
          <div className="border border-[#F2B8CF] bg-white p-6 rounded-xl text-center text-[#8A5468]">
            No hay actividades registradas para este concierto todavía.
          </div>
        ) : (
          project.subitems.map((activity) => {
            const status = getFanProjectStatus(activity.estado);

            return (
            <div 
              key={activity.id} 
              className="border border-[#F2B8CF] bg-[#FFE4F3] p-4 rounded-xl flex justify-between items-center gap-4"
            >
              <div>
                <h3 className="text-base font-bold text-[#5C1F3A]">{activity.titulo}</h3>
                <p className="text-xs text-[#8A5468] line-clamp-1 mt-0.5">{activity.descripcion}</p>
                <span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${status.badgeClassName}`}>
                  {status.label}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
               
                <Link
                  href={`/dashboard/projects/${project.id}/activities/${activity.id}/edit`}
                  className="text-xs bg-white hover:bg-[#f9d4e6] text-[#5C1F3A] px-3 py-1.5 rounded-lg transition font-medium border border-[#F2B8CF]"
                >
                  Editar
                </Link>

                <DeleteActivityButton 
                  projectId={project.id}
                  activityId={activity.id}
                  activityTitle={activity.titulo}
                  deleteAction={handleDeleteActivity}
                />
              </div>
            </div>
            );
          })
        )}
      </div>
    </main>
  );
}
