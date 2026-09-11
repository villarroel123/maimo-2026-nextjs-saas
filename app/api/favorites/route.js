import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/firebase/session";
import { getFavoritesForUser, toggleFavoriteForUser } from "@/lib/favorites/favorites";

export const dynamic = "force-dynamic";

function unauthorizedResponse() {
  return NextResponse.json({ error: "Iniciá sesión para administrar favoritos." }, { status: 401 });
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResponse();
  }

  try {
    const favorites = await getFavoritesForUser(user.uid);
    return NextResponse.json({ favorites });
  } catch (error) {
    console.error("Could not load favorites:", error);
    return NextResponse.json({ error: "No se pudieron cargar los favoritos." }, { status: 500 });
  }
}

export async function POST(request) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorizedResponse();
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "La solicitud no es válida." }, { status: 400 });
  }

  if (body?.action !== "toggle") {
    return NextResponse.json({ error: "La acción no es válida." }, { status: 400 });
  }

  try {
    const isFavorite = await toggleFavoriteForUser(user.uid, body.target);
    const favorites = await getFavoritesForUser(user.uid);

    return NextResponse.json({ favorites, isFavorite });
  } catch (error) {
    console.error("Could not update favorite:", error);
    return NextResponse.json({ error: "No se pudo actualizar el favorito." }, { status: 400 });
  }
}
