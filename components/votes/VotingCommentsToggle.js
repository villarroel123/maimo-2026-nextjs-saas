"use client";

import { useState } from "react";
import CommentIcon from "@/components/icons/CommentIcon";

export default function VotingCommentsToggle({ commentCount, panelId }) {
  const [isOpen, setIsOpen] = useState(false);

  function toggleComments() {
    const panel = document.getElementById(panelId);

    if (!panel) {
      return;
    }

    const shouldShow = panel.hasAttribute("hidden");

    if (shouldShow) {
      panel.removeAttribute("hidden");
      setIsOpen(true);
      panel.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    panel.setAttribute("hidden", "");
    setIsOpen(false);
  }

  return (
    <button
      aria-controls={panelId}
      aria-label="Abrir comentarios"
      className={`ml-1 inline-flex size-10 items-center justify-center rounded-full transition hover:bg-[#FFF7FB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#823038] ${
        isOpen ? "text-[#0D1821]" : "text-[#823038] hover:text-[#0D1821]"
      }`}
      onClick={toggleComments}
      title="Abrir comentarios"
      type="button"
    >
      <CommentIcon className="size-4" />
      {commentCount ? <span className="sr-only">{commentCount} comentarios</span> : null}
    </button>
  );
}
