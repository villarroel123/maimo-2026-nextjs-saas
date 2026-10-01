"use client";

import Link from "next/link";
import { useState } from "react";

export default function LoginRequiredPopup({ label, className, children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button className={className} onClick={() => setIsOpen(true)} type="button">
        {children || label}
      </button>
      {isOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#0D1821]/55 px-4" onClick={() => setIsOpen(false)}>
          <section
            aria-labelledby="login-required-title"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl bg-white p-6 text-center text-[#5C1F3A] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <h2 className="text-xl font-semibold" id="login-required-title">Iniciá sesión para participar</h2>
            <p className="mt-2 text-sm leading-6 text-[#8A5468]">
              Para votar o interactuar en esta votación, necesitás iniciar sesión y elegir las fanbases que seguís.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <button className="rounded-full border border-[#823038] px-4 py-2 text-sm font-semibold" onClick={() => setIsOpen(false)} type="button">Ahora no</button>
              <Link className="rounded-full bg-[#823038] px-4 py-2 text-sm font-semibold text-white" href="/login?next=%2Fvotaciones">Iniciar sesión</Link>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
