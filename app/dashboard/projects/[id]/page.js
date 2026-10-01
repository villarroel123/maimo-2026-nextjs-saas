import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getProjectWithDetails, deleteFanProject } from "@/lib/projects/projects";
import { getCurrentUser } from "@/lib/firebase/session";
import { getCurrentUserProfile } from "@/lib/users/users";
import { getOrganizedFanbasesForUser } from "@/lib/fanbases/fanbases";
import DeleteActivityButton from "@/components/DeleteActivityButton";
import { getFanProjectStatus } from "@/lib/projects/fanproject-status";
import { closeFanProjectVoting, getFanProjectVoteSummary } from "@/lib/votes/fanproject-votes";
import { notifyFavoriteUsers } from "@/lib/notifications/notifications";
import { requireAdmin } from "@/lib/users/authorization";
import CircleArrowIcon from "@/components/icons/CircleArrowIcon";

export const dynamic = "force-dynamic";

export default async function AdminProjectDetailPage({ params }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const project = await getProjectWithDetails(id);
  if (!project) redirect("/dashboard");

  const profile = await getCurrentUserProfile(user);
  const isAdmin = profile?.user_type === "admin";
  const isFanbaseAccount = profile?.user_type === "fanbase";
  if (!isAdmin && !isFanbaseAccount) redirect("/profile");
  const managedFanbases = isAdmin ? [] : await getOrganizedFanbasesForUser(user.uid);
  const ownedFanbaseIds = new Set(managedFanbases.map((fanbase) => fanbase.id));
  const canManageVoting = isAdmin || ownedFanbaseIds.has(project.fanbaseId) || project.subitems?.some((activity) => ownedFanbaseIds.has(activity.fanbaseId));
  const canCreateFanproject = isAdmin || (isFanbaseAccount && ownedFanbaseIds.size > 0);

  const votingSummary = await getFanProjectVoteSummary(project);

  async function handleDeleteActivity(formData) {
    "use server";
    await requireAdmin();
    const projId = formData.get("projectId");
    const actId = formData.get("activityId");
    await deleteFanProject(projId, actId);
    redirect(`/dashboard/projects/${projId}`);
  }

  async function handleCloseVote(formData) {
    "use server";

    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Unauthorized.");
    const currentProfile = await getCurrentUserProfile(currentUser);
    const currentIsAdmin = currentProfile?.user_type === "admin";
    const currentIsFanbase = currentProfile?.user_type === "fanbase";
    if (!currentIsAdmin && !currentIsFanbase) throw new Error("No tenés permisos para cerrar esta votación.");
    let currentCanManageVoting = currentIsAdmin;

    if (!currentCanManageVoting) {
      const currentManagedFanbases = await getOrganizedFanbasesForUser(currentUser.uid);
      const currentOwnedIds = new Set(currentManagedFanbases.map((fanbase) => fanbase.id));
      currentCanManageVoting = currentOwnedIds.has(project.fanbaseId) || project.subitems?.some((activity) => currentOwnedIds.has(activity.fanbaseId));
    }

    if (!currentCanManageVoting) throw new Error("No tenés permisos para cerrar esta votación.");
    const projectId = String(formData.get("projectId") || "").trim();
    const fanprojectId = String(formData.get("fanprojectId") || "").trim();

    if (projectId !== id || !fanprojectId || fanprojectId.includes("/")) {
      throw new Error("La votación no es válida.");
    }

    const result = await closeFanProjectVoting({ projectId, fanprojectId });

    try {
      await notifyFavoriteUsers({
        projectId,
        title: `Fanproject confirmado: ${result.title}`,
        message: `La votación se cerró y ${result.title} fue confirmado para este concierto.`,
        href: `/projects/${projectId}/activities/${fanprojectId}`,
      });
    } catch (error) {
      console.error("Could not notify favorite users about the closed vote:", error);
    }

    revalidatePath("/");
    revalidatePath("/votaciones");
    revalidatePath(`/dashboard/projects/${projectId}`);
    redirect(`/dashboard/projects/${projectId}?vote=closed`);
  }

  return (
    <main className="min-h-screen bg-[#FDFDFF] text-[#823038] p-8 max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-[#C0567A] hover:underline">
          <CircleArrowIcon direction="left" className="size-4" />
          Volver a dashboard
        </Link>
        {canCreateFanproject ? (
          <Link
            href={`/dashboard/projects/${project.id}/activities/new`}
            className="text-xs bg-[#5C1F3A] text-white font-semibold px-4 py-2 rounded-lg hover:bg-[#7a2a4d] transition"
          >
            + Nuevo fanproject
          </Link>
        ) : null}
      </div>

      {/* Tarjeta principal del Concierto con su respectivo botón de Editar Proyecto */}
      <div className="border border-[#F2B8CF] bg-[#FFE4F3] p-6 rounded-2xl mb-8 flex justify-between items-start">
        <div>
          <span className="text-xs font-semibold text-[#C0567A] uppercase tracking-wider">
            {project.Pais || "Global"} • {project["Dia del concierto"]}
          </span>
          <h1 className="text-3xl font-bold text-[#5C1F3A] mt-2">{project.Titulo}</h1>
        </div>
        {isAdmin ? (
          <Link
            href={`/dashboard/projects/${project.id}/edit`}
            className="text-xs bg-white hover:bg-[#f9d4e6] text-[#5C1F3A] px-3 py-2 rounded-lg transition font-medium border border-[#F2B8CF] shrink-0"
          >
            Editar Concierto
          </Link>
        ) : null}
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-bold text-[#5C1F3A]">Gestión de Actividades</h2>
      </div>

      {votingSummary?.isClosed ? (
        <section className="mb-8 rounded-xl border border-[#B7DFC5] bg-[#E9F8EE] p-5">
          <span className="inline-flex rounded-full border border-[#B7DFC5] bg-white px-2.5 py-1 text-xs font-semibold text-[#287142]">
            Votación cerrada
          </span>
          <h2 className="mt-3 text-xl font-bold text-[#287142]">Fanproject confirmado</h2>
          <p className="mt-1 text-sm text-[#3B6D4B]">
            {votingSummary.winner
              ? `${votingSummary.winner.titulo} fue confirmado con ${votingSummary.totalVotes} voto${votingSummary.totalVotes === 1 ? "" : "s"} registrados.`
              : "La votación se cerró."}
          </p>
        </section>
      ) : votingSummary ? (
        <section className="mb-8 border border-[#F2B8CF] bg-white p-5 rounded-xl">
          <h2 className="text-xl font-bold text-[#5C1F3A]">Resultados de la votación</h2>
          <p className="mt-1 text-sm text-[#8A5468]">
            {votingSummary.totalVotes} voto{votingSummary.totalVotes === 1 ? "" : "s"} registrado{votingSummary.totalVotes === 1 ? "" : "s"}. Elegí el ganador para confirmarlo y cerrar la votación.
          </p>
          <div className="mt-4 space-y-3">
            {votingSummary.candidates.map((candidate) => {
              const percentage = votingSummary.totalVotes ? Math.round((candidate.votes / votingSummary.totalVotes) * 100) : 0;

              return (
                <div className="rounded-lg border border-[#F2B8CF] bg-[#FFE4F3] p-4" key={candidate.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="font-semibold text-[#5C1F3A]">{candidate.titulo}</span>
                    <span className="text-[#8A5468]">{candidate.votes} voto{candidate.votes === 1 ? "" : "s"} · {percentage}%</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-[#C0567A]" style={{ width: `${percentage}%` }} />
                  </div>
                  {canManageVoting ? <form action={handleCloseVote} className="mt-4">
                    <input name="projectId" type="hidden" value={project.id} />
                    <input name="fanprojectId" type="hidden" value={candidate.id} />
                    <button
                      className="rounded-full bg-[#5C1F3A] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#7a2a4d]"
                      type="submit"
                    >
                      Confirmar ganador y cerrar votación
                    </button>
                  </form> : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="space-y-3">
        {!project.subitems || project.subitems.length === 0 ? (
          <div className="border border-[#F2B8CF] bg-white p-6 rounded-xl text-center text-[#8A5468]">
            No hay actividades registradas para este concierto todavía.
          </div>
        ) : (
          project.subitems.map((activity) => {
            const status = getFanProjectStatus(activity.estado);

            return (
            <div 
              key={activity.id} 
              className="border border-[#F2B8CF] bg-[#FFE4F3] p-4 rounded-xl flex justify-between items-center gap-4"
            >
              <div>
                <h3 className="text-base font-bold text-[#5C1F3A]">{activity.titulo}</h3>
                <p className="text-xs text-[#8A5468] line-clamp-1 mt-0.5">{activity.descripcion}</p>
                <span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${status.badgeClassName}`}>
                  {status.label}
                </span>
              </div>

              {isAdmin || ownedFanbaseIds.has(activity.fanbaseId) ? (
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/dashboard/projects/${project.id}/activities/${activity.id}/edit`}
                    className="text-xs bg-white hover:bg-[#f9d4e6] text-[#5C1F3A] px-3 py-1.5 rounded-lg transition font-medium border border-[#F2B8CF]"
                  >
                    Editar
                  </Link>

                  {isAdmin ? <DeleteActivityButton
                    projectId={project.id}
                    activityId={activity.id}
                    activityTitle={activity.titulo}
                    deleteAction={handleDeleteActivity}
                  /> : null}
                </div>
              ) : null}
            </div>
            );
          })
        )}
      </div>
    </main>
  );
}
