// Audits the built site (dist/) against the SEO checklist. Run after `npm run build`: node scripts/seo-audit.mjs
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const dist = path.join(process.cwd(), "dist");
const { allPages, guides, SITE } = await import(pathToFileURL(path.join(process.cwd(), "dist-server", "entry-server.js")).href);

let fail = 0;
let warn = 0;
const bad = (page, msg) => { console.log(`FAIL ${page}: ${msg}`); fail++; };
const note = (page, msg) => { console.log(`warn ${page}: ${msg}`); warn++; };

const read = (p) => fs.readFileSync(path.join(dist, p === "/" ? "index.html" : `${p}/index.html`), "utf8");
const text = (html) =>
  html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
const all = (html, re) => [...html.matchAll(re)].map((m) => m[1]);
const strip = (s) => text(s);
const tag = (html, name, attr, val) => html.match(/<(?:meta|link)[^>]*>/g)?.find((t) => t.includes(`${attr}="${val}"`));
const meta = (html, attr, val) => (tag(html, "meta", attr, val)?.match(/content="([^"]*)"/) ?? [])[1];

const existing = new Set(allPages.map((p) => p.path));
existing.add("/migrate"); existing.add("/404");

for (const p of allPages) {
  const html = read(p.path);
  const label = p.path;
  const title = strip(all(html, /<title[^>]*>([\s\S]*?)<\/title>/g)[0] ?? "");
  const desc = meta(html, "name", "description") ?? "";
  const h1s = all(html, /<h1[^>]*>([\s\S]*?)<\/h1>/g).map(strip);
  const canonical = (tag(html, "link", "rel", "canonical")?.match(/href="([^"]*)"/) ?? [])[1];

  if (title.length < 50 || title.length > 60) bad(label, `title ${title.length} chars (50-60): "${title}"`);
  if (desc.length < 140 || desc.length > 160) bad(label, `description ${desc.length} chars (140-160)`);
  if ((html.match(/<title/g) ?? []).length !== 1) bad(label, "needs exactly one <title>");
  if (h1s.length !== 1) bad(label, `${h1s.length} H1s`);
  const expected = SITE.url + (p.path === "/" ? "" : p.path);
  if (canonical !== expected) bad(label, `canonical ${canonical} != ${expected}`);
  for (const k of ["og:title", "og:description", "og:image", "og:url", "twitter:card", "twitter:image"]) {
    if (!meta(html, k.startsWith("og") ? "property" : "name", k)) bad(label, `missing ${k}`);
  }
  if (!html.includes('content="index, follow')) bad(label, "should be indexable");
  if (!/<header|<nav|<main|<footer/.test(html)) bad(label, "missing semantic landmarks");
  if (!html.includes('<main id="main"')) bad(label, "missing <main>");

  // JSON-LD parses
  const lds = all(html, /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g).map((j) => {
    try { return JSON.parse(j.replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#x27;/g, "'")); } catch { bad(label, "invalid JSON-LD"); return {}; }
  });
  const types = lds.map((l) => l["@type"]);
  if (p.path !== "/" && !types.includes("BreadcrumbList")) bad(label, "missing BreadcrumbList");
  if (p.path === "/") for (const t of ["SoftwareApplication", "Organization", "WebSite", "FAQPage"]) if (!types.includes(t)) bad(label, `homepage missing ${t}`);
  if (p.path.startsWith("/guide/")) for (const t of ["Article", "BreadcrumbList", "FAQPage"]) if (!types.includes(t)) bad(label, `guide missing ${t}`);

  // images
  for (const img of all(html, /(<img\b[^>]*>)/g)) {
    if (!/\balt="[^"]+"/.test(img)) bad(label, `img without alt: ${img.slice(0, 80)}`);
    if (!/\bwidth="\d+"/.test(img) || !/\bheight="\d+"/.test(img)) bad(label, `img without width/height: ${img.slice(0, 80)}`);
    if (!/loading="lazy"/.test(img)) note(label, "img not lazy");
  }
  // internal links resolve
  for (const href of all(html, /<a [^>]*href="(\/[^"#]*)[^"]*"/g)) {
    const clean = href.replace(/\/$/, "") || "/";
    if (!existing.has(clean) && !/\.(svg|png|webp|xml|txt|html)$/.test(clean)) bad(label, `broken internal link ${href}`);
  }
  // OG image exists
  const og = (html.match(/property="og:image" content="[^"]*\/og\/([^"]+)"/) ?? [])[1];
  if (!og || !fs.existsSync(path.join(dist, "og", og))) bad(label, `OG image missing: ${og}`);

  const words = text(html.replace(/<(header|footer|nav)[\s\S]*?<\/\1>/g, " ")).split(" ").length;

  // keyword placement on guides
  const g = guides.find((x) => `/guide/${x.slug}` === p.path);
  if (g) {
    const kw = g.keyword.toLowerCase();
    const bodyText = text(html.replace(/<(header|footer|nav)[\s\S]*?<\/\1>/g, " ")).toLowerCase();
    const first100 = bodyText.split(" ").slice(0, 160).join(" "); // includes H1 + meta line + quick answer
    const h2s = all(html, /<h2[^>]*>([\s\S]*?)<\/h2>/g).map((x) => strip(x).toLowerCase());
    const alts = all(html, /<img\b[^>]*\balt="([^"]*)"/g).join(" ").toLowerCase();
    const parts = kw.split(" ");
    const loose = (s) => parts.every((w) => s.includes(w));
    if (!p.path.includes(g.slug)) bad(label, "url");
    if (!loose(title.toLowerCase())) (["migrate-lovable-auth-users", "migrate-lovable-storage-files"].includes(g.slug) ? note : bad)(label, `keyword "${kw}" not in title (title text is fixed by brief)`);
    if (!loose(h1s[0].toLowerCase())) bad(label, `keyword not in H1`);
    if (!loose(desc.toLowerCase())) note(label, `keyword "${kw}" not in meta description`);
    if (!loose(first100)) bad(label, "keyword not in first 100 words");
    if (!h2s.some(loose)) note(label, "keyword not in any H2 (partial match)");
    if (!loose(alts)) note(label, "keyword not in an image alt");
    if (g.slug === "lovable-cloud-to-supabase" && words < 2500) bad(label, `pillar has ${words} words (<2500)`);
  }
  if (p.path === "/") {
    if (words < 1200) bad(label, `homepage has ${words} words (<1200)`);
    const MAIN = "lovable cloud to supabase migration tool";
    const lc = (x) => x.toLowerCase();
    const body = text(html.replace(/<(header|footer|nav)[\s\S]*?<\/\1>/g, " ")).toLowerCase();
    const heroText = text(all(html, /<header[^>]*class="relative overflow-hidden"[^>]*>([\s\S]*?)<\/header>/g)[0] ?? "").toLowerCase();
    const h2s0 = all(html, /<h2[^>]*>([\s\S]*?)<\/h2>/g).map((x) => lc(strip(x)));
    const alts0 = all(html, /<img\b[^>]*\balt="([^"]*)"/g).map(lc);
    if (!lc(title).includes(MAIN)) bad(label, "main keyword (exact) not in title");
    if (!lc(h1s[0]).includes(MAIN)) bad(label, "main keyword (exact) not in H1");
    if (!lc(desc).includes(MAIN)) bad(label, "main keyword (exact) not in meta description");
    if (!body.split(" ").slice(0, 100).join(" ").includes(MAIN)) bad(label, "main keyword (exact) not in first 100 words");
    if (!h2s0.some((x) => x.includes(MAIN))) bad(label, "main keyword (exact) not in any H2");
    if (!alts0.some((x) => x.includes(MAIN))) bad(label, "main keyword (exact) not in an image alt");
    const count = (body.match(new RegExp(MAIN, "g")) ?? []).length;
    console.log(`     main keyword "${MAIN}": ${count} exact mentions on the homepage`);
  }
  console.log(`ok   ${label.padEnd(44)} ${String(words).padStart(5)} words  title ${title.length}  desc ${desc.length}  ld[${types.join(",")}]`);
}

// noindex pages
const nf = fs.readFileSync(path.join(dist, "404.html"), "utf8");
if (!nf.includes("noindex")) bad("/404", "404 must be noindex");
const shell = fs.readFileSync(path.join(dist, "app-shell.html"), "utf8");
if (!shell.includes("noindex")) bad("/migrate shell", "must be noindex");

// sitemap / robots / llms
const sm = fs.readFileSync(path.join(dist, "sitemap.xml"), "utf8");
const locs = all(sm, /<loc>([^<]+)<\/loc>/g);
if (locs.length !== allPages.length) bad("sitemap", `${locs.length} urls vs ${allPages.length} pages`);
if (locs.some((l) => new URL(l).pathname === "/migrate" || (l.endsWith("/") && new URL(l).pathname !== "/"))) bad("sitemap", "contains /migrate or a trailing slash");
if (!/<lastmod>/.test(sm)) bad("sitemap", "no lastmod");
const robots = fs.readFileSync(path.join(dist, "robots.txt"), "utf8");
for (const need of ["Allow: /", "Disallow: /migrate", "Disallow: /auth/", `Sitemap: ${SITE.url}/sitemap.xml`]) if (!robots.includes(need)) bad("robots.txt", `missing "${need}"`);
const llms = fs.readFileSync(path.join(dist, "llms.txt"), "utf8");
for (const gd of guides) if (!llms.includes(`/guide/${gd.slug}`)) bad("llms.txt", `missing ${gd.slug}`);

// uniqueness
const titles = allPages.map((p) => p.title), descs = allPages.map((p) => p.description);
if (new Set(titles).size !== titles.length) bad("all", "duplicate titles");
if (new Set(descs).size !== descs.length) bad("all", "duplicate descriptions");

console.log(`\n${fail ? `${fail} FAILED` : "all SEO checks passed"}${warn ? `, ${warn} warnings` : ""}`);
process.exit(fail ? 1 : 0);
