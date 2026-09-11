"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFavorites } from "@/components/favorites/FavoritesProvider";

export default function FavoriteButton({ target, className = "" }) {
  const router = useRouter();
  const { isFavorite, isLoading, toggleFavorite } = useFavorites();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const saved = isFavorite(target);

  async function handleClick() {
    setIsSaving(true);
    setError("");

    try {
      const result = await toggleFavorite(target);

      if (result.requiresLogin) {
        router.push("/login");
        return;
      }

      if (result.error) {
        setError(result.error);
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        aria-pressed={saved}
        className={`inline-flex h-10 items-center justify-center rounded-full border px-4 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-60 ${
          saved
            ? "border-[#C0567A] bg-[#FFE4F3] text-[#823038] hover:bg-[#f9d4e6]"
            : "border-[#F2B8CF] bg-white text-[#5C1F3A] hover:border-[#C0567A] hover:bg-[#FFE4F3]"
        } ${className}`}
        disabled={isLoading || isSaving}
        onClick={handleClick}
        type="button"
      >
        {isSaving ? "Guardando..." : saved ? "★ Guardado" : "☆ Guardar"}
      </button>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
