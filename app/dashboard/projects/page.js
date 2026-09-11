import Link from "next/link";
import { redirect } from "next/navigation";
import { getProjects, deleteProject } from "@/lib/projects/projects";
import { getCurrentUser } from "@/lib/firebase/session";
import { getCurrentUserProfile } from "@/lib/users/users";
import DeleteButton from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  const profile = user ? await getCurrentUserProfile(user) : null;
  const isAdmin = profile?.user_type === "admin";

  const projects = await getProjects();

  async function handleDeleteProject(formData) {
    "use server";
    const projectId = formData.get("projectId");
    await deleteProject(projectId);
    redirect("/projects");
  }

  return (
    <main className="min-h-screen bg-[#FDFDFF] text-[#823038] p-8 max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/dashboard" className="text-sm text-[#C0567A] hover:underline">
          &larr; Volver al Dashboard
        </Link>
        {isAdmin && (
          <Link
            href="/dashboard/projects/new"
            className="text-xs bg-[#5C1F3A] text-white font-semibold px-4 py-2 rounded-lg hover:bg-[#7a2a4d] transition"
          >
            + Nuevo Concierto
          </Link>
        )}
      </div>

      <h1 className="text-3xl font-bold text-[#5C1F3A] mb-6">Conciertos y Proyectos</h1>

      <div className="space-y-4">
        {projects.length === 0 ? (
          <p className="text-sm text-[#8A5468]">No hay conciertos registrados todavía.</p>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="border border-[#F2B8CF] p-5 rounded-xl bg-[#FFE4F3] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-xs text-[#C0567A] uppercase">{project.Pais || "Global"} • {project["Dia del concierto"]}</span>
                <h2 className="text-lg font-bold text-[#5C1F3A] mt-1">{project.Titulo}</h2>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                <Link 
                  href={`/dashboard/projects/${project.id}`}
                  className="text-xs bg-white hover:bg-[#f9d4e6] text-[#5C1F3A] px-3 py-2 rounded-lg transition font-medium"
                >
                  Ver actividades &rarr;
                </Link>

                {isAdmin && (
                  <>
                    <Link
                      href={`/dashboard/projects/${project.id}/edit`}
                      className="text-xs bg-white hover:bg-[#f9d4e6] text-[#C0567A] px-3 py-2 rounded-lg transition font-medium"
                    >
                      Editar
                    </Link>

                    <DeleteButton 
                      projectId={project.id} 
                      projectTitle={project.Titulo} 
                      deleteAction={handleDeleteProject} 
                    />
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}