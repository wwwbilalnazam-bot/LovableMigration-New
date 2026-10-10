// Build-time prerender: renders every public route to static HTML (full text in the page source),
// and writes sitemap.xml, robots.txt, llms.txt and a 1200x630 OG image per page.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

const root = process.cwd();
const dist = path.join(root, "dist");
const server = await import(pathToFileURL(path.join(root, "dist-server", "entry-server.js")).href);
const { render, allPages, noindexPages, guides, SITE } = server;

if (SITE.urlIsPlaceholder) {
  console.warn("\n⚠  VITE_SITE_URL is not set. Canonicals, sitemap and OG tags use https://example.com.\n   Set it before deploying, e.g. VITE_SITE_URL=https://your-domain.com npm run build\n");
}

const template = fs.readFileSync(path.join(dist, "index.html"), "utf8");

// Preload the main font (hashed file name from the build).
const assets = fs.readdirSync(path.join(dist, "assets"));
const font = assets.find((f) => /^inter-latin-wght-normal-.*\.woff2$/.test(f));
const fontTag = font ? `<link rel="preload" href="/assets/${font}" as="font" type="font/woff2" crossorigin>` : "";

// Keep an untouched client-only shell for /migrate and OAuth callbacks (served via rewrites, noindex).
const shell = template
  .replace("</head>", `${fontTag}\n<meta name="robots" content="noindex, nofollow">\n</head>`)
  .replace(/<title>.*?<\/title>/s, "<title>Lovable Cloud to Supabase Migrator</title>");
fs.writeFileSync(path.join(dist, "app-shell.html"), shell);

function page(url) {
  const { html, head } = render(url);
  const out = template
    .replace(/<title>.*?<\/title>/s, "")
    .replace("</head>", `${fontTag}\n${head}\n</head>`)
    .replace('<div id="root"></div>', `<div id="root">${html}</div>`);
  return out;
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

for (const p of allPages) {
  const file = p.path === "/" ? path.join(dist, "index.html") : path.join(dist, p.path, "index.html");
  write(file, page(p.path));
}
write(path.join(dist, "404.html"), page("/404"));
console.log(`Prerendered ${allPages.length} pages + 404`);

// ------------------------------------------------------------ OG images
const f400 = fs.readFileSync(path.join(root, "node_modules/@fontsource/inter/files/inter-latin-400-normal.woff"));
const f700 = fs.readFileSync(path.join(root, "node_modules/@fontsource/inter/files/inter-latin-700-normal.woff"));
const host = SITE.url.replace(/^https?:\/\//, "");
const h = (type, style, children, props = {}) => ({ type, props: { style, children, ...props } });

async function ogPng(label) {
  const size = label.length > 70 ? 54 : label.length > 45 ? 62 : 72;
  const tree = h(
    "div",
    { width: 1200, height: 630, boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, color: "#f1f5f9", fontFamily: "Inter", backgroundColor: "#070b14", backgroundImage: "radial-gradient(circle at 85% 0%, rgba(52,211,153,0.35), rgba(7,11,20,0) 55%)" },
    [
      h("div", { display: "flex", alignItems: "center" }, [
        h("div", { display: "flex", width: 56, height: 56, borderRadius: 14, backgroundColor: "rgba(52,211,153,0.15)", alignItems: "center", justifyContent: "center" }, [
          { type: "svg", props: { width: 30, height: 30, viewBox: "0 0 32 32", children: { type: "path", props: { d: "M18 4 7 18h8l-1 10 11-14h-8z", fill: "#34d399" } } } },
        ]),
        h("div", { marginLeft: 18, fontSize: 28, fontWeight: 700, letterSpacing: 4, color: "#34d399" }, "LOVABLE CLOUD TO SUPABASE"),
      ]),
      h("div", { fontSize: size, fontWeight: 700, lineHeight: 1.12, letterSpacing: -1.5, maxWidth: 1000 }, label),
      h("div", { display: "flex", justifyContent: "space-between", fontSize: 28, color: "#94a3b8" }, [h("div", {}, "Free migration tool · No coding needed"), h("div", { color: "#cbd5e1" }, host)]),
    ],
  );
  const svg = await satori(tree, { width: 1200, height: 630, fonts: [{ name: "Inter", data: f400, weight: 400, style: "normal" }, { name: "Inter", data: f700, weight: 700, style: "normal" }] });
  return new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
}

const seen = new Set();
for (const p of allPages) {
  if (seen.has(p.ogName)) continue;
  seen.add(p.ogName);
  write(path.join(dist, "og", `${p.ogName}.png`), await ogPng(p.ogLabel));
}
console.log(`Generated ${seen.size} OG images (1200x630)`);

// ------------------------------------------------- sitemap / robots / llms
const lastmod = SITE.modified;
const urls = allPages
  .map((p) => `  <url>\n    <loc>${SITE.url}${p.path === "/" ? "" : p.path}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <priority>${p.priority.toFixed(2)}</priority>\n  </url>`)
  .join("\n");
write(path.join(dist, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);

write(
  path.join(dist, "robots.txt"),
  `User-agent: *\nAllow: /\nDisallow: /migrate\nDisallow: /auth/\nDisallow: /oauth/\nDisallow: /github/\n\nSitemap: ${SITE.url}/sitemap.xml\n`,
);

const abs = (p) => `${SITE.url}${p}`;
write(
  path.join(dist, "llms.txt"),
  `# ${SITE.name}

> A free web tool and a set of step-by-step guides for migrating a Lovable Cloud backend (database schema, table data, auth users with password hashes, storage files and edge functions) to your own Supabase project. Credentials are never stored.

## Tool
- [Free migration wizard](${abs("/migrate")}): connect GitHub and Supabase, upload CSV exports and migrate in your browser.

## Guides
${guides.map((g) => `- [${g.h1}](${abs(`/guide/${g.slug}`)}): ${g.cardBlurb}`).join("\n")}

## Reference
- [Lovable Cloud vs Supabase](${abs("/compare/lovable-cloud-vs-supabase")}): when to stay and when to move.
- [Migration errors and fixes](${abs("/troubleshooting")}): foreign keys, duplicate keys, RLS, logins, missing migrations, secrets.
- [FAQ](${abs("/faq")}): safety, cost, time and data loss.
- [About](${abs("/about")}), [Privacy](${abs("/privacy")}), [Terms](${abs("/terms")})
`,
);

// ------------------------------------------------------ hosting config
write(
  path.join(dist, "_redirects"),
  `/migrate /app-shell.html 200\n/oauth/* /app-shell.html 200\n/github/* /app-shell.html 200\n`,
);
console.log("Wrote sitemap.xml, robots.txt, llms.txt, app-shell.html");
