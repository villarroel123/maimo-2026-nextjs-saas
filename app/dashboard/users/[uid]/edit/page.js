import Link from "next/link";

import { notFound, redirect } from "next/navigation";

import UserForm from "@/components/users/UserForm";

import { getCurrentUser } from "@/lib/firebase/session";

import { getCurrentUserProfile, getUserProfile } from "@/lib/users/users";

import { updateUser } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditUserPage({ params }) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const currentProfile = await getCurrentUserProfile(currentUser);

  if (currentProfile?.user_type !== "admin") {
    redirect("/dashboard");
  }

  const { uid } = await params;

  const managedUser = await getUserProfile(uid);

  if (!managedUser) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#FDFDFF] text-[#823038]">
      <section className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[#823038]/15 bg-[#FFE4F3] p-6 shadow-[0_20px_60px_rgba(130,48,56,0.10)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#823038]/70">
            Administración
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-[#823038] sm:text-4xl">
            Editar usuario
          </h1>

          <p className="mt-4 overflow-wrap-anywhere rounded-xl border border-[#823038]/10 bg-[#FDFDFF]/60 px-4 py-3 font-mono text-xs leading-6 text-[#823038]/55">
            {managedUser.uid}
          </p>

          <div className="mt-7 rounded-2xl bg-[#FDFDFF] p-5 sm:p-6">
            <UserForm
              action={updateUser.bind(null, managedUser.uid)}
              user={managedUser}
              submitLabel="Guardar cambios"
            />
          </div>

          <Link
            className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#823038]/30 bg-[#FDFDFF] px-4 text-sm font-semibold text-[#823038] transition hover:border-[#823038] hover:bg-[#FFE4F3] sm:w-auto sm:px-6"
            href="/dashboard/users"
          >
            Volver a usuarios
          </Link>
        </div>
      </section>
    </main>
  );
}