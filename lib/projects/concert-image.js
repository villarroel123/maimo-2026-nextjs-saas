const CONCERT_IMAGES = {
  ARIRANG: "/items/BTS_Arirang_Tour_logo.jpg",
  BTS: "/items/BTS_Arirang_Tour_logo.jpg",
  AESPA: "/items/static_vip_1280x1280_aespa_2023_national_1684345938.jpg",
  SEVENTEEN: "/items/svt.png",
  SVT: "/items/svt.png",
  STRAYCITY: "/items/straycity_tour.webp",
  NEXZ: "/items/nexz_tour.webp",
};

const PREVIOUS_IMAGES = new Set([
  "/items/arirang.png",
  "/items/bts_tour.jpg",
  "/items/aespa_tour.jpg",
  "/items/svt_tour.webp",
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
