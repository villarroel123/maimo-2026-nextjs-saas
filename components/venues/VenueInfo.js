"use client";

import { useEffect, useState } from "react";
import { loadPlacesLibrary } from "@/lib/google/places-loader";

const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function VenueInfo({ placeId = "", manualName = "" }) {
  const [details, setDetails] = useState(null);

  useEffect(() => {
    if (!placeId || !googleMapsKey) return;

    let active = true;
    loadPlacesLibrary(googleMapsKey)
      .then(async ({ Place }) => {
        const place = new Place({ id: placeId });
        await place.fetchFields({ fields: ["displayName", "formattedAddress"] });
        if (active) {
          setDetails({ name: place.displayName || "Recinto", address: place.formattedAddress || "" });
        }
      })
      .catch(() => {
        if (active) setDetails(null);
      });

    return () => { active = false; };
  }, [placeId]);

  if (!placeId && !manualName) return null;

  return (
    <div className="mt-2 text-sm text-[#8A5468]">
      <p>Recinto: <span className="font-semibold text-[#5C1F3A]">{details?.name || manualName || "Recinto vinculado a Google Maps"}</span></p>
      {details?.address ? <p className="mt-1">{details.address}</p> : null}
      {details ? <p className="mt-1 text-[11px]">Datos de Google Maps</p> : null}
    </div>
  );
}
