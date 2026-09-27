"use client";

import { Children, useState } from "react";

const INITIAL_POST_COUNT = 3;

export default function FanbasePostsDisplay({ count, composer, children }) {
  const [showAll, setShowAll] = useState(false);
  const postCards = Children.toArray(children);
  const visiblePosts = showAll ? postCards : postCards.slice(0, INITIAL_POST_COUNT);

  return (
    <section className="mt-10 scroll-mt-24" id="publicaciones">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#5C1F3A] sm:text-3xl">Publicaciones de la fanbase</h2>
          <p className="mt-2 text-sm text-[#8A5468]">Avisos, merch y tutoriales compartidos por el equipo.</p>
        </div>
        <div className="flex items-center gap-3">
          {count > INITIAL_POST_COUNT ? (
            <button
              aria-controls="fanbase-post-list"
              aria-expanded={showAll}
              className="text-sm font-semibold text-[#823038] underline underline-offset-2 transition hover:text-[#5C1F3A]"
              onClick={() => setShowAll((current) => !current)}
              type="button"
            >
              {showAll ? "Ver menos" : "Ver más"}
            </button>
          ) : null}
        </div>
      </div>

      {composer}

      {count === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-[#EAB0C8] bg-white p-5 text-sm text-[#8A5468]">
          Esta fanbase todavía no tiene publicaciones.
        </p>
      ) : (
        <div className="mt-6 grid gap-4" id="fanbase-post-list">
          {visiblePosts}
        </div>
      )}
    </section>
  );
}
