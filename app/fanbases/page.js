import Link from "next/link";
import { getFanbases } from "@/lib/fanbases/fanbases";

export const dynamic = "force-dynamic";

export default async function FanbasesPage() {
  const fanbases = await getFanbases();
  const byKpopGroup = fanbases.reduce((groups, fanbase) => {
    const group = fanbase.kpopGroup || "Otros grupos";
    groups.set(group, [...(groups.get(group) || []), fanbase]);
    return groups;
  }, new Map());

  return (
    <main className="min-h-screen bg-[#FDFDFF] text-[#823038]">
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C0567A]">Comunidad Narabi</p>
          <h1 className="mt-3 text-3xl font-semibold text-[#5C1F3A] sm:text-5xl">Fanbases</h1>
          <p className="mt-3 text-sm leading-6 text-[#8A5468]">
            Conocé las comunidades que organizan fanprojects para cada grupo de K-pop y encontrá a sus integrantes.
          </p>
        </div>

        {fanbases.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-[#EAB0C8] bg-[#FFF7FB] p-8 text-sm leading-6 text-[#8A5468]">
            Todavía no hay fanbases registradas. Las próximas comunidades aparecerán acá.
          </div>
        ) : (
          <div className="mt-10 space-y-10">
            {[...byKpopGroup.entries()].map(([kpopGroup, groupFanbases]) => (
              <section key={kpopGroup}>
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-[#FFE4F3] text-sm font-bold text-[#823038]">
                    {kpopGroup.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C0567A]">Grupo de K-pop</p>
                    <h2 className="mt-1 text-2xl font-semibold text-[#5C1F3A]">{kpopGroup}</h2>
                  </div>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {groupFanbases.map((fanbase) => (
                    <Link
                      className="group rounded-3xl border border-[#F2B8CF] bg-white p-5 shadow-[0_16px_40px_-34px_rgba(92,31,58,0.65)] transition hover:-translate-y-1 hover:border-[#D985A5] hover:shadow-[0_20px_40px_-28px_rgba(92,31,58,0.35)]"
                      href={`/fanbases/${fanbase.id}`}
                      key={fanbase.id}
                    >
                      <span className="grid size-12 place-items-center rounded-2xl bg-[#FFE4F3] text-lg font-bold text-[#823038]">
                        {fanbase.name.charAt(0).toUpperCase()}
                      </span>
                      <h3 className="mt-5 text-xl font-semibold text-[#5C1F3A] transition group-hover:text-[#B53E66]">{fanbase.name}</h3>
                      <p className="mt-2 min-h-10 text-sm leading-5 text-[#8A5468]">
                        {[fanbase.city, fanbase.country].filter(Boolean).join(", ") || "Ubicación a confirmar"}
                      </p>
                      <span className="mt-5 inline-flex rounded-full bg-[#FFF7FB] px-3 py-1.5 text-xs font-semibold text-[#823038]">
                        {fanbase.memberCount} integrante{fanbase.memberCount === 1 ? "" : "s"}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
