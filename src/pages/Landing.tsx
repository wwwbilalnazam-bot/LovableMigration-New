import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bell, Boxes, CheckCircle2, Code2, Database, EyeOff, FolderOpen, Link2, Lock, Rocket, ShieldCheck, Table2, Trash2, Upload, UserRound, XCircle } from "lucide-react";
import { PageShell, Seo, WaitlistForm } from "@/components/shared";
import { FaqList } from "@/components/seo-ui";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/misc";
import { guides } from "@/content/guides";
import { faqs, pageMeta } from "@/content/pages";
import { SITE } from "@/content/site";
import { testimonials } from "@/content/testimonials";
import { getMigrationCount } from "@/lib/supabase";
import { faqLd, organizationLd, softwareLd, websiteLd } from "@/lib/schema";

const steps = [
  { icon: Link2, title: "Connect GitHub and Supabase", text: "Sign in with the official OAuth screens. GitHub access is read-only and limited to the repository you choose, and Supabase access is used only to create your tables and import your data." },
  { icon: Upload, title: "Upload your CSV exports", text: "Lovable does not hand over everything automatically, so you export each table as a CSV and your auth users with one query. Drop the files into the page and we match every file to the right table." },
  { icon: Rocket, title: "Click Migrate", text: "We replay your schema in order, import rows parents-first, copy users with their ids and password hashes, and upload your files. You watch live progress and download a report at the end." },
];

const covers = [
  { icon: Database, title: "Schema and RLS policies", text: "Tables, functions, triggers and Row Level Security policies are replayed from your migration files, in timestamp order." },
  { icon: Table2, title: "Table data", text: "Rows are inserted in batches of 500, sorted by foreign keys, with empty strings, JSON, arrays, booleans and timestamps converted per column type." },
  { icon: UserRound, title: "Auth users", text: "Users keep their ids and bcrypt password hashes, with matching identities, so existing logins keep working." },
  { icon: FolderOpen, title: "Storage files", text: "Buckets are recreated with the same public or private setting and files keep their folder paths." },
  { icon: Code2, title: "Edge functions (guided)", text: "We list your functions and secret names and give you the exact Supabase CLI commands to deploy them." },
];

const why = [
  { title: "Ownership", text: "Your database, users and files live in a Supabase project under your account, with your billing and your access rules. Nobody else decides when features, limits or pricing change." },
  { title: "Scaling", text: "Pick the region and compute size you need and upgrade when traffic grows. You can add read replicas, backups and monitoring without waiting for a platform to expose them." },
  { title: "Direct database access", text: "Use the full Supabase dashboard: SQL editor, table editor, logs and connection strings for BI tools, scripts and other apps that need to read your data." },
  { title: "Lower, predictable costs", text: "Supabase publishes its pricing, so you can see what a given amount of storage and compute costs and choose the plan that fits instead of guessing." },
];

const compare: [string, string, string][] = [
  ["Time needed", "Hours of copying files and fixing errors", "Roughly 20 to 40 minutes"],
  ["Migration order", "You work out foreign key order yourself", "Tables sorted automatically, parents first"],
  ["Type conversion", "Manual cleanup of empty strings, JSON and arrays", "Converted per column type"],
  ["Auth users and passwords", "Hand-written SQL for auth.users and auth.identities", "Ids and hashes copied for you"],
  ["Error handling", "Stop and search for the failing line", "Retry, Skip or Stop on each file with plain-English errors"],
  ["Report", "None", "Downloadable JSON or TXT report"],
  ["Cost", "Free, but your time", "Free"],
];

function MigrationCounter() {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (import.meta.env.VITE_SHOW_COUNTER !== "true") return; // enable after `supabase db push` adds migration_count()
    getMigrationCount().then(setN);
  }, []);
  if (n < SITE.counterThreshold) return null;
  return (
    <p className="mt-6 text-sm text-muted-foreground">
      <span className="font-semibold text-foreground">{n.toLocaleString("en-US")}+</span> migrations completed
    </p>
  );
}

