export const siteConfig = {
  name: "M3E",
  tagline: "Design & Technology Blog",
  description: "A personal blog exploring the intersection of design, technology, and thoughtful living. Apple News editorial aesthetics meet Brutalist attitude.",
  url: "https://m3e.blog",
  copyright: "M3E",
  author: {
    name: "Author Name",
  },
  social: {
    github: "/about",
  },
  music: {
    mode: (import.meta.env.PUBLIC_MUSIC_MODE || "api") as "api" | "local",
    metingApi: import.meta.env.PUBLIC_MUSIC_METING_API || "https://api.i-meto.com/meting/api",
    type: (import.meta.env.PUBLIC_MUSIC_TYPE || "album") as "playlist" | "album" | "song" | "artist",
    id: import.meta.env.PUBLIC_MUSIC_ID || "398973",
    server: import.meta.env.PUBLIC_MUSIC_SERVER || "netease",
  },
  defaultLanguage: "en",
};

export function getMusicApiEndpoint(): string {
  if (siteConfig.music?.mode !== 'api') return '';
  const { metingApi, server, type, id } = siteConfig.music;
  return `${metingApi}?server=${server}&type=${type}&id=${id}`;
}
