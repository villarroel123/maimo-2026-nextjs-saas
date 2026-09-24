const CONCERT_IMAGES = {
  ARIRANG: "/items/bts_tour.jpg",
  BTS: "/items/bts_tour.jpg",
  AESPA: "/items/aespa_tour.jpg",
  SEVENTEEN: "/items/svt_tour.webp",
  SVT: "/items/svt_tour.webp",
  STRAYCITY: "/items/straycity_tour.webp",
  NEXZ: "/items/nexz_tour.webp",
};

const PREVIOUS_IMAGES = new Set([
  "/items/arirang.png",
  "/items/nexz.png",
  "/items/straycity.jpg",
  "/projects/placeholder.jpg",
]);

export function getConcertImage(project) {
  const title = typeof project?.Titulo === "string" ? project.Titulo.trim().toUpperCase() : "";
  const currentImage = typeof project?.imagen === "string" ? project.imagen.trim() : "";
  const matchingImage = CONCERT_IMAGES[title];

  if (matchingImage && (!currentImage || PREVIOUS_IMAGES.has(currentImage))) {
    return matchingImage;
  }

  return currentImage || "/projects/placeholder.jpg";
}
