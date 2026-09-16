import Link from "next/link";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/firebase/session";
import { hasUnreadNotificationsForUser } from "@/lib/notifications/notifications";
import { getCurrentUserProfile } from "@/lib/users/users";
import { getFanProjectVotingConcerts } from "@/lib/votes/fanproject-votes";
import { castFanProjectVote } from "./actions";

export const dynamic = "force-dynamic";

function getStatusMessage(status) {
  const messages = {
    voted: "Tu voto fue registrado. Ahora podés ver los resultados de esta votación.",
    "already-voted": "Ya habías votado en ese concierto. Cada cuenta puede votar una sola vez.",
    invalid: "Elegí un fanproject válido para votar.",
    unavailable: "No se pudo registrar el voto porque la votación ya no está disponible.",
  };

  return messages[status] || "";
}

export default async function VotingPage({ searchParams }) {
  const user = await getCurrentUser();
  const status = (await searchParams)?.status;
  const [profile, hasUnreadNotifications, concerts] = await Promise.all([
    user ? getCurrentUserProfile(user) : null,
    user ? hasUnreadNotificationsForUser(user.uid) : false,
    getFanProjectVotingConcerts(user?.uid),
  ]);
  const statusMessage = getStatusMessage(status);

  return (
    <main className="min-h-screen bg-[#FDFDFF] text-[#823038]">
      <Navbar hasUnreadNotifications={hasUnreadNotifications} profile={profile} user={user} />
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C0567A]">Participación de la comunidad</p>
        <h1 className="mt-3 text-3xl font-semibold text-[#5C1F3A] sm:text-5xl">Votaciones</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#8A5468]">
          Elegí un fanproject para cada concierto disponible. Cada cuenta puede emitir un voto por concierto.
        </p>

        {statusMessage ? (
          <p className="mt-6 rounded-xl border border-[#F2B8CF] bg-[#FFE4F3] p-4 text-sm text-[#5C1F3A]">
            {statusMessage}
          </p>
        ) : null}

        <div className="mt-8 space-y-6">
          {concerts.length === 0 ? (
            <div className="rounded-xl border border-[#F2B8CF] bg-white p-6 text-sm text-[#8A5468]">
              No hay votaciones activas en este momento.
            </div>
          ) : concerts.map((concert) => {
            const selectedFanProject = concert.candidates.find((candidate) => candidate.id === concert.userVote);

            return (
              <article className="rounded-xl border border-[#F2B8CF] bg-[#FFE4F3] p-5 sm:p-6" key={concert.id}>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#C0567A]">
                  {concert.Pais || "Global"} · {concert["Dia del concierto"] || "Fecha a confirmar"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#5C1F3A]">{concert.Titulo}</h2>
                <p className="mt-2 text-sm text-[#8A5468]">
                  {concert.candidates.length} fanproject{concert.candidates.length === 1 ? "" : "s"} propuesto{concert.candidates.length === 1 ? "" : "s"}.
                </p>

                {!user ? (
                  <Link className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-[#5C1F3A] px-4 text-sm font-semibold text-white transition hover:bg-[#7a2a4d]" href="/login?next=/votaciones">
                    Iniciar sesión para votar
                  </Link>
                ) : selectedFanProject ? (
                  <div className="mt-5">
                    <p className="text-sm font-semibold text-[#5C1F3A]">Tu voto: {selectedFanProject.titulo}</p>
                    <div className="mt-4 space-y-3">
                      {concert.candidates.map((candidate) => {
                        const percentage = concert.totalVotes ? Math.round((candidate.votes / concert.totalVotes) * 100) : 0;

                        return (
                          <div className="rounded-lg border border-[#F2B8CF] bg-white p-4" key={candidate.id}>
                            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                              <span className="font-semibold text-[#5C1F3A]">{candidate.titulo}</span>
                              <span className="text-[#8A5468]">{candidate.votes} voto{candidate.votes === 1 ? "" : "s"} · {percentage}%</span>
                            </div>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#FFE4F3]">
                              <div className="h-full rounded-full bg-[#C0567A]" style={{ width: `${percentage}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <form action={castFanProjectVote} className="mt-5 space-y-3">
                    <input name="projectId" type="hidden" value={concert.id} />
                    <fieldset className="space-y-3">
                      <legend className="text-sm font-semibold text-[#5C1F3A]">Elegí un fanproject</legend>
                      {concert.candidates.map((candidate) => (
                        <label className="flex cursor-pointer gap-3 rounded-lg border border-[#F2B8CF] bg-white p-4 text-sm text-[#8A5468]" key={candidate.id}>
                          <input className="mt-1 size-4 accent-[#823038]" name="fanprojectId" required type="radio" value={candidate.id} />
                          <span>
                            <span className="block font-semibold text-[#5C1F3A]">{candidate.titulo}</span>
                            {candidate.descripcion ? <span className="mt-1 block leading-6">{candidate.descripcion}</span> : null}
                          </span>
                        </label>
                      ))}
                    </fieldset>
                    <button className="inline-flex h-10 items-center justify-center rounded-full bg-[#5C1F3A] px-4 text-sm font-semibold text-white transition hover:bg-[#7a2a4d]" type="submit">
                      Confirmar voto
                    </button>
                  </form>
                )}
              </article>
            );
          })}
        </div>
      </section>
      <Footer />
    </main>
  );
}
