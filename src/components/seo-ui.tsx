import { Fragment, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, Lightbulb, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/shared";
import { SITE } from "@/content/site";
import { guideBySlug, type Faq, type Guide, type Section, type Step } from "@/content/guides";

// ---- inline markup: **bold**, `code`, [text](/path | https://url)
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**")) return <strong key={i} className="font-semibold text-foreground">{p.slice(2, -2)}</strong>;
        if (p.startsWith("`")) return <code key={i}>{p.slice(1, -1)}</code>;
        const m = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (m) {
          return m[2].startsWith("/") ? (
            <Link key={i} to={m[2]}>{m[1]}</Link>
          ) : (
            <a key={i} href={m[2]} target="_blank" rel="noopener">{m[1]}</a>
          );
        }
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => (
          <li key={it.path} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5" aria-hidden />}
            {i === items.length - 1 ? <span aria-current="page" className="text-foreground">{it.name}</span> : <Link to={it.path} className="hover:text-foreground">{it.name}</Link>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function FaqList({ faqs, heading = "Frequently asked questions", level = 2 }: { faqs: Faq[]; heading?: string; level?: 2 | 3 }) {
  const H = level === 2 ? "h2" : "h3";
  return (
    <section aria-labelledby="faq-heading">
      <H id="faq-heading">{heading}</H>
      <div className="mt-4 divide-y rounded-lg border">
        {faqs.map((f) => (
          <details key={f.q} className="group p-4 open:bg-secondary/30">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium marker:hidden [&::-webkit-details-marker]:hidden">
              <h3 className="text-base font-medium">{f.q}</h3>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" aria-hidden />
            </summary>
            <p className="mt-3 text-sm leading-7 text-muted-foreground"><Rich text={f.a} /></p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function CtaBox({ className = "" }: { className?: string }) {
  return (
    <aside className={`not-prose rounded-xl border border-primary/30 bg-primary/5 p-6 text-center ${className}`}>
      <p className="text-lg font-semibold">Skip the manual work. Migrate in 3 clicks with our free Lovable Cloud to Supabase migration tool</p>
      <p className="mx-auto mb-4 mt-1 max-w-lg text-sm text-muted-foreground">Connect GitHub and Supabase, upload your exports and click Migrate. Keys are never stored.</p>
      <Button asChild size="lg">
        <Link to="/migrate">Start free migration <ArrowRight className="h-4 w-4" /></Link>
      </Button>
    </aside>
  );
}

export function AuthorBox() {
  return (
    <aside aria-label="About the author" className="flex gap-4 rounded-lg border bg-card p-5">
      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground" aria-hidden>
        <UserRound className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <p className="font-semibold">{SITE.author.name}</p>
        <p className="text-xs text-primary">{SITE.author.role}</p>
        <p className="text-sm text-muted-foreground">{SITE.author.bio} <Link to="/about" className="text-primary underline underline-offset-4">About us</Link>.</p>
      </div>
    </aside>
  );
}

function StepList({ steps, start }: { steps: Step[]; start: number }) {
  return (
    <ol className="not-prose my-4 space-y-4" start={start}>
      {steps.map((s, i) => (
        <li key={s.title} className="rounded-lg border bg-card p-4">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/15 text-xs text-primary">{start + i}</span>
            {s.title}
          </h3>
          {s.body.map((b, j) => <p key={j} className="mt-2 text-sm leading-7 text-muted-foreground"><Rich text={b} /></p>)}
          {s.code && <div className="mt-3"><CodeBlock code={s.code.code} label={s.code.label} /></div>}
          {s.shot && (
            <figure className="mt-3">
              <img src="/screenshots/placeholder.webp" width={800} height={450} loading="lazy" decoding="async" alt={s.shot} className="h-auto w-full rounded-md border" />
              <figcaption className="mt-1 text-xs text-muted-foreground">{s.shot}</figcaption>
            </figure>
          )}
        </li>
      ))}
    </ol>
  );
}

function SectionBlock({ s, stepStart }: { s: Section; stepStart: number }) {
  return (
    <section aria-labelledby={slugify(s.h2)}>
      <h2 id={slugify(s.h2)}>{s.h2}</h2>
      {s.paras?.map((p, i) => <p key={i}><Rich text={p} /></p>)}
      {s.steps && <StepList steps={s.steps} start={stepStart} />}
      {s.bullets && <ul>{s.bullets.map((b, i) => <li key={i}><Rich text={b} /></li>)}</ul>}
      {s.code && <div className="my-4"><CodeBlock code={s.code.code} label={s.code.label} /></div>}
    </section>
  );
}

export function RelatedGuides({ slugs, heading = "Related guides" }: { slugs: string[]; heading?: string }) {
  const list = slugs.map(guideBySlug).filter(Boolean) as Guide[];
  return (
    <section aria-labelledby="related-heading">
      <h2 id="related-heading">{heading}</h2>
      <div className="not-prose mt-4 grid gap-3 sm:grid-cols-3">
        {list.map((g) => (
          <Link key={g.slug} to={`/guide/${g.slug}`} className="group rounded-lg border bg-card p-4 transition-colors hover:border-primary/50">
            <p className="text-sm font-semibold group-hover:text-primary">{g.h1}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{g.cardBlurb}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function GuideBody({ guide }: { guide: Guide }) {
  let stepCounter = 1;
  const toc = guide.sections.map((s) => ({ id: slugify(s.h2), label: s.h2 }));
  return (
    <>
      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        <span>Last updated: <time dateTime={SITE.modified}>{new Date(SITE.modified).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</time></span>
        <span aria-hidden>·</span>
        <span>By {SITE.author.name}</span>
      </p>

      <aside aria-label="Quick answer" className="not-prose my-6 rounded-xl border border-primary/30 bg-primary/5 p-5">
        <p className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-primary"><Lightbulb className="h-4 w-4" aria-hidden /> Quick answer</p>
        <p className="text-sm leading-7 sm:text-base"><Rich text={guide.quick} /></p>
      </aside>

      <nav aria-label="Table of contents" className="not-prose mb-8 rounded-lg border bg-card p-5">
        <p className="mb-2 text-sm font-semibold">In this guide</p>
        <ol className="grid list-decimal gap-x-10 gap-y-1.5 pl-6 text-sm sm:grid-cols-2">
          {toc.map((t) => <li key={t.id}><a href={`#${t.id}`} className="text-muted-foreground hover:text-primary">{t.label}</a></li>)}
          <li><a href="#faq-heading" className="text-muted-foreground hover:text-primary">Frequently asked questions</a></li>
        </ol>
      </nav>

      {guide.intro.map((p, i) => <p key={i}><Rich text={p} /></p>)}

      {guide.sections.map((s, i) => {
        const start = stepCounter;
        stepCounter += s.steps?.length ?? 0;
        return (
          <Fragment key={s.h2}>
            <SectionBlock s={s} stepStart={start} />
            {i === Math.floor(guide.sections.length / 2) && <CtaBox className="my-10" />}
          </Fragment>
        );
      })}
    </>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return <div className="prose-guide">{children}</div>;
}
