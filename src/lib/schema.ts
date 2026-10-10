import { abs, ogImage, SITE } from "@/content/site";
import type { Faq, Guide } from "@/content/guides";

const ctx = "https://schema.org";

export const breadcrumbLd = (items: { name: string; path: string }[]) => ({
  "@context": ctx,
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.path) })),
});

export const faqLd = (faqs: Faq[]) => ({
  "@context": ctx,
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: stripMarkup(f.a) } })),
});

export const stripMarkup = (s: string) =>
  s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/`([^`]+)`/g, "$1");

export const organizationLd = () => ({
  "@context": ctx,
  "@type": "Organization",
  "@id": `${SITE.url}/#organization`,
  name: SITE.name,
  url: SITE.url,
  logo: `${SITE.url}/favicon.svg`,
});

export const websiteLd = () => ({
  "@context": ctx,
  "@type": "WebSite",
  "@id": `${SITE.url}/#website`,
  url: SITE.url,
  name: SITE.name,
  publisher: { "@id": `${SITE.url}/#organization` },
  inLanguage: "en",
});

export const softwareLd = () => ({
  "@context": ctx,
  "@type": "SoftwareApplication",
  name: "Lovable Cloud to Supabase Migration Tool",
  alternateName: "Lovable Cloud to Supabase Migrator",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  url: SITE.url,
  description: "Free web app that migrates a Lovable Cloud database, auth users and storage files to your own Supabase project.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  publisher: { "@id": `${SITE.url}/#organization` },
});

export const articleLd = (g: Guide) => ({
  "@context": ctx,
  "@type": "Article",
  headline: g.h1,
  description: g.description,
  image: [ogImage(`guide-${g.slug}`)],
  author: { "@type": "Organization", name: SITE.author.name, url: abs("/about") },
  publisher: { "@id": `${SITE.url}/#organization` },
  datePublished: SITE.published,
  dateModified: SITE.modified,
  mainEntityOfPage: abs(`/guide/${g.slug}`),
  inLanguage: "en",
});

export const howToLd = (g: Guide) => {
  const steps = g.sections.flatMap((s) => s.steps ?? []);
  if (!steps.length) return null;
  return {
    "@context": ctx,
    "@type": "HowTo",
    name: g.h1,
    description: g.description,
    image: ogImage(`guide-${g.slug}`),
    step: steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.title, text: stripMarkup(s.body.join(" ")) })),
  };
};
