import Image from "next/image";
import Link from "next/link";
import { getConcertImage } from "@/lib/projects/concert-image";

function formatActivityDate(value) {
  if (!value) return "Participación registrada";

  try {
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "America/Argentina/Buenos_Aires",
    }).format(new Date(value));
  } catch {
    return "Participación registrada";
  }
}

export default function ParticipationHistory({ events }) {
  return (
    <section
      className="relative left-1/2 mt-10 w-screen -translate-x-1/2 bg-[#FFE4F3] bg-cover bg-center py-8 sm:py-10"
      id="participaciones"
      style={{ backgroundImage: 'url("/items/participation-events-bg.png")' }}
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-[#5C1F3A] sm:text-3xl">Eventos en los que participaste</h2>

        {events.length ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {events.map((event) => {
              const image = getConcertImage({ Titulo: event.title, imagen: event.image });
              const primaryActivity = event.activities[0];
              const remainingActivities = Math.max(event.activities.length - 1, 0);

              return (
                <Link
                  className="group overflow-hidden rounded-2xl border border-[#F2B8CF] bg-[#FFE4F3] shadow-[0_10px_24px_rgba(130,48,56,0.07)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_30px_rgba(130,48,56,0.12)]"
                  href={`/projects/${event.projectId}`}
                  key={event.projectId}
                >
                  <article>
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#FFE4F3]">
                      <Image
                        alt={`Concierto de ${event.group}`}
                        className="object-cover transition duration-300 group-hover:scale-105"
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                        src={image}
                        unoptimized={/^https?:\/\//i.test(image)}
                      />
                      <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
                        <span className="rounded-full bg-[#FFF7FB]/95 px-2.5 py-1 text-[10px] font-semibold text-[#823038] shadow-sm">
                          {primaryActivity?.label || "Participaste"}
                        </span>
                        {remainingActivities ? (
                          <span className="flex size-6 items-center justify-center rounded-full bg-[#823038] text-[10px] font-semibold text-white shadow-sm">
                            +{remainingActivities}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="border-t border-[#F2B8CF] bg-[#FFF7FB] px-4 py-3">
                      <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-[#C0567A]">{event.group}</p>
                      <h3 className="mt-1 truncate text-sm font-semibold text-[#5C1F3A]">{event.title}</h3>
                      <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-[#8A5468]">
                        <span className="truncate">{event.country} · {event.date}</span>
                        <span className="shrink-0">{formatActivityDate(event.latestAt)}</span>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-dashed border-[#EAB0C8] bg-[#FFF7FB] p-7 text-center">
            <p className="text-base font-semibold text-[#5C1F3A]">Todavía no registramos participaciones.</p>
            <p className="mt-2 text-sm text-[#8A5468]">Cuando votes, comentes o propongas una idea, el evento aparecerá acá.</p>
            <Link className="mt-5 inline-flex rounded-full bg-[#823038] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#5C1F3A]" href="/votaciones">Ver votaciones</Link>
          </div>
        )}
      </div>
    </section>
  );
}
