import Link from "next/link";

import { redirect } from "next/navigation";

import UserForm from "@/components/users/UserForm";

import { getCurrentUser } from "@/lib/firebase/session";

import { getCurrentUserProfile, listUserProfiles } from "@/lib/users/users";

import { createUser, deleteUser } from "./actions";

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

export default async function UsersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentUserProfile(user);

  if (profile?.user_type !== "admin") {
    redirect("/dashboard");
  }

  const users = await listUserProfiles();

  return (
    <main className="min-h-screen bg-[#FDFDFF] pb-17 text-[#823038]">
      {/* HEADER */}
      <header className="mx-auto flex w-full max-w-6xl flex-col gap-5 border-b border-[#823038]/20 px-4 py-8 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#823038]">
            Administración
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-[#823038] sm:text-5xl lg:text-6xl">
            Usuarios
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#823038]">
            Gestión de perfiles almacenados en Firestore.
          </p>
        </div>
      </header>

      {/* CONTENIDO */}
      <section className="mx-auto mt-7 grid w-full max-w-6xl gap-6 px-4 sm:px-6 lg:px-8 xl:grid-cols-[minmax(280px,360px)_1fr]">
        {/* CREAR USUARIO */}
        <div>
          <h2 className="mb-3 text-lg font-semibold text-[#823038]">
            Crear usuario
          </h2>

          <div className="rounded-3xl border border-[#823038]/20 bg-[#FFE4F3] p-5 shadow-[0_15px_45px_rgba(130,48,56,0.08)]">
            <UserForm
              action={createUser}
              showCredentials
              submitLabel="Crear usuario"
            />
          </div>
        </div>

        {/* USUARIOS REGISTRADOS */}
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[#823038]">
              Usuarios registrados
            </h2>

            <span className="rounded-full bg-[#FFE4F3] px-3 py-1 text-sm font-semibold text-[#823038]">
              {users.length} total
            </span>
          </div>

          {users.length === 0 ? (
            <div className="rounded-2xl border border-[#823038]/20 bg-[#FFE4F3] p-6 text-sm leading-6 text-[#823038]">
              No hay perfiles de usuario registrados.
            </div>
          ) : (
            <div className="grid gap-4">
              {users.map((managedUser) => (
                <article
                  className="grid min-w-0 gap-5 rounded-2xl border border-[#823038]/20 bg-[#FFE4F3] p-5 shadow-[0_10px_35px_rgba(130,48,56,0.06)] sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto]"
                  key={managedUser.uid}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="overflow-wrap-anywhere text-base font-semibold text-[#823038]">
                        {managedUser.email || managedUser.uid}
                      </h3>

                      <span className="rounded-full border border-[#823038]/25 bg-[#FDFDFF] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#823038]">
                        {managedUser.user_type}
                      </span>
                    </div>

                    {managedUser.displayName ? (
                      <p className="mt-3 text-sm font-medium leading-6 text-[#823038]">
                        {managedUser.displayName}
                      </p>
                    ) : null}

                    <p className="mt-3 overflow-wrap-anywhere rounded-lg bg-[#FDFDFF] px-3 py-2 font-mono text-xs text-[#823038]">
                      {managedUser.uid}
                    </p>

                    <p className="mt-2 text-xs font-medium text-[#823038]">
                      Último acceso: {formatDate(managedUser.lastLoginAt)}
                    </p>
                  </div>

                  <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-start lg:justify-end">
                    <Link
                      className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-[#823038] bg-[#FDFDFF] px-4 text-sm font-semibold text-[#823038] transition hover:bg-[#FFE4F3] sm:w-auto"
                      href={`/dashboard/users/${managedUser.uid}/edit`}
                    >
                      Editar
                    </Link>

                    {managedUser.uid !== user.uid ? (
                      <form action={deleteUser.bind(null, managedUser.uid)}>
                        <button
                          className="h-10 w-full rounded-xl border border-[#823038] bg-[#823038] px-4 text-sm font-semibold text-[#FDFDFF] transition hover:bg-[#5C1F3A] sm:w-auto"
                          type="submit"
                        >
                          Eliminar
                        </button>
                      </form>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}