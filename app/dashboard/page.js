import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowTrendUp,
  faCalendarDays,
  faChartColumn,
  faChartLine,
  faClock,
  faFileLines,
  faGear,
  faHouse,
  faShieldHalved,
  faTicket,
  faUsers,
  faUserGroup,
} from "@fortawesome/free-solid-svg-icons";
import {
  getAllFanbaseMembershipRequests,
  approveFanbaseMembershipRequest,
  getFanbaseFollowers,
  getFanbaseMembershipRequests,
  getFanbaseMembers,
  getFanbases,
  getOrganizedFanbasesForUser,
  rejectFanbaseMembershipRequest,
} from "@/lib/fanbases/fanbases";
import { getCurrentUser } from "@/lib/firebase/session";
import { deleteFanProject, getProjectWithDetails, getProjectsWithFanProjects } from "@/lib/projects/projects";
import { isFanProjectVotable } from "@/lib/projects/fanproject-status";
import { getCurrentUserProfile, listUserProfiles } from "@/lib/users/users";
import { requireFanbaseAdmin } from "@/lib/users/authorization";
import { closeFanProjectVoting, getFanProjectVotingConcerts } from "@/lib/votes/fanproject-votes";

export const dynamic = "force-dynamic";

const palette = { plum: "#5C1F3A", burgundy: "#823038", rose: "#A63D65", pink: "#FFE4F3" };

function DashboardIcon({ icon, className = "size-5" }) {
  return <FontAwesomeIcon aria-hidden="true" className={className} icon={icon} />;
}

