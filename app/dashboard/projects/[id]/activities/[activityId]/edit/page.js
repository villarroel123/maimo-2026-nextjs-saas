import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/firebase/session";
import { getCurrentUserProfile } from "@/lib/users/users";
import { getActivityDetails, updateFanProject } from "@/lib/projects/projects";
import { FANPROJECT_STATUSES, getFanProjectStatus } from "@/lib/projects/fanproject-status";
import { sectorInstructionsToText } from "@/lib/projects/sector-instructions";
import { getOrganizedFanbasesForUser } from "@/lib/fanbases/fanbases";
import { notifyFavoriteUsers } from "@/lib/notifications/notifications";
import CircleArrowIcon from "@/components/icons/CircleArrowIcon";

export const dynamic = "force-dynamic";

export default async function EditActivityPage({ params }) {
  const { id, activityId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getCurrentUserProfile(user);
  const isAdmin = profile?.user_type === "admin";
  const isFanbaseAccount = profile?.user_type === "fanbase";
  if (!isAdmin && !isFanbaseAccount) redirect("/profile");

  const [activity, fanbases] = await Promise.all([
    getActivityDetails(id, activityId),
    getOrganizedFanbasesForUser(user.uid),
  ]);
  if (!activity) redirect(`/dashboard/projects/${id}`);
  const managedFanbaseIds = new Set(fanbases.map((fanbase) => fanbase.id));
  if (!isAdmin && !managedFanbaseIds.has(activity.fanbaseId)) redirect(`/dashboard/projects/${id}`);

  async function handleUpdateActivity(formData) {
    "use server";
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Unauthorized.");
    const currentProfile = await getCurrentUserProfile(currentUser);
    const currentIsAdmin = currentProfile?.user_type === "admin";
    const currentIsFanbase = currentProfile?.user_type === "fanbase";
    if (!currentIsAdmin && !currentIsFanbase) throw new Error("Forbidden.");
    const titulo = String(formData.get("titulo") || "").trim();
    const descripcion = String(formData.get("descripcion") || "").trim();
    const elementos = String(formData.get("elementos") || "");
    const estado = String(formData.get("estado") || "");
    const instruccionesPorSector = String(formData.get("instruccionesPorSector") || "");
    const fanbaseId = String(formData.get("fanbaseId") || "").trim();
    const availableFanbases = await getOrganizedFanbasesForUser(currentUser.uid);
    const fanbase = fanbaseId ? availableFanbases.find((item) => item.id === fanbaseId) : null;
    const currentActivity = await getActivityDetails(id, activityId);
    const availableFanbaseIds = new Set(availableFanbases.map((item) => item.id));

    if (!currentActivity || (!currentIsAdmin && !availableFanbaseIds.has(currentActivity.fanbaseId))) {
      throw new Error("No tenés permisos para editar este fanproject.");
    }

    if (!titulo || !descripcion) {
      throw new Error("Completá el título y la descripción del fanproject.");
    }

    if (fanbaseId && !fanbase) {
      throw new Error("Seleccioná una fanbase que administres.");
    }

    if (currentIsFanbase && !fanbase) {
      throw new Error("El fanproject debe permanecer asociado a una fanbase que administres.");
    }

    const res = await updateFanProject(id, activityId, { titulo, descripcion, elementos, estado, instruccionesPorSector, fanbase });
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

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#8A5468] mb-2" htmlFor="fanbaseId">
            Fanbase organizadora
          </label>
          <select
            id="fanbaseId"
            name="fanbaseId"
            defaultValue={activity.fanbaseId || ""}
            className="w-full bg-white border border-[#F2B8CF] rounded-lg px-4 py-2.5 text-[#5C1F3A] focus:outline-none focus:border-[#C0567A]"
          >
            {isAdmin ? <option value="">Publicación personal</option> : null}
            {fanbases.map((fanbase) => (
              <option key={fanbase.id} value={fanbase.id}>
                {fanbase.name} · {fanbase.kpopGroup}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-[#8A5468]">
            Vinculá el fanproject a una fanbase para mostrar su autoría pública.
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
