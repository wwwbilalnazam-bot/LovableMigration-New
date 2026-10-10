// Central site config. Set VITE_SITE_URL (no trailing slash) at build time, e.g. https://your-domain.com
const env = (import.meta as any).env ?? {};

export const SITE = {
  name: "Lovable Cloud to Supabase Migration Tool",
  shortName: "Lovable → Supabase",
  url: String(env.VITE_SITE_URL || "https://example.com").replace(/\/+$/, ""),
  urlIsPlaceholder: !env.VITE_SITE_URL,
  gaId: String(env.VITE_GA_ID || ""), // e.g. G-XXXXXXXXXX
  gscToken: String(env.VITE_GSC_VERIFICATION || ""), // Search Console meta-tag verification value
  published: "2026-10-10",
  modified: "2026-10-10",
  author: {
    name: "The Migrator Team", // TODO: replace with your name
    role: "Maintainers of the free Lovable Cloud to Supabase Migrator",
    bio: "We build and maintain a free, browser-based tool that moves Lovable Cloud projects to a Supabase project you own. These guides document the same steps the tool automates.",
  },
  // Minimum number of successful migrations before the public counter is shown on the homepage.
  counterThreshold: 50,
};

export const abs = (path: string) => `${SITE.url}${path === "/" ? "" : path}`;
export const ogImage = (name: string) => `${SITE.url}/og/${name}.png`;
