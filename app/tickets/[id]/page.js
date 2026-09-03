import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/firebase/session";
import { getPublishedTicket } from "@/lib/tickets/tickets";
import { getCurrentUserProfile } from "@/lib/users/users";
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

export default async function PublicItemPage({ params }) {
  const { id } = await params;
  const [item, user] = await Promise.all([getPublishedTicket(id), getCurrentUser()]);
  const profile = user ? await getCurrentUserProfile(user) : null;

  if (!item) {
    notFound();
  }

  const isOwner = user?.uid === item.userId;

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar
        user={user}
        profile={profile}
        actions={
          isOwner ? (
            <Link
              className="inline-flex h-10 w-full items-center justify-center border border-cyan-400 bg-cyan-400 px-4 text-sm font-semibold text-zinc-950 transition hover:border-cyan-300 hover:bg-cyan-300 sm:w-auto"
              href={`/dashboard/tickets/${item.id}/edit`}
            >
              Editar
            </Link>
          ) : null
        }
      />

      <article className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="border border-zinc-800 px-2 py-1 text-xs uppercase tracking-[0.12em] text-zinc-400">
            {item.status}
          </span>
          <span className="border border-cyan-900/70 px-2 py-1 text-xs uppercase tracking-[0.12em] text-cyan-300">
            published
          </span>
        </div>

        <h1 className="mt-5 overflow-wrap-anywhere text-3xl font-semibold tracking-normal text-zinc-50 sm:text-5xl lg:text-6xl">
          {item.title}
        </h1>

        {item.imageUrl ? (
          <div className="mt-8 border border-zinc-800 bg-zinc-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={item.title}
              className="max-h-[520px] w-full object-cover"
              src={item.imageUrl}
            />
          </div>
        ) : null}

        {item.description ? (
          <p className="mt-6 whitespace-pre-wrap overflow-wrap-anywhere text-base leading-8 text-zinc-300">
            {item.description}
          </p>
        ) : null}

        <footer className="mt-10 border-t border-zinc-800 pt-5 text-sm text-zinc-500">
          Publicado: {formatDate(item.createdAt)}
        </footer>
      </article>
      <Footer />
    </main>
  );
}
