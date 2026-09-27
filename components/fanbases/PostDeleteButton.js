"use client";

export default function PostDeleteButton({ title }) {
  return (
    <button
      className="text-xs font-semibold text-[#A33549] transition hover:text-[#5C1F3A]"
      onClick={(event) => {
        if (!window.confirm(`¿Eliminar la publicación «${title}»?`)) event.preventDefault();
      }}
      type="submit"
    >
      Eliminar
    </button>
  );
}
