import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/firebase/session";
import { getNotificationsForUser, markNotificationAsRead } from "@/lib/notifications/notifications";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const notifications = await getNotificationsForUser(user.uid);

  async function markAsRead(formData) {
    "use server";
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      throw new Error("Unauthorized.");
    }

    const notificationId = String(formData.get("notificationId") || "");
    await markNotificationAsRead(currentUser.uid, notificationId);
    revalidatePath("/notifications");
  }

  return (
    <main className="min-h-screen bg-[#FDFDFF] text-[#823038]">
      <section className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C0567A]">Tu actividad</p>
        <h1 className="mt-3 text-3xl font-semibold text-[#5C1F3A] sm:text-5xl">Notificaciones</h1>
        <p className="mt-3 text-sm leading-6 text-[#8A5468]">
          Acá verás los cambios de los conciertos y fanprojects que guardaste.
        </p>

        <div className="mt-8 space-y-3">
          {notifications.length === 0 ? (
            <div className="rounded-xl border border-[#F2B8CF] bg-white p-6 text-sm text-[#8A5468]">
              Todavía no tenés notificaciones.
            </div>
          ) : notifications.map((notification) => (
            <article className={`rounded-xl border p-5 ${notification.read ? "border-[#F2B8CF] bg-white" : "border-[#C0567A] bg-[#FFE4F3]"}`} key={notification.id}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-semibold text-[#5C1F3A]">{notification.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-[#8A5468]">{notification.message}</p>
                </div>
                {!notification.read ? <span className="w-fit rounded-full bg-[#823038] px-2.5 py-1 text-xs font-semibold text-white">Nueva</span> : null}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <Link className="text-sm font-semibold text-[#C0567A] hover:underline" href={notification.href}>
                  Ver detalle
                </Link>
                {!notification.read ? (
                  <form action={markAsRead}>
                    <input name="notificationId" type="hidden" value={notification.id} />
                    <button className="text-sm font-semibold text-[#5C1F3A] hover:underline" type="submit">
                      Marcar como leída
                    </button>
                  </form>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
