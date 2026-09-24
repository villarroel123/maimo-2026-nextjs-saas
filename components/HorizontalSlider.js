"use client";

import { useRef } from "react";
import CircleArrowIcon from "@/components/icons/CircleArrowIcon";

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
      <div className="mb-3 flex justify-end">
        <div className="flex items-center gap-1 rounded-full border border-[#823038]/35 bg-[#EEEEEE] p-1 shadow-[0_8px_20px_-14px_rgba(13,24,33,0.75)]">
          <button
            aria-label={`Desplazar ${label} hacia la izquierda`}
            className="grid size-10 place-items-center rounded-full text-[#823038] transition duration-200 hover:scale-105 hover:bg-[#823038] hover:text-[#EEEEEE] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#823038]"
            onClick={() => scrollSlider(-1)}
            type="button"
          >
            <CircleArrowIcon direction="left" className="size-7" />
          </button>
          <button
            aria-label={`Desplazar ${label} hacia la derecha`}
            className="grid size-10 place-items-center rounded-full text-[#823038] transition duration-200 hover:scale-105 hover:bg-[#823038] hover:text-[#EEEEEE] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#823038]"
            onClick={() => scrollSlider(1)}
            type="button"
          >
            <CircleArrowIcon direction="right" className="size-7" />
          </button>
        </div>
      </div>

      <div
        aria-label={label}
        className="flex items-start snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-px pb-4 pt-px [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden"
        ref={sliderRef}
        role="region"
        tabIndex="0"
      >
        {children}
      </div>
    </div>
  );
}
