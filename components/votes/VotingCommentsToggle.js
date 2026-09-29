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
      aria-expanded={isOpen}
      aria-label={isOpen ? "Cerrar comentarios" : "Abrir comentarios"}
      className="inline-flex size-7 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      onClick={toggleComments}
      title={isOpen ? "Cerrar comentarios" : "Abrir comentarios"}
      type="button"
    >
      <CommentIcon color={isOpen ? "#FF9FD6" : "#FFFFFF"} />
      {commentCount ? <span className="sr-only">{commentCount} comentarios</span> : null}
    </button>
  );
}
