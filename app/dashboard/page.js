import Link from "next/link";
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
  getFanbaseMembershipRequests,
  getFanbases,
  getOrganizedFanbasesForUser,
} from "@/lib/fanbases/fanbases";
import { getCurrentUser } from "@/lib/firebase/session";
import { getProjectsWithFanProjects } from "@/lib/projects/projects";
import { isFanProjectVotable } from "@/lib/projects/fanproject-status";
import { getCurrentUserProfile, listUserProfiles } from "@/lib/users/users";

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
      <div className="flex items-center gap-2"><DashboardIcon className="size-4 text-[#823038]" icon={icon} /><h2 className="text-lg font-semibold text-[#0D1821]">{title}</h2></div>
      {href ? <Link className="text-xs font-semibold text-[#823038] hover:underline" href={href}>{action} →</Link> : null}
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
  const fanProjects = projects.flatMap((project) => project.subitems || []);
  const activeVotes = projects.filter((project) => !project.votacionCerradaAt && (project.subitems || []).some((item) => isFanProjectVotable(item.estado))).length;
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

  return (
    <main className="min-h-screen bg-[#FDFDFF] text-[#0D1821]">
      <div className="mx-auto flex w-full max-w-[1440px] gap-0 px-3 py-5 sm:px-6 lg:px-8">
        <aside className="hidden w-52 shrink-0 border-r border-[#F2B8CF] pr-5 lg:block"><div className="sticky top-6"><p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A5468]">Navegación</p><nav className="mt-3 grid gap-1" aria-label="Navegación del dashboard">{navItems.map((item, index) => <Link className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${index === 0 ? "bg-[#FFE4F3] text-[#823038]" : "text-[#8A5468] hover:bg-[#FFF7FB] hover:text-[#823038]"}`} href={item.href} key={item.href + item.label}><DashboardIcon className="size-4" icon={item.icon} />{item.label}</Link>)}</nav></div></aside>

        <div className="min-w-0 flex-1 lg:pl-7">
          <header className="flex flex-wrap items-center justify-between gap-4 pt-8"><div><h1 className="text-3xl font-semibold text-[#5C1F3A] sm:text-4xl">Dashboard</h1></div><div className="flex items-center gap-3"><span className="rounded-full border border-[#F2B8CF] bg-[#FFF7FB] px-3 py-1.5 text-xs font-semibold text-[#823038]">{isAdmin ? "Administrador general" : "Administrador de fanbase"}</span>{isAdmin ? <Link className="inline-flex items-center gap-2 rounded-full bg-[#823038] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#5C1F3A]" href="/dashboard/projects/new"><span className="text-base leading-none">+</span> Nuevo concierto</Link> : null}</div></header>

          <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Resumen del dashboard"><MetricCard icon={faUsers} label="Usuarios totales" trend={isAdmin ? "+12%" : null} value={isAdmin ? users.length.toLocaleString("es-AR") : "—"} /><MetricCard icon={faUserGroup} label="Fanbases activas" trend="+8%" value={fanbases.length.toLocaleString("es-AR")} /><MetricCard icon={faFileLines} label="Fan projects publicados" trend="+15%" value={fanProjects.length.toLocaleString("es-AR")} /><MetricCard icon={faTicket} label="Conciertos" trend="+5%" value={projects.length.toLocaleString("es-AR")} /><MetricCard icon={faChartColumn} label="Votaciones activas" trend="+27%" value={activeVotes.toLocaleString("es-AR")} tone="rose" /></section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_1fr_0.9fr]">
            <DashboardPanel><PanelHeader href="/dashboard/projects" icon={faChartLine} title="Actividad reciente" /><p className="mt-1 text-xs text-[#8A5468]">Fan projects y actividad de la comunidad</p><ActivityChart /><div className="mt-4 flex items-center justify-between text-xs text-[#8A5468]"><span>1 abr</span><span>8 abr</span><span>15 abr</span><span>22 abr</span><span>30 abr</span></div></DashboardPanel>
            <DashboardPanel><PanelHeader href="/" icon={faCalendarDays} title="Próximos conciertos" /><div className="mt-5 divide-y divide-[#F2B8CF]">{upcomingProjects.length ? upcomingProjects.map((project) => <Link className="flex items-center gap-3 py-3 first:pt-0 last:pb-0" href={`/projects/${project.id}`} key={project.id}><span className="grid min-h-14 min-w-16 shrink-0 place-items-center rounded-xl bg-[#FFE4F3] px-2 py-2 text-center text-[10px] font-bold uppercase leading-tight text-[#823038]">{formatDate(project["Dia del concierto"])}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm text-[#0D1821]">{project.Titulo || project.Grupo || "Concierto"}</strong><span className="block truncate text-xs text-[#8A5468]">{project.Ubicacion || project.Pais || "Lugar a confirmar"}</span></span><span className="text-xs font-semibold text-[#823038]">→</span></Link>) : <p className="py-6 text-sm text-[#8A5468]">Todavía no hay conciertos cargados.</p>}</div></DashboardPanel>
            <DashboardPanel><PanelHeader href="/votaciones" icon={faChartColumn} title="Estado de votaciones" /><div className="mt-6 flex items-center justify-center"><div className="grid size-40 place-items-center rounded-full" style={{ background: `conic-gradient(${palette.burgundy} 0 62%, ${palette.rose} 62% 82%, ${palette.pink} 82% 100%)` }}><div className="grid size-24 place-items-center rounded-full bg-white text-center"><strong className="block text-2xl text-[#0D1821]">{activeVotes}</strong><span className="text-xs text-[#8A5468]">activas</span></div></div></div><div className="mt-5 grid gap-2 text-xs text-[#8A5468]"><div className="flex items-center justify-between"><span><i className="mr-2 inline-block size-2 rounded-full bg-[#823038]" />Abiertas</span><strong className="text-[#0D1821]">{activeVotes}</strong></div><div className="flex items-center justify-between"><span><i className="mr-2 inline-block size-2 rounded-full bg-[#A63D65]" />En recuento</span><strong className="text-[#0D1821]">{Math.max(0, Math.min(5, activeVotes))}</strong></div><div className="flex items-center justify-between"><span><i className="mr-2 inline-block size-2 rounded-full bg-[#FFE4F3]" />Finalizadas</span><strong className="text-[#0D1821]">{Math.max(0, projects.length - activeVotes)}</strong></div></div></DashboardPanel>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <DashboardPanel><PanelHeader href="/dashboard/projects" icon={faFileLines} title="Fan projects recientes" /><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead><tr className="border-b border-[#F2B8CF] bg-[#FFF7FB] text-[#823038]"><th className="rounded-l-lg px-3 py-3 font-semibold">Título</th><th className="px-3 py-3 font-semibold">Fanbase</th><th className="px-3 py-3 font-semibold">Fecha</th><th className="rounded-r-lg px-3 py-3 font-semibold">Estado</th></tr></thead><tbody>{recentProjects.length ? recentProjects.map((project) => <tr className="border-b border-[#F2B8CF] last:border-0" key={project.id}><td className="px-3 py-3 font-semibold text-[#0D1821]">{project.titulo || "Fan project sin título"}</td><td className="px-3 py-3 text-[#8A5468]">{project.fanbaseName || "Comunidad"}</td><td className="px-3 py-3 text-[#8A5468]">{formatDate(project.createdAt)}</td><td className="px-3 py-3"><span className="rounded-full bg-[#FFE4F3] px-2.5 py-1 font-semibold text-[#823038]">Publicado</span></td></tr>) : <tr><td className="px-3 py-8 text-center text-sm text-[#8A5468]" colSpan="4">Todavía no hay fan projects publicados.</td></tr>}</tbody></table></div></DashboardPanel>
            <DashboardPanel><PanelHeader href="/dashboard/fanbases#solicitudes" icon={faShieldHalved} title="Solicitudes de miembros" action="Gestionar" /><div className="mt-5 divide-y divide-[#F2B8CF]">{membershipRequests.length ? membershipRequests.slice(0, 4).map((request) => <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0" key={`${request.fanbaseId}-${request.uid}`}><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#FFF7FB] text-sm font-bold text-[#823038]">{request.displayName.charAt(0).toUpperCase()}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm text-[#0D1821]">{request.displayName}</strong><span className="block truncate text-xs text-[#8A5468]">{fanbaseNames.get(request.fanbaseId) || "Fanbase"}</span></span><span className="rounded-full bg-[#FFE4F3] px-2 py-1 text-xs font-semibold text-[#823038]">Pendiente</span></div>) : <p className="py-5 text-sm text-[#8A5468]">No hay solicitudes pendientes.</p>}</div><div className="mt-5 rounded-xl bg-[#FFE4F3] p-4 text-xs leading-5 text-[#823038]"><DashboardIcon className="mr-2 size-3" icon={faClock} /> Solo administradores pueden revisar y asignar permisos.</div></DashboardPanel>
          </section>
        </div>
      </div>
    </main>
  );
}