export default function Landing() {
  const meta = pageMeta("/");
  const featured = ["lovable-cloud-to-supabase", "lovable-cloud-pricing", "export-lovable-project", "self-host-lovable-app", "connect-supabase-to-lovable", "migrate-lovable-auth-users"];
  const latest = featured.map((s) => guides.find((g) => g.slug === s)!);
  return (
    <PageShell>
      <Seo
        path="/"
        title={meta.title}
        description={meta.description}
        ogName={meta.ogName}
        jsonLd={[softwareLd(), organizationLd(), websiteLd(), faqLd(faqs.slice(0, 8))]}
      />

      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0" aria-hidden />
        <div className="absolute left-1/2 top-0 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" aria-hidden />
        <div className="container relative py-20 text-center sm:py-28">
          <div className="mx-auto max-w-3xl space-y-6">
            <Badge><ShieldCheck className="h-3.5 w-3.5" /> Free · No sign-up · Open to everyone</Badge>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
              <span className="text-gradient">Lovable Cloud to Supabase Migration Tool</span>: Migrate in 3 Simple Steps
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Our free Lovable Cloud to Supabase migration tool moves your database, users and files to your own Supabase project in minutes. Free. Secure. Your keys never leave your session. No coding knowledge needed.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg"><Link to="/migrate">Start free migration <ArrowRight className="h-4 w-4" /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link to="/guide/lovable-cloud-to-supabase">Read the complete guide</Link></Button>
            </div>
            <MigrationCounter />
          </div>
        </div>
      </header>

      {/* How it works */}
      <section className="container py-16" aria-labelledby="how">
        <div className="mb-10 text-center">
          <h2 id="how" className="text-3xl font-bold tracking-tight">How the Lovable Cloud to Supabase migration tool works</h2>
          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">Three simple steps take you from a managed Lovable backend to a Supabase project you own.</p>
        </div>
        <ol className="grid gap-4 lg:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title}>
              <Card className="h-full space-y-3 p-6 transition-colors hover:border-primary/40">
                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><s.icon className="h-5 w-5" /></span>
                  <span className="text-sm font-semibold text-muted-foreground">Step {i + 1}</span>
                </div>
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{s.text}</p>
              </Card>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Prefer to do it by hand? Follow our <Link to="/guide/lovable-cloud-to-supabase" className="text-primary underline underline-offset-4">step-by-step Lovable Cloud to Supabase guide</Link> instead.
        </p>
      </section>

      {/* The tool in action */}
      <section className="container py-8" aria-labelledby="demo">
        <h2 id="demo" className="text-center text-3xl font-bold tracking-tight">See the migration tool in action</h2>
        <figure className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-xl border bg-card shadow-lg shadow-black/10">
          <img
            src="/screenshots/migration-tool-wizard.webp"
            width={1100}
            height={820}
            loading="lazy"
            decoding="async"
            alt="Lovable Cloud to Supabase migration tool running a schema migration with every migration file marked as successful"
            className="h-auto w-full"
          />
          <figcaption className="border-t px-4 py-2.5 text-center text-xs text-muted-foreground">Example run: the tool replays each schema file in order with live status. File names shown are sample data.</figcaption>
        </figure>
      </section>

      {/* What gets migrated */}
      <section className="container py-16" aria-labelledby="covers">
        <div className="mb-10 text-center">
          <h2 id="covers" className="text-3xl font-bold tracking-tight">What gets migrated</h2>
          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">Everything your app needs to run on its own backend.</p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {covers.map((c) => (
            <li key={c.title}>
              <Card className="flex h-full gap-4 p-5 transition-colors hover:border-primary/40">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><c.icon className="h-5 w-5" /></span>
                <div><h3 className="font-semibold">{c.title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{c.text}</p></div>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      {/* Why */}
      <section className="container py-16" aria-labelledby="why">
        <div className="mb-10 max-w-3xl">
          <h2 id="why" className="text-3xl font-bold tracking-tight">Why move from Lovable Cloud to your own Supabase project?</h2>
          <p className="mt-3 text-muted-foreground">
            Lovable Cloud is a quick way to get a backend running. As soon as an app has real users, though, many builders want more control. A Lovable to Supabase migration does not change how your app works, because Lovable Cloud and Supabase use the same Postgres foundation. It changes who is in charge. Whether you call it a Lovable migration, moving off Lovable Cloud or wanting to self-host a Lovable app, the goal is the same. Here is what people usually want from the move.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {why.map((w) => (
            <Card key={w.title} className="space-y-2 p-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold"><Boxes className="h-4 w-4 text-primary" aria-hidden /> {w.title}</h3>
              <p className="text-sm leading-6 text-muted-foreground">{w.text}</p>
            </Card>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Wondering what it costs? See our <Link to="/guide/lovable-cloud-pricing" className="text-primary underline underline-offset-4">Lovable Cloud pricing guide</Link>. Not sure yet? Read our honest <Link to="/compare/lovable-cloud-vs-supabase" className="text-primary underline underline-offset-4">comparison of Lovable Cloud and Supabase</Link>.
        </p>
      </section>

      {/* Security */}
      <section className="container py-16" id="security" aria-labelledby="security-h">
        <Card className="grid gap-8 overflow-hidden p-6 sm:p-10 lg:grid-cols-2">
          <div className="space-y-4">
            <Badge><Lock className="h-3.5 w-3.5" /> Security first</Badge>
            <h2 id="security-h" className="text-3xl font-bold tracking-tight">We never store your passwords or keys</h2>
            <p className="text-muted-foreground">
              A migration tool needs real access to your project, so it has to earn your trust. The migrator is built so that it cannot keep what it does not need. Everything is explained on our <Link to="/privacy" className="text-primary underline underline-offset-4">privacy page</Link>.
            </p>
          </div>
          <ul className="space-y-4">
            {([
              [ShieldCheck, "Official OAuth login", "You approve access on Supabase's and GitHub's own sign-in screens. You never paste a password."],
              [EyeOff, "Read-only GitHub access", "The GitHub app only reads files from the repository you select. It cannot change your code."],
              [Trash2, "Nothing stored", "Tokens and keys live in memory for the length of a request. They are never written to a database or to logs, and you can revoke access any time."],
            ] as const).map(([Icon, t, d]) => (
              <li key={t} className="flex gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <div><h3 className="font-medium">{t}</h3><p className="text-sm text-muted-foreground">{d}</p></div>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* Comparison */}
      <section className="container py-16" aria-labelledby="comparison">
        <h2 id="comparison" className="mb-3 text-3xl font-bold tracking-tight">Manual migration vs the migrator tool</h2>
        <p className="mb-6 max-w-3xl text-muted-foreground">You can absolutely migrate by hand, and our guides show you how. The tool simply removes the repetitive and error-prone parts.</p>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <caption className="sr-only">Comparison of manual migration and the Lovable Cloud to Supabase migrator tool</caption>
            <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th scope="col" className="p-3">&nbsp;</th><th scope="col" className="p-3">Manual migration</th><th scope="col" className="p-3 text-primary">Migrator tool</th></tr>
            </thead>
            <tbody className="divide-y">
              {compare.map(([a, b, c]) => (
                <tr key={a}>
                  <th scope="row" className="p-3 font-medium">{a}</th>
                  <td className="p-3 text-muted-foreground"><span className="inline-flex items-start gap-2"><XCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" aria-hidden />{b}</span></td>
                  <td className="p-3"><span className="inline-flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />{c}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Latest guides */}
      <section className="container py-16" aria-labelledby="latest">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 id="latest" className="text-3xl font-bold tracking-tight">Latest Lovable to Supabase guides</h2>
          <Link to="/guide" className="shrink-0 text-sm text-primary underline underline-offset-4">All guides</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {latest.map((g) => (
            <Link key={g.slug} to={`/guide/${g.slug}`} className="group">
              <Card className="h-full space-y-2 p-5 transition-colors group-hover:border-primary/50">
                <h3 className="font-semibold group-hover:text-primary">{g.h1}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{g.cardBlurb}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Testimonials (rendered only when real reviews exist) */}
      {testimonials.length > 0 && (
        <section className="container py-16" aria-labelledby="reviews">
          <h2 id="reviews" className="mb-8 text-3xl font-bold tracking-tight">What builders say</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.name} className="p-5"><blockquote className="text-sm leading-6">“{t.quote}”</blockquote><p className="mt-3 text-sm font-medium">{t.name}<span className="font-normal text-muted-foreground"> · {t.role}</span></p></Card>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="container max-w-3xl scroll-mt-20 py-16" id="faq">
        <div className="prose-guide">
          <FaqList faqs={faqs.slice(0, 8)} heading="Lovable Cloud to Supabase migration FAQ" />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">More answers on the <Link to="/faq" className="text-primary underline underline-offset-4">full FAQ page</Link>, or see <Link to="/troubleshooting" className="text-primary underline underline-offset-4">common migration errors and fixes</Link>.</p>
      </section>

      {/* Waitlist */}
      <section className="container scroll-mt-20 py-16" id="waitlist" aria-labelledby="waitlist-h">
        <Card className="relative mx-auto max-w-2xl overflow-hidden p-8 text-center sm:p-10">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
          <Bell className="mx-auto mb-4 h-8 w-8 text-primary" aria-hidden />
          <h2 id="waitlist-h" className="text-2xl font-bold tracking-tight">Pro and done-for-you migration coming soon</h2>
          <p className="mb-6 mt-2 text-muted-foreground">Too big or too stressful to do yourself? Join the waitlist and we'll let you know first.</p>
          <div className="mx-auto max-w-md"><WaitlistForm source="landing" /></div>
        </Card>
      </section>
    </PageShell>
  );
}
