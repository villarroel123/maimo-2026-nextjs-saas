export const DEFAULT_FANPROJECT_IMAGE = "/items/hero.jpg";

export function getFanprojectImage(fanproject, project) {
  const image = fanproject?.imagen || project?.imagen;

  return typeof image === "string" && image.trim()
    ? image.trim()
    : DEFAULT_FANPROJECT_IMAGE;
}
