"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getFavoriteKey } from "@/lib/favorites/favorite-key";

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    try {
      const response = await fetch("/api/favorites", { cache: "no-store" });

      if (response.status === 401) {
        setFavorites([]);
        return;
      }

      const payload = await response.json();

      if (response.ok) {
        setFavorites(payload.favorites || []);
      }
    } catch {
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFavorites();
  }, [loadFavorites]);

  const toggleFavorite = useCallback(async (target) => {
    const response = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle", target }),
    });

    const payload = await response.json().catch(() => ({}));

    if (response.status === 401) {
      return { requiresLogin: true, error: payload.error };
    }

    if (!response.ok) {
      return { error: payload.error || "No se pudo actualizar el favorito." };
    }

    setFavorites(payload.favorites || []);
    return { isFavorite: payload.isFavorite };
  }, []);

  const favoriteKeys = useMemo(
    () => new Set(favorites.map((favorite) => getFavoriteKey(favorite))),
    [favorites],
  );

  const value = useMemo(() => ({
    favorites,
    isLoading,
    isFavorite: (target) => favoriteKeys.has(getFavoriteKey(target)),
    toggleFavorite,
  }), [favoriteKeys, favorites, isLoading, toggleFavorite]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider.");
  }

  return context;
}