function MetricCard({ icon, label, value, trend, tone = "pink" }) {
  return (
    <div className="rounded-2xl border border-[#F2B8CF] bg-white p-4 shadow-[0_8px_24px_rgba(92,31,58,0.06)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${tone === "rose" ? "bg-[#F8E3ED]" : "bg-[#FFE4F3]"} text-[#823038]`}><DashboardIcon icon={icon} /></span>
        {trend ? <span className="text-xs font-semibold text-[#A63D65]"><DashboardIcon className="mr-1 size-3" icon={faArrowTrendUp} />{trend}</span> : null}
      </div>
      <p className="mt-4 text-xs font-semibold text-[#8A5468]">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-[#0D1821]">{value}</p>
      {trend ? <p className="mt-1 text-[11px] text-[#8A5468]">vs. mes anterior</p> : null}
    </div>
  );
}

function PanelHeader({ href, icon, title, action = "Ver todo" }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-2"><DashboardIcon className="size-4 shrink-0 text-[#823038]" icon={icon} /><h2 className="whitespace-nowrap text-lg font-semibold text-[#0D1821]">{title}</h2></div>
      {href ? <Link className="shrink-0 whitespace-nowrap text-xs font-semibold text-[#823038] hover:underline" href={href}>{action}</Link> : null}
    </div>
  );
}

function DashboardPanel({ children, className = "" }) {
  return <section className={`rounded-2xl border border-[#F2B8CF] bg-white p-5 shadow-[0_8px_24px_rgba(92,31,58,0.05)] sm:p-6 ${className}`}>{children}</section>;
}

function ActivityChart() {
  const bars = [32, 48, 38, 62, 53, 70, 48, 76, 59, 84, 68, 92];
  return <div className="mt-7 flex h-48 items-end gap-2 border-b border-[#F2B8CF] px-1 pb-2 sm:gap-3">{bars.map((height, index) => <div className="flex h-full flex-1 items-end" key={index}><div className="w-full rounded-t-md bg-[#FFE4F3]" style={{ height: `${height}%` }}><div className="h-[62%] w-full rounded-t-md bg-[#A63D65]" /></div></div>)}</div>;
}

function formatDate(value) {
  if (!value) return "Fecha a confirmar";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short" }).format(date);
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const projectsPromise = getProjectsWithFanProjects();
  const fanbasesPromise = getFanbases().catch(() => []);
  const profile = await getCurrentUserProfile(user);
  const isAdmin = profile?.user_type === "admin";
  const [allProjects, allFanbases, users] = await Promise.all([
    projectsPromise,
    fanbasesPromise,
    isAdmin ? listUserProfiles() : Promise.resolve([]),
  ]);
  const fanbases = isAdmin ? allFanbases : await getOrganizedFanbasesForUser(user.uid);
  const managedFanbaseIds = new Set(fanbases.map((fanbase) => fanbase.id));
  const projects = isAdmin ? allProjects : allProjects.filter((project) => (
    managedFanbaseIds.has(project.fanbaseId) ||
    (project.subitems || []).some((item) => managedFanbaseIds.has(item.fanbaseId))
  ));
  const membershipRequests = isAdmin
    ? await getAllFanbaseMembershipRequests().catch(() => [])
    : (await Promise.all(fanbases.map((fanbase) => getFanbaseMembershipRequests(fanbase.id).catch(() => [])))).flat();
  const fanbaseInsights = new Map(await Promise.all(fanbases.map(async (fanbase) => {
    const [members, followers] = await Promise.all([
      getFanbaseMembers(fanbase.id),
      getFanbaseFollowers(fanbase.id),
    ]);
    return [fanbase.id, { members, followers }];
  })));
  const fanProjects = projects.flatMap((project) => project.subitems || []);
  const activeVotes = projects.filter((project) => !project.votacionCerradaAt && (project.subitems || []).some((item) => isFanProjectVotable(item.estado))).length;
  const loadedVotingConcerts = await getFanProjectVotingConcerts(undefined, projects);
  const votingConcerts = isAdmin
    ? loadedVotingConcerts
    : loadedVotingConcerts.map((concert) => {
      const candidates = concert.candidates.filter((candidate) => managedFanbaseIds.has(candidate.fanbaseId));
      return {
        ...concert,
        candidates,
        totalVotes: candidates.reduce((total, candidate) => total + candidate.votes, 0),
        userVote: candidates.some((candidate) => candidate.id === concert.userVote) ? concert.userVote : null,
      };
    }).filter((concert) => concert.candidates.length > 0);
  const recentProjects = fanProjects.slice(0, 5);
  const upcomingProjects = projects.slice(0, 4);
  const fanbaseNames = new Map(fanbases.map((fanbase) => [fanbase.id, fanbase.name]));
  const navItems = [
    { href: "/dashboard", label: "Inicio", icon: faHouse },
    { href: "/dashboard/projects", label: "Fan projects", icon: faFileLines },
    { href: "/dashboard/fanbases", label: "Fanbases", icon: faUserGroup },
    { href: "/dashboard/projects", label: "Conciertos", icon: faTicket },
    { href: "/votaciones", label: "Votaciones", icon: faChartColumn },
    ...(isAdmin ? [{ href: "/dashboard/users", label: "Administración", icon: faGear }] : []),
  ];

  async function reviewMembershipAction(formData) {
    "use server";

    const fanbaseId = String(formData.get("fanbaseId") || "").trim();
    const uid = String(formData.get("uid") || "").trim();
    const decision = String(formData.get("decision") || "").trim();
    await requireFanbaseAdmin(fanbaseId);

    if (decision === "reject") {
      await rejectFanbaseMembershipRequest({ fanbaseId, uid });
    } else if (decision === "accept-admin") {
      await approveFanbaseMembershipRequest({ fanbaseId, uid, role: "organizador" });
    } else {
      throw new Error("La decisión seleccionada no es válida.");
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/fanbases");
    revalidatePath(`/fanbases/${fanbaseId}`);
    redirect("/dashboard");
  }

  async function closeVotingAction(formData) {
    "use server";

    const currentUser = await requireFanbaseAdmin(String(formData.get("fanbaseId") || "").trim());
    const projectId = String(formData.get("projectId") || "").trim();
    const fanprojectId = String(formData.get("fanprojectId") || "").trim();
    const project = await getProjectWithDetails(projectId);
    if (!project || !fanprojectId) throw new Error("La votación no es válida.");

    const currentProfile = await getCurrentUserProfile(currentUser);
    if (currentProfile?.user_type !== "admin") {
      const managed = await getOrganizedFanbasesForUser(currentUser.uid);
      const managedIds = new Set(managed.map((fanbase) => fanbase.id));
      const activity = project.subitems?.find((item) => item.id === fanprojectId);
      if (!managedIds.has(project.fanbaseId) && !managedIds.has(activity?.fanbaseId)) {
        throw new Error("No tenés permisos para cerrar esta votación.");
      }
    }

    await closeFanProjectVoting({ projectId, fanprojectId });
    revalidatePath("/dashboard");
    revalidatePath("/votaciones");
    redirect("/dashboard");
  }

  async function deleteFanProjectAction(formData) {
    "use server";

    const fanbaseId = String(formData.get("fanbaseId") || "").trim();
    const currentUser = await requireFanbaseAdmin(fanbaseId);
    const projectId = String(formData.get("projectId") || "").trim();
    const activityId = String(formData.get("fanprojectId") || "").trim();
    const project = await getProjectWithDetails(projectId);
    const activity = project?.subitems?.find((item) => item.id === activityId);
    const currentProfile = await getCurrentUserProfile(currentUser);
    const managed = currentProfile?.user_type === "admin"
      ? true
      : (await getOrganizedFanbasesForUser(currentUser.uid)).some((item) => item.id === activity?.fanbaseId);

    if (!project || !activity || !managed) throw new Error("No tenés permisos para eliminar este fanproject.");
    await deleteFanProject(projectId, activityId);
    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath("/votaciones");
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#FDFDFF] text-[#0D1821]">
      <div className="mx-auto flex w-full max-w-[1440px] gap-0 px-3 py-5 sm:px-6 lg:px-8">
        <aside className="hidden w-52 shrink-0 border-r border-[#F2B8CF] pr-5 lg:block"><div className="sticky top-6"><p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A5468]">Navegación</p><nav className="mt-3 grid gap-1" aria-label="Navegación del dashboard">{navItems.map((item, index) => <Link className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${index === 0 ? "bg-[#FFE4F3] text-[#823038]" : "text-[#8A5468] hover:bg-[#FFF7FB] hover:text-[#823038]"}`} href={item.href} key={item.href + item.label}><DashboardIcon className="size-4" icon={item.icon} />{item.label}</Link>)}</nav></div></aside>

        <div className="min-w-0 flex-1 lg:pl-7">
          <header className="flex flex-wrap items-center justify-between gap-4 pt-8"><div><h1 className="text-3xl font-semibold text-[#5C1F3A] sm:text-4xl">Dashboard</h1></div><div className="flex items-center gap-3"><span className="rounded-full border border-[#F2B8CF] bg-[#FFF7FB] px-3 py-1.5 text-xs font-semibold text-[#823038]">{isAdmin ? "Administrador general" : "Administrador de fanbase"}</span>{isAdmin ? <Link className="inline-flex items-center gap-2 rounded-full bg-[#823038] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#5C1F3A]" href="/dashboard/projects/new"><span className="text-base leading-none">+</span> Nuevo concierto</Link> : null}</div></header>

          <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Resumen del dashboard"><MetricCard icon={faUsers} label="Usuarios totales" trend={isAdmin ? "+12%" : null} value={isAdmin ? users.length.toLocaleString("es-AR") : "—"} /><MetricCard icon={faUserGroup} label="Fanbases activas" trend="+8%" value={fanbases.length.toLocaleString("es-AR")} /><MetricCard icon={faFileLines} label="Fan projects publicados" trend="+15%" value={fanProjects.length.toLocaleString("es-AR")} /><MetricCard icon={faTicket} label="Conciertos" trend="+5%" value={projects.length.toLocaleString("es-AR")} /><MetricCard icon={faChartColumn} label="Votaciones activas" trend="+27%" value={activeVotes.toLocaleString("es-AR")} tone="rose" /></section>

          {!isAdmin ? (
            <section className="mt-6 space-y-6" aria-label="Gestión de tus fanbases">
              <div className="grid gap-4 md:grid-cols-2">
                {fanbases.map((fanbase) => {
                  const insight = fanbaseInsights.get(fanbase.id) || { members: [], followers: [] };
                  const owner = fanbase.ownerName || fanbase.createdByName || "Sin propietario registrado";
                  const managedProject = projects.find((project) => (
                    project.fanbaseId === fanbase.id ||
                    (project.subitems || []).some((item) => item.fanbaseId === fanbase.id)
                  ));

                  return (
                    <DashboardPanel key={fanbase.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#C0567A]">{fanbase.kpopGroup}</p>
                          <h2 className="mt-1 text-xl font-semibold text-[#5C1F3A]">{fanbase.name}</h2>
                          <p className="mt-1 text-xs text-[#8A5468]">Propietario: {owner}</p>
                        </div>
                        <Link className="text-xs font-semibold text-[#823038] hover:underline" href={`/fanbases/${fanbase.id}`}>Ver fanbase →</Link>
                      </div>
                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-[#FFF7FB] p-3"><p className="text-xs text-[#8A5468]">Seguidores</p><strong className="mt-1 block text-xl text-[#5C1F3A]">{insight.followers.length}</strong></div>
                        <div className="rounded-xl bg-[#FFF7FB] p-3"><p className="text-xs text-[#8A5468]">Integrantes</p><strong className="mt-1 block text-xl text-[#5C1F3A]">{insight.members.length}</strong></div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link className="rounded-full bg-[#823038] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#5C1F3A]" href={managedProject ? `/dashboard/projects/${managedProject.id}/activities/new` : "/dashboard/projects"}>Agregar fanproject</Link>
                        <Link className="rounded-full border border-[#823038] px-3 py-2 text-xs font-semibold text-[#823038] transition hover:bg-[#FFE4F3]" href={`/fanbases/${fanbase.id}#publicaciones`}>Agregar publicación</Link>
                      </div>
                    </DashboardPanel>
                  );
                })}
              </div>

              <DashboardPanel>
                <PanelHeader href="/votaciones" icon={faChartColumn} title="Votaciones de tus fanbases" action="Ver públicas" />
                <p className="mt-1 text-xs text-[#8A5468]">Administrá únicamente las votaciones vinculadas con tus comunidades.</p>
                <div className="mt-5 grid gap-3">
                  {votingConcerts.length ? votingConcerts.map((concert) => {
                    const fanbaseId = concert.fanbaseId || concert.subitems?.find((item) => item.fanbaseId)?.fanbaseId || "";
                    const candidates = concert.candidates || [];
                    return (
                      <article className="rounded-2xl border border-[#F2B8CF] bg-[#FFF7FB] p-4" key={concert.id}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div><p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#C0567A]">{fanbaseNames.get(fanbaseId) || "Tu fanbase"}</p><h3 className="mt-1 text-base font-semibold text-[#5C1F3A]">{concert.Titulo || concert.Grupo || "Concierto"}</h3><p className="mt-1 text-xs text-[#8A5468]">{concert.totalVotes} voto{concert.totalVotes === 1 ? "" : "s"} · {candidates.length} propuestas</p></div>
                          <Link className="text-xs font-semibold text-[#823038] hover:underline" href={`/dashboard/projects/${concert.id}`}>Gestionar →</Link>
                        </div>
                        <div className="mt-4 grid gap-2">
                          {candidates.map((candidate) => (
                            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-3 py-2" key={candidate.id}>
                              <span className="text-sm font-semibold text-[#5C1F3A]">{candidate.titulo} <span className="text-xs font-normal text-[#8A5468]">({candidate.votes} votos)</span></span>
                              <div className="flex items-center gap-2">
                                <form action={closeVotingAction}><input name="fanbaseId" type="hidden" value={fanbaseId} /><input name="projectId" type="hidden" value={concert.id} /><input name="fanprojectId" type="hidden" value={candidate.id} /><button className="rounded-full border border-[#823038] px-2.5 py-1 text-[11px] font-semibold text-[#823038] hover:bg-[#FFE4F3]" type="submit">Cerrar con esta propuesta</button></form>
                                <form action={deleteFanProjectAction}><input name="fanbaseId" type="hidden" value={fanbaseId} /><input name="projectId" type="hidden" value={concert.id} /><input name="fanprojectId" type="hidden" value={candidate.id} /><button className="px-2 py-1 text-[11px] font-semibold text-[#8A5468] hover:text-[#823038]" type="submit">Eliminar</button></form>
                              </div>
                            </div>
                          ))}
                        </div>
                      </article>
                    );
                  }) : <p className="rounded-xl bg-[#FFF7FB] p-4 text-sm text-[#8A5468]">No hay votaciones activas en tus fanbases.</p>}
                </div>
              </DashboardPanel>
            </section>
          ) : null}

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_1fr_0.9fr]">
            <DashboardPanel><PanelHeader href="/dashboard/projects" icon={faChartLine} title="Actividad reciente" /><p className="mt-1 text-xs text-[#8A5468]">Fan projects y actividad de la comunidad</p><ActivityChart /><div className="mt-4 flex items-center justify-between text-xs text-[#8A5468]"><span>1 abr</span><span>8 abr</span><span>15 abr</span><span>22 abr</span><span>30 abr</span></div></DashboardPanel>
            <DashboardPanel><PanelHeader href="/" icon={faCalendarDays} title="Próximos conciertos" /><div className="mt-5 divide-y divide-[#F2B8CF]">{upcomingProjects.length ? upcomingProjects.map((project) => <Link className="flex items-center gap-3 py-3 first:pt-0 last:pb-0" href={`/projects/${project.id}`} key={project.id}><span className="grid min-h-14 min-w-16 shrink-0 place-items-center rounded-xl bg-[#FFE4F3] px-2 py-2 text-center text-[10px] font-bold uppercase leading-tight text-[#823038]">{formatDate(project["Dia del concierto"])}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm text-[#0D1821]">{project.Titulo || project.Grupo || "Concierto"}</strong><span className="block truncate text-xs text-[#8A5468]">{project.Ubicacion || project.Pais || "Lugar a confirmar"}</span></span><span className="text-xs font-semibold text-[#823038]">→</span></Link>) : <p className="py-6 text-sm text-[#8A5468]">Todavía no hay conciertos cargados.</p>}</div></DashboardPanel>
            <DashboardPanel><PanelHeader href="/votaciones" icon={faChartColumn} title="Estado de votaciones" /><div className="mt-6 flex items-center justify-center"><div className="grid size-40 place-items-center rounded-full" style={{ background: `conic-gradient(${palette.burgundy} 0 62%, ${palette.rose} 62% 82%, ${palette.pink} 82% 100%)` }}><div className="grid size-24 place-items-center rounded-full bg-white text-center"><strong className="block text-2xl text-[#0D1821]">{activeVotes}</strong><span className="text-xs text-[#8A5468]">activas</span></div></div></div><div className="mt-5 grid gap-2 text-xs text-[#8A5468]"><div className="flex items-center justify-between"><span><i className="mr-2 inline-block size-2 rounded-full bg-[#823038]" />Abiertas</span><strong className="text-[#0D1821]">{activeVotes}</strong></div><div className="flex items-center justify-between"><span><i className="mr-2 inline-block size-2 rounded-full bg-[#A63D65]" />En recuento</span><strong className="text-[#0D1821]">{Math.max(0, Math.min(5, activeVotes))}</strong></div><div className="flex items-center justify-between"><span><i className="mr-2 inline-block size-2 rounded-full bg-[#FFE4F3]" />Finalizadas</span><strong className="text-[#0D1821]">{Math.max(0, projects.length - activeVotes)}</strong></div></div></DashboardPanel>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <DashboardPanel><PanelHeader href="/dashboard/projects" icon={faFileLines} title="Fan projects recientes" /><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead><tr className="border-b border-[#F2B8CF] bg-[#FFF7FB] text-[#823038]"><th className="rounded-l-lg px-3 py-3 font-semibold">Título</th><th className="px-3 py-3 font-semibold">Fanbase</th><th className="px-3 py-3 font-semibold">Fecha</th><th className="rounded-r-lg px-3 py-3 font-semibold">Estado</th></tr></thead><tbody>{recentProjects.length ? recentProjects.map((project) => <tr className="border-b border-[#F2B8CF] last:border-0" key={project.id}><td className="px-3 py-3 font-semibold text-[#0D1821]">{project.titulo || "Fan project sin título"}</td><td className="px-3 py-3 text-[#8A5468]">{project.fanbaseName || "Comunidad"}</td><td className="px-3 py-3 text-[#8A5468]">{formatDate(project.createdAt)}</td><td className="px-3 py-3"><span className="rounded-full bg-[#FFE4F3] px-2.5 py-1 font-semibold text-[#823038]">Publicado</span></td></tr>) : <tr><td className="px-3 py-8 text-center text-sm text-[#8A5468]" colSpan="4">Todavía no hay fan projects publicados.</td></tr>}</tbody></table></div></DashboardPanel>
            <DashboardPanel><PanelHeader href="/dashboard/fanbases#solicitudes" icon={faShieldHalved} title="Solicitudes" action="Gestionar" /><div className="mt-5 divide-y divide-[#F2B8CF]">{membershipRequests.length ? membershipRequests.slice(0, 4).map((request) => <div className="py-3 first:pt-0 last:pb-0" key={`${request.fanbaseId}-${request.uid}`}><div className="flex items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#FFF7FB] text-sm font-bold text-[#823038]">{request.displayName.charAt(0).toUpperCase()}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm text-[#0D1821]">{request.displayName}</strong><span className="block truncate text-xs text-[#8A5468]">{fanbaseNames.get(request.fanbaseId) || "Fanbase"}</span></span><span className="rounded-full bg-[#FFE4F3] px-2 py-1 text-xs font-semibold text-[#823038]">Pendiente</span></div><form action={reviewMembershipAction} className="mt-2 flex gap-2 pl-12"><input name="fanbaseId" type="hidden" value={request.fanbaseId} /><input name="uid" type="hidden" value={request.uid} /><button className="rounded-full bg-[#823038] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#5C1F3A]" name="decision" type="submit" value="accept-admin">Aceptar</button><button className="rounded-full border border-[#F2B8CF] px-2.5 py-1 text-[11px] font-semibold text-[#823038] hover:bg-[#FFE4F3]" name="decision" type="submit" value="reject">Rechazar</button></form></div>) : <p className="py-5 text-sm text-[#8A5468]">No hay solicitudes pendientes.</p>}</div><div className="mt-5 rounded-xl bg-[#FFE4F3] p-4 text-xs leading-5 text-[#823038]"><DashboardIcon className="mr-2 size-3" icon={faClock} /> Las solicitudes se revisan por cada fanbase.</div></DashboardPanel>
          </section>
        </div>
      </div>
    </main>
  );
}
