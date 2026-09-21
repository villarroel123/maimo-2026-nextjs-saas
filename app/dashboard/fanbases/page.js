import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import CircleArrowIcon from "@/components/icons/CircleArrowIcon";
import { getCurrentUser } from "@/lib/firebase/session";
import { createFanbase, getFanbases } from "@/lib/fanbases/fanbases";
import { requireAdmin } from "@/lib/users/authorization";
import { getCurrentUserProfile } from "@/lib/users/users";

export const dynamic = "force-dynamic";

export default async function FanbasesManagementPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  const profile = await getCurrentUserProfile(user);

  if (profile?.user_type !== "admin") redirect("/dashboard");

  const fanbases = await getFanbases();

  async function createFanbaseAction(formData) {
    "use server";

    const currentUser = await requireAdmin();
    const currentProfile = await getCurrentUserProfile(currentUser);

    await createFanbase({
      creator: {
        uid: currentUser.uid,
        displayName:
          currentProfile?.displayName ||
          currentUser.name ||
          currentUser.email?.split("@")[0] ||
          "Fan de Narabi",
        photoURL: currentProfile?.photoURL || currentUser.picture || "",
      },
      data: {
        name: formData.get("name"),
        kpopGroup: formData.get("kpopGroup"),
        country: formData.get("country"),
        city: formData.get("city"),
        description: formData.get("description"),
        instagram: formData.get("instagram"),
      },
    });

    revalidatePath("/fanbases");
    revalidatePath("/dashboard/fanbases");
    redirect("/dashboard/fanbases");
  }

  return (
    <main className="min-h-screen bg-[#FDFDFF] text-[#823038]">
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#B53E66] hover:underline" href="/dashboard">
          <CircleArrowIcon direction="left" className="size-4" />
          Volver al dashboard
        </Link>

        <div className="mt-6 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C0567A]">Comunidad</p>
          <h1 className="mt-3 text-3xl font-semibold text-[#5C1F3A] sm:text-5xl">Gestionar fanbases</h1>
          <p className="mt-3 text-sm leading-6 text-[#8A5468]">
            Creá las comunidades que organizan fanprojects. Al crear una, tu cuenta quedará como fundadora.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]">
          <form action={createFanbaseAction} className="rounded-3xl border border-[#F2B8CF] bg-[#FFE4F3] p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-[#5C1F3A]">Nueva fanbase</h2>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm font-semibold text-[#5C1F3A]">
                Nombre
                <input className="h-11 rounded-xl border border-[#F2B8CF] bg-white px-3 font-normal outline-none transition focus:border-[#C0567A]" name="name" placeholder="Ej. ARMY Argentina" required />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[#5C1F3A]">
                Grupo de K-pop
                <input className="h-11 rounded-xl border border-[#F2B8CF] bg-white px-3 font-normal outline-none transition focus:border-[#C0567A]" name="kpopGroup" placeholder="Ej. BTS" required />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-[#5C1F3A]">
                  País
                  <input className="h-11 rounded-xl border border-[#F2B8CF] bg-white px-3 font-normal outline-none transition focus:border-[#C0567A]" name="country" placeholder="Argentina" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-[#5C1F3A]">
                  Ciudad
                  <input className="h-11 rounded-xl border border-[#F2B8CF] bg-white px-3 font-normal outline-none transition focus:border-[#C0567A]" name="city" placeholder="Buenos Aires" />
                </label>
              </div>
              <label className="grid gap-2 text-sm font-semibold text-[#5C1F3A]">
                Descripción
                <textarea className="min-h-28 rounded-xl border border-[#F2B8CF] bg-white p-3 font-normal outline-none transition focus:border-[#C0567A]" name="description" placeholder="Contá qué hace esta comunidad." />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[#5C1F3A]">
                Instagram (opcional)
                <input className="h-11 rounded-xl border border-[#F2B8CF] bg-white px-3 font-normal outline-none transition focus:border-[#C0567A]" name="instagram" placeholder="@armyar" />
              </label>
              <button className="mt-2 h-11 rounded-full bg-[#5C1F3A] px-4 text-sm font-semibold text-white transition hover:bg-[#7A2A4D]" type="submit">
                Crear fanbase
              </button>
            </div>
          </form>

          <section>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-[#5C1F3A]">Fanbases registradas</h2>
              <span className="rounded-full bg-[#FFE4F3] px-3 py-1 text-xs font-semibold text-[#823038]">{fanbases.length} total</span>
            </div>
            <div className="mt-4 space-y-3">
              {fanbases.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#EAB0C8] bg-white p-5 text-sm text-[#8A5468]">
                  Todavía no hay fanbases creadas.
                </div>
              ) : fanbases.map((fanbase) => (
                <article className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#F2B8CF] bg-white p-4" key={fanbase.id}>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#C0567A]">{fanbase.kpopGroup}</p>
                    <h3 className="mt-1 text-lg font-semibold text-[#5C1F3A]">{fanbase.name}</h3>
                    <p className="mt-1 text-sm text-[#8A5468]">{[fanbase.city, fanbase.country].filter(Boolean).join(", ") || "Ubicación a confirmar"} · {fanbase.memberCount} integrante{fanbase.memberCount === 1 ? "" : "s"}</p>
                  </div>
                  <Link className="rounded-full border border-[#823038] px-3 py-2 text-sm font-semibold text-[#823038] transition hover:bg-[#FFE4F3]" href={`/fanbases/${fanbase.id}`}>
                    Ver perfil
                  </Link>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
