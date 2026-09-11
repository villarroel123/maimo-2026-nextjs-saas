import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import FavoritesList from "@/components/favorites/FavoritesList";
import { getCurrentUser } from "@/lib/firebase/session";
import { getCurrentUserProfile } from "@/lib/users/users";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentUserProfile(user);

  return (
    <main className="min-h-screen bg-[#FDFDFF] text-[#823038]">
      <Navbar user={user} profile={profile} />
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C0567A]">Tu lista</p>
        <h1 className="mt-3 text-3xl font-semibold text-[#5C1F3A] sm:text-5xl">Favoritos</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#8A5468]">
          Guardá conciertos y fanprojects para encontrarlos rápidamente antes del show.
        </p>
        <div className="mt-8">
          <FavoritesList />
        </div>
      </section>
      <Footer />
    </main>
  );
}
