import Link from "next/link";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ItemForm from "@/components/items/ItemForm";
import { getCurrentUser } from "@/lib/firebase/session";
import { listUserTickets } from "@/lib/tickets/tickets";
import { getCurrentUserProfile } from "@/lib/users/users";
import { createItem, deleteItem } from "./actions";

export const dynamic = "force-dynamic";

function formatDate(value) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function ItemsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const items = await listUserTickets(user.uid);
  const profile = await getCurrentUserProfile(user);
  const useFirebaseStorage = process.env.FIREBASE_STORAGE === "true";

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar user={user} profile={profile} />
      <header className="mx-auto flex w-full max-w-6xl flex-col gap-5 border-b border-zinc-800 px-4 py-7 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">
            Firestore
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-zinc-50 sm:text-5xl lg:text-6xl">
            Tickets
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">
            ABM base con documentos asociados al usuario autenticado.
          </p>
        </div>
      </header>

      <section className="mx-auto mt-7 grid w-full max-w-6xl gap-6 px-4 sm:px-6 lg:px-8 lg:grid-cols-[420px_1fr]">
        <div>
          <h2 className="mb-3 text-lg font-semibold text-zinc-100">
            Crear ticket
          </h2>
          <ItemForm
            action={createItem}
            submitLabel="Crear ticket"
            useFirebaseStorage={useFirebaseStorage}
          />
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-zinc-100">
              Mis tickets
            </h2>
            <span className="text-sm text-zinc-500">{items.length} total</span>
          </div>

          {items.length === 0 ? (
            <div className="border border-zinc-800 p-6 text-sm leading-6 text-zinc-400">
              Todavia no hay tickets cargados para este usuario.
            </div>
          ) : (
            <div className="grid gap-px overflow-hidden border border-zinc-800 bg-zinc-800">
              {items.map((item) => (
                <article
                  className="grid min-w-0 gap-4 bg-zinc-950 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_auto]"
                  key={item.id}
                >
                  <div className="min-w-0">
                    {item.imageUrl ? (
                      <div className="mb-4 border border-zinc-800 bg-zinc-900">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          alt={item.title}
                          className="h-40 w-full object-cover"
                          src={item.imageUrl}
                        />
                      </div>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="overflow-wrap-anywhere text-base font-semibold text-zinc-100">
                        {item.title}
                      </h3>
                      <span className="border border-zinc-800 px-2 py-1 text-xs uppercase tracking-[0.12em] text-zinc-400">
                        {item.status}
                      </span>
                      <span className="border border-zinc-800 px-2 py-1 text-xs uppercase tracking-[0.12em] text-zinc-400">
                        {item.published ? "published" : "draft"}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-400 sm:grid-cols-4">
                      {item.artist && <div>Artista: <strong className="text-zinc-200">{item.artist}</strong></div>}
                      {item.venue && <div>Estadio: <strong className="text-zinc-200">{item.venue}</strong></div>}
                      {item.eventDate && <div>Fecha: <strong className="text-zinc-200">{item.eventDate}</strong></div>}
                      {item.sector && <div>Sector: <strong className="text-zinc-200">{item.sector}</strong></div>}
                      {item.originalPrice !== undefined && <div>Original: <strong className="text-zinc-200">${item.originalPrice}</strong></div>}
                    </div>

                    {(item.resalePrice !== undefined || item.reasonForSale) && (
                      <div className="mt-3 flex items-center justify-between border border-zinc-800 bg-zinc-900/50 p-3 text-sm">
                        {item.resalePrice !== undefined && (
                          <div>
                            <span className="text-xs text-zinc-500 block">Precio de Reventa:</span>
                            <span className="font-bold text-emerald-400">${item.resalePrice}</span>
                          </div>
                        )}
                        {item.reasonForSale && (
                          <div className="text-right">
                            <span className="text-xs text-zinc-500 block">Motivo:</span>
                            <span className="text-xs italic text-zinc-300">{item.reasonForSale}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {item.description ? (
                      <p className="mt-3 overflow-wrap-anywhere text-sm leading-6 text-zinc-400">
                        {item.description}
                      </p>
                    ) : null}

                    <p className="mt-3 text-xs text-zinc-600">
                      Creado: {formatDate(item.createdAt)}
                    </p>
                  </div>

                  <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-start lg:justify-end">
                    {item.published ? (
                      <Link
                        className="inline-flex h-9 w-full items-center justify-center border border-zinc-700 px-3 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900 sm:w-auto"
                        href={`/items/${item.id}`}
                      >
                        Ver
                      </Link>
                    ) : null}
                    <Link
                      className="inline-flex h-9 w-full items-center justify-center border border-zinc-700 px-3 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900 sm:w-auto"
                      href={`/dashboard/items/${item.id}/edit`}
                    >
                      Editar
                    </Link>
                    <form action={deleteItem.bind(null, item.id)}>
                      <button
                        className="h-9 w-full border border-red-900/80 px-3 text-sm font-semibold text-red-300 transition hover:bg-red-950/50 sm:w-auto"
                        type="submit"
                      >
                        Eliminar
                      </button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}