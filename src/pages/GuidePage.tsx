import { Navigate, useParams } from "react-router-dom";
import { AuthorBox, Breadcrumbs, CtaBox, FaqList, GuideBody, Prose, RelatedGuides } from "@/components/seo-ui";
import { PageShell, Seo } from "@/components/shared";
import { guideBySlug } from "@/content/guides";
import { articleLd, breadcrumbLd, faqLd, howToLd } from "@/lib/schema";

export default function GuidePage() {
  const { slug = "" } = useParams();
  const guide = guideBySlug(slug);
  if (!guide) return <Navigate to="/404" replace />;

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Guides", path: "/guide" },
    { name: guide.h1, path: `/guide/${guide.slug}` },
  ];
  const howTo = howToLd(guide);
  return (
    <PageShell>
      <Seo
        path={`/guide/${guide.slug}`}
        title={guide.title}
        description={guide.description}
        ogName={`guide-${guide.slug}`}
        type="article"
        jsonLd={[articleLd(guide), ...(howTo ? [howTo] : []), breadcrumbLd(crumbs), faqLd(guide.faq)]}
      />
      <article className="container max-w-3xl py-10 sm:py-14">
        <Breadcrumbs items={crumbs} />
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{guide.h1}</h1>
        </header>
        <Prose>
          <GuideBody guide={guide} />
          <CtaBox className="my-10" />
          <FaqList faqs={guide.faq} />
          <RelatedGuides slugs={guide.related.length >= 3 ? guide.related : [...guide.related, "lovable-cloud-to-supabase"]} />
        </Prose>
        <div className="mt-12"><AuthorBox /></div>
      </article>
    </PageShell>
  );
}
