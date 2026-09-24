let placesLibraryPromise;

export function loadPlacesLibrary(apiKey) {
  if (typeof window === "undefined" || !apiKey) {
    return Promise.reject(new Error("Google Places no está configurado."));
  }

  if (window.google?.maps?.importLibrary) {
    return window.google.maps.importLibrary("places");
  }

  if (!placesLibraryPromise) {
    placesLibraryPromise = new Promise((resolve, reject) => {
      const callbackName = "__narabiGoogleMapsReady";
      const script = document.createElement("script");
      const params = new URLSearchParams({
        key: apiKey,
        loading: "async",
        libraries: "places",
        callback: callbackName,
        language: "es",
        v: "weekly",
      });

      window[callbackName] = () => {
        delete window[callbackName];
        resolve(window.google.maps.importLibrary("places"));
      };

      script.async = true;
      script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
      script.onerror = () => {
        delete window[callbackName];
        script.remove();
        placesLibraryPromise = null;
        reject(new Error("No se pudo cargar Google Places."));
      };
      document.head.appendChild(script);
    });
  }

  return placesLibraryPromise;
}
