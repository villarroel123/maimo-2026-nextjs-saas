import Link from "next/link";
import Image from "next/image";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import VotingReactionControls from "@/components/votes/VotingReactionControls";
import LoginRequiredPopup from "@/components/votes/LoginRequiredPopup";
import { getVotingComments } from "@/lib/comments/voting-comments";
import { getCurrentUser } from "@/lib/firebase/session";
import { getConcertImage } from "@/lib/projects/concert-image";
import { deleteFanProject, getProjectWithDetails } from "@/lib/projects/projects";
import { getCurrentUserProfile } from "@/lib/users/users";
import { getFollowedFanbasesForUser, getOrganizedFanbasesForUser } from "@/lib/fanbases/fanbases";
import { requireFanbaseAdmin } from "@/lib/users/authorization";
import { closeFanProjectVoting, getFanProjectVotingConcerts } from "@/lib/votes/fanproject-votes";
import {
  addVotingComment,
  castFanProjectVote,
} from "./actions";

export const dynamic = "force-dynamic";

async function manageVotingAction(formData, intent) {
  "use server";

  const fanbaseId = String(formData.get("fanbaseId") || "").trim();
  const projectId = String(formData.get("projectId") || "").trim();
  const fanprojectId = String(formData.get("fanprojectId") || "").trim();
  const user = await requireFanbaseAdmin(fanbaseId);
  const project = await getProjectWithDetails(projectId);
  const activity = project?.subitems?.find((item) => item.id === fanprojectId);

  if (!project || !activity) throw new Error("La propuesta seleccionada no es válida.");

  const profile = await getCurrentUserProfile(user);
  if (profile?.user_type !== "admin") {
    const managed = await getOrganizedFanbasesForUser(user.uid);
    if (!managed.some((fanbase) => fanbase.id === activity.fanbaseId)) {
      throw new Error("No tenés permisos para gestionar esta propuesta.");
    }
  }

  if (intent === "delete") {
    await deleteFanProject(projectId, fanprojectId);
  } else if (intent === "close") {
    await closeFanProjectVoting({ projectId, fanprojectId });
  } else {
    throw new Error("La acción seleccionada no es válida.");
  }

  revalidatePath("/votaciones");
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/projects/${projectId}`);
  redirect("/votaciones");
}

async function deleteVotingProposal(formData) {
  "use server";
  return manageVotingAction(formData, "delete");
}

async function closeVotingProposal(formData) {
  "use server";
  return manageVotingAction(formData, "close");
}

function getStatusMessage(status) {
  const messages = {
    voted: "Tu voto fue registrado. Ya podés seguir el resultado de esta votación.",
    "already-voted": "Ya habías votado en este concierto. Cada cuenta puede votar una sola vez.",
    "fanbase-required": "Solo podés votar en propuestas de las fanbases que seguís.",
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

export default async function VotingPage({ searchParams }) {
  const user = await getCurrentUser();
  const profile = user ? await getCurrentUserProfile(user) : null;
  const isAdmin = profile?.user_type === "admin";
  const managedFanbases = user && profile?.user_type === "fanbase"
    ? await getOrganizedFanbasesForUser(user.uid)
    : [];
  const managedFanbaseIds = new Set(managedFanbases.map((fanbase) => fanbase.id));
  const isFanbaseManager = profile?.user_type === "fanbase" && managedFanbaseIds.size > 0;
  const params = await searchParams;
  const status = params?.status;
  const query = typeof params?.q === "string" ? params.q.trim().slice(0, 100) : "";
  const selectedGroup = typeof params?.group === "string" ? params.group.trim() : "";
  let followedFanbases = [];

  if (user && profile?.user_type === "user") {
    followedFanbases = await getFollowedFanbasesForUser(user.uid);
    if (followedFanbases.length === 0) {
      redirect(`/onboarding/fanbases?next=${encodeURIComponent("/votaciones")}`);
    }
  }

  const allVotingConcerts = await getFanProjectVotingConcerts(user?.uid);
  const followedIds = new Set(followedFanbases.map((fanbase) => fanbase.id));
  const visibleFanbaseIds = isFanbaseManager ? managedFanbaseIds : followedIds;
  const shouldFilterByFanbase = isFanbaseManager
    || (profile?.user_type === "user" && followedFanbases.length > 0);
  const votingConcerts = shouldFilterByFanbase
    ? allVotingConcerts.flatMap((concert) => {
      const candidates = concert.candidates.filter((candidate) => visibleFanbaseIds.has(candidate.fanbaseId));
      if (!candidates.length) return [];
      const visibleVoteCount = candidates.reduce((total, candidate) => total + candidate.votes, 0);
      return [{ ...concert, candidates, totalVotes: visibleVoteCount }];
    })
    : allVotingConcerts;
  const normalizedQuery = normalizeSearchValue(query);
  const matchingConcerts = (normalizedQuery
    ? votingConcerts.filter((concert) => matchesConcertSearch(concert, normalizedQuery))
    : votingConcerts).filter((concert) => !selectedGroup || getConcertGroupName(concert) === selectedGroup);
  const concerts = await getConcertsWithComments(matchingConcerts);
  const concertGroups = groupConcerts(concerts);
  const availableGroups = [...new Set(votingConcerts.map(getConcertGroupName))]
    .sort((first, second) => first.localeCompare(second, "es"));
  const groupedConcerts = concertGroups.flatMap((group) =>
    group.concerts.map((concert) => ({ group, concert })),
  );
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
          {isFanbaseManager ? (
            <p className="mt-2 text-xs text-[#8A5468]">Mostrando únicamente las votaciones de tus fanbases.</p>
          ) : null}
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

        <form action="/votaciones" className="mx-auto mt-8 flex max-w-5xl flex-wrap items-end gap-3">
          <div className="min-w-52 flex-1">
            <label className="mb-1.5 block text-sm font-medium text-[#754B5B]" htmlFor="voting-group">Ver votaciones de</label>
            <select className="w-full rounded-xl border border-[#E9C8D5] bg-white px-3 py-2.5 text-sm text-[#5C1F3A] outline-none focus:border-[#C0567A] focus:ring-2 focus:ring-[#F5D5E2]" defaultValue={selectedGroup} id="voting-group" name="group">
              <option value="">Todos los grupos</option>
              {availableGroups.map((group) => <option key={group} value={group}>{group}</option>)}
            </select>
          </div>
          <button className="rounded-xl bg-[#823038] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5C1F3A]" type="submit">Filtrar</button>
          {selectedGroup ? <Link className="px-2 py-2.5 text-sm font-medium text-[#823038] hover:underline" href="/votaciones">Quitar filtro</Link> : null}
        </form>

        <div className="mt-6 space-y-10">
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
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {groupedConcerts.map(({ group, concert }) => {
            const selectedFanProject = concert.candidates.find((candidate) => candidate.id === concert.userVote);
            const concertImage = getConcertImage(concert);

            return (
              <article
                id={`votacion-${concert.id}`}
                className="w-full scroll-mt-6 overflow-hidden rounded-2xl border border-[#F3DCE5] bg-[#FFF7FA] text-[#5C1F3A] shadow-[0_12px_28px_rgba(92,31,58,0.08)]"
                key={concert.id}
              >
                <div className="flex flex-col gap-4 p-4 sm:p-5">
                  <div className="flex min-w-0 flex-col">
                    <p className="text-sm font-medium text-[#9B697A]">Concierto de {group.name}</p>
                    <h3 className="mt-1 text-2xl font-semibold leading-tight sm:text-3xl">Elegí un fanproject</h3>
                    <p className="mt-2 text-sm text-[#754B5B]">
                      {typeof concert.Titulo === "string" && concert.Titulo.toLocaleLowerCase("es") !== group.name.toLocaleLowerCase("es") ? `${concert.Titulo} · ` : ""}
                      {concert.Pais || "Lugar a confirmar"} · {concert["Dia del concierto"] || "Fecha a confirmar"}
                    </p>
                    <p className="mt-3 text-sm font-semibold text-[#823038]">
                      {concert.totalVotes} {concert.totalVotes === 1 ? "voto" : "votos"} · {concert.candidates.length} propuesta{concert.candidates.length === 1 ? "" : "s"}
                    </p>

                  {!user ? (
                    <div className="mt-6">
                      <div className="space-y-2">
                        {concert.candidates.map((candidate) => (
                          <LoginRequiredPopup className="w-full rounded-lg bg-white/90 px-4 py-3 text-left text-sm font-semibold text-[#5C1F3A]" key={candidate.id}>
                            {candidate.titulo}
                          </LoginRequiredPopup>
                        ))}
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <p className="text-sm text-white/85">Elegí una propuesta para iniciar sesión y votar.</p>
                      </div>
                    </div>
                  ) : selectedFanProject ? (
                    <div className="mt-6">
                      <p className="mb-3 text-sm font-semibold text-[#754B5B]">
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
                      <button className="mt-4 rounded-full bg-[#823038] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5C1F3A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C0567A]" type="submit">
                        Confirmar voto
                      </button>
                    </form>
                  )}

                    <VotingReactionControls
                      commentCount={concert.comments.length}
                      initialCounts={concert.reactionCounts}
                      initialReaction={concert.userReaction}
                      isSignedIn={Boolean(user)}
                      projectId={concert.id}
                    />
                    {(isAdmin || isFanbaseManager) ? (
                      <div className="mt-4 rounded-xl border border-white/20 bg-white/10 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-white">Gestionar votación</p>
                          <Link className="text-xs font-semibold text-white underline underline-offset-2 hover:text-[#FFE4F3]" href={`/dashboard/projects/${concert.id}/activities/new`}>Crear propuesta</Link>
                        </div>
                        <div className="mt-3 grid gap-2">
                          {concert.candidates.map((candidate) => {
                            const candidateFanbaseId = candidate.fanbaseId || "";
                            return (
                              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/10 px-3 py-2" key={`manage-${candidate.id}`}>
                                <span className="text-xs font-semibold text-white">{candidate.titulo}</span>
                                <div className="flex items-center gap-2">
                                  <Link className="text-[11px] font-semibold text-white underline underline-offset-2 hover:text-[#FFE4F3]" href={`/dashboard/projects/${concert.id}/activities/${candidate.id}/edit`}>Editar</Link>
                                  <form action={deleteVotingProposal}><input name="fanbaseId" type="hidden" value={candidateFanbaseId} /><input name="projectId" type="hidden" value={concert.id} /><input name="fanprojectId" type="hidden" value={candidate.id} /><button className="text-[11px] font-semibold text-white underline underline-offset-2 hover:text-[#FFE4F3]" type="submit">Eliminar</button></form>
                                  <form action={closeVotingProposal}><input name="fanbaseId" type="hidden" value={candidateFanbaseId} /><input name="projectId" type="hidden" value={concert.id} /><input name="fanprojectId" type="hidden" value={candidate.id} /><button className="text-[11px] font-semibold text-white underline underline-offset-2 hover:text-[#FFE4F3]" type="submit">Cerrar</button></form>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="order-first lg:order-last">
                    <Link
                      aria-label={`Ver concierto de ${group.name}`}
                    className="group relative block aspect-[16/7] w-full overflow-hidden rounded-xl bg-[#5C1F3A] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                      href={`/projects/${concert.id}`}
                    >
                      <Image
                        alt=""
                        aria-hidden="true"
                        className="scale-110 object-cover opacity-60 blur-lg"
                        fill
                        sizes="(min-width: 768px) 45vw, 100vw"
                        src={concertImage}
                        unoptimized={/^https?:\/\//i.test(concertImage)}
                      />
                      <Image
                        alt={`Concierto de ${group.name}`}
                        className="object-contain"
                        fill
                        sizes="(min-width: 768px) 45vw, 100vw"
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
          )}
        </div>
      </section>
    </main>
  );
}
