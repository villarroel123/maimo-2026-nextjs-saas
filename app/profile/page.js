import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import PersonalAgenda from "@/components/profile/PersonalAgenda";
import { getCurrentUser } from "@/lib/firebase/session";
import { getFavoriteAgendaForUser } from "@/lib/favorites/favorites";
import { updateEmailNotificationPreference } from "@/lib/notifications/notifications";
import { getCurrentUserProfile } from "@/lib/users/users";

export const dynamic = "force-dynamic";

function getProviderLabel(provider) {
  const labels = {
    "google.com": "Google",
    password: "Correo y contraseña",
  };

  return labels[provider] || "Cuenta Narabi";
}

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/profile");
  }

  const [profile, initialFavorites] = await Promise.all([
    getCurrentUserProfile(user),
    getFavoriteAgendaForUser(user.uid),
  ]);
  const displayName = profile?.displayName || user.name || user.email?.split("@")[0] || "Fan de Narabi";
  const avatarUrl = profile?.photoURL || user.picture || "";

  async function saveEmailPreference(formData) {
    "use server";

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      redirect("/login?next=/profile");
    }

    await updateEmailNotificationPreference(
      currentUser.uid,
      formData.get("emailNotifications") === "on",
    );
    revalidatePath("/profile");
  }

  return (
    <main className="min-h-screen bg-[#FDFDFF] text-[#823038]">
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C0567A]">Espacio personal</p>
        <h1 className="mt-3 text-3xl font-semibold text-[#5C1F3A] sm:text-5xl">Mi perfil</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#8A5468]">
          Tu información, tus fanprojects guardados y los próximos conciertos que querés vivir.
        </p>

        <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(15rem,0.7fr)_minmax(0,1.3fr)]">
          <article className="rounded-3xl border border-[#F2B8CF] bg-white p-6 text-center shadow-[0_12px_30px_rgba(130,48,56,0.06)]">
            {avatarUrl ? (
              <img
                alt={`Avatar de ${displayName}`}
                className="mx-auto size-24 rounded-full border-4 border-[#FFE4F3] object-cover"
                referrerPolicy="no-referrer"
                src={avatarUrl}
              />
            ) : (
              <span className="mx-auto grid size-24 place-items-center rounded-full border-4 border-[#FFE4F3] bg-[#823038] text-3xl font-bold text-white">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
            <h2 className="mt-4 text-xl font-semibold text-[#5C1F3A]">{displayName}</h2>
            <p className="mt-1 text-sm text-[#8A5468]">{user.email || "Correo no disponible"}</p>
            <span className="mt-4 inline-flex rounded-full bg-[#FFE4F3] px-3 py-1.5 text-xs font-semibold capitalize text-[#823038]">
              {profile?.user_type || "user"}
            </span>
          </article>

          <article className="rounded-3xl border border-[#F2B8CF] bg-white p-6 shadow-[0_12px_30px_rgba(130,48,56,0.06)] sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C0567A]">Información general</p>
                <h2 className="mt-2 text-xl font-semibold text-[#5C1F3A]">Datos personales</h2>
              </div>
            </div>
            <dl className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-[#A36A7C]">Nombre</dt>
                <dd className="mt-1.5 break-words text-sm font-semibold text-[#5C1F3A]">{displayName}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-[#A36A7C]">Correo</dt>
                <dd className="mt-1.5 break-words text-sm font-semibold text-[#5C1F3A]">{user.email || "No disponible"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-[#A36A7C]">Acceso</dt>
                <dd className="mt-1.5 text-sm font-semibold text-[#5C1F3A]">{getProviderLabel(profile?.provider)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-[#A36A7C]">Cuenta</dt>
                <dd className="mt-1.5 text-sm font-semibold capitalize text-[#5C1F3A]">{profile?.user_type || "user"}</dd>
              </div>
            </dl>

            <form action={saveEmailPreference} className="mt-7 flex flex-col gap-3 rounded-2xl bg-[#FFF7FB] p-4 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-3 text-sm font-medium text-[#5C1F3A]">
                <input
                  className="size-4 accent-[#823038]"
                  defaultChecked={profile?.email_notifications !== false}
                  name="emailNotifications"
                  type="checkbox"
                />
                Recibir por email los cambios de mis favoritos
              </label>
              <button className="rounded-full border border-[#823038] bg-white px-4 py-2 text-sm font-semibold text-[#823038] transition hover:bg-[#FFE4F3]" type="submit">
                Guardar
              </button>
            </form>
          </article>
        </div>

        <PersonalAgenda initialFavorites={initialFavorites} />
      </section>
    </main>
  );
}
