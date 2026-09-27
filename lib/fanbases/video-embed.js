const YOUTUBE_ID = /^[a-zA-Z0-9_-]{11}$/;
const VIMEO_ID = /^\d+$/;

export function getVideoEmbedUrl(link) {
  if (typeof link !== "string" || !link.trim()) return null;

  let url;
  try {
    url = new URL(link);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.toLowerCase();
  const path = url.pathname.split("/").filter(Boolean);

  if (host === "youtu.be" || host === "www.youtu.be") {
    return YOUTUBE_ID.test(path[0] || "") ? `https://www.youtube-nocookie.com/embed/${path[0]}` : null;
  }

  if (["youtube.com", "www.youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"].includes(host)) {
    const videoId = path[0] === "watch" ? url.searchParams.get("v") :
      ["shorts", "live", "embed"].includes(path[0]) ? path[1] : null;
    return YOUTUBE_ID.test(videoId || "") ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
  }

  if (host === "vimeo.com" || host === "www.vimeo.com" || host === "player.vimeo.com") {
    const videoId = path[0] === "video" ? path[1] : path[0];
    return VIMEO_ID.test(videoId || "") ? `https://player.vimeo.com/video/${videoId}` : null;
  }

  return null;
}
