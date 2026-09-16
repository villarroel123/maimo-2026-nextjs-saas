"use client";

import { useRef } from "react";

export default function HorizontalSlider({ children, label }) {
  const sliderRef = useRef(null);

  function scrollSlider(direction) {
    const slider = sliderRef.current;

    if (!slider) return;

    slider.scrollBy({
      behavior: "smooth",
      left: direction * slider.clientWidth * 0.85,
    });
  }

  return (
    <div>
      <div className="mb-3 flex justify-end gap-2">
        <button
          aria-label={`Desplazar ${label} hacia la izquierda`}
          className="grid size-9 place-items-center rounded-full border border-[#C9819C] bg-white text-lg font-semibold text-[#823038] transition hover:bg-[#F7CDE0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#823038]"
          onClick={() => scrollSlider(-1)}
          type="button"
        >
          <span aria-hidden="true">←</span>
        </button>
        <button
          aria-label={`Desplazar ${label} hacia la derecha`}
          className="grid size-9 place-items-center rounded-full border border-[#C9819C] bg-white text-lg font-semibold text-[#823038] transition hover:bg-[#F7CDE0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#823038]"
          onClick={() => scrollSlider(1)}
          type="button"
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <div
        aria-label={label}
        className="flex items-start snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-px pb-4 pt-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        ref={sliderRef}
        role="region"
        tabIndex="0"
      >
        {children}
      </div>
    </div>
  );
}
