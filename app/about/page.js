import Link from "next/link";

const highlights = [
  {
    number: "01",
    title: "Encontrá conciertos",
    description: "Explorá conciertos y proyectos de fans para descubrir qué se está organizando cerca tuyo.",
  },
  {
    number: "02",
    title: "Participá en comunidad",
    description: "Conectá con fanbases y colaborá con otras personas que comparten tu entusiasmo.",
  },
  {
    number: "03",
    title: "Hacé realidad tus ideas",
    description: "Sumate a las votaciones y ayudá a preparar fanprojects para cada concierto.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#EEEEEE]">
      <section className="relative overflow-hidden bg-[#823038] px-4 py-20 text-[#FDFDFF] sm:px-6 sm:py-28 lg:px-8">
        <div aria-hidden="true" className="absolute -right-20 -top-28 size-80 rounded-full border-[40px] border-[#FFE4F3]/10 sm:size-[28rem]" />
        <div className="relative mx-auto max-w-5xl">
          <p className="inline-flex rounded-full border border-[#FFE4F3]/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#FFE4F3]">De fans para fans</p>
          <h1 className="mt-6 max-w-3xl text-5xl leading-tight sm:text-7xl">Los conciertos se disfrutan más en comunidad.</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-[#FDFDFF]/80 sm:text-lg sm:leading-8">
            Narabi es un espacio para encontrar conciertos, compartir ideas y organizar fanprojects junto a otras personas fans.
          </p>
          <Link className="mt-9 inline-flex min-h-11 items-center justify-center rounded-full bg-[#FFE4F3] px-6 text-sm font-bold text-[#823038] transition hover:bg-white" href="/fanbases">
            Conocé las fanbases
          </Link>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C0567A]">Qué hacemos</p>
          <h2 className="mt-3 max-w-sm text-4xl leading-tight text-[#823038] sm:text-5xl">Una idea compartida puede cambiar una noche.</h2>
        </div>
        <div className="space-y-5 text-base leading-7 text-[#0D1821]/75">
          <p>Un cartel, un proyecto especial o una sorpresa se vuelven posibles cuando muchas personas se organizan. Narabi ayuda a reunir esas ideas en un solo lugar.</p>
          <p>Acá podés conocer proyectos de conciertos, participar en votaciones y encontrar fanbases que impulsan iniciativas para sus comunidades. Cada aporte ayuda a que la experiencia del show sea todavía más especial.</p>
        </div>
      </section>

      <section className="bg-[#FDFDFF] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C0567A]">Cómo ser parte</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {highlights.map((highlight) => (
              <article className="rounded-2xl border border-[#823038]/15 bg-[#FFE4F3]/35 p-6" key={highlight.number}>
                <span className="text-sm font-bold tracking-[0.12em] text-[#C0567A]">{highlight.number}</span>
                <h3 className="mt-5 text-2xl text-[#823038]">{highlight.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#0D1821]/70">{highlight.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 text-center sm:px-6 sm:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C0567A]">Hecho por y para fans</p>
        <h2 className="mx-auto mt-3 max-w-2xl text-4xl text-[#823038] sm:text-5xl">¿Lista para organizar algo increíble?</h2>
        <Link className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full bg-[#823038] px-6 text-sm font-bold text-white transition hover:bg-[#5C1F3A]" href="/">
          Explorá Narabi
        </Link>
      </section>
    </main>
  );
}