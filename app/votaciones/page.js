import Link from "next/link";
import { getCurrentUser } from "@/lib/firebase/session";
import { getFanProjectVotingConcerts } from "@/lib/votes/fanproject-votes";
import { castFanProjectVote } from "./actions";

export const dynamic = "force-dynamic";

function getStatusMessage(status) {
  const messages = {
    voted: "Tu voto fue registrado. Ya podés seguir el resultado de esta votación.",
    "already-voted": "Ya habías votado en este concierto. Cada cuenta puede votar una sola vez.",
    invalid: "Elegí un fanproject válido para votar.",
    unavailable: "No se pudo registrar el voto porque la votación ya no está disponible.",
  };

  return messages[status] || "";
}

export default async function VotingPage({ searchParams }) {
  const user = await getCurrentUser();
  const status = (await searchParams)?.status;
  const concerts = await getFanProjectVotingConcerts(user?.uid);
  const statusMessage = getStatusMessage(status);

  return (
    <main className="min-h-screen bg-[#FDFDFF] text-[#823038]">
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-[#F2B8CF] bg-[#FFE4F3] px-6 py-8 sm:px-10 sm:py-10">
          <div className="absolute -right-12 -top-16 size-48 rounded-full bg-white/45" />
          <div className="absolute -bottom-24 left-1/3 size-40 rounded-full border-[18px] border-[#F6BDD5]/55" />
          <div className="relative max-w-3xl">
            <p className="inline-flex rounded-full border border-[#E9A8C2] bg-white/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#A63D65]">
              Participación de la comunidad
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[#5C1F3A] sm:text-5xl">
              Elegí el próximo fanproject
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#7A5364] sm:text-base">
              Cada cuenta tiene un voto por concierto. Elegí tu propuesta favorita y acompañá las ideas de la comunidad.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full bg-[#5C1F3A] px-3 py-1.5 font-semibold text-white">
                {concerts.length} votación{concerts.length === 1 ? " activa" : "es activas"}
              </span>
              <span className="rounded-full border border-[#E9A8C2] bg-white/75 px-3 py-1.5 font-medium text-[#823038]">
                1 voto por concierto
              </span>
            </div>
          </div>
        </div>

        {statusMessage ? (
          <div className={`mt-6 rounded-2xl border p-4 text-sm ${
            status === "voted"
              ? "border-[#B7DFC5] bg-[#E9F8EE] text-[#287142]"
              : "border-[#F2B8CF] bg-[#FFF7FB] text-[#823038]"
          }`}>
            {statusMessage}
          </div>
        ) : null}

        <div className="mt-10 space-y-7">
          {concerts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#E9A8C2] bg-[#FFF7FB] px-6 py-12 text-center">
              <p className="text-lg font-semibold text-[#5C1F3A]">No hay votaciones activas</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#8A5468]">
                Cuando se publiquen nuevas propuestas para un concierto, van a aparecer acá.
              </p>
              <Link className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-[#5C1F3A] px-4 text-sm font-semibold text-white transition hover:bg-[#7A2A4D]" href="/">
                Ver conciertos
              </Link>
            </div>
          ) : concerts.map((concert) => {
            const selectedFanProject = concert.candidates.find((candidate) => candidate.id === concert.userVote);

            return (
              <article className="overflow-hidden rounded-3xl border border-[#F2B8CF] bg-white shadow-[0_14px_35px_rgba(130,48,56,0.08)]" key={concert.id}>
                <div className="border-b border-[#FCE7F0] bg-[#FFF7FB] px-5 py-5 sm:px-7">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#C0567A]">
                        {concert.Pais || "Global"} · {concert["Dia del concierto"] || "Fecha a confirmar"}
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold text-[#5C1F3A]">{concert.Titulo}</h2>
                    </div>
                    <span className="inline-flex w-fit rounded-full border border-[#F2B8CF] bg-white px-3 py-1.5 text-xs font-semibold text-[#8A5468]">
                      {concert.candidates.length} propuesta{concert.candidates.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>

                <div className="p-5 sm:p-7">
                  {!user ? (
                    <div className="flex flex-col gap-4 rounded-2xl bg-[#FFE4F3] p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-[#5C1F3A]">Iniciá sesión para participar</p>
                        <p className="mt-1 text-sm text-[#8A5468]">Tu cuenta permite emitir un voto en este concierto.</p>
                      </div>
                      <Link className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-[#5C1F3A] px-4 text-sm font-semibold text-white transition hover:bg-[#7A2A4D]" href="/login?next=/votaciones">
                        Iniciar sesión
                      </Link>
                    </div>
                  ) : selectedFanProject ? (
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#B7DFC5] bg-[#E9F8EE] px-4 py-3">
                        <p className="text-sm font-semibold text-[#287142]">Voto registrado: {selectedFanProject.titulo}</p>
                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#287142]">Resultados actuales</span>
                      </div>
                      <div className="mt-4 grid gap-3">
                        {concert.candidates.map((candidate) => {
                          const percentage = concert.totalVotes ? Math.round((candidate.votes / concert.totalVotes) * 100) : 0;
                          const isSelected = candidate.id === selectedFanProject.id;

                          return (
                            <div className={`rounded-2xl border p-4 ${isSelected ? "border-[#C9819C] bg-[#FFF7FB]" : "border-[#F2B8CF] bg-white"}`} key={candidate.id}>
                              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                                <span className="font-semibold text-[#5C1F3A]">{candidate.titulo}</span>
                                <span className="font-medium text-[#8A5468]">{candidate.votes} voto{candidate.votes === 1 ? "" : "s"} · {percentage}%</span>
                              </div>
                              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#FFE4F3]">
                                <div className="h-full rounded-full bg-[#C0567A] transition-all" style={{ width: `${percentage}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <form action={castFanProjectVote}>
                      <input name="projectId" type="hidden" value={concert.id} />
                      <fieldset>
                        <legend className="text-base font-semibold text-[#5C1F3A]">Elegí tu propuesta favorita</legend>
                        <p className="mt-1 text-sm text-[#8A5468]">Podés votar una sola vez en este concierto.</p>
                        <div className="mt-5 grid gap-3 md:grid-cols-2">
                          {concert.candidates.map((candidate, index) => (
                            <label className="group block cursor-pointer" key={candidate.id}>
                              <input className="peer sr-only" name="fanprojectId" required type="radio" value={candidate.id} />
                              <span className="block h-full rounded-2xl border border-[#F2B8CF] bg-[#FFF7FB] p-5 transition duration-200 group-hover:-translate-y-0.5 group-hover:border-[#C9819C] group-hover:bg-white peer-checked:border-[#823038] peer-checked:bg-white peer-checked:shadow-[0_8px_24px_rgba(130,48,56,0.12)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#823038]">
                                <span className="flex items-start justify-between gap-3">
                                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#F2B8CF] text-xs font-semibold text-[#823038] peer-checked:bg-[#823038] peer-checked:text-white">
                                    {index + 1}
                                  </span>
                                  <span className="rounded-full border border-[#F2B8CF] bg-white px-2.5 py-1 text-xs font-semibold text-[#A63D65]">Votar</span>
                                </span>
                                <span className="mt-4 block text-base font-semibold text-[#5C1F3A]">{candidate.titulo}</span>
                                {candidate.descripcion ? <span className="mt-2 block text-sm leading-6 text-[#8A5468]">{candidate.descripcion}</span> : null}
                              </span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                      <button className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#5C1F3A] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#7A2A4D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#823038]" type="submit">
                        Confirmar voto
                      </button>
                    </form>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
