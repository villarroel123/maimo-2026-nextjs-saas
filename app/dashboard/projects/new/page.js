import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/firebase/session";
import { getCurrentUserProfile } from "@/lib/users/users";
import { createProject } from "@/lib/projects/projects";
import { requireAdmin } from "@/lib/users/authorization";
import CircleArrowIcon from "@/components/icons/CircleArrowIcon";
import VenuePicker from "@/components/venues/VenuePicker";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getCurrentUserProfile(user);
  if (profile?.user_type !== "admin") redirect("/dashboard");

  async function handleCreate(formData) {
    "use server";
    await requireAdmin();
    const titulo = String(formData.get("titulo") || "").trim();
    const pais = String(formData.get("pais") || "").trim();
    const fecha = String(formData.get("fecha") || "").trim();
    const ubicacion = String(formData.get("ubicacion") || "").trim();
    const venuePlaceId = String(formData.get("venuePlaceId") || "").trim();
    const venueManualName = String(formData.get("venueManualName") || "").trim();
    const imagen = String(formData.get("imagen") || "").trim();

    if (!titulo || !pais || !fecha) {
      throw new Error("Completá el título, país y fecha del concierto.");
    }

    const res = await createProject({ titulo, pais, fecha, ubicacion, venuePlaceId, venueManualName, imagen });
    if (res.success) {
      redirect("/dashboard");
    }
  }

  return (
    <main className="min-h-screen bg-[#FDFDFF] text-[#823038] p-8 max-w-xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-[#C0567A] hover:underline">
          <CircleArrowIcon direction="left" className="size-4" />
          Volver al Dashboard
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-[#5C1F3A] mb-2">Crear Nuevo Concierto</h1>
      <p className="text-sm text-[#8A5468] mb-8">Da de alta un nuevo evento en la base de datos principal.</p>

      <form action={handleCreate} className="space-y-5 bg-[#FFE4F3] border border-[#F2B8CF] p-6 rounded-xl">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#8A5468] mb-2">
            Título del Concierto / Evento
          </label>
          <input 
            type="text" 
            name="titulo" 
            required 
            placeholder="Ej: STRAYCITY"
            className="w-full bg-white border border-[#F2B8CF] rounded-lg px-4 py-2.5 text-[#5C1F3A] focus:outline-none focus:border-[#C0567A]"
          />
        </div>

        <VenuePicker />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#8A5468] mb-2">
            Ubicación / Punto de encuentro
          </label>
          <input
            type="text"
            name="ubicacion"
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
            placeholder="Ej: Argentina"
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
            placeholder="Ej: 14 de Septiembre de 2026"
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
            placeholder="Ej: /projects/arirang.jpg"
            className="w-full bg-white border border-[#F2B8CF] rounded-lg px-4 py-2.5 text-[#5C1F3A] focus:outline-none focus:border-[#C0567A]"
          />
          <p className="text-xs text-[#8A5468] mt-1">Guarda tu archivo primero en la carpeta <code className="text-[#5C1F3A]">public/projects/</code></p>
        </div>

        <button 
          type="submit"
          className="w-full mt-4 bg-[#5C1F3A] hover:bg-[#7a2a4d] text-white font-semibold py-2.5 rounded-lg transition"
        >
          Guardar Concierto
        </button>
      </form>
    </main>
  );
}
