import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getCurrentUserProfile } from "@/lib/users/users";
import { getFanbases, getFollowedFanbasesForUser } from "@/lib/fanbases/fanbases";
import { saveFollowedFanbases } from "./actions";

export const dynamic = "force-dynamic";

function getSafeNext(value) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : "/";
}

export default async function ChooseFanbasesPage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=%2Fonboarding%2Ffanbases");

  const [profile, fanbases, followedFanbases, params] = await Promise.all([
    getCurrentUserProfile(user),
    getFanbases(),
    getFollowedFanbasesForUser(user.uid),
    searchParams,
  ]);
  const next = getSafeNext(params?.next);

  if (profile?.user_type === "admin" || profile?.user_type === "fanbase") redirect("/dashboard");
  if (followedFanbases.length > 0 && !params?.edit) redirect(next);

  return (
    <main className="min-h-screen bg-cover bg-center px-4 py-5 text-[#5C1F3A] sm:py-12" style={{ backgroundImage: "linear-gradient(rgba(253, 253, 255, 0.58), rgba(253, 253, 255, 0.58)), url('/items/hero_one.jpg')" }}>
      <section className="mx-auto max-w-3xl rounded-3xl border border-[#F2B8CF] bg-white/95 p-5 shadow-sm backdrop-blur-sm sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C0567A]">Personalizá Narabi</p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">¿Qué fanbases querés seguir?</h1>
        <p className="mt-3 text-sm leading-6 text-[#8A5468]">Vas a ver las votaciones y novedades de las comunidades que elijas. Podés elegir más de una.</p>

        {params?.error ? <p className="mt-4 rounded-xl bg-[#FFF7FB] p-3 text-sm text-[#823038]">Elegí al menos una fanbase para continuar.</p> : null}

        <form action={saveFollowedFanbases} className="mt-7">
          <input name="next" type="hidden" value={next} />
          <div className="grid gap-3 sm:grid-cols-2">
            {fanbases.map((fanbase) => (
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#F2B8CF] p-4 transition hover:bg-[#FFF7FB]" key={fanbase.id}>
                <input className="size-4 accent-[#823038]" defaultChecked={followedFanbases.some((item) => item.id === fanbase.id)} name="fanbaseId" type="checkbox" value={fanbase.id} />
                <span><strong className="block text-sm">{fanbase.kpopGroup}</strong><span className="text-xs text-[#8A5468]">{fanbase.name}</span></span>
              </label>
            ))}
          </div>
          {fanbases.length === 0 ? <p className="mt-5 text-sm text-[#8A5468]">Todavía no hay fanbases disponibles. Podés explorar Narabi y volver más tarde.</p> : null}
          <button className="mt-7 rounded-full bg-[#823038] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#5C1F3A] disabled:opacity-50" disabled={!fanbases.length} type="submit">Guardar y continuar</button>
        </form>
      </section>
    </main>
  );
}
