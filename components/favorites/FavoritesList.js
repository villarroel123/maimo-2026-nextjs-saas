"use client";

import Link from "next/link";
import FavoriteButton from "@/components/favorites/FavoriteButton";
import { useFavorites } from "@/components/favorites/FavoritesProvider";

export default function FavoritesList() {
  const { favorites, isLoading } = useFavorites();
  const fanprojectFavorites = favorites.filter((favorite) => favorite.type === "fanproject");

  if (isLoading) {
    return <p className="text-sm text-[#8A5468]">Cargando tus favoritos...</p>;
  }

  if (fanprojectFavorites.length === 0) {
    return (
      <div className="rounded-xl border border-[#F2B8CF] bg-white p-6 text-[#8A5468]">
        <p className="font-medium text-[#5C1F3A]">Todavía no guardaste ningún favorito.</p>
        <p className="mt-2 text-sm">Explorá los fanprojects de cada concierto para crear tu lista.</p>
        <Link className="mt-5 inline-flex rounded-full bg-[#5C1F3A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#7a2a4d]" href="/">
          Explorar conciertos
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fanprojectFavorites.map((favorite) => (
        <article className="flex min-w-0 flex-col justify-between rounded-xl border border-[#F2B8CF] bg-white p-5" key={favorite.id}>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#C0567A]">
              Fanproject
            </span>
            <h2 className="mt-2 break-words text-xl font-semibold text-[#5C1F3A]">{favorite.title}</h2>
            {favorite.description ? <p className="mt-2 text-sm text-[#8A5468]">{favorite.description}</p> : null}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link className="text-sm font-semibold text-[#C0567A] hover:underline" href={favorite.href}>
              Ver detalle
            </Link>
            <FavoriteButton target={favorite} />
          </div>
        </article>
      ))}
    </div>
  );
}
