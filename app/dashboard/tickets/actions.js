"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import {
  createUserTicket,
  deleteUserTicket,
  updateUserTicket,
} from "@/lib/tickets/tickets";

function parseItemForm(formData) {
  const title = String(formData.get("title") || "").trim();
  const artist = String(formData.get("artist") || "").trim();
  const venue = String(formData.get("venue") || "").trim();
  const eventDate = String(formData.get("eventDate") || "").trim();
  const sector = String(formData.get("sector") || "").trim();
  const originalPrice = Number(formData.get("originalPrice")) || 0;
  const resalePrice = Number(formData.get("resalePrice")) || 0;
  const reasonForSale = String(formData.get("reasonForSale") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const status = String(formData.get("status") || "disponible");
  const published = formData.get("published") === "on";
  const imageUrl = String(formData.get("imageUrl") || "").trim();
  const imagePath = String(formData.get("imagePath") || "").trim();

  if (!title) {
    throw new Error("El titulo es obligatorio.");
  }

  return {
    title,
    artist,
    venue,
    eventDate,
    sector,
    originalPrice,
    resalePrice,
    reasonForSale,
    description,
    status,
    published,
    imageUrl,
    imagePath,
  };
}

export async function createItem(formData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  await createUserTicket(user.uid, parseItemForm(formData));
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/items");
}

export async function updateItem(itemId, formData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  await updateUserTicket(user.uid, itemId, parseItemForm(formData));
  revalidatePath("/");
  revalidatePath(`/items/${itemId}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/items");
  // Quitamos el redirect de aquí adentro para prevenir conflictos de hidratación/renderizado en el cliente
}

export async function deleteItem(itemId) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  await deleteUserTicket(user.uid, itemId);
  revalidatePath("/");
  revalidatePath(`/items/${itemId}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/items");
}