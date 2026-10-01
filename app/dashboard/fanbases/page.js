import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import CircleArrowIcon from "@/components/icons/CircleArrowIcon";
import { getCurrentUser } from "@/lib/firebase/session";
import {
  approveFanbaseMembershipRequest,
  createFanbase,
  getAllFanbaseMembershipRequests,
  getFanbaseFollowers,
  getFanbaseMembershipRequests,
  getFanbaseMembers,
  getFanbases,
  getOrganizedFanbasesForUser,
  rejectFanbaseMembershipRequest,
} from "@/lib/fanbases/fanbases";
import { requireAdmin, requireFanbaseAdmin } from "@/lib/users/authorization";
import { getCurrentUserProfile } from "@/lib/users/users";

export const dynamic = "force-dynamic";

export default async function FanbasesManagementPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  const profile = await getCurrentUserProfile(user);
  const isAdmin = profile?.user_type === "admin";

  const fanbases = isAdmin ? await getFanbases() : await getOrganizedFanbasesForUser(user.uid);
  const membershipRequests = isAdmin
    ? await getAllFanbaseMembershipRequests()
    : (await Promise.all(fanbases.map((fanbase) => getFanbaseMembershipRequests(fanbase.id)))).flat();
  const fanbaseNames = new Map(fanbases.map((fanbase) => [fanbase.id, fanbase.name]));
  const fanbaseInsights = new Map(await Promise.all(fanbases.map(async (fanbase) => {
    const [members, followers] = await Promise.all([
      getFanbaseMembers(fanbase.id),
      getFanbaseFollowers(fanbase.id),
    ]);
    return [fanbase.id, { members, followers }];
  })));

  async function createFanbaseAction(formData) {
    "use server";

    const currentUser = await requireAdmin();
    const currentProfile = await getCurrentUserProfile(currentUser);

    await createFanbase({
      creator: {
        uid: currentUser.uid,
        displayName:
          currentProfile?.displayName ||
          currentUser.name ||
          currentUser.email?.split("@")[0] ||
          "Fan de Narabi",
        photoURL: currentProfile?.photoURL || currentUser.picture || "",
      },
      data: {
        name: formData.get("name"),
        kpopGroup: formData.get("kpopGroup"),
        country: formData.get("country"),
        city: formData.get("city"),
        description: formData.get("description"),
        instagram: formData.get("instagram"),
      },
    });

    revalidatePath("/fanbases");
    revalidatePath("/dashboard/fanbases");
    redirect("/dashboard/fanbases");
  }

  async function reviewMembershipAction(formData) {
    "use server";

    const fanbaseId = String(formData.get("fanbaseId") || "").trim();
    const uid = String(formData.get("uid") || "").trim();
    const decision = String(formData.get("decision") || "").trim();
    await requireFanbaseAdmin(fanbaseId);

    if (decision === "reject") {
      await rejectFanbaseMembershipRequest({ fanbaseId, uid });
    } else if (decision === "accept-admin") {
      await approveFanbaseMembershipRequest({
        fanbaseId,
        uid,
        role: "organizador",
      });
    } else {
      throw new Error("La decisión seleccionada no es válida.");
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/fanbases");
    revalidatePath(`/fanbases/${fanbaseId}`);
    redirect("/dashboard/fanbases#solicitudes");
  }

  return (
    <main className="min-h-screen bg-[#FDFDFF] text-[#823038]">
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#B53E66] hover:underline" href="/dashboard">
          <CircleArrowIcon direction="left" className="size-4" />
          Volver a dashboard
        </Link>

        <div className="mt-6 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C0567A]">Comunidad</p>
          <h1 className="mt-3 text-3xl font-semibold text-[#5C1F3A] sm:text-5xl">Gestionar fanbases</h1>
          <p className="mt-3 text-sm leading-6 text-[#8A5468]">
            {isAdmin
              ? "Creá comunidades y administrá sus integrantes. Al crear una, tu cuenta quedará como fundadora."
              : "Administrá las solicitudes y los permisos de las fanbases que tenés a cargo."}
          </p>
        </div>

        <section className="mt-8 rounded-3xl border border-[#F2B8CF] bg-white p-5 sm:p-6" id="solicitudes">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C0567A]">Acceso privado</p>
              <h2 className="mt-2 text-2xl font-semibold text-[#5C1F3A]">Solicitudes de miembros</h2>
            </div>
            <span className="rounded-full bg-[#FFE4F3] px-3 py-1 text-xs font-semibold text-[#823038]">{membershipRequests.length} pendiente{membershipRequests.length === 1 ? "" : "s"}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#8A5468]">Aceptá o rechazá las solicitudes para administrar una fanbase.</p>

          {membershipRequests.length ? (
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {membershipRequests.map((request) => (
                <article className="rounded-2xl border border-[#F2B8CF] bg-[#FFF7FB] p-4" key={`${request.fanbaseId}-${request.uid}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#C0567A]">{fanbaseNames.get(request.fanbaseId) || "Fanbase"}</p>
                  <h3 className="mt-1 text-base font-semibold text-[#5C1F3A]">{request.displayName}</h3>
                  {request.email ? <p className="mt-1 truncate text-xs text-[#8A5468]">{request.email}</p> : null}
                  <form action={reviewMembershipAction} className="mt-4 flex flex-wrap gap-2">
                    <input name="fanbaseId" type="hidden" value={request.fanbaseId} />
                    <input name="uid" type="hidden" value={request.uid} />
                    <button className="rounded-full bg-[#823038] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#5C1F3A]" name="decision" type="submit" value="accept-admin">Aceptar como administrador</button>
                    <button className="px-3 py-2 text-xs font-semibold text-[#8A5468] transition hover:text-[#5C1F3A]" name="decision" type="submit" value="reject">Rechazar</button>
                  </form>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-2xl border border-dashed border-[#EAB0C8] bg-[#FFF7FB] p-5 text-sm text-[#8A5468]">No hay solicitudes pendientes.</p>
          )}
        </section>

        <div className={`mt-8 grid gap-6 ${isAdmin ? "lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]" : "grid-cols-1"}`}>
          {isAdmin ? <form action={createFanbaseAction} className="rounded-3xl border border-[#F2B8CF] bg-[#FFE4F3] p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-[#5C1F3A]">Nueva fanbase</h2>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm font-semibold text-[#5C1F3A]">
                Nombre
                <input className="h-11 rounded-xl border border-[#F2B8CF] bg-white px-3 font-normal outline-none transition focus:border-[#C0567A]" name="name" placeholder="Ej. ARMY Argentina" required />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[#5C1F3A]">
                Grupo de K-pop
                <input className="h-11 rounded-xl border border-[#F2B8CF] bg-white px-3 font-normal outline-none transition focus:border-[#C0567A]" name="kpopGroup" placeholder="Ej. BTS" required />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-[#5C1F3A]">
                  País
                  <input className="h-11 rounded-xl border border-[#F2B8CF] bg-white px-3 font-normal outline-none transition focus:border-[#C0567A]" name="country" placeholder="Argentina" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-[#5C1F3A]">
                  Ciudad
                  <input className="h-11 rounded-xl border border-[#F2B8CF] bg-white px-3 font-normal outline-none transition focus:border-[#C0567A]" name="city" placeholder="Buenos Aires" />
                </label>
              </div>
              <label className="grid gap-2 text-sm font-semibold text-[#5C1F3A]">
                Descripción
                <textarea className="min-h-28 rounded-xl border border-[#F2B8CF] bg-white p-3 font-normal outline-none transition focus:border-[#C0567A]" name="description" placeholder="Contá qué hace esta comunidad." />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-[#5C1F3A]">
                Instagram (opcional)
                <input className="h-11 rounded-xl border border-[#F2B8CF] bg-white px-3 font-normal outline-none transition focus:border-[#C0567A]" name="instagram" placeholder="@armyar" />
              </label>
              <button className="mt-2 h-11 rounded-full bg-[#5C1F3A] px-4 text-sm font-semibold text-white transition hover:bg-[#7A2A4D]" type="submit">
                Crear fanbase
              </button>
            </div>
          </form> : null}

          <section>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-[#5C1F3A]">Fanbases registradas</h2>
              <span className="rounded-full bg-[#FFE4F3] px-3 py-1 text-xs font-semibold text-[#823038]">{fanbases.length} total</span>
            </div>
            <div className="mt-4 space-y-3">
              {fanbases.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#EAB0C8] bg-white p-5 text-sm text-[#8A5468]">
                  Todavía no hay fanbases creadas.
                </div>
              ) : fanbases.map((fanbase) => {
                const insight = fanbaseInsights.get(fanbase.id) || { members: [], followers: [] };

                return (
                <article className="rounded-2xl border border-[#F2B8CF] bg-white p-4" key={fanbase.id}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#C0567A]">{fanbase.kpopGroup}</p>
                    <h3 className="mt-1 text-lg font-semibold text-[#5C1F3A]">{fanbase.name}</h3>
                    <p className="mt-1 text-sm text-[#8A5468]">{[fanbase.city, fanbase.country].filter(Boolean).join(", ") || "Ubicación a confirmar"}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link className="rounded-full bg-[#823038] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#5C1F3A]" href="/dashboard/projects">Crear fanproject</Link>
                      <Link className="rounded-full border border-[#823038] px-3 py-2 text-sm font-semibold text-[#823038] transition hover:bg-[#FFE4F3]" href={`/fanbases/${fanbase.id}#publicaciones`}>Agregar publicación</Link>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-[#FFF7FB] p-3"><p className="text-xs text-[#8A5468]">Miembros</p><strong className="mt-1 block text-xl text-[#5C1F3A]">{insight.members.length}</strong></div>
                    <div className="rounded-xl bg-[#FFF7FB] p-3"><p className="text-xs text-[#8A5468]">Seguidores</p><strong className="mt-1 block text-xl text-[#5C1F3A]">{insight.followers.length}</strong></div>
                  </div>

                  <div className="mt-4 border-t border-[#F2B8CF] pt-4">
                    <div className="flex items-center justify-between gap-3"><h4 className="text-sm font-semibold text-[#5C1F3A]">Perfiles de seguidores</h4><Link className="text-xs font-semibold text-[#823038] hover:underline" href={`/fanbases/${fanbase.id}`}>Ver perfil</Link></div>
                    {insight.followers.length ? (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {insight.followers.slice(0, 6).map((follower) => (
                          <div className="flex min-w-0 items-center gap-2 rounded-xl bg-[#FFF7FB] px-3 py-2" key={follower.uid}>
                            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#FFE4F3] text-xs font-bold text-[#823038]">{follower.displayName.charAt(0).toUpperCase()}</span>
                            <div className="min-w-0"><p className="truncate text-xs font-semibold text-[#5C1F3A]">{follower.displayName}</p>{follower.email ? <p className="truncate text-[11px] text-[#8A5468]">{follower.email}</p> : null}</div>
                          </div>
                        ))}
                      </div>
                    ) : <p className="mt-3 text-sm text-[#8A5468]">Esta fanbase todavía no tiene seguidores.</p>}
                  </div>
                </article>
              );})}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
