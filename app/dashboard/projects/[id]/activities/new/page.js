import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/firebase/session";
import { getCurrentUserProfile } from "@/lib/users/users";
import { createFanProject } from "@/lib/projects/projects";
import { FANPROJECT_STATUSES } from "@/lib/projects/fanproject-status";
import { requireAdmin } from "@/lib/users/authorization";

export const dynamic = "force-dynamic";

export default async function NewActivityPage({ params }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getCurrentUserProfile(user);
  if (profile?.user_type !== "admin") redirect("/dashboard");

async function handleCreateActivity(formData) {
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

    const res = await createFanProject(id, { titulo, descripcion, elementos, estado, instruccionesPorSector });
    if (res.success) {
      redirect(`/dashboard/projects/${id}`);
    }
  }

  return (
    <main className="min-h-screen bg-[#FDFDFF] text-[#823038] p-8 max-w-xl mx-auto">
      <div className="mb-6">
        <Link href={`/dashboard/projects/${id}`} className="text-sm text-[#C0567A] hover:underline">
          &larr; Volver a actividades
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-[#5C1F3A] mb-2">Nueva Actividad</h1>
      <p className="text-sm text-[#8A5468] mb-8">Agrega un nuevo fanproject para este concierto.</p>

      <form action={handleCreateActivity} className="space-y-5 bg-[#FFE4F3] border border-[#F2B8CF] p-6 rounded-xl">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#8A5468] mb-2">
            Título de la Actividad
          </label>
          <input 
            type="text" 
            name="titulo" 
            required 
            placeholder="Ej: Luces rojas"
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
            placeholder="Explica en qué consiste la actividad..."
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
            placeholder="Ej: celular, celofán rojo"
            className="w-full bg-white border border-[#F2B8CF] rounded-lg px-4 py-2.5 text-[#5C1F3A] focus:outline-none focus:border-[#C0567A]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#8A5468] mb-2">
            Estado
          </label>
          <select
            name="estado"
            defaultValue="planificado"
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
            placeholder={"Sívori Alta | Encendé la linterna durante el estribillo.\nCampo delantero | Levantá el cartel cuando comience la canción."}
            aria-describedby="sector-instructions-help"
            className="w-full bg-white border border-[#F2B8CF] rounded-lg px-4 py-2.5 text-[#5C1F3A] focus:outline-none focus:border-[#C0567A]"
          />
          <p id="sector-instructions-help" className="mt-2 text-xs text-[#8A5468]">
            Escribí una indicación por línea, separando el sector y la instrucción con |.
          </p>
        </div>

        <button 
          type="submit"
          className="w-full mt-4 bg-[#5C1F3A] hover:bg-[#7a2a4d] text-white font-semibold py-2.5 rounded-lg transition cursor-pointer"
        >
          Crear Actividad
        </button>
      </form>
    </main>
  );
}
