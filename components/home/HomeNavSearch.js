"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function HomeNavSearch({
  inputId = "nav-home-search",
  isScrolled,
  placeholder = "Buscar conciertos, fanprojects o fanbases",
}) {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  return (
    <form action="/#explorar" className="mx-auto flex w-full max-w-lg items-center gap-2" method="get" role="search">
      <label className="sr-only" htmlFor={inputId}>Buscar en Narabi</label>
      <div className={`flex min-w-0 flex-1 items-center rounded-full border bg-[#FDFDFF]/10 transition focus-within:ring-2 ${
        isScrolled
          ? "border-[#823038]/35 text-[#823038] focus-within:ring-[#823038]/30"
          : "border-[#FDFDFF]/50 text-[#FDFDFF] focus-within:ring-[#FDFDFF]/35"
      }`}>
        <input
          autoComplete="off"
          className={`min-w-0 flex-1 bg-transparent px-4 py-2 text-sm outline-none ${
            isScrolled ? "placeholder:text-[#823038]/60" : "placeholder:text-[#FDFDFF]/70"
          }`}
          defaultValue={query}
          id={inputId}
          key={query}
          maxLength={100}
          name="q"
          placeholder={placeholder}
          type="search"
        />
        <button aria-label="Buscar en Narabi" className="grid size-9 shrink-0 place-items-center rounded-full transition hover:bg-[#FDFDFF]/20" type="submit">
          <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m15.5 15.5 5 5" />
          </svg>
        </button>
      </div>
      {query ? (
        <Link className={`shrink-0 text-xs font-semibold underline underline-offset-2 transition ${
          isScrolled ? "text-[#823038] hover:text-[#5C1F3A]" : "text-[#FDFDFF] hover:text-[#FFE4F3]"
        }`} href="/#explorar">
          Limpiar
        </Link>
      ) : null}
    </form>
  );
}
