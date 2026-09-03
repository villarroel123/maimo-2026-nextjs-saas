import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ItemForm from "@/components/items/ItemForm";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserTicket } from "@/lib/tickets/tickets";
import { getCurrentUserProfile } from "@/lib/users/users";
import { updateItem } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditItemPage({ params }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const item = await getUserTicket(user.uid, id);
  const profile = await getCurrentUserProfile(user);
  const useFirebaseStorage = process.env.FIREBASE_STORAGE === "true";

  if (!item) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar user={user} profile={profile} />
      <section className="mx-auto w-full max-w-2xl px-4 py-7 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">
          Firestore
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal text-zinc-50 sm:text-4xl">
          Editar item
        </h1>
        <p className="mt-4 text-sm leading-6 text-zinc-400">
          Esta pantalla valida que el documento pertenezca al usuario actual.
        </p>

        <div className="mt-7">
          <ItemForm
            action={updateItem.bind(null, item.id)}
            item={item}
            storageItemId={item.id}
            submitLabel="Guardar cambios"
            useFirebaseStorage={useFirebaseStorage}
          />
        </div>

        <Link
          className="mt-4 inline-flex h-10 w-full items-center justify-center border border-zinc-700 bg-transparent px-4 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900 sm:w-auto"
          href="/dashboard/items"
        >
          Volver a items
        </Link>
      </section>
      <Footer />
    </main>
  );
}
