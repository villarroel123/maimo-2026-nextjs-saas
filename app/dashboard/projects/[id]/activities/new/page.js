import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/firebase/session";
import { getCurrentUserProfile } from "@/lib/users/users";
import { createFanProject } from "@/lib/projects/projects";

export const dynamic = "force-dynamic";

export default async function NewActivityPage({ params }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getCurrentUserProfile(user);
  if (profile?.user_type !== "admin") redirect("/dashboard");

async function handleCreateActivity(formData) {
    "use server";
    const titulo = formData.get("titulo");
    const descripcion = formData.get("descripcion");
    const elementos = formData.get("elementos"); 

    const res = await createFanProject(id, { titulo, descripcion, elementos });
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