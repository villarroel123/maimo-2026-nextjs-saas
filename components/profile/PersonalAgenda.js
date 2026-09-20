"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import FavoriteButton from "@/components/favorites/FavoriteButton";
import { useFavorites } from "@/components/favorites/FavoritesProvider";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const WEEKDAYS = ["D", "L", "M", "X", "J", "V", "S"];
const MONTH_INDEX = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  setiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
};

function parseConcertDate(value) {
  if (typeof value !== "string") return null;

  const match = value
    .trim()
    .toLocaleLowerCase("es-AR")
    .match(/(\d{1,2})\s+de\s+([a-záéíóúñ]+)\s+de\s+(\d{4})/i);

  if (!match) return null;

  const day = Number(match[1]);
  const month = MONTH_INDEX[match[2].normalize("NFD").replace(/[\u0300-\u036f]/g, "")];
  const year = Number(match[3]);

  if (!Number.isInteger(day) || month === undefined || !Number.isInteger(year)) {
    return null;
  }

  const date = new Date(year, month, day);
  return date.getMonth() === month && date.getDate() === day ? date : null;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function sameDay(first, second) {
  return first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate();
}

function getCountdown(date, now) {
  const eventDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const currentDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const difference = eventDay.getTime() - currentDay.getTime();
  const days = Math.round(difference / 86400000);

  if (days < 0) return "Evento finalizado";
  if (days === 0) return "Es hoy";
  if (days === 1) return "Falta 1 día";
  return `Faltan ${days} días`;
}

function escapeIcs(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\n/g, "\\n");
}

function formatIcsDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function downloadCalendarEvent(event) {
  const date = event.date;
  const nextDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Narabi//Mi agenda//ES",
    "BEGIN:VEVENT",
    `UID:${event.projectId}@narabi`,
    `DTSTART;VALUE=DATE:${formatIcsDate(date)}`,
    `DTEND;VALUE=DATE:${formatIcsDate(nextDate)}`,
    `SUMMARY:${escapeIcs(event.concertTitle)}`,
    `DESCRIPTION:${escapeIcs(`Fanprojects guardados: ${event.fanprojects.map((fanproject) => fanproject.title).join(", ")}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${event.concertTitle.toLocaleLowerCase().replace(/[^a-z0-9]+/gi, "-") || "concierto"}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getCalendarEvents(favorites) {
  const grouped = new Map();

  favorites.forEach((favorite) => {
    const date = parseConcertDate(favorite.concertDate);

    if (!date) return;

    const existing = grouped.get(favorite.projectId);

    if (existing) {
      existing.fanprojects.push(favorite);
      return;
    }

    grouped.set(favorite.projectId, {
      projectId: favorite.projectId,
      concertTitle: favorite.concertTitle || favorite.description || "Concierto",
      concertCountry: favorite.concertCountry || "",
      date,
      fanprojects: [favorite],
    });
  });

  return [...grouped.values()].sort((first, second) => first.date - second.date);
}

export default function PersonalAgenda({ initialFavorites }) {
  const { favorites, isLoading } = useFavorites();
  const [now, setNow] = useState(() => new Date());
  const initialById = useMemo(
    () => new Map(initialFavorites.map((favorite) => [favorite.id, favorite])),
    [initialFavorites],
  );
  const displayedFavorites = useMemo(() => {
    const source = isLoading
      ? initialFavorites
      : favorites.filter((favorite) => favorite.type === "fanproject");

    return source.map((favorite) => ({
      ...initialById.get(favorite.id),
      ...favorite,
    }));
  }, [favorites, initialById, initialFavorites, isLoading]);
  const events = useMemo(() => getCalendarEvents(displayedFavorites), [displayedFavorites]);
  const firstUpcomingEvent = events.find((event) => event.date >= startOfMonth(now)) || events[0];
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(firstUpcomingEvent?.date || new Date()));

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarCells = Array.from({ length: firstWeekday + daysInMonth }, (_, index) => (
    index < firstWeekday ? null : index - firstWeekday + 1
  ));
  const eventsInMonth = events.filter((event) => (
    event.date.getFullYear() === year && event.date.getMonth() === month
  ));

  return (
    <section className="mt-10" id="agenda">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C0567A]">Tu planificación</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#5C1F3A]">Mi agenda</h2>
          <p className="mt-2 text-sm text-[#8A5468]">Tus fanprojects guardados, fechas y recordatorios en un solo lugar.</p>
        </div>
        <span className="rounded-full bg-[#FFE4F3] px-3 py-1.5 text-xs font-semibold text-[#823038]">
          {displayedFavorites.length} guardado{displayedFavorites.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <article className="rounded-3xl border border-[#F2B8CF] bg-[#FFE4F3] p-5 shadow-[0_12px_30px_rgba(130,48,56,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <button
              aria-label="Mes anterior"
              className="grid size-8 place-items-center rounded-full text-lg text-[#823038] transition hover:bg-white"
              onClick={() => setVisibleMonth((value) => new Date(value.getFullYear(), value.getMonth() - 1, 1))}
              type="button"
            >
              ‹
            </button>
            <p className="text-sm font-bold text-[#5C1F3A]">{MONTHS[month]} {year}</p>
            <button
              aria-label="Mes siguiente"
              className="grid size-8 place-items-center rounded-full text-lg text-[#823038] transition hover:bg-white"
              onClick={() => setVisibleMonth((value) => new Date(value.getFullYear(), value.getMonth() + 1, 1))}
              type="button"
            >
              ›
            </button>
          </div>
          <div className="mt-4 rounded-2xl bg-white p-3">
            <div className="grid grid-cols-7 text-center text-[10px] font-bold uppercase text-[#A36A7C]">
              {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-y-1 text-center text-xs">
              {calendarCells.map((day, index) => {
                const date = day ? new Date(year, month, day) : null;
                const hasEvent = date && events.some((event) => sameDay(event.date, date));
                const isToday = date && sameDay(date, now);

                return (
                  <span
                    className={`mx-auto grid size-7 place-items-center rounded-full ${
                      hasEvent
                        ? "bg-[#823038] font-bold text-white"
                        : isToday
                          ? "border border-[#823038] font-semibold text-[#823038]"
                          : "text-[#5C1F3A]"
                    }`}
                    key={`${index}-${day || "empty"}`}
                  >
                    {day || ""}
                  </span>
                );
              })}
            </div>
          </div>
        </article>

        <div className="space-y-3">
          {eventsInMonth.length ? eventsInMonth.map((event) => (
            <article className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#F2B8CF] bg-white p-4 shadow-[0_8px_20px_rgba(130,48,56,0.05)]" key={event.projectId}>
              <time className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#FFE4F3] text-center text-sm font-bold leading-4 text-[#823038]" dateTime={event.date.toISOString()}>
                {event.date.getDate()}<span className="text-[9px] uppercase">{MONTHS[event.date.getMonth()].slice(0, 3)}</span>
              </time>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[#5C1F3A]">{event.concertTitle}</p>
                <p className="mt-0.5 text-xs text-[#8A5468]">{event.concertCountry || event.fanprojects.length + " fanproject(s) guardados"}</p>
                <p className="mt-1 text-xs font-semibold text-[#823038]">{getCountdown(event.date, now)}</p>
              </div>
              <button
                className="rounded-full border border-[#823038] px-3 py-1.5 text-xs font-bold text-[#823038] transition hover:bg-[#823038] hover:text-white"
                onClick={() => downloadCalendarEvent(event)}
                type="button"
              >
                Agregar al calendario
              </button>
            </article>
          )) : (
            <div className="rounded-2xl border border-dashed border-[#EAB0C8] bg-white p-5 text-sm text-[#8A5468]">
              No hay conciertos guardados para este mes. Elegí otro mes o guardá un fanproject para verlo acá.
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-semibold text-[#5C1F3A]">Fanprojects guardados</h3>
        {isLoading ? (
          <p className="mt-4 text-sm text-[#8A5468]">Cargando tus guardados...</p>
        ) : displayedFavorites.length ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {displayedFavorites.map((favorite) => (
              <article className="flex min-w-0 flex-col justify-between rounded-2xl border border-[#F2B8CF] bg-white p-4" key={favorite.id}>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#C0567A]">
                    {favorite.concertTitle || "Concierto"}
                  </p>
                  <h4 className="mt-2 break-words text-lg font-semibold text-[#5C1F3A]">{favorite.title}</h4>
                  <p className="mt-2 text-xs text-[#8A5468]">{favorite.concertDate || "Fecha a confirmar"}</p>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Link className="text-sm font-semibold text-[#823038] hover:underline" href={favorite.href}>
                    Ver detalle
                  </Link>
                  <FavoriteButton target={favorite} />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-[#EAB0C8] bg-white p-5 text-sm text-[#8A5468]">
            Todavía no guardaste fanprojects. Explorá los conciertos para crear tu agenda.
          </div>
        )}
      </div>
    </section>
  );
}
