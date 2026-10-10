import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs, CtaBox, FaqList, Prose, Rich, slugify } from "@/components/seo-ui";
import { CodeBlock, PageShell, Seo } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/misc";
import { guides } from "@/content/guides";
import { compareFaqs, compareRows, faqs, noindexPages, pageMeta, troubleshooting } from "@/content/pages";
import { SITE } from "@/content/site";
import { breadcrumbLd, faqLd } from "@/lib/schema";

function Page({ path, name, h1, lead, children, extraLd = [], trail }: { path: string; name: string; h1: string; lead?: string; children: ReactNode; extraLd?: object[]; trail?: { name: string; path: string }[] }) {
  const meta = pageMeta(path);
  const crumbs = [{ name: "Home", path: "/" }, ...(trail ?? []), { name, path }];
  return (
    <PageShell>
      <Seo path={path} title={meta.title} description={meta.description} ogName={meta.ogName} jsonLd={[breadcrumbLd(crumbs), ...extraLd]} />
      <article className="container max-w-3xl py-10 sm:py-14">
        <Breadcrumbs items={crumbs} />
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{h1}</h1>
          {lead && <p className="mt-4 text-lg text-muted-foreground"><Rich text={lead} /></p>}
        </header>
        <Prose>{children}</Prose>
      </article>
    </PageShell>
  );
}

// ------------------------------------------------------------------ /guide
export function GuideIndex() {
  return (
    <Page path="/guide" name="Guides" h1="Lovable Cloud to Supabase Guides" lead="Every step of moving a Lovable project to your own Supabase project, explained in plain English. Start with the complete guide, or jump to the part you are stuck on.">
      <div className="not-prose grid gap-4">
        {guides.map((g, i) => (
          <Link key={g.slug} to={`/guide/${g.slug}`} className="group">
            <Card className="space-y-1.5 p-5 transition-colors group-hover:border-primary/50">
              {i === 0 && <span className="text-xs font-medium uppercase tracking-wide text-primary">Start here</span>}
              <h2 className="text-lg font-semibold group-hover:text-primary">{g.h1}</h2>
              <p className="text-sm text-muted-foreground">{g.cardBlurb}</p>
            </Card>
          </Link>
        ))}
      </div>
      <p>Looking for something specific? See <Link to="/troubleshooting">common migration errors</Link>, the <Link to="/faq">FAQ</Link> or the <Link to="/compare/lovable-cloud-vs-supabase">Lovable Cloud vs Supabase comparison</Link>.</p>
      <CtaBox className="my-8" />
    </Page>
  );
}

