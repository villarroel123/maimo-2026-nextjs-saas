import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/firebase/session";
import { getCurrentUserProfile } from "@/lib/users/users";
import { getActivityDetails, updateFanProject } from "@/lib/projects/projects";
import { FANPROJECT_STATUSES, getFanProjectStatus } from "@/lib/projects/fanproject-status";
import { sectorInstructionsToText } from "@/lib/projects/sector-instructions";

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
    const titulo = formData.get("titulo");
    const descripcion = formData.get("descripcion");
    const elementos = formData.get("elementos");
    const estado = formData.get("estado");
    const instruccionesPorSector = formData.get("instruccionesPorSector");

    const res = await updateFanProject(id, activityId, { titulo, descripcion, elementos, estado, instruccionesPorSector });
    if (res.success) {
      redirect(`/dashboard/projects/${id}`);
    }
  }

  const elementosStr = Array.isArray(activity.elementos) ? activity.elementos.join(", ") : "";
  const instruccionesPorSector = sectorInstructionsToText(activity.instruccionesPorSector);

  return (
    <main className="min-h-screen bg-[#FDFDFF] text-[#823038] p-8 max-w-xl mx-auto">
      <div className="mb-6">
        <Link href={`/dashboard/projects/${id}`} className="text-sm text-[#C0567A] hover:underline">
          &larr; Volver al proyecto
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
