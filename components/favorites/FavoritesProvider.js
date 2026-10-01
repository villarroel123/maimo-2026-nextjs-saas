"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getFavoriteKey } from "@/lib/favorites/favorite-key";

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children, enabled = false }) {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const favoritesRef = useRef([]);

  const updateFavorites = useCallback((nextFavorites) => {
    favoritesRef.current = nextFavorites;
    setFavorites(nextFavorites);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let active = true;

    fetch("/api/favorites", { cache: "no-store" })
      .then(async (response) => ({ response, payload: await response.json().catch(() => ({})) }))
      .then(({ response, payload }) => {
        if (!active) return;
        updateFavorites(response.ok ? payload.favorites || [] : []);
      })
      .catch(() => {
        if (active) updateFavorites([]);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [enabled, updateFavorites]);

  const toggleFavorite = useCallback(async (target) => {
    if (!enabled) return { requiresLogin: true };

    const previousFavorites = favoritesRef.current;
    const targetKey = getFavoriteKey(target);
    const wasFavorite = previousFavorites.some((favorite) => getFavoriteKey(favorite) === targetKey);
    const optimisticFavorites = wasFavorite
      ? previousFavorites.filter((favorite) => getFavoriteKey(favorite) !== targetKey)
      : [...previousFavorites, target];
    updateFavorites(optimisticFavorites);

    try {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", target }),
      });
      const payload = await response.json().catch(() => ({}));

      if (response.status === 401) {
        updateFavorites(previousFavorites);
        return { requiresLogin: true, error: payload.error };
      }

      if (!response.ok) {
        updateFavorites(previousFavorites);
        return { error: payload.error || "No se pudo actualizar el favorito." };
      }

      updateFavorites(payload.favorites || optimisticFavorites);
      return { isFavorite: payload.isFavorite };
    } catch {
      updateFavorites(previousFavorites);
      return { error: "No se pudo actualizar el favorito." };
    }
  }, [enabled, updateFavorites]);

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
