import Link from "next/link";
import Image from "next/image";
import ThumbIcon from "@/components/icons/ThumbIcon";
import VotingCommentsToggle from "@/components/votes/VotingCommentsToggle";
import { getVotingComments } from "@/lib/comments/voting-comments";
import { getCurrentUser } from "@/lib/firebase/session";
import { getConcertImage } from "@/lib/projects/concert-image";
import { getFanProjectVotingConcerts } from "@/lib/votes/fanproject-votes";
import {
  addVotingComment,
  castFanProjectVote,
  toggleVotingReaction,
} from "./actions";

export const dynamic = "force-dynamic";

function getStatusMessage(status) {
  const messages = {
    voted: "Tu voto fue registrado. Ya podés seguir el resultado de esta votación.",
    "already-voted": "Ya habías votado en este concierto. Cada cuenta puede votar una sola vez.",
    invalid: "Elegí un fanproject válido para votar.",
    unavailable: "No se pudo registrar el voto porque la votación ya no está disponible.",
    commented: "Tu comentario fue publicado.",
    "comment-invalid": "No se pudo identificar la propuesta para comentar.",
    "comment-unavailable": "No se pudo publicar tu comentario. Probá nuevamente.",
    reacted: "Tu reacción fue actualizada.",
    "reaction-invalid": "No se pudo identificar tu reacción.",
    "reaction-unavailable": "No se pudo actualizar tu reacción. Probá nuevamente.",
  };

  return messages[status] || "";
}