// ---------------------------------------------------------------- /compare
export function Compare() {
  return (
    <Page
      path="/compare/lovable-cloud-vs-supabase"
      name="Lovable Cloud vs Supabase"
      h1="Lovable Cloud vs Supabase: Which Backend Should You Use?"
      lead="Lovable Cloud and your own Supabase project run on the same Postgres foundation. The real difference is who manages it, how much access you get, what it costs and how easily you can move later."
      extraLd={[faqLd(compareFaqs)]}
    >
      <section aria-labelledby="quick">
        <h2 id="quick">The short answer</h2>
        <p>Stay on Lovable Cloud while you are prototyping and want zero setup. Move to your own Supabase project when you have real users, need direct database access, want predictable costs or simply want to own your data. The move is a one-off job of roughly 20 to 40 minutes with the <Link to="/migrate">free migration tool</Link>.</p>
      </section>

      <section aria-labelledby="not-competitors">
        <h2 id="not-competitors">Lovable vs Supabase: they are not direct competitors</h2>
        <p>Searches for "Lovable vs Supabase" and "Supabase vs Lovable" often compare two different kinds of product. <strong className="text-foreground">Lovable</strong> is an AI app builder: you describe an app and it writes the front end. <strong className="text-foreground">Supabase</strong> is a backend platform: Postgres database, authentication, file storage and edge functions.</p>
        <p>They are meant to work together. Every Lovable app that stores data needs a backend, and Supabase is the technology behind it. So the real decision is not Lovable <em>or</em> Supabase, but whether your app's backend is managed inside Lovable (Lovable Cloud) or lives in a Supabase project that you own and control. Read more in <Link to="/guide/connect-supabase-to-lovable">how to connect Supabase to Lovable</Link>.</p>
      </section>

      <section aria-labelledby="table">
        <h2 id="table">Lovable Cloud vs Supabase at a glance</h2>
        <div className="not-prose my-4 overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <caption className="sr-only">Lovable Cloud compared with your own Supabase project</caption>
            <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th scope="col" className="p-3">Topic</th><th scope="col" className="p-3">Lovable Cloud</th><th scope="col" className="p-3 text-primary">Your own Supabase</th></tr>
            </thead>
            <tbody className="divide-y">
              {compareRows.map((r) => (
                <tr key={r.topic}><th scope="row" className="p-3 font-medium">{r.topic}</th><td className="p-3 text-muted-foreground">{r.cloud}</td><td className="p-3">{r.supabase}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="pricing">
        <h2 id="pricing">Lovable Cloud pricing vs Supabase pricing</h2>
        <p>Both are usage-based, and both charge for the same things: database size and compute, file storage, bandwidth and function calls. The difference is visibility. With your own Supabase project the pricing is published, you choose the compute size and you get an itemised bill from Supabase. With Lovable Cloud the backend usage is billed through your Lovable account.</p>
        <p>Which is cheaper depends entirely on your numbers, so we do not quote prices here. Our <Link to="/guide/lovable-cloud-pricing">Lovable Cloud pricing and costs guide</Link> shows how to estimate your usage and compare it with the official <a href="https://supabase.com/pricing" target="_blank" rel="noopener">Supabase pricing</a> and <a href="https://lovable.dev/pricing" target="_blank" rel="noopener">Lovable pricing</a> pages.</p>
      </section>

      <section aria-labelledby="vendor-lock-in">
        <h2 id="vendor-lock-in">Vendor lock-in and portability: how portable is Supabase?</h2>
        <p>Vendor lock-in is the cost of leaving a platform. By that measure, Supabase is on the low end of backend platforms, and Lovable Cloud inherits most of the same portability because it is built on the same foundation.</p>
        <h3>What keeps lock-in low</h3>
        <ul>
          <li><strong className="text-foreground">Standard Postgres.</strong> Your data lives in an ordinary Postgres database. You can dump it with standard tools and restore it anywhere that runs Postgres.</li>
          <li><strong className="text-foreground">Open source and self-hostable.</strong> Supabase can be run on your own servers with Docker, so the platform itself is not a hard dependency. See <Link to="/guide/self-host-lovable-app">how to self-host a Lovable app</Link>.</li>
          <li><strong className="text-foreground">Portable users and files.</strong> Password hashes are standard bcrypt and stored files are ordinary objects, so both can be moved, as shown in the <Link to="/guide/migrate-lovable-auth-users">users guide</Link> and <Link to="/guide/migrate-lovable-storage-files">storage guide</Link>.</li>
          <li><strong className="text-foreground">Standard function code.</strong> Edge functions are TypeScript for the Deno runtime, which runs elsewhere too.</li>
        </ul>
        <h3>Where some lock-in remains</h3>
        <ul>
          <li>Features built around Supabase conventions, such as the auth schema, the auto-generated APIs, Row Level Security patterns, Realtime and the Storage API, would need replacing if you left Supabase entirely.</li>
          <li>With Lovable Cloud specifically, the practical lock-in is operational: the project is managed inside Lovable until you export it. The <Link to="/guide/export-lovable-project">export guide</Link> shows how to get everything out.</li>
          <li>Running Supabase yourself trades vendor dependence for operations work: backups, upgrades and security are then your job.</li>
        </ul>
        <p>For most teams the sensible reading is: lock-in risk is low and manageable, and owning your own Supabase project is the single biggest step you can take to reduce it. Official background is in the <a href="https://supabase.com/docs" target="_blank" rel="noopener">Supabase docs</a>.</p>
      </section>

      <section aria-labelledby="stay">
        <h2 id="stay">When Lovable Cloud is the better choice</h2>
        <ul>
          <li>You are building a prototype or an internal tool and want to ship today.</li>
          <li>You do not need direct database connections, custom extensions or external analytics tools.</li>
          <li>You prefer one place to manage your app, its backend and its billing.</li>
        </ul>
      </section>
      <section aria-labelledby="move">
        <h2 id="move">When to move to your own Supabase project</h2>
        <ul>
          <li>You want to own your data and control who has access to it.</li>
          <li>You need the SQL editor, logs, backups or connection strings for other tools.</li>
          <li>You expect growth and want to choose region, compute size and plan yourself.</li>
          <li>You want predictable, published pricing, and a backend that can be self-hosted later.</li>
          <li>You are building a business on the app and do not want a single point of dependence.</li>
        </ul>
      </section>
      <section aria-labelledby="how">
        <h2 id="how">How hard is it to switch?</h2>
        <p>Because both sides are Postgres-based, nothing in your app has to be rewritten. You copy the schema, the table data, the auth users and the files, deploy your edge functions, and update three environment variables. Our <Link to="/guide/lovable-cloud-to-supabase">complete guide to migrating Lovable Cloud to Supabase</Link> walks through each step, and <Link to="/troubleshooting">the troubleshooting page</Link> covers the errors people hit most.</p>
        <p>Official documentation: <a href="https://supabase.com/docs" target="_blank" rel="noopener">Supabase docs</a> and <a href="https://docs.lovable.dev/" target="_blank" rel="noopener">Lovable docs</a>.</p>
      </section>
      <CtaBox className="my-8" />
      <FaqList faqs={compareFaqs} heading="Lovable Cloud vs Supabase: common questions" />
    </Page>
  );
}

// ---------------------------------------------------------- /troubleshooting
export function Troubleshooting() {
  return (
    <Page
      path="/troubleshooting"
      name="Troubleshooting"
      h1="Lovable to Supabase Migration Errors and How to Fix Them"
      lead="Six problems cause almost every failed Lovable to Supabase migration. Find your error below, check the likely causes and follow the fix."
      extraLd={[faqLd(troubleshooting.map((t) => ({ q: t.h2, a: `${t.symptom} Fix: ${t.fix.join(" ")}` })))]}
    >
      <nav aria-label="Errors on this page" className="not-prose mb-8 rounded-lg border bg-card p-5">
        <p className="mb-2 text-sm font-semibold">Jump to your error</p>
        <ul className="grid gap-1 text-sm sm:grid-cols-2">
          {troubleshooting.map((t) => <li key={t.id}><a href={`#${t.id}`} className="text-muted-foreground hover:text-primary">{t.h2}</a></li>)}
        </ul>
      </nav>
      {troubleshooting.map((t) => (
        <section key={t.id} aria-labelledby={t.id}>
          <h2 id={t.id}>{t.h2}</h2>
          <p><strong className="text-foreground">What you see:</strong> {t.symptom}</p>
          <h3>Likely causes</h3>
          <ul>{t.causes.map((c) => <li key={c}><Rich text={c} /></li>)}</ul>
          <h3>How to fix it</h3>
          <ul>{t.fix.map((c) => <li key={c}><Rich text={c} /></li>)}</ul>
          {t.code && <div className="my-4"><CodeBlock code={t.code.code} label={t.code.label} /></div>}
        </section>
      ))}
      <CtaBox className="my-8" />
      <p>Still stuck? Read the <Link to="/guide/lovable-cloud-to-supabase">complete migration guide</Link> or join the <Link to="/#waitlist">done-for-you waitlist</Link>.</p>
    </Page>
  );
}

// -------------------------------------------------------------------- /faq
export function FaqPage() {
  return (
    <Page path="/faq" name="FAQ" h1="Lovable Cloud to Supabase Migration FAQ" lead="Quick answers about safety, cost, time and what happens to your data." extraLd={[faqLd(faqs)]}>
      <FaqList faqs={faqs} heading="Your questions answered" />
      <CtaBox className="my-8" />
      <p>More detail: <Link to="/guide/lovable-cloud-to-supabase">the complete guide</Link>, <Link to="/troubleshooting">troubleshooting</Link> and <Link to="/compare/lovable-cloud-vs-supabase">Lovable Cloud vs Supabase</Link>.</p>
    </Page>
  );
}

// ------------------------------------------------------------------ /about
export function About() {
  return (
    <Page path="/about" name="About" h1="About the Lovable Cloud to Supabase Migrator" lead="A free tool that helps Lovable builders move their backend to a Supabase project they own.">
      <h2 id="why">Why this exists</h2>
      <p>Lovable makes it easy to build an app, and Lovable Cloud makes it easy to get a backend with no setup. Many builders later want their own Supabase project, for ownership, direct database access or cost control, and then discover that moving is fiddly: the schema, rows, users and files live in different places and have to be moved in the right order.</p>
      <p>This project exists to turn that into a guided, repeatable process that does not require coding knowledge, and to document every step so you can also do it by hand. See the <Link to="/guide/lovable-cloud-to-supabase">complete guide</Link>.</p>
      <h2 id="who">Who is behind it</h2>
      <p>{SITE.author.name} builds and maintains the tool and the guides. {SITE.author.bio}</p>
      <p>This is an independent community project. It is not affiliated with, endorsed by or sponsored by Lovable or Supabase.</p>
      <h2 id="principles">How we work</h2>
      <ul>
        <li><strong className="text-foreground">Free and simple.</strong> The migrator is free to use.</li>
        <li><strong className="text-foreground">Security by design.</strong> Official OAuth login, read-only GitHub access, and credentials that are never stored. Details on the <Link to="/privacy">privacy page</Link>.</li>
        <li><strong className="text-foreground">Honest content.</strong> Guides describe what really works, including the limits, and are dated so you know how fresh they are.</li>
      </ul>
      <h2 id="contact">Contact and feedback</h2>
      <p>Found an error in a guide or a bug in the tool? Join the <Link to="/#waitlist">waitlist</Link> with a note or contact the maintainers using the address listed on this site's repository. Corrections are welcome and are credited in the guide's update date.</p>
      <div className="not-prose my-8"><Button asChild size="lg"><Link to="/migrate">Start free migration <ArrowRight className="h-4 w-4" /></Link></Button></div>
    </Page>
  );
}

// ---------------------------------------------------------------- /privacy
export function Privacy() {
  return (
    <Page path="/privacy" name="Privacy" h1="Privacy Policy" lead={`Last updated ${new Date(SITE.modified).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}. Plain-English summary of what the migrator does with your information.`}>
      <h2 id="stored">What we store</h2>
      <ul>
        <li><strong className="text-foreground">Waitlist emails</strong> that you choose to submit, to tell you when Pro launches.</li>
        <li><strong className="text-foreground">Anonymous counters</strong> after a migration: number of tables, rows and users, and whether it succeeded. No names, emails, keys or data.</li>
      </ul>
      <h2 id="not-stored">What we never store</h2>
      <ul>
        <li>Your Supabase or GitHub access tokens, API keys and passwords. They are used in memory for the length of a request and are never written to a database or to logs.</li>
        <li>Your tables, rows, users or files. They pass through the migration proxy to your own Supabase project and are not saved.</li>
      </ul>
      <h2 id="browser">In your browser</h2>
      <p>The wizard saves progress (current step and project reference) in your browser's session storage, which is cleared when you close the tab. Keys and tokens are kept only in memory, so a page refresh asks you to reconnect.</p>
      <h2 id="analytics">Analytics and cookies</h2>
      <p>If analytics is enabled on this site, we use Google Analytics 4 with IP anonymization to count visits and key actions such as starting a migration. You can block it with your browser's privacy settings.</p>
      <h2 id="rights">Your rights</h2>
      <p>You can ask us to delete your waitlist email at any time. Because migrations store no personal data, there is nothing else to delete. You can revoke the tool's access in your Supabase account (Authorized apps) and GitHub settings (Applications).</p>
      <h2 id="changes">Changes</h2>
      <p>We will update this page, with a new date, if our practices change. This page is a plain-language policy and not legal advice; have it reviewed before relying on it commercially.</p>
    </Page>
  );
}

// ------------------------------------------------------------------ /terms
export function Terms() {
  return (
    <Page path="/terms" name="Terms" h1="Terms of Service" lead={`Last updated ${new Date(SITE.modified).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}. By using the migrator you agree to these terms.`}>
      <h2 id="use">Using the tool</h2>
      <p>The migrator is provided free of charge to help you copy your own data from Lovable Cloud to a Supabase project you own. Only use it with projects and data you are authorized to move.</p>
      <h2 id="backups">Backups are your responsibility</h2>
      <p>The tool reads from Lovable Cloud and writes to your new project, but all data operations carry risk. Keep your CSV exports and a backup of your destination project, and test before switching real users over.</p>
      <h2 id="warranty">No warranty</h2>
      <p>The service and the guides are provided "as is", without warranties of any kind. Third-party interfaces such as Lovable and Supabase change over time, and steps may differ from what you see.</p>
      <h2 id="liability">Limit of liability</h2>
      <p>To the maximum extent permitted by law, we are not liable for data loss, downtime or other damages arising from use of the tool or the guides.</p>
      <h2 id="acceptable">Acceptable use</h2>
      <p>Do not use the service to access data you are not entitled to, to attack other systems, or to overload the migration proxy.</p>
      <h2 id="trademarks">Trademarks</h2>
      <p>Lovable and Supabase are trademarks of their respective owners. This project is independent and not affiliated with either company.</p>
      <h2 id="changes">Changes</h2>
      <p>We may update these terms and will change the date above when we do. This page is a plain-language template and not legal advice; have it reviewed before relying on it commercially.</p>
    </Page>
  );
}

// ------------------------------------------------------------------- /blog
export function Blog() {
  return (
    <Page path="/blog" name="Blog" h1="Lovable and Supabase Blog" lead="Migration tips, release notes and tutorials. New posts are coming soon.">
      <p>We have not published blog posts yet. In the meantime, our step-by-step guides cover everything about moving from Lovable Cloud to your own Supabase project:</p>
      <ul>
        {guides.map((g) => <li key={g.slug}><Link to={`/guide/${g.slug}`}>{g.h1}</Link></li>)}
      </ul>
      <p>Want to know when we publish? Join the <Link to="/#waitlist">waitlist</Link>.</p>
    </Page>
  );
}

// -------------------------------------------------------------------- 404
export function NotFound() {
  const meta = noindexPages[0];
  return (
    <PageShell>
      <Seo path="/404" title={meta.title} description={meta.description} noindex />
      <div className="container max-w-xl space-y-4 py-24 text-center">
        <h1 className="text-5xl font-bold">404</h1>
        <p className="text-muted-foreground">That page doesn't exist.</p>
        <p className="text-sm">Try the <Link className="text-primary underline underline-offset-4" to="/guide">guides</Link>, the <Link className="text-primary underline underline-offset-4" to="/faq">FAQ</Link> or go <Link className="text-primary underline underline-offset-4" to="/">home</Link>.</p>
      </div>
    </PageShell>
  );
}

export { slugify };
