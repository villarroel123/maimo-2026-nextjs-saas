import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import CircleArrowIcon from "@/components/icons/CircleArrowIcon";
import { getFanprojectImage } from "@/lib/projects/fanproject-image";
import { getProjectsWithFanProjects } from "@/lib/projects/projects";
import { getCurrentUser } from "@/lib/firebase/session";
import {
  getFanbase,
  getFanbaseMembers,
  getFanbaseMembership,
  getFanbaseRoleLabel,
  joinFanbase,
} from "@/lib/fanbases/fanbases";
import { getCurrentUserProfile } from "@/lib/users/users";

export const dynamic = "force-dynamic";

export default async function FanbaseDetailPage({ params }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  const [fanbase, members, projects] = await Promise.all([
    getFanbase(id),
    getFanbaseMembers(id),
    getProjectsWithFanProjects(),
  ]);

  if (!fanbase) notFound();

  const membership = currentUser ? await getFanbaseMembership(id, currentUser.uid) : null;
  const fanprojects = projects.flatMap((project) => (
    (project.subitems || [])
      .filter((fanproject) => fanproject.fanbaseId === fanbase.id)
      .map((fanproject) => ({ ...fanproject, project }))
  ));

  async function handleJoin() {
    "use server";

    const user = await getCurrentUser();
    const detailPath = `/fanbases/${id}`;

    if (!user) {
      redirect(`/login?next=${encodeURIComponent(detailPath)}`);
    }

    const profile = await getCurrentUserProfile(user);
    await joinFanbase({
      fanbaseId: id,
      user: {
        uid: user.uid,
        displayName: profile?.displayName || user.name || user.email?.split("@")[0] || "Fan de Narabi",
        photoURL: profile?.photoURL || user.picture || "",
      },
    });

    revalidatePath("/fanbases");
    revalidatePath(detailPath);
    redirect(detailPath);
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
            {membership ? (
              <span className="w-fit rounded-full border border-[#F2B8CF] bg-white px-4 py-2 text-sm font-semibold text-[#823038]">
                Sos {getFanbaseRoleLabel(membership.role).toLowerCase()}
              </span>
            ) : (
              <form action={handleJoin}>
                <button className="rounded-full bg-[#5C1F3A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#7A2A4D]" type="submit">
                  Unirme a esta fanbase
                </button>
              </form>
            )}
          </div>
          {fanbase.description ? <p className="relative mt-7 max-w-3xl text-sm leading-6 text-[#7F4A5E]">{fanbase.description}</p> : null}
          <div className="relative mt-6 flex flex-wrap gap-2.5 text-sm">
            <span className="rounded-full border border-[#F2B8CF] bg-white/75 px-3 py-1.5 text-[#823038]">{members.length} integrante{members.length === 1 ? "" : "s"}</span>
            <span className="rounded-full border border-[#F2B8CF] bg-white/75 px-3 py-1.5 text-[#823038]">{fanprojects.length} fanproject{fanprojects.length === 1 ? "" : "s"}</span>
            {fanbase.instagram ? <span className="rounded-full border border-[#F2B8CF] bg-white/75 px-3 py-1.5 text-[#823038]">@{fanbase.instagram}</span> : null}
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(16rem,0.7fr)]">
          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C0567A]">Creaciones de la comunidad</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#5C1F3A]">Fanprojects organizados</h2>
            {fanprojects.length === 0 ? (
              <p className="mt-5 rounded-2xl border border-dashed border-[#EAB0C8] bg-white p-5 text-sm text-[#8A5468]">Esta fanbase todavía no publicó fanprojects.</p>
            ) : (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {fanprojects.map((fanproject) => (
                  <Link className="group overflow-hidden rounded-2xl border border-[#F2B8CF] bg-white transition hover:-translate-y-1 hover:border-[#D985A5]" href={`/projects/${fanproject.project.id}/activities/${fanproject.id}`} key={`${fanproject.project.id}-${fanproject.id}`}>
                    <div className="h-32 overflow-hidden bg-[#FFE4F3]">
                      <img alt={`Imagen de ${fanproject.titulo}`} className="size-full object-cover transition duration-300 group-hover:scale-105" src={getFanprojectImage(fanproject, fanproject.project)} />
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

          <aside className="rounded-3xl border border-[#F2B8CF] bg-white p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C0567A]">Equipo</p>
            <h2 className="mt-2 text-xl font-semibold text-[#5C1F3A]">Integrantes</h2>
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
          </aside>
        </div>
      </section>
    </main>
  );
}
