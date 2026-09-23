import FanbaseGrid from "@/components/fanbases/FanbaseGrid";
import { getFanbases } from "@/lib/fanbases/fanbases";

export const dynamic = "force-dynamic";

export default async function FanbasesPage() {
  const fanbases = await getFanbases();

  return (
    <main className="min-h-screen bg-[#FDFDFF] text-[#0D1821]">
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C0567A]">Comunidad Narabi</p>
          <h1 className="mt-3 text-3xl text-[#5C1F3A] sm:text-5xl">Fanbases</h1>
          <p className="mt-3 text-sm leading-6 text-[#8A5468]">
            Comunidades que organizan y acompañan los fanprojects de cada grupo de K-pop.
          </p>
        </div>

        {fanbases.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-[#EAB0C8] bg-[#FFF7FB] p-8 text-sm leading-6 text-[#8A5468]">
            Todavía no hay fanbases registradas. Las próximas comunidades aparecerán acá.
          </div>
        ) : (
          <FanbaseGrid fanbases={fanbases} />
        )}
      </section>
    </main>
  );
}
