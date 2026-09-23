"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

const DEFAULT_FANBASE_IMAGE = "/items/hero_one.jpg";

function normalizeSearchValue(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-AR");
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

export default function FanbaseGrid({ fanbases }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = normalizeSearchValue(query.trim());
  const visibleFanbases = useMemo(() => (
    fanbases.filter((fanbase) => {
      if (!normalizedQuery) return true;

      return [fanbase.name, fanbase.kpopGroup].some((value) => (
        normalizeSearchValue(value).includes(normalizedQuery)
      ));
    })
  ), [fanbases, normalizedQuery]);

  return (
    <>
      <div className="mt-8 max-w-xl">
        <label className="block text-xs font-semibold uppercase tracking-[0.13em] text-[#823038]" htmlFor="fanbase-search">
          Buscar comunidad
        </label>
        <div className="relative mt-2">
          <input
            aria-describedby="fanbase-search-result"
            className="h-12 w-full border border-[#0D1821]/35 bg-white py-3 pl-11 pr-20 text-sm text-[#0D1821] outline-none transition placeholder:text-[#68747B] focus:border-[#823038] focus:ring-2 focus:ring-[#823038]/20"
            id="fanbase-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscá por nombre o grupo"
            type="search"
            value={query}
          />
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#823038]">
            <SearchIcon />
          </span>
          {query ? (
            <button
              aria-label="Limpiar búsqueda"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-semibold text-[#823038] transition hover:text-[#0D1821] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#823038]"
              onClick={() => setQuery("")}
              type="button"
            >
              Limpiar
            </button>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-[#68747B]" id="fanbase-search-result" role="status">
          {normalizedQuery
            ? `${visibleFanbases.length} fanbase${visibleFanbases.length === 1 ? "" : "s"} encontrada${visibleFanbases.length === 1 ? "" : "s"}.`
            : `${fanbases.length} fanbase${fanbases.length === 1 ? "" : "s"} disponibles.`}
        </p>
      </div>

      {visibleFanbases.length === 0 ? (
        <div className="mt-8 border border-dashed border-[#823038]/40 bg-[#FFF7FB] px-6 py-10 text-center">
          <p className="text-base font-semibold text-[#0D1821]">No se encontraron fanbases.</p>
          <p className="mt-2 text-sm text-[#68747B]">Probá con otro nombre o grupo de K-pop.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleFanbases.map((fanbase) => (
            <article
              className="group overflow-hidden border border-[#0D1821]/25 bg-[#EEEEEE] shadow-[0_18px_32px_-28px_rgba(13,24,33,0.7)] transition duration-300 hover:-translate-y-1 hover:border-[#823038] hover:shadow-[0_24px_38px_-25px_rgba(13,24,33,0.72)]"
              key={fanbase.id}
            >
              <Link
                aria-label={`Conocer la fanbase de ${fanbase.kpopGroup}`}
                className="block overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[#823038]"
                href={`/fanbases/${fanbase.id}`}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[#0D1821]">
                  <Image
                    alt={`Imagen temporal de la fanbase de ${fanbase.kpopGroup}`}
                    className="object-cover object-[78%_85%] grayscale transition duration-500 group-hover:scale-105 group-hover:grayscale-0"
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    src={DEFAULT_FANBASE_IMAGE}
                  />
                </div>
              </Link>

              <div className="border-t border-[#0D1821]/20 px-5 py-5 text-center">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-[#823038]">Fanbase</p>
                <h2 className="mt-2 text-xl text-[#0D1821]">{fanbase.kpopGroup}</h2>
                <p className="mx-auto mt-3 max-w-xs text-xs leading-5 text-[#50606B]">
                  {fanbase.description || `Comunidad de fans de ${fanbase.kpopGroup} que organiza fanprojects.`}
                </p>
                <Link
                  className="mt-5 inline-flex rounded-full border border-[#0D1821]/60 px-4 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-[#0D1821] transition hover:border-[#823038] hover:bg-[#823038] hover:text-[#EEEEEE] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#823038]"
                  href={`/fanbases/${fanbase.id}`}
                >
                  Conocer comunidad
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
