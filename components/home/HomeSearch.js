"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

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

function ResultGroup({ label, results }) {
  if (results.length === 0) return null;

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#823038]">{label}</p>
      <div className="mt-3 space-y-2">
        {results.map((result) => (
          <Link
            className="group flex items-center justify-between gap-4 border border-[#0D1821]/15 bg-white px-4 py-3 transition hover:border-[#823038] hover:bg-[#FFF7FB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#823038]"
            href={result.href}
            key={result.key}
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-[#0D1821] group-hover:text-[#823038]">
                {result.title}
              </span>
              {result.subtitle ? (
                <span className="mt-1 block truncate text-xs text-[#68747B]">{result.subtitle}</span>
              ) : null}
            </span>
            <span aria-hidden="true" className="shrink-0 text-lg text-[#823038]">→</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function HomeSearch({ searchData }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = normalizeSearchValue(query.trim());
  const results = useMemo(() => {
    if (!normalizedQuery) {
      return { concerts: [], fanprojects: [], fanbases: [] };
    }

    const matches = (values) => values.some((value) => (
      normalizeSearchValue(value).includes(normalizedQuery)
    ));

    return {
      concerts: searchData.concerts
        .filter((concert) => matches([concert.title, concert.country, concert.date]))
        .slice(0, 4),
      fanprojects: searchData.fanprojects
        .filter((fanproject) => matches([fanproject.title, fanproject.description, fanproject.concertTitle]))
        .slice(0, 4),
      fanbases: searchData.fanbases
        .filter((fanbase) => matches([fanbase.name, fanbase.kpopGroup]))
        .slice(0, 4),
    };
  }, [normalizedQuery, searchData]);

  const resultCount = results.concerts.length + results.fanprojects.length + results.fanbases.length;

  return (
    <section className="bg-[#EEEEEE] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#823038]">Explorar Narabi</p>
          <h2 className="mt-2 text-[#0D1821]">Encontrá lo que buscás</h2>
          <p className="mt-2 text-sm leading-6 text-[#50606B]">
            Buscá conciertos, fanprojects o fanbases desde un solo lugar.
          </p>
        </div>

        <div className="relative mt-5 max-w-2xl">
          <label className="sr-only" htmlFor="home-search">Buscar en Narabi</label>
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#823038]">
            <SearchIcon />
          </span>
          <input
            aria-describedby="home-search-status"
            className="h-13 w-full border border-[#0D1821]/35 bg-white py-3 pl-11 pr-20 text-sm text-[#0D1821] outline-none transition placeholder:text-[#68747B] focus:border-[#823038] focus:ring-2 focus:ring-[#823038]/20"
            id="home-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ej.: BTS, mosaico, ARMY..."
            type="search"
            value={query}
          />
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

        <p className="mt-2 text-xs text-[#68747B]" id="home-search-status" role="status">
          {normalizedQuery
            ? `${resultCount} resultado${resultCount === 1 ? "" : "s"} encontrado${resultCount === 1 ? "" : "s"}.`
            : "Escribí para buscar en toda la comunidad."}
        </p>

        {normalizedQuery ? (
          resultCount > 0 ? (
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <ResultGroup label="Conciertos" results={results.concerts} />
              <ResultGroup label="Fanprojects" results={results.fanprojects} />
              <ResultGroup label="Fanbases" results={results.fanbases} />
            </div>
          ) : (
            <div className="mt-6 border border-dashed border-[#823038]/40 bg-[#FFF7FB] px-6 py-8 text-center">
              <p className="font-semibold text-[#0D1821]">No se encontraron coincidencias.</p>
              <p className="mt-2 text-sm text-[#68747B]">Probá con otro nombre, grupo o fanproject.</p>
            </div>
          )
        ) : null}
      </div>
    </section>
  );
}
