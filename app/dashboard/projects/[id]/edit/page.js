import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/firebase/session";
import { getCurrentUserProfile } from "@/lib/users/users";
import { getProjectWithDetails, updateProject } from "@/lib/projects/projects";
import { notifyFavoriteUsers } from "@/lib/notifications/notifications";
import { requireAdmin } from "@/lib/users/authorization";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({ params }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getCurrentUserProfile(user);
  if (profile?.user_type !== "admin") redirect("/dashboard");

  const project = await getProjectWithDetails(id);
  if (!project) redirect("/projects");

  async function handleUpdate(formData) {
    "use server";
    await requireAdmin();
    const titulo = String(formData.get("titulo") || "").trim();
    const pais = String(formData.get("pais") || "").trim();
    const fecha = String(formData.get("fecha") || "").trim();
    const ubicacion = String(formData.get("ubicacion") || "").trim();
    const imagen = String(formData.get("imagen") || "").trim();

    if (!titulo || !pais || !fecha) {
      throw new Error("Completá el título, país y fecha del concierto.");
    }

    const res = await updateProject(id, { titulo, pais, fecha, ubicacion, imagen });
    if (res.success) {
      if (res.changes.length > 0) {
        const updatedFields = res.changes.join(" y ");

        try {
          await notifyFavoriteUsers({
            projectId: id,
            title: `Actualización de ${res.title}`,
            message: `Se actualizó ${updatedFields} de este concierto que guardaste en favoritos.`,
            href: `/projects/${id}`,
          });
        } catch (error) {
          console.error("Could not notify favorite users about the project update:", error);
        }
      }

      redirect("/dashboard/projects");
    }
  }

  return (
    <main className="min-h-screen bg-[#FDFDFF] text-[#823038] p-8 max-w-xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/projects" className="text-sm text-[#C0567A] hover:underline">
          &larr; Volver al listado
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-[#5C1F3A] mb-2">Editar Concierto</h1>
      <p className="text-sm text-[#8A5468] mb-8">Modifica los datos principales del evento.</p>

      <form action={handleUpdate} className="space-y-5 bg-[#FFE4F3] border border-[#F2B8CF] p-6 rounded-xl">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#8A5468] mb-2">
            Título del Concierto
          </label>
          <input 
            type="text" 
            name="titulo" 
            required 
            defaultValue={project.Titulo}
            className="w-full bg-white border border-[#F2B8CF] rounded-lg px-4 py-2.5 text-[#5C1F3A] focus:outline-none focus:border-[#C0567A]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#8A5468] mb-2">
            Ubicación / Punto de encuentro
          </label>
          <input
            type="text"
            name="ubicacion"
            defaultValue={project.Ubicacion || ""}
            placeholder="Ej: Entrada de Sívori Alta, River Plate"
            className="w-full bg-white border border-[#F2B8CF] rounded-lg px-4 py-2.5 text-[#5C1F3A] focus:outline-none focus:border-[#C0567A]"
          />
        </div>

       <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#8A5468] mb-2">
            País
          </label>
          <input 
            type="text" 
            name="pais" 
            required 
            defaultValue={project.Pais}
            className="w-full bg-white border border-[#F2B8CF] rounded-lg px-4 py-2.5 text-[#5C1F3A] focus:outline-none focus:border-[#C0567A]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#8A5468] mb-2">
            Fecha del concierto
          </label>
          <input 
            type="text" 
            name="fecha" 
            required 
            defaultValue={project["Dia del concierto"]}
            className="w-full bg-white border border-[#F2B8CF] rounded-lg px-4 py-2.5 text-[#5C1F3A] focus:outline-none focus:border-[#C0567A]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#8A5468] mb-2">
            Ruta de la imagen (carpeta public)
          </label>
          <input 
            type="text" 
            name="imagen" 
            defaultValue={project.imagen || ""} 
            placeholder="Ej: /projects/arirang.jpg"
            className="w-full bg-white border border-[#F2B8CF] rounded-lg px-4 py-2.5 text-[#5C1F3A] focus:outline-none focus:border-[#C0567A]"
          />
          <p className="text-xs text-[#8A5468] mt-1">Guarda tu archivo primero en la carpeta <code className="text-[#5C1F3A]">public/projects/</code></p>
        </div>

        <button 
          type="submit"
          className="w-full mt-4 bg-[#5C1F3A] hover:bg-[#7a2a4d] text-white font-semibold py-2.5 rounded-lg transition cursor-pointer"
        >
          Guardar Cambios
        </button>
      </form>
    </main>
  );
}
