import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import FavoritesList from "@/components/favorites/FavoritesList";
import { getCurrentUser } from "@/lib/firebase/session";
import { getCurrentUserProfile } from "@/lib/users/users";
import { updateEmailNotificationPreference } from "@/lib/notifications/notifications";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentUserProfile(user);

  async function saveEmailPreference(formData) {
    "use server";
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      throw new Error("Unauthorized.");
    }

    await updateEmailNotificationPreference(
      currentUser.uid,
      formData.get("emailNotifications") === "on",
    );
    revalidatePath("/favorites");
  }

  return (
    <main className="min-h-screen bg-[#FDFDFF] text-[#823038]">
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C0567A]">Tu lista</p>
        <h1 className="mt-3 text-3xl font-semibold text-[#5C1F3A] sm:text-5xl">Favoritos</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#8A5468]">
          Guardá fanprojects para encontrarlos rápidamente antes del show.
        </p>
        <form action={saveEmailPreference} className="mt-6 flex flex-col gap-3 rounded-xl border border-[#F2B8CF] bg-[#FFE4F3] p-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-3 text-sm font-medium text-[#5C1F3A]">
            <input
              className="size-4 accent-[#823038]"
              defaultChecked={profile?.email_notifications !== false}
              name="emailNotifications"
              type="checkbox"
            />
            Recibir por email los cambios de mis favoritos
          </label>
          <button className="rounded-full border border-[#823038] bg-white px-4 py-2 text-sm font-semibold text-[#823038] transition hover:bg-[#f9d4e6]" type="submit">
            Guardar preferencia
          </button>
        </form>
        <div className="mt-8">
          <FavoritesList />
        </div>
      </section>
    </main>
  );
}
