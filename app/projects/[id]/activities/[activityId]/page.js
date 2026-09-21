import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import {
  getActivityDetails,
  getRelatedFanProjects,
} from "@/lib/projects/projects";
import { getFanProjectStatus } from "@/lib/projects/fanproject-status";
import { getSectorInstructions } from "@/lib/projects/sector-instructions";
import {
  createFanprojectComment,
  createFanprojectReply,
  getFanprojectComments,
} from "@/lib/comments/fanproject-comments";
import { getCurrentUser } from "@/lib/firebase/session";
import { getCurrentUserProfile } from "@/lib/users/users";
import FavoriteButton from "@/components/favorites/FavoriteButton";
import CircleArrowIcon from "@/components/icons/CircleArrowIcon";

export const dynamic = "force-dynamic";

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

function getDescriptionPreview(description) {
  if (typeof description !== "string" || !description.trim()) {
    return "Conocé los detalles de este fanproject.";
  }

  return description.length > 112
    ? `${description.slice(0, 112).trim()}…`
    : description;
}

export default async function ActivityDetailPage({ params }) {
  const { id, activityId } = await params;
  const detailPath = `/projects/${id}/activities/${activityId}`;
  const currentUser = await getCurrentUser();
  const [activity, relatedFanprojects, comments, currentProfile] = await Promise.all([
    getActivityDetails(id, activityId),
    getRelatedFanProjects(id, activityId),
    getFanprojectComments(id, activityId),
    currentUser ? getCurrentUserProfile(currentUser) : null,
  ]);

  if (!activity) {
    notFound();
  }

  const status = getFanProjectStatus(activity.estado);
  const instruccionesPorSector = getSectorInstructions(activity.instruccionesPorSector);
  const recommendedFanprojects = relatedFanprojects
    .sort((first, second) => {
      const firstMatchesStatus = Number(first.estado === activity.estado);
      const secondMatchesStatus = Number(second.estado === activity.estado);

      if (firstMatchesStatus !== secondMatchesStatus) {
        return secondMatchesStatus - firstMatchesStatus;
      }

      return (first.titulo ?? "").localeCompare(second.titulo ?? "", "es");
    })
    .slice(0, 3);
  const communityMessageCount = comments.reduce(
    (total, comment) => total + 1 + comment.replies.length,
    0,
  );

  async function addComment(formData) {
    "use server";

    const user = await getCurrentUser();

    if (!user) {
      redirect(`/login?next=${encodeURIComponent(detailPath)}`);
    }

    const profile = await getCurrentUserProfile(user);
    const authorName =
      profile?.displayName ||
      user.name ||
      user.email?.split("@")[0] ||
      "Fan de Narabi";

    await createFanprojectComment({
      projectId: id,
      fanprojectId: activityId,
      userId: user.uid,
      authorName,
      message: formData.get("comment"),
    });

    revalidatePath(detailPath);
    redirect(`${detailPath}#comentarios`);
  }

  async function addReply(formData) {
    "use server";

    const user = await getCurrentUser();

    if (!user) {
      redirect(`/login?next=${encodeURIComponent(detailPath)}`);
    }

    const commentId = String(formData.get("commentId") || "").trim();
    const profile = await getCurrentUserProfile(user);
    const authorName =
      profile?.displayName ||
      user.name ||
      user.email?.split("@")[0] ||
      "Fan de Narabi";

    await createFanprojectReply({
      projectId: id,
      fanprojectId: activityId,
      commentId,
      userId: user.uid,
      authorName,
      message: formData.get("reply"),
    });

    revalidatePath(detailPath);
    redirect(`${detailPath}#comentarios`);
  }

  return (
    <main className="min-h-screen bg-[#FDFDFF] text-[#823038]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
        <Link
          href={`/projects/${id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#B53E66] transition hover:text-[#823038]"
        >
          <CircleArrowIcon direction="left" className="size-4" />
          Volver al concierto
        </Link>

        <section className="relative mt-5 overflow-hidden rounded-3xl border border-[#F2B8CF] bg-[#FFE4F3] p-6 shadow-[0_18px_45px_-34px_rgba(92,31,58,0.7)] sm:p-9">
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/45" />
          <div className="pointer-events-none absolute -bottom-16 right-24 h-36 w-36 rounded-full border-[18px] border-[#F8C9DE]/70" />

          <div className="relative">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#B53E66]">
                Fanproject
              </span>
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${status.badgeClassName}`}
              >
                {status.label}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-start justify-between gap-5">
              <div className="max-w-3xl">
                <h1 className="text-3xl font-bold tracking-tight text-[#5C1F3A] sm:text-4xl">
                  {activity.titulo}
                </h1>
                {(activity.authorName || activity.fanbaseName) ? (
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-[#7F4A5E]">
                    <span className="grid size-8 place-items-center rounded-full bg-white text-xs font-bold text-[#823038]">
                      {(activity.authorName || activity.fanbaseName).charAt(0).toUpperCase()}
                    </span>
                    <span>
                      Publicado por <strong className="font-semibold text-[#5C1F3A]">{activity.authorName || "la comunidad"}</strong>
                    </span>
                    {activity.fanbaseName ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <Link className="font-semibold text-[#B53E66] hover:underline" href={`/fanbases/${activity.fanbaseId}`}>
                          Integrante de {activity.fanbaseName}
                        </Link>
                      </>
                    ) : null}
                  </div>
                ) : null}
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#7F4A5E] sm:text-lg">
                  {activity.descripcion}
                </p>
              </div>
              <FavoriteButton
                target={{ type: "fanproject", projectId: id, activityId }}
              />
            </div>

            <div className="mt-7 flex flex-wrap gap-3 text-sm text-[#7F4A5E]">
              <span className="rounded-full border border-[#F2B8CF] bg-white/75 px-3 py-1.5">
                {activity.elementos?.length ?? 0} elemento{activity.elementos?.length === 1 ? "" : "s"}
              </span>
              <span className="rounded-full border border-[#F2B8CF] bg-white/75 px-3 py-1.5">
                {instruccionesPorSector.length} sector{instruccionesPorSector.length === 1 ? "" : "es"} con instrucciones
              </span>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-3xl border border-[#F2B8CF] bg-white p-6 shadow-[0_16px_40px_-34px_rgba(92,31,58,0.65)]">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#C0567A]">
              Para participar
            </span>
            <h2 className="mt-2 text-xl font-bold text-[#5C1F3A]">Elementos necesarios</h2>

            {activity.elementos?.length ? (
              <ul className="mt-5 flex flex-wrap gap-2.5">
                {activity.elementos.map((item, index) => (
                  <li
                    key={`${item}-${index}`}
                    className="rounded-full border border-[#F2B8CF] bg-[#FFF7FB] px-3.5 py-2 text-sm font-medium text-[#823038]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 rounded-2xl bg-[#FFF7FB] p-4 text-sm leading-relaxed text-[#8A5468]">
                No se requieren elementos específicos para este fanproject.
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-[#F2B8CF] bg-white p-6 shadow-[0_16px_40px_-34px_rgba(92,31,58,0.65)]">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#C0567A]">
              Durante el concierto
            </span>
            <h2 className="mt-2 text-xl font-bold text-[#5C1F3A]">Instrucciones por sector</h2>

            {instruccionesPorSector.length ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {instruccionesPorSector.map(({ sector, instruccion }) => (
                  <article
                    key={`${sector}-${instruccion}`}
                    className="rounded-2xl border border-[#F2B8CF] bg-[#FFF7FB] p-4"
                  >
                    <h3 className="text-sm font-bold text-[#5C1F3A]">{sector}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#8A5468]">
                      {instruccion}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-5 rounded-2xl bg-[#FFF7FB] p-4 text-sm leading-relaxed text-[#8A5468]">
                Este fanproject todavía no tiene indicaciones específicas por sector.
              </p>
            )}
          </div>
        </section>

        <section
          id="comentarios"
          className="mt-6 scroll-mt-6 rounded-3xl border border-[#F2B8CF] bg-white p-6 shadow-[0_16px_40px_-34px_rgba(92,31,58,0.65)] sm:p-7"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#C0567A]">
                Comunidad
              </span>
              <h2 className="mt-2 text-2xl font-bold text-[#5C1F3A]">Comentarios</h2>
              <p className="mt-1 text-sm text-[#8A5468]">
                Compartí dudas, ideas y tips para que el fanproject salga increíble.
              </p>
            </div>
            <span className="rounded-full bg-[#FFE4F3] px-3 py-1.5 text-sm font-semibold text-[#823038]">
              {communityMessageCount} {communityMessageCount === 1 ? "mensaje" : "mensajes"}
            </span>
          </div>

          {currentUser ? (
            <form action={addComment} className="mt-6 rounded-2xl border border-[#F2B8CF] bg-[#FFF7FB] p-4">
              <label htmlFor="comment" className="text-sm font-bold text-[#5C1F3A]">
                Comentá como {currentProfile?.displayName || currentUser.name || "fan"}
              </label>
              <textarea
                id="comment"
                name="comment"
                required
                maxLength={500}
                rows={4}
                placeholder="Por ejemplo: ¿en qué momento levantamos el cartel?"
                className="mt-3 w-full resize-y rounded-xl border border-[#EAB0C8] bg-white px-3.5 py-3 text-sm text-[#5C1F3A] outline-none transition placeholder:text-[#B68A9A] focus:border-[#C0567A] focus:ring-2 focus:ring-[#F8C9DE]"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-[#9B697A]">Máximo 500 caracteres.</span>
                <button
                  type="submit"
                  className="rounded-full bg-[#823038] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#5C1F3A] focus:outline-none focus:ring-2 focus:ring-[#C0567A] focus:ring-offset-2"
                >
                  Publicar comentario
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-[#EAB0C8] bg-[#FFF7FB] p-4">
              <p className="text-sm leading-relaxed text-[#8A5468]">
                Iniciá sesión para participar de la conversación.
              </p>
              <Link
                href={`/login?next=${encodeURIComponent(detailPath)}`}
                className="rounded-full bg-[#823038] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#5C1F3A]"
              >
                Iniciar sesión
              </Link>
            </div>
          )}

          <div className="mt-6 space-y-3">
            {comments.length ? (
              comments.map((comment) => (
                <article
                  key={comment.id}
                  className="rounded-2xl border border-[#F5D5E2] bg-white p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFE4F3] text-sm font-bold text-[#823038]">
                      {comment.authorName.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <h3 className="text-sm font-bold text-[#5C1F3A]">{comment.authorName}</h3>
                        <time className="text-xs text-[#9B697A]" dateTime={comment.createdAt ?? undefined}>
                          {formatCommentDate(comment.createdAt)}
                        </time>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-[#754B5B]">
                        {comment.message}
                      </p>
                    </div>
                  </div>

                  <div className="ml-12 mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                    {currentUser ? (
                      <details className="group">
                        <summary className="cursor-pointer list-none text-xs font-bold text-[#B53E66] hover:text-[#823038] [&::-webkit-details-marker]:hidden">
                          Responder
                        </summary>
                        <form
                          action={addReply}
                          className="mt-3 w-full min-w-[15rem] rounded-xl border border-[#F2B8CF] bg-[#FFF7FB] p-3 sm:min-w-[22rem]"
                        >
                          <input name="commentId" type="hidden" value={comment.id} />
                          <label htmlFor={`reply-${comment.id}`} className="sr-only">
                            Responder a {comment.authorName}
                          </label>
                          <textarea
                            id={`reply-${comment.id}`}
                            name="reply"
                            required
                            maxLength={500}
                            rows={3}
                            placeholder={`Respondé a ${comment.authorName}...`}
                            className="w-full resize-y rounded-lg border border-[#EAB0C8] bg-white px-3 py-2.5 text-sm text-[#5C1F3A] outline-none transition placeholder:text-[#B68A9A] focus:border-[#C0567A] focus:ring-2 focus:ring-[#F8C9DE]"
                          />
                          <div className="mt-2 flex items-center justify-between gap-3">
                            <span className="text-[11px] text-[#9B697A]">Máximo 500 caracteres.</span>
                            <button
                              type="submit"
                              className="rounded-full bg-[#823038] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#5C1F3A]"
                            >
                              Publicar respuesta
                            </button>
                          </div>
                        </form>
                      </details>
                    ) : (
                      <Link
                        href={`/login?next=${encodeURIComponent(detailPath)}`}
                        className="text-xs font-bold text-[#B53E66] hover:text-[#823038]"
                      >
                        Responder
                      </Link>
                    )}

                    {comment.replies.length ? (
                      <details className="group">
                        <summary className="cursor-pointer list-none text-xs font-bold text-[#B53E66] hover:text-[#823038] [&::-webkit-details-marker]:hidden">
                          <span className="group-open:hidden">
                            Ver más ({comment.replies.length} {comment.replies.length === 1 ? "respuesta" : "respuestas"})
                          </span>
                          <span className="hidden group-open:inline">Ver menos</span>
                        </summary>

                        <div className="mt-3 space-y-2 border-l-2 border-[#F2B8CF] pl-3">
                          {comment.replies.map((reply) => (
                            <article key={reply.id} className="rounded-xl bg-[#FFF7FB] p-3">
                              <div className="flex items-start gap-2.5">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F8C9DE] text-xs font-bold text-[#823038]">
                                  {reply.authorName.charAt(0).toUpperCase()}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                                    <h4 className="text-xs font-bold text-[#5C1F3A]">{reply.authorName}</h4>
                                    <time className="text-[11px] text-[#9B697A]" dateTime={reply.createdAt ?? undefined}>
                                      {formatCommentDate(reply.createdAt)}
                                    </time>
                                  </div>
                                  <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-[#754B5B]">
                                    {reply.message}
                                  </p>
                                </div>
                              </div>
                            </article>
                          ))}
                        </div>
                      </details>
                    ) : null}
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[#EAB0C8] bg-[#FFF7FB] p-5 text-sm leading-relaxed text-[#8A5468]">
                Todavía no hay comentarios. Sé la primera persona en compartir una idea.
              </div>
            )}
          </div>
        </section>

        {recommendedFanprojects.length ? (
          <section className="mt-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#C0567A]">
                  Mismo concierto
                </span>
                <h2 className="mt-2 text-2xl font-bold text-[#5C1F3A]">También te puede interesar</h2>
              </div>
              <Link
                href={`/projects/${id}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#B53E66] transition hover:text-[#823038]"
              >
                Ver todos
                <CircleArrowIcon direction="right" className="size-4" />
              </Link>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recommendedFanprojects.map((fanproject) => {
                const relatedStatus = getFanProjectStatus(fanproject.estado);

                return (
                  <Link
                    key={fanproject.id}
                    href={`/projects/${id}/activities/${fanproject.id}`}
                    className="group rounded-3xl border border-[#F2B8CF] bg-white p-5 shadow-[0_16px_40px_-34px_rgba(92,31,58,0.65)] transition duration-200 hover:-translate-y-1 hover:border-[#D985A5] hover:shadow-[0_20px_40px_-28px_rgba(92,31,58,0.35)]"
                  >
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${relatedStatus.badgeClassName}`}
                    >
                      {relatedStatus.label}
                    </span>
                    <h3 className="mt-4 text-lg font-bold text-[#5C1F3A] transition group-hover:text-[#B53E66]">
                      {fanproject.titulo}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#8A5468]">
                      {getDescriptionPreview(fanproject.descripcion)}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[#B53E66]">
                      Ver fanproject
                      <CircleArrowIcon direction="right" className="size-4" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
