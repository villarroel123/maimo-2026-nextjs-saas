'use client';

import { useState } from "react";

export default function ItemForm({ action, initialData = {}, submitLabel = "Guardar", useFirebaseStorage = false }) {
  const [loading, setLoading] = useState(false);

  return (
    <form
      action={async (formData) => {
        setLoading(true);
        try {
          await action(formData);
        } finally {
          setLoading(false);
        }
      }}
      className="grid gap-4 border border-zinc-800 bg-zinc-950 p-4 sm:p-6"
    >
      {/* Título */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400" htmlFor="title">
          Título *
        </label>
        <input
          className="h-10 w-full border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 focus:border-cyan-400 focus:outline-none"
          defaultValue={initialData.title || ""}
          id="title"
          name="title"
          required
          type="text"
          placeholder="Ej: Entrada campo delantero"
        />
      </div>

      {/* Grid interno adaptativo con lg:grid-cols-2 para evitar colapsos tempranos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400" htmlFor="artist">
            Artista / Banda
          </label>
          <input
            className="h-10 w-full border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 focus:border-cyan-400 focus:outline-none"
            defaultValue={initialData.artist || ""}
            id="artist"
            name="artist"
            type="text"
            placeholder="Ej: Coldplay"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400" htmlFor="venue">
            Estadio / Recinto
          </label>
          <input
            className="h-10 w-full border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 focus:border-cyan-400 focus:outline-none"
            defaultValue={initialData.venue || ""}
            id="venue"
            name="venue"
            type="text"
            placeholder="Ej: River Plate"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400" htmlFor="eventDate">
            Fecha del evento
          </label>
          <input
            className="h-10 w-full border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 focus:border-cyan-400 focus:outline-none"
            defaultValue={initialData.eventDate || ""}
            id="eventDate"
            name="eventDate"
            type="text"
            placeholder="Ej: 15 de Noviembre"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400" htmlFor="sector">
            Sector / Ubicación
          </label>
          <input
            className="h-10 w-full border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 focus:border-cyan-400 focus:outline-none"
            defaultValue={initialData.sector || ""}
            id="sector"
            name="sector"
            type="text"
            placeholder="Ej: Sívori Alta"
          />
        </div>
      </div>

      {/* Precios */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400" htmlFor="originalPrice">
            Precio Original ($)
          </label>
          <input
            className="h-10 w-full border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 focus:border-cyan-400 focus:outline-none"
            defaultValue={initialData.originalPrice || ""}
            id="originalPrice"
            name="originalPrice"
            type="number"
            step="0.01"
            placeholder="0.00"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400" htmlFor="resalePrice">
            Precio de Reventa ($)
          </label>
          <input
            className="h-10 w-full border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 focus:border-cyan-400 focus:outline-none"
            defaultValue={initialData.resalePrice || ""}
            id="resalePrice"
            name="resalePrice"
            type="number"
            step="0.01"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Motivo de venta */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400" htmlFor="reasonForSale">
          Motivo de la venta
        </label>
        <input
          className="h-10 w-full border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 focus:border-cyan-400 focus:outline-none"
          defaultValue={initialData.reasonForSale || ""}
          id="reasonForSale"
          name="reasonForSale"
          type="text"
          placeholder="Ej: No puedo asistir por viaje"
        />
      </div>

      {/* Estado y Publicado */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 items-center">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400" htmlFor="status">
            Estado
          </label>
          <select
            className="h-10 w-full border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 focus:border-cyan-400 focus:outline-none"
            defaultValue={initialData.status || "disponible"}
            id="status"
            name="status"
          >
            <option value="disponible">Disponible</option>
            <option value="reservado">Reservado</option>
            <option value="vendido">Vendido</option>
          </select>
        </div>

        <div className="flex items-center gap-3 pt-5">
          <input
            className="h-4 w-4 accent-cyan-400"
            defaultChecked={initialData.published ?? true}
            id="published"
            name="published"
            type="checkbox"
          />
          <label className="text-sm text-zinc-300" htmlFor="published">
            Publicado visible
          </label>
        </div>
      </div>

      {/* Descripción general */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400" htmlFor="description">
          Descripción adicional
        </label>
        <textarea
          className="min-h-[90px] w-full border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-100 focus:border-cyan-400 focus:outline-none"
          defaultValue={initialData.description || ""}
          id="description"
          name="description"
          placeholder="Detalles extras..."
        />
      </div>

      {/* URL de Imagen */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400" htmlFor="imageUrl">
          URL de la Imagen del Ticket
        </label>
        <input
          className="h-10 w-full border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 focus:border-cyan-400 focus:outline-none"
          defaultValue={initialData.imageUrl || ""}
          id="imageUrl"
          name="imageUrl"
          type="url"
          placeholder="https://..."
        />
      </div>

      <button
        className="mt-2 inline-flex h-10 w-full items-center justify-center bg-cyan-500 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-400 disabled:opacity-50"
        disabled={loading}
        type="submit"
      >
        {loading ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}