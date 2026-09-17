import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/firebase/session";
import { getCurrentUserProfile } from "@/lib/users/users";
import { getActivityDetails, updateFanProject } from "@/lib/projects/projects";
import { FANPROJECT_STATUSES, getFanProjectStatus } from "@/lib/projects/fanproject-status";
import { sectorInstructionsToText } from "@/lib/projects/sector-instructions";
import { notifyFavoriteUsers } from "@/lib/notifications/notifications";
import { requireAdmin } from "@/lib/users/authorization";
import CircleArrowIcon from "@/components/icons/CircleArrowIcon";

export const dynamic = "force-dynamic";

export default async function EditActivityPage({ params }) {
  const { id, activityId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getCurrentUserProfile(user);
  if (profile?.user_type !== "admin") redirect("/dashboard");

  const activity = await getActivityDetails(id, activityId);
  if (!activity) redirect(`/dashboard/projects/${id}`);

  async function handleUpdateActivity(formData) {
    "use server";
    await requireAdmin();
    const titulo = String(formData.get("titulo") || "").trim();
    const descripcion = String(formData.get("descripcion") || "").trim();
    const elementos = String(formData.get("elementos") || "");
    const estado = String(formData.get("estado") || "");
    const instruccionesPorSector = String(formData.get("instruccionesPorSector") || "");

    if (!titulo || !descripcion) {
      throw new Error("Completá el título y la descripción del fanproject.");
    }

    const res = await updateFanProject(id, activityId, { titulo, descripcion, elementos, estado, instruccionesPorSector });
    if (res.success) {
      if (res.statusChanged) {
        try {
          await notifyFavoriteUsers({
            projectId: id,
            title: `Nuevo estado: ${res.title}`,
            message: `El fanproject que guardaste ahora está: ${res.statusLabel}.`,
            href: `/projects/${id}/activities/${activityId}`,
          });
        } catch (error) {
          console.error("Could not notify favorite users about the fanproject update:", error);
        }
      }

      redirect(`/dashboard/projects/${id}`);
    }
  }

  const elementosStr = Array.isArray(activity.elementos) ? activity.elementos.join(", ") : "";
  const instruccionesPorSector = sectorInstructionsToText(activity.instruccionesPorSector);

  return (
    <main className="min-h-screen bg-[#FDFDFF] text-[#823038] p-8 max-w-xl mx-auto">
      <div className="mb-6">
        <Link href={`/dashboard/projects/${id}`} className="inline-flex items-center gap-2 text-sm text-[#C0567A] hover:underline">
          <CircleArrowIcon direction="left" className="size-4" />
          Volver al proyecto
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-[#5C1F3A] mb-2">Editar Actividad</h1>
      <p className="text-sm text-[#8A5468] mb-8">Modifica los detalles de la actividad.</p>

      <form action={handleUpdateActivity} className="space-y-5 bg-[#FFE4F3] border border-[#F2B8CF] p-6 rounded-xl">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#8A5468] mb-2">
            Título de la Actividad
          </label>
          <input 
            type="text" 
            name="titulo" 
            required 
            defaultValue={activity.titulo}
            className="w-full bg-white border border-[#F2B8CF] rounded-lg px-4 py-2.5 text-[#5C1F3A] focus:outline-none focus:border-[#C0567A]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#8A5468] mb-2">
            Descripción
          </label>
          <textarea 
            name="descripcion" 
            required 
            rows={4}
            defaultValue={activity.descripcion}
            className="w-full bg-white border border-[#F2B8CF] rounded-lg px-4 py-2.5 text-[#5C1F3A] focus:outline-none focus:border-[#C0567A]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#8A5468] mb-2">
            Elementos necesarios (separados por coma)
          </label>
          <input 
            type="text" 
            name="elementos" 
            defaultValue={elementosStr}
            className="w-full bg-white border border-[#F2B8CF] rounded-lg px-4 py-2.5 text-[#5C1F3A] focus:outline-none focus:border-[#C0567A]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#8A5468] mb-2">
            Estado
          </label>
          <select
            name="estado"
            defaultValue={getFanProjectStatus(activity.estado).value}
            className="w-full bg-white border border-[#F2B8CF] rounded-lg px-4 py-2.5 text-[#5C1F3A] focus:outline-none focus:border-[#C0567A]"
          >
            {FANPROJECT_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#8A5468] mb-2" htmlFor="instruccionesPorSector">
            Instrucciones por sector
          </label>
          <textarea
            id="instruccionesPorSector"
            name="instruccionesPorSector"
            rows={5}
            defaultValue={instruccionesPorSector}
            aria-describedby="sector-instructions-help"
            className="w-full bg-white border border-[#F2B8CF] rounded-lg px-4 py-2.5 text-[#5C1F3A] focus:outline-none focus:border-[#C0567A]"
          />
          <p id="sector-instructions-help" className="mt-2 text-xs text-[#8A5468]">
            Una línea por sector, usando el formato: Sector | Instrucción.
          </p>
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
