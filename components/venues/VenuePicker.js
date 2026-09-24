"use client";

import { useEffect, useRef, useState } from "react";
import { loadPlacesLibrary } from "@/lib/google/places-loader";

const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function VenuePicker({ initialPlaceId = "", initialManualName = "" }) {
  const autocompleteHost = useRef(null);
  const autocompleteElement = useRef(null);
  const selectionVersion = useRef(0);
  const [placeId, setPlaceId] = useState(initialPlaceId);
  const [manualName, setManualName] = useState(initialManualName);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!googleMapsKey) return;

    let active = true;
    let element;

    async function handlePlaceSelect(event) {
      const place = event.placePrediction?.toPlace();
      if (!place?.id) return;

      const currentVersion = ++selectionVersion.current;
      setPlaceId(place.id);
      setManualName("");
      setSelectedPlace({ name: "Recinto seleccionado", address: "" });
      setLoadError("");

      try {
        await place.fetchFields({ fields: ["displayName", "formattedAddress"] });
        if (active && selectionVersion.current === currentVersion) {
          setSelectedPlace({
            name: place.displayName || "Recinto seleccionado",
            address: place.formattedAddress || "",
          });
        }
      } catch {
        if (active && selectionVersion.current === currentVersion) {
          setLoadError("Se seleccionó el recinto, pero no se pudieron cargar sus datos.");
        }
      }
    }

    loadPlacesLibrary(googleMapsKey)
      .then(async ({ Place, PlaceAutocompleteElement }) => {
        if (!active || !autocompleteHost.current) return;

        element = new PlaceAutocompleteElement({
          description: "Buscar un estadio, teatro o sala de conciertos",
          requestedLanguage: "es",
        });
        element.className = "venue-autocomplete";
        element.placeholder = "Escribí el nombre del estadio o teatro";
        element.addEventListener("gmp-select", handlePlaceSelect);
        autocompleteHost.current.appendChild(element);
        autocompleteElement.current = element;

        if (initialPlaceId) {
          const currentVersion = selectionVersion.current;
          try {
            const initialPlace = new Place({ id: initialPlaceId });
            await initialPlace.fetchFields({ fields: ["displayName", "formattedAddress"] });
            if (active && selectionVersion.current === currentVersion) {
              setSelectedPlace({
                name: initialPlace.displayName || "Recinto seleccionado",
                address: initialPlace.formattedAddress || "",
              });
            }
          } catch {
            if (active && selectionVersion.current === currentVersion) {
              setLoadError("No se pudieron cargar los datos del recinto guardado.");
            }
          }
        }
      })
      .catch(() => {
        if (active) setLoadError("No se pudo iniciar Google Places. Revisá la clave y los dominios autorizados.");
      });

    return () => {
      active = false;
      element?.removeEventListener("gmp-select", handlePlaceSelect);
      element?.remove();
      if (autocompleteElement.current === element) autocompleteElement.current = null;
    };
  }, [initialPlaceId]);

  function clearPlace() {
    selectionVersion.current += 1;
    setPlaceId("");
    setManualName("");
    setSelectedPlace(null);
    setLoadError("");
    if (autocompleteElement.current) autocompleteElement.current.value = "";
  }

  return (
    <div className="space-y-3">
      <p className="block text-xs font-semibold uppercase tracking-wider text-[#8A5468]">Estadio, teatro o sala</p>
      <input name="venuePlaceId" type="hidden" value={placeId} />
      <input name="venueManualName" type="hidden" value={manualName} />

      {googleMapsKey ? (
        <div className="rounded-lg border border-[#F2B8CF] bg-white text-[#5C1F3A] transition-colors focus-within:border-[#C0567A]" ref={autocompleteHost} />
      ) : (
        <p className="rounded-lg border border-[#F2B8CF] bg-white px-4 py-3 text-xs text-[#8A5468]">
          Para buscar recintos, configurá NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
        </p>
      )}

      {placeId || manualName ? (
        <div className="rounded-lg border border-[#F2B8CF] bg-white px-4 py-3 text-sm text-[#5C1F3A]">
          <p className="font-semibold">{selectedPlace?.name || manualName || "Recinto vinculado a Google Maps"}</p>
          {selectedPlace?.address ? <p className="mt-1 text-xs text-[#8A5468]">{selectedPlace.address}</p> : null}
          {placeId && selectedPlace ? <p className="mt-2 text-[11px] text-[#8A5468]">Datos de Google Maps</p> : null}
          <button className="mt-2 text-xs font-semibold text-[#823038] hover:underline" onClick={clearPlace} type="button">
            Quitar recinto
          </button>
        </div>
      ) : null}

      {loadError ? <p className="text-xs text-[#823038]" role="status">{loadError}</p> : null}

      <p className="text-xs text-[#8A5468]">El recinto se comparte con todos los fanprojects de este concierto.</p>
    </div>
  );
}