function formatCommentDate(value) {
  if (!value) return "Recién publicado";

  try {
    return new Intl.DateTimeFormat("es-AR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "Recién publicado";
  }
}

async function getConcertsWithComments(concerts) {
  return Promise.all(
    concerts.map(async (concert) => {
      try {
        return {
          ...concert,
          comments: await getVotingComments(concert.id),
        };
      } catch (error) {
        console.error("Could not load comments for voting:", error);
        return { ...concert, comments: [] };
      }
    }),
  );
}

function getConcertGroupName(concert) {
  if (typeof concert.Grupo === "string" && concert.Grupo.trim()) {
    return concert.Grupo.trim();
  }

  const fanbaseGroups = [...new Set(concert.candidates
    .map((candidate) => typeof candidate.fanbaseKpopGroup === "string" ? candidate.fanbaseKpopGroup.trim() : "")
    .filter(Boolean))];

  const title = typeof concert.Titulo === "string" ? concert.Titulo.trim() : "";
  return fanbaseGroups.length === 1 ? fanbaseGroups[0] : title || "Grupo por confirmar";
}

function groupConcerts(concerts) {
  const groups = new Map();

  for (const concert of concerts) {
    const name = getConcertGroupName(concert);
    const key = name.toLocaleLowerCase("es");
    if (!groups.has(key)) groups.set(key, { name, concerts: [] });
    groups.get(key).concerts.push(concert);
  }

  return [...groups.values()]
    .sort((first, second) => first.name.localeCompare(second.name, "es"))
    .map((group, index) => ({ ...group, anchor: `grupo-${index + 1}` }));
}

function normalizeSearchValue(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");
}

function matchesConcertSearch(concert, query) {
  const searchableValues = [
    getConcertGroupName(concert),
    concert.Titulo,
    concert.Pais,
    concert["Dia del concierto"],
    ...concert.candidates.map((candidate) => candidate.titulo),
  ];

  return searchableValues.some((value) => normalizeSearchValue(value).includes(query));
}

function VotingComments({ comments, concert, user }) {
  const commentCount = comments.length;
  const anchorId = `comentarios-${concert.id}`;
  const loginPath = `/login?next=${encodeURIComponent("/votaciones")}`;
  const authorName = user?.name || user?.email?.split("@")[0] || "Fan";
  const authorInitial = authorName.charAt(0).toUpperCase();

  return (
    <section
      hidden
      id={anchorId}
      className="scroll-mt-6 border-t border-[#FCE7F0] bg-[#FFF7FB]/65 p-5 sm:p-7"
    >
      <div className="space-y-4">
        {user ? (
          <form action={addVotingComment} className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#823038] text-xs font-bold text-white" title={authorName}>
              {authorInitial}
            </span>
            <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-[#E4BAC9] bg-white shadow-[0_3px_10px_rgba(130,48,56,0.05)]">
              <input name="projectId" type="hidden" value={concert.id} />
              <label className="sr-only" htmlFor={`comment-${concert.id}`}>
                Escribí un comentario sobre la votación de {concert.Titulo}
              </label>
              <textarea
                id={`comment-${concert.id}`}
                name="comment"
                required
                maxLength={500}
                rows={3}
                placeholder="Compartí una idea o una pregunta..."
                className="block min-h-24 w-full resize-y border-0 bg-white px-3.5 py-3 text-sm text-[#5C1F3A] outline-none placeholder:text-[#B68A9A] focus:ring-0"
              />
              <div className="flex items-center justify-between gap-3 border-t border-[#F5D5E2] px-3 py-2">
                <span className="text-[11px] text-[#9B697A]">Máximo 500 caracteres.</span>
                <button
                  type="submit"
                  className="rounded-lg bg-[#823038] px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-[#5C1F3A] focus:outline-none focus:ring-2 focus:ring-[#C0567A] focus:ring-offset-2"
                >
                  Publicar
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-[#EAB0C8] bg-white p-3">
            <p className="text-xs leading-relaxed text-[#8A5468]">Iniciá sesión para comentar.</p>
            <Link href={loginPath} className="rounded-full bg-[#823038] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#5C1F3A]">
              Iniciar sesión
            </Link>
          </div>
        )}

        {commentCount ? (
          <div className="space-y-2">
            {comments.map((comment) => (
              <article key={comment.id} className="rounded-xl border border-[#F5D5E2] bg-white p-3">
                <div className="flex items-start gap-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#FFE4F3] text-xs font-bold text-[#823038]">
                    {comment.authorName.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <p className="text-xs font-bold text-[#5C1F3A]">{comment.authorName}</p>
                      <time className="text-[11px] text-[#9B697A]" dateTime={comment.createdAt ?? undefined}>
                        {formatCommentDate(comment.createdAt)}
                      </time>
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-[#754B5B]">
                      {comment.message}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-[#FFF7FB] p-3 text-xs leading-relaxed text-[#8A5468]">
            Todavía no hay comentarios. Sé la primera persona en compartir una idea.
          </p>
        )}
      </div>
    </section>
  );
}

function VotingReactionButton({ direction, projectId, user, userReaction }) {
  const label = direction === "like" ? "Me gusta" : "No me gusta";
  const isActive = userReaction === direction;
  const className = `inline-flex size-7 items-center justify-center text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
    isActive
      ? "text-[#FF9FD6]"
      : "text-white hover:text-[#FF9FD6]"
  }`;

  if (!user) {
    return (
      <Link aria-label={label} className={className} href="/login?next=/votaciones" title={label}>
        <ThumbIcon className="size-5" direction={direction === "dislike" ? "down" : "up"} />
      </Link>
    );
  }

  return (
    <form action={toggleVotingReaction}>
      <input name="projectId" type="hidden" value={projectId} />
      <button aria-label={label} className={className} name="reaction" title={label} type="submit" value={direction}>
        <ThumbIcon className="size-5" direction={direction === "dislike" ? "down" : "up"} />
        <span className="sr-only">{label}</span>
      </button>
    </form>
  );
}

function VotingReactionControls({ concert, user }) {
  const commentCount = concert.comments.length;

  return (
    <div className="mt-auto flex items-center gap-2 pt-5">
      <VotingReactionButton direction="like" projectId={concert.id} user={user} userReaction={concert.userReaction} />
      {concert.reactionCounts?.like ? <span className="mr-2 text-xs font-semibold text-white/80">{concert.reactionCounts.like}</span> : null}
      <VotingReactionButton direction="dislike" projectId={concert.id} user={user} userReaction={concert.userReaction} />
      {concert.reactionCounts?.dislike ? <span className="mr-2 text-xs font-semibold text-white/80">{concert.reactionCounts.dislike}</span> : null}
      <VotingCommentsToggle commentCount={commentCount} panelId={`comentarios-${concert.id}`} />
      {commentCount ? <span className="text-xs font-semibold text-white/80">{commentCount}</span> : null}
    </div>
  );
}

export default async function VotingPage({ searchParams }) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const status = params?.status;
  const query = typeof params?.q === "string" ? params.q.trim().slice(0, 100) : "";
  const votingConcerts = await getFanProjectVotingConcerts(user?.uid);
  const normalizedQuery = normalizeSearchValue(query);
  const matchingConcerts = normalizedQuery
    ? votingConcerts.filter((concert) => matchesConcertSearch(concert, normalizedQuery))
    : votingConcerts;
  const concerts = await getConcertsWithComments(matchingConcerts);
  const concertGroups = groupConcerts(concerts);
  const statusMessage = getStatusMessage(status);

  return (
    <main className="min-h-screen bg-[#FDFDFF] text-[#823038]">
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-4xl font-semibold tracking-tight text-[#5C1F3A] sm:text-5xl">
            Elegí el próximo fanproject
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#7A5364] sm:text-base">
            Cada cuenta tiene un voto por concierto. Elegí tu propuesta favorita y acompañá las ideas de la comunidad.
          </p>
          <p className="mt-5 text-sm font-medium text-[#823038]">
            {votingConcerts.length} votación{votingConcerts.length === 1 ? " activa" : "es activas"} · 1 voto por concierto
          </p>
        </div>

        {statusMessage ? (
          <div className={`mt-6 rounded-2xl border p-4 text-sm ${
            status === "voted" || status === "commented" || status === "reacted"
              ? "border-[#B7DFC5] bg-[#E9F8EE] text-[#287142]"
              : "border-[#F2B8CF] bg-[#FFF7FB] text-[#823038]"
          }`}>
            {statusMessage}
          </div>
        ) : null}

        <div className="mt-10 space-y-10">
          {concerts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#E9A8C2] bg-[#FFF7FB] px-6 py-12 text-center">
              <p className="text-lg font-semibold text-[#5C1F3A]">
                {votingConcerts.length ? `No encontramos votaciones para “${query}”` : "No hay votaciones activas"}
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#8A5468]">
                {votingConcerts.length
                  ? "Probá con el nombre del grupo, del concierto o de un fanproject."
                  : "Cuando se publiquen nuevas propuestas para un concierto, van a aparecer acá."}
              </p>
              <Link className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-[#5C1F3A] px-4 text-sm font-semibold text-white transition hover:bg-[#7A2A4D]" href={votingConcerts.length ? "/votaciones" : "/"}>
                {votingConcerts.length ? "Ver todas las votaciones" : "Ver conciertos"}
              </Link>
            </div>
          ) : concertGroups.map((group) => (
            <section className="scroll-mt-24" id={group.anchor} key={group.anchor}>
              <div className="mx-auto mb-5 w-full max-w-5xl">
                <h2 className="text-2xl font-semibold text-[#5C1F3A] sm:text-3xl">{group.name}</h2>
              </div>
              <div className="space-y-6">
                {group.concerts.map((concert) => {
            const selectedFanProject = concert.candidates.find((candidate) => candidate.id === concert.userVote);
            const concertImage = getConcertImage(concert);

            return (
              <article
                id={`votacion-${concert.id}`}
                className="mx-auto w-full max-w-5xl scroll-mt-6 overflow-hidden rounded-2xl bg-[#823038] text-white shadow-[0_16px_36px_rgba(92,31,58,0.16)]"
                key={concert.id}
              >
                <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,35%)] lg:gap-8">
                  <div className="flex min-w-0 flex-col">
                    <p className="text-sm font-medium text-white/80">Concierto de {group.name}</p>
                    <h3 className="mt-1 text-2xl font-semibold leading-tight sm:text-3xl">Elegí un fanproject</h3>
                    <p className="mt-2 text-sm text-white/75">
                      {typeof concert.Titulo === "string" && concert.Titulo.toLocaleLowerCase("es") !== group.name.toLocaleLowerCase("es") ? `${concert.Titulo} · ` : ""}
                      {concert.Pais || "Lugar a confirmar"} · {concert["Dia del concierto"] || "Fecha a confirmar"}
                    </p>
                    <p className="mt-3 text-sm font-semibold text-white/90">
                      {concert.totalVotes} {concert.totalVotes === 1 ? "voto" : "votos"} · {concert.candidates.length} propuesta{concert.candidates.length === 1 ? "" : "s"}
                    </p>

                  {!user ? (
                    <div className="mt-6">
                      <div className="space-y-2">
                        {concert.candidates.map((candidate) => (
                          <div className="rounded-lg bg-white/90 px-4 py-3 text-sm font-semibold text-[#5C1F3A]" key={candidate.id}>
                            {candidate.titulo}
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <p className="text-sm text-white/85">Iniciá sesión para elegir una propuesta.</p>
                        <Link className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#823038] transition hover:bg-[#FFE4F3]" href="/login?next=/votaciones">
                          Iniciar sesión
                        </Link>
                      </div>
                    </div>
                  ) : selectedFanProject ? (
                    <div className="mt-6">
                      <p className="mb-3 text-sm font-semibold text-white/90">
                        Votaste por {selectedFanProject.titulo}. Estos son los resultados actuales.
                      </p>
                      <div className="space-y-2">
                        {concert.candidates.map((candidate) => {
                          const percentage = concert.totalVotes ? Math.round((candidate.votes / concert.totalVotes) * 100) : 0;
                          const isSelected = candidate.id === selectedFanProject.id;

                          return (
                            <div className={`relative overflow-hidden rounded-lg px-4 py-3 ${isSelected ? "bg-white" : "bg-white/90"}`} key={candidate.id}>
                              <div className="absolute inset-y-0 left-0 bg-[#F5C6D8] transition-all" style={{ width: `${percentage}%` }} />
                              <div className="relative flex items-center justify-between gap-3 text-sm">
                                <span className="font-semibold text-[#5C1F3A]">{candidate.titulo}</span>
                                <span className="shrink-0 font-semibold text-[#5C1F3A]">{percentage}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <form action={castFanProjectVote} className="mt-6">
                      <input name="projectId" type="hidden" value={concert.id} />
                      <fieldset>
                        <legend className="sr-only">Elegí tu propuesta favorita</legend>
                        <div className="space-y-2">
                          {concert.candidates.map((candidate) => (
                            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg bg-white/90 px-4 py-3 text-sm font-semibold text-[#5C1F3A] transition hover:bg-white" key={candidate.id}>
                                <span>{candidate.titulo}</span>
                                <input className="size-4 shrink-0 accent-[#823038]" name="fanprojectId" required type="radio" value={candidate.id} />
                            </label>
                          ))}
                        </div>
                      </fieldset>
                      <button className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#823038] transition hover:bg-[#FFE4F3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" type="submit">
                        Confirmar voto
                      </button>
                    </form>
                  )}

                    <VotingReactionControls concert={concert} user={user} />
                  </div>

                  <div className="order-first lg:order-last">
                    <Link
                      aria-label={`Ver concierto de ${group.name}`}
                      className="group relative block aspect-square w-full overflow-hidden rounded-xl bg-[#5C1F3A] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                      href={`/projects/${concert.id}`}
                    >
                      <Image
                        alt=""
                        aria-hidden="true"
                        className="scale-110 object-cover opacity-60 blur-lg"
                        fill
                        sizes="(min-width: 1024px) 35vw, 100vw"
                        src={concertImage}
                        unoptimized={/^https?:\/\//i.test(concertImage)}
                      />
                      <Image
                        alt={`Concierto de ${group.name}`}
                        className="object-contain"
                        fill
                        sizes="(min-width: 1024px) 35vw, 100vw"
                        src={concertImage}
                        unoptimized={/^https?:\/\//i.test(concertImage)}
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-[#0D1821]/40 p-4 opacity-100 transition-opacity duration-200 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-visible:opacity-100">
                        <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#823038] shadow-sm">Ver concierto</span>
                      </span>
                    </Link>
                  </div>
                </div>

                <VotingComments comments={concert.comments} concert={concert} user={user} />
              </article>
            );
                })}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
