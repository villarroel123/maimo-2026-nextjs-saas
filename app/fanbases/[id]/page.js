import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import CircleArrowIcon from "@/components/icons/CircleArrowIcon";
import FanbasePostsDisplay from "@/components/fanbases/FanbasePostsDisplay";
import PostDeleteButton from "@/components/fanbases/PostDeleteButton";
import { getFanprojectImage } from "@/lib/projects/fanproject-image";
import { getProjectsWithFanProjects } from "@/lib/projects/projects";
import { getCurrentUser } from "@/lib/firebase/session";
import {
  approveFanbaseMembershipRequest,
  getFanbase,
  getFanbaseMembers,
  getFanbaseFollowerCount,
  getFanbaseMembership,
  getFanbaseMembershipRequest,
  getFanbaseMembershipRequests,
  getFanbaseRoleLabel,
  followFanbase,
  isFollowingFanbase,
  rejectFanbaseMembershipRequest,
  requestFanbaseMembership,
  unfollowFanbase,
} from "@/lib/fanbases/fanbases";
import { getCurrentUserProfile } from "@/lib/users/users";
import { getVideoEmbedUrl } from "@/lib/fanbases/video-embed";
import {
  createFanbasePost,
  deleteFanbasePost,
  FANBASE_POST_CATEGORIES,
  getFanbasePosts,
  updateFanbasePost,
} from "@/lib/fanbases/posts";

export const dynamic = "force-dynamic";

function canManagePosts(profile, fanbaseId) {
  return profile?.user_type === "admin" ||
    (profile?.user_type === "fanbase" && profile.fanbases?.includes(fanbaseId));
}

function canEditPosts(profile, fanbaseId) {
  return canManagePosts(profile, fanbaseId);
}

async function requireFanbaseManager(fanbaseId) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/fanbases/${fanbaseId}`)}`);

  const [fanbase, profile] = await Promise.all([
    getFanbase(fanbaseId),
    getCurrentUserProfile(user),
  ]);

  if (!fanbase || !canManagePosts(profile, fanbaseId)) {
    throw new Error("No tenés permiso para gestionar las publicaciones de esta fanbase.");
  }

  return {
    uid: user.uid,
    displayName: profile?.displayName || user.name || user.email?.split("@")[0] || "Equipo de la fanbase",
  };
}

async function requirePostEditor(fanbaseId) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/fanbases/${fanbaseId}`)}`);

  const [fanbase, profile] = await Promise.all([
    getFanbase(fanbaseId),
    getCurrentUserProfile(user),
  ]);

  if (!fanbase || !canEditPosts(profile, fanbaseId)) {
    throw new Error("Solo administradores de esta fanbase pueden editar sus publicaciones.");
  }

  return {
    uid: user.uid,
    displayName: profile?.displayName || user.name || user.email?.split("@")[0] || "Integrante de la fanbase",
  };
}

function formatPostDate(value) {
  if (!value) return "Recién publicado";

  try {
    return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return "Recién publicado";
  }
}

