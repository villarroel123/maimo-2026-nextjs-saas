"use client";

import { useActionState, useEffect, useRef } from "react";

export default function EditProfileButton({
  avatarUrl,
  displayName,
  saveAction,
}) {
  const [state, formAction, pending] = useActionState(saveAction, null);
  const detailsRef = useRef(null);

  useEffect(() => {
    if (state?.ok && detailsRef.current) {
      detailsRef.current.open = false;
    }
  }, [state]);

  return (
    <details className="mt-5 text-left" ref={detailsRef}>
      <summary className="mx-auto w-fit cursor-pointer list-none rounded-full bg-[#823038] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#5C1F3A] [&::-webkit-details-marker]:hidden">
        Editar perfil
      </summary>

      <form action={formAction} className="mt-4 grid gap-4 rounded-2xl bg-[#FFF7FB] p-4">
        <label className="grid gap-2 text-sm font-semibold text-[#5C1F3A]">
          Nombre visible
          <input
            className="h-11 rounded-xl border border-[#F2B8CF] bg-white px-3 font-normal outline-none transition focus:border-[#C0567A]"
            defaultValue={displayName}
            maxLength={50}
            name="displayName"
            required
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-[#5C1F3A]">
          URL de la foto
          <input
            className="h-11 rounded-xl border border-[#F2B8CF] bg-white px-3 font-normal outline-none transition focus:border-[#C0567A]"
            defaultValue={avatarUrl}
            name="photoURL"
            placeholder="https://..."
          />
          <span className="text-xs font-normal leading-5 text-[#8A5468]">
            Podés pegar una dirección HTTPS o dejar el campo vacío para usar tu inicial.
          </span>
        </label>

        {state?.error ? <p className="text-sm font-semibold text-[#B42318]" role="alert">{state.error}</p> : null}
        {state?.ok ? <p className="text-sm font-semibold text-[#287142]" role="status">Perfil actualizado.</p> : null}

        <button
          className="h-10 rounded-full bg-[#823038] px-4 text-sm font-semibold text-white transition hover:bg-[#5C1F3A] disabled:cursor-wait disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </details>
  );
}