export default async function FanbaseDetailPage({ params }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  const [fanbase, profile, membership] = await Promise.all([
    getFanbase(id),
    currentUser ? getCurrentUserProfile(currentUser) : null,
    currentUser ? getFanbaseMembership(id, currentUser.uid) : null,
  ]);

  if (!fanbase) notFound();

  const mayManagePosts = canManagePosts(profile, id);
  const mayEditPosts = canEditPosts(profile, id);
  const isAdmin = profile?.user_type === "admin";
  const [members, membershipRequests, membershipRequest, followerCount, projects, posts, isFollowing] = await Promise.all([
    isAdmin ? getFanbaseMembers(id) : Promise.resolve([]),
    mayManagePosts ? getFanbaseMembershipRequests(id) : Promise.resolve([]),
    currentUser && !membership && !mayManagePosts ? getFanbaseMembershipRequest(id, currentUser.uid) : null,
    getFanbaseFollowerCount(id),
    getProjectsWithFanProjects(),
    getFanbasePosts(id),
    currentUser ? isFollowingFanbase(id, currentUser.uid) : false,
  ]);
  const fanprojects = projects.flatMap((project) => (
    (project.subitems || [])
      .filter((fanproject) => fanproject.fanbaseId === fanbase.id)
      .map((fanproject) => ({ ...fanproject, project }))
  ));

  async function handleFollow(formData) {
    "use server";

    const user = await getCurrentUser();
    const detailPath = `/fanbases/${id}`;

    if (!user) {
      redirect(`/login?next=${encodeURIComponent(detailPath)}`);
    }

    if (formData.get("intent") === "unfollow") {
      await unfollowFanbase(id, user.uid);
    } else {
      await followFanbase(id, user.uid);
    }

    revalidatePath("/fanbases");
    revalidatePath(detailPath);
    redirect(detailPath);
  }

  async function handleMembershipRequest() {
    "use server";

    const user = await getCurrentUser();
    const detailPath = `/fanbases/${id}`;

    if (!user) redirect(`/login?next=${encodeURIComponent(detailPath)}`);

    const userProfile = await getCurrentUserProfile(user);
    await requestFanbaseMembership({
      fanbaseId: id,
      user: {
        uid: user.uid,
        displayName: userProfile?.displayName || user.name || user.email?.split("@")[0] || "Fan de Narabi",
        email: user.email || "",
        photoURL: userProfile?.photoURL || user.picture || "",
      },
    });

    revalidatePath(detailPath);
    redirect(`${detailPath}?solicitud=enviada`);
  }

  async function handleMembershipReview(formData) {
    "use server";

    await requireFanbaseManager(id);
    const uid = String(formData.get("uid") || "").trim();
    const decision = String(formData.get("decision") || "").trim();

    if (decision === "reject") {
      await rejectFanbaseMembershipRequest({ fanbaseId: id, uid });
    } else if (decision === "accept-admin") {
      await approveFanbaseMembershipRequest({
        fanbaseId: id,
        uid,
        role: "organizador",
      });
    } else {
      throw new Error("La decisión seleccionada no es válida.");
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/fanbases");
    revalidatePath(`/fanbases/${id}`);
    redirect(`/fanbases/${id}#solicitudes`);
  }

  async function handleCreatePost(formData) {
    "use server";

    const author = await requireFanbaseManager(id);
    await createFanbasePost({
      fanbaseId: id,
      author,
      data: {
        title: formData.get("title"),
        body: formData.get("body"),
        category: formData.get("category"),
        linkUrl: formData.get("linkUrl"),
      },
    });

    revalidatePath(`/fanbases/${id}`);
    redirect(`/fanbases/${id}#publicaciones`);
  }

  async function handleDeletePost(formData) {
    "use server";

    await requireFanbaseManager(id);
    await deleteFanbasePost(id, formData.get("postId"));
    revalidatePath(`/fanbases/${id}`);
    redirect(`/fanbases/${id}#publicaciones`);
  }

  async function handleEditPost(formData) {
    "use server";

    const editor = await requirePostEditor(id);
    await updateFanbasePost({
      fanbaseId: id,
      postId: formData.get("postId"),
      editor,
      data: {
        title: formData.get("title"),
        body: formData.get("body"),
        category: formData.get("category"),
        linkUrl: formData.get("linkUrl"),
      },
    });

    revalidatePath(`/fanbases/${id}`);
    redirect(`/fanbases/${id}#publicaciones`);
  }

  return (
    <main className="min-h-screen bg-[#FDFDFF] text-[#823038]">
      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#B53E66] hover:underline" href="/fanbases">
          <CircleArrowIcon direction="left" className="size-4" />
          Ver todas las fanbases
        </Link>

        <section className="relative mt-6 overflow-hidden rounded-3xl border border-[#F2B8CF] bg-[#FFE4F3] p-6 shadow-[0_18px_45px_-34px_rgba(92,31,58,0.7)] sm:p-9">
          <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-white/45" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="grid size-16 shrink-0 place-items-center rounded-3xl bg-[#823038] text-2xl font-bold text-white">
                {fanbase.name.charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C0567A]">Fanbase de {fanbase.kpopGroup}</p>
                <h1 className="mt-2 text-3xl font-semibold text-[#5C1F3A] sm:text-4xl">{fanbase.name}</h1>
                <p className="mt-2 text-sm text-[#8A5468]">{[fanbase.city, fanbase.country].filter(Boolean).join(", ") || "Comunidad sin ubicación definida"}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {membership ? (
                <span className="w-fit rounded-full border border-[#F2B8CF] bg-white px-4 py-2 text-sm font-semibold text-[#823038]">
                  Sos {getFanbaseRoleLabel(membership.role).toLowerCase()}
                </span>
              ) : mayManagePosts ? (
                <span className="w-fit rounded-full border border-[#F2B8CF] bg-white px-4 py-2 text-sm font-semibold text-[#823038]">
                  Acceso de administrador
                </span>
              ) : membershipRequest ? (
                <span className="w-fit rounded-full border border-[#F2B8CF] bg-white px-4 py-2 text-sm font-semibold text-[#823038]">
                  Solicitud pendiente
                </span>
              ) : (
                <form action={handleMembershipRequest}>
                  <button className="rounded-full border border-[#823038] bg-white px-5 py-2.5 text-sm font-semibold text-[#823038] transition hover:bg-[#FFE4F3]" type="submit">
                    Solicitar ser administrador
                  </button>
                </form>
              )}
              <form action={handleFollow}>
                <input name="intent" type="hidden" value={isFollowing ? "unfollow" : "follow"} />
                <button className="rounded-full bg-[#5C1F3A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#7A2A4D]" type="submit">
                  {isFollowing ? "Dejar de seguir" : "Seguir fanbase"}
                </button>
              </form>
            </div>
          </div>
          {fanbase.description ? <p className="relative mt-7 max-w-3xl text-sm leading-6 text-[#7F4A5E]">{fanbase.description}</p> : null}
          <div className="relative mt-6 flex flex-wrap gap-2.5 text-sm">
            <span className="rounded-full border border-[#F2B8CF] bg-white/75 px-3 py-1.5 text-[#823038]">{fanbase.memberCount} integrante{fanbase.memberCount === 1 ? "" : "s"}</span>
            <span className="rounded-full border border-[#F2B8CF] bg-white/75 px-3 py-1.5 text-[#823038]">{followerCount} seguidor{followerCount === 1 ? "" : "es"}</span>
            <span className="rounded-full border border-[#F2B8CF] bg-white/75 px-3 py-1.5 text-[#823038]">{posts.length} publicaci{posts.length === 1 ? "ón" : "ones"}</span>
            {fanbase.instagram ? <span className="rounded-full border border-[#F2B8CF] bg-white/75 px-3 py-1.5 text-[#823038]">@{fanbase.instagram}</span> : null}
          </div>
        </section>

        <div className={`mt-8 grid gap-8 ${isAdmin ? "lg:grid-cols-[minmax(0,1.3fr)_minmax(16rem,0.7fr)]" : ""}`}>
          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C0567A]">Creaciones de la comunidad</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#5C1F3A]">Fanprojects organizados</h2>
            {fanprojects.length === 0 ? (
              <p className="mt-5 rounded-2xl border border-dashed border-[#EAB0C8] bg-white p-5 text-sm text-[#8A5468]">Esta fanbase todavía no publicó fanprojects.</p>
            ) : (
              <div className="mt-5 grid gap-4 sm:grid-cols-[repeat(auto-fit,minmax(min(100%,17rem),1fr))]">
                {fanprojects.map((fanproject) => (
                  <Link className="group overflow-hidden rounded-2xl border border-[#F2B8CF] bg-white transition hover:-translate-y-1 hover:border-[#D985A5]" href={`/projects/${fanproject.project.id}/activities/${fanproject.id}`} key={`${fanproject.project.id}-${fanproject.id}`}>
                    <div className="relative h-32 overflow-hidden bg-[#FFE4F3]">
                      <Image alt={`Imagen de ${fanproject.titulo}`} className="size-full object-cover transition duration-300 group-hover:scale-105" fill sizes="(min-width: 640px) 50vw, 100vw" src={getFanprojectImage(fanproject, fanproject.project)} unoptimized={/^https?:\/\//i.test(getFanprojectImage(fanproject, fanproject.project))} />
                    </div>
                    <div className="p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#C0567A]">{fanproject.project.Titulo}</p>
                      <h3 className="mt-2 text-lg font-semibold text-[#5C1F3A]">{fanproject.titulo}</h3>
                      <p className="mt-2 text-sm text-[#8A5468]">Por {fanproject.authorName || "la comunidad"}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {isAdmin ? <aside className="rounded-3xl border border-[#F2B8CF] bg-white p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C0567A]">Equipo</p>
            <h2 className="mt-2 text-xl font-semibold text-[#5C1F3A]">Integrantes</h2>
            {mayManagePosts ? (
              <>
                <div className="mt-5 space-y-3">
                  {members.slice(0, 12).map((member) => (
                    <article className="flex items-center gap-3" key={member.uid}>
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#FFE4F3] text-sm font-bold text-[#823038]">{member.displayName.charAt(0).toUpperCase()}</span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#5C1F3A]">{member.displayName}</p>
                        <p className="text-xs text-[#8A5468]">{getFanbaseRoleLabel(member.role)}</p>
                      </div>
                    </article>
                  ))}
                </div>

                <section className="mt-6 border-t border-[#F2B8CF] pt-5" id="solicitudes">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-[#5C1F3A]">Solicitudes de miembros</h3>
                    <span className="rounded-full bg-[#FFE4F3] px-2.5 py-1 text-xs font-semibold text-[#823038]">{membershipRequests.length}</span>
                  </div>
                  {membershipRequests.length ? (
                    <div className="mt-4 space-y-4">
                      {membershipRequests.map((request) => (
                        <article className="rounded-2xl bg-[#FFF7FB] p-3" key={request.uid}>
                          <div className="flex items-center gap-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#FFE4F3] text-sm font-bold text-[#823038]">{request.displayName.charAt(0).toUpperCase()}</span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[#5C1F3A]">{request.displayName}</p>
                              {request.email ? <p className="truncate text-xs text-[#8A5468]">{request.email}</p> : null}
                            </div>
                          </div>
                          <form action={handleMembershipReview} className="mt-3 grid gap-2">
                            <input name="uid" type="hidden" value={request.uid} />
                            <button className="rounded-full bg-[#823038] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#5C1F3A]" name="decision" type="submit" value="accept-admin">Aceptar como administrador</button>
                            <button className="px-3 py-1 text-xs font-semibold text-[#8A5468] transition hover:text-[#5C1F3A]" name="decision" type="submit" value="reject">Rechazar</button>
                          </form>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-[#8A5468]">No hay solicitudes pendientes.</p>
                  )}
                </section>
              </>
            ) : (
              <p className="mt-4 text-sm leading-6 text-[#8A5468]">
                La lista de integrantes y los permisos son información privada para administradores de la fanbase.
              </p>
            )}
          </aside> : null}
        </div>

        <FanbasePostsDisplay count={posts.length} composer={mayManagePosts ? (
            <details className="mt-6 rounded-2xl border border-[#F2B8CF] bg-[#FFF7FB] p-5 open:shadow-[0_12px_30px_-24px_rgba(92,31,58,0.5)]">
              <summary className="flex w-fit cursor-pointer list-none items-center gap-2 text-sm font-semibold text-[#823038] [&::-webkit-details-marker]:hidden">
                <FontAwesomeIcon aria-hidden="true" className="size-4" icon={faPlus} />
                Crear una publicación
              </summary>
              <form action={handleCreatePost} className="mt-5 grid gap-4">
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
                  <label className="grid gap-2 text-sm font-semibold text-[#5C1F3A]">
                    Título
                    <input className="h-11 rounded-xl border border-[#F2B8CF] bg-white px-3 font-normal outline-none focus:border-[#C0567A]" maxLength={120} name="title" placeholder="Ej. Cómo preparar el banner" required />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-[#5C1F3A]">
                    Tipo de publicación
                    <select className="h-11 rounded-xl border border-[#F2B8CF] bg-white px-3 font-normal outline-none focus:border-[#C0567A]" name="category">
                      {Object.entries(FANBASE_POST_CATEGORIES).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="grid gap-2 text-sm font-semibold text-[#5C1F3A]">
                  Contenido
                  <textarea className="min-h-32 rounded-xl border border-[#F2B8CF] bg-white p-3 font-normal outline-none focus:border-[#C0567A]" maxLength={2000} name="body" placeholder="Contá los pasos, materiales o novedades para la comunidad." required />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-[#5C1F3A]">
                  Enlace o video de YouTube/Vimeo (opcional)
                  <input className="h-11 rounded-xl border border-[#F2B8CF] bg-white px-3 font-normal outline-none focus:border-[#C0567A]" maxLength={500} name="linkUrl" placeholder="https://..." type="url" />
                </label>
                <div className="flex justify-end">
                  <button className="rounded-full bg-[#823038] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5C1F3A]" type="submit">
                    Publicar
                  </button>
                </div>
              </form>
            </details>
          ) : null}>
          {posts.map((post) => {
            const videoEmbedUrl = getVideoEmbedUrl(post.linkUrl);

            return (
                <article className="rounded-2xl border border-[#F2B8CF] bg-white p-5 sm:p-6" key={post.id}>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <span className="rounded-full border border-[#F2B8CF] bg-white px-3 py-1 text-[#823038]">{FANBASE_POST_CATEGORIES[post.category]}</span>
                    <time className="ml-auto text-[#8A5468]" dateTime={post.createdAt || undefined}>{formatPostDate(post.createdAt)}</time>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-[#5C1F3A]">{post.title}</h3>
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#754B5B]">{post.body}</p>
                  {videoEmbedUrl ? (
                    <div className="mt-4 aspect-video w-full overflow-hidden rounded-xl bg-[#0D1821]">
                      <iframe
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="h-full w-full border-0"
                        loading="lazy"
                        referrerPolicy="strict-origin-when-cross-origin"
                        src={videoEmbedUrl}
                        title={`Video de ${post.title}`}
                      />
                    </div>
                  ) : post.linkUrl ? (
                    <a className="mt-4 inline-block text-sm font-semibold text-[#823038] underline underline-offset-2 hover:text-[#5C1F3A]" href={post.linkUrl} rel="noopener noreferrer" target="_blank">
                      Abrir enlace
                    </a>
                  ) : null}
                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#F2B8CF] pt-3">
                    <div className="text-xs text-[#8A5468]">
                      <p>Por {post.authorName}</p>
                      {post.updatedAt ? <p className="mt-1">Editado por {post.updatedByName} el {formatPostDate(post.updatedAt)}</p> : null}
                    </div>
                    {mayManagePosts ? (
                      <form action={handleDeletePost}>
                        <input name="postId" type="hidden" value={post.id} />
                        <PostDeleteButton title={post.title} />
                      </form>
                    ) : null}
                  </div>
                  {mayEditPosts ? (
                    <details className="mt-4 border-t border-[#F2B8CF] pt-4">
                      <summary className="w-fit cursor-pointer text-sm font-semibold text-[#823038] hover:text-[#5C1F3A]">Editar publicación</summary>
                      <form action={handleEditPost} className="mt-4 grid gap-4 rounded-xl bg-white/70 p-4">
                        <input name="postId" type="hidden" value={post.id} />
                        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
                          <label className="grid gap-2 text-sm font-semibold text-[#5C1F3A]">
                            Título
                            <input className="h-11 rounded-xl border border-[#F2B8CF] bg-white px-3 font-normal outline-none focus:border-[#C0567A]" defaultValue={post.title} maxLength={120} name="title" required />
                          </label>
                          <label className="grid gap-2 text-sm font-semibold text-[#5C1F3A]">
                            Tipo de publicación
                            <select className="h-11 rounded-xl border border-[#F2B8CF] bg-white px-3 font-normal outline-none focus:border-[#C0567A]" defaultValue={post.category} name="category">
                              {Object.entries(FANBASE_POST_CATEGORIES).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <label className="grid gap-2 text-sm font-semibold text-[#5C1F3A]">
                          Contenido
                          <textarea className="min-h-32 rounded-xl border border-[#F2B8CF] bg-white p-3 font-normal outline-none focus:border-[#C0567A]" defaultValue={post.body} maxLength={2000} name="body" required />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-[#5C1F3A]">
                          Enlace o video de YouTube/Vimeo (opcional)
                          <input className="h-11 rounded-xl border border-[#F2B8CF] bg-white px-3 font-normal outline-none focus:border-[#C0567A]" defaultValue={post.linkUrl} maxLength={500} name="linkUrl" type="url" />
                        </label>
                        <div className="flex justify-end">
                          <button className="rounded-full bg-[#823038] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5C1F3A]" type="submit">
                            Guardar cambios
                          </button>
                        </div>
                      </form>
                    </details>
                  ) : null}
                </article>
            );
          })}
        </FanbasePostsDisplay>
      </section>
    </main>
  );
}
