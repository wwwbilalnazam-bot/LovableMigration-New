import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Check, CheckCircle2, ChevronDown, Copy, HelpCircle, Loader2, Menu, MessageCircle, Moon, Sun, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { cn, copyText, isValidEmail } from "@/lib/utils";
import { joinWaitlist } from "@/lib/supabase";
import { abs, ogImage, SITE, whatsappUrl } from "@/content/site";
import { guides } from "@/content/guides";
import { track } from "@/lib/analytics";

// ---- Theme -----------------------------------------------------------------
type Theme = "dark" | "light";
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({ theme: "dark", toggle: () => {} });
export const useTheme = () => useContext(ThemeCtx);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Always "dark" on first render so server HTML and hydration match; the inline script in index.html sets the real class.
  const [theme, setTheme] = useState<Theme>("dark");
  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);
  const toggle = () =>
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      try {
        localStorage.setItem("theme", next);
      } catch {
        /* ignore */
      }
      return next;
    });
  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>;
}

// ---- SEO -------------------------------------------------------------------
export function Seo({
  path,
  title,
  description,
  ogName = "home",
  noindex,
  jsonLd = [],
  type = "website",
}: {
  path: string;
  title: string;
  description: string;
  ogName?: string;
  noindex?: boolean;
  jsonLd?: object[];
  type?: "website" | "article";
}) {
  const url = abs(path);
  const image = ogImage(ogName);
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1"} />
      {!noindex && <link rel="canonical" href={url} />}
      <meta property="og:site_name" content={SITE.name} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      {SITE.gscToken && <meta name="google-site-verification" content={SITE.gscToken} />}
      {jsonLd.map((d, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(d)}</script>
      ))}
    </Helmet>
  );
}

// ---- Layout ----------------------------------------------------------------
export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight" aria-label="Lovable Cloud to Supabase Migrator home">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
        <Zap className="h-4 w-4" fill="currentColor" />
      </span>
      <span className="hidden sm:inline">Lovable → Supabase</span>
      <span className="sm:hidden">Migrator</span>
    </Link>
  );
}

const GUIDE_NAV: Record<string, string> = {
  "lovable-cloud-to-supabase": "Migrate Lovable Cloud to Supabase (complete guide)",
  "export-lovable-cloud-database": "Export your Lovable Cloud database",
  "migrate-lovable-auth-users": "Migrate users and keep passwords",
  "migrate-lovable-storage-files": "Move storage files",
  "deploy-lovable-edge-functions": "Deploy edge functions",
  "update-env-after-migration": "Update your .env after migrating",
  "sync-lovable-to-github": "Sync your project to GitHub",
  "export-lovable-project": "Export your Lovable project (code, data, files)",
  "lovable-cloud-pricing": "Lovable Cloud pricing and costs",
  "self-host-lovable-app": "Self-host a Lovable app",
  "connect-supabase-to-lovable": "Connect Supabase to Lovable",
};

const navLink = "text-sm text-muted-foreground transition-colors hover:text-foreground";

export function Navbar() {
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
          <div className="group relative">
            <Link to="/guide" className={cn(navLink, "inline-flex items-center gap-1")}>
              Guides <ChevronDown className="h-3.5 w-3.5" />
            </Link>
            <div className="invisible absolute left-0 top-full z-50 w-80 pt-2 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              <div className="rounded-lg border bg-card p-2 shadow-xl">
                {guides.map((g) => (
                  <Link key={g.slug} to={`/guide/${g.slug}`} className="block rounded-md px-3 py-2 text-sm hover:bg-secondary">
                    {GUIDE_NAV[g.slug] ?? g.h1}
                  </Link>
                ))}
                <Link to="/guide" className="block rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-secondary">All guides →</Link>
              </div>
            </div>
          </div>
          <Link to="/compare/lovable-cloud-vs-supabase" className={navLink}>Compare</Link>
          <Link to="/troubleshooting" className={navLink}>Troubleshooting</Link>
          <Link to="/faq" className={navLink}>FAQ</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle light and dark mode">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button asChild size="sm">
            <Link to="/migrate">Migrate</Link>
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      <nav aria-label="Mobile" className={cn("border-t md:hidden", open ? "block" : "hidden")}>
        <div className="container grid gap-1 py-3 text-sm">
          {[["/guide", "Guides"], ["/compare/lovable-cloud-vs-supabase", "Compare"], ["/troubleshooting", "Troubleshooting"], ["/faq", "FAQ"], ["/about", "About"]].map(([to, label]) => (
            <Link key={to} to={to} onClick={() => setOpen(false)} className="rounded-md px-2 py-2 hover:bg-secondary">{label}</Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

export function Footer() {
  const col = "space-y-2.5 text-sm";
  const h = "mb-3 text-sm font-semibold";
  const a = "block text-muted-foreground transition-colors hover:text-foreground";
  return (
    <footer className="border-t py-12">
      <div className="container grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-1">
          <Logo />
          <p className="text-xs leading-5 text-muted-foreground">Free community tool. Not affiliated with Lovable or Supabase. Always keep a backup before migrating.</p>
        </div>
        <nav aria-label="Product" className={col}>
          <p className={h}>Product</p>
          <Link to="/" className={a}>Lovable Cloud to Supabase migration tool</Link>
          <Link to="/migrate" className={a}>Start free migration</Link>
          <Link to="/guide" className={a}>All guides</Link>
          <Link to="/compare/lovable-cloud-vs-supabase" className={a}>Lovable Cloud vs Supabase</Link>
          <Link to="/#waitlist" className={a}>Pro waitlist</Link>
        </nav>
        <nav aria-label="Guides" className={cn(col, "lg:col-span-2")}>
          <p className={h}>Guides</p>
          {guides.map((g) => (
            <Link key={g.slug} to={`/guide/${g.slug}`} className={a}>{GUIDE_NAV[g.slug] ?? g.h1}</Link>
          ))}
        </nav>
        <nav aria-label="Company" className={col}>
          <p className={h}>Resources</p>
          <Link to="/troubleshooting" className={a}>Troubleshooting</Link>
          <Link to="/faq" className={a}>FAQ</Link>
          <Link to="/blog" className={a}>Blog</Link>
          <Link to="/about" className={a}>About</Link>
          <Link to="/privacy" className={a}>Privacy</Link>
          <Link to="/terms" className={a}>Terms</Link>
        </nav>
      </div>
      <p className="container mt-10 text-xs text-muted-foreground">© {new Date(SITE.published).getFullYear()} {SITE.name}. Lovable and Supabase are trademarks of their respective owners.</p>
    </footer>
  );
}

export function WhatsAppLink({ className, label = "Chat on WhatsApp", location }: { className?: string; label?: string; location: string }) {
  return (
    <a
      href={whatsappUrl()}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("whatsapp_click", { location })}
      className={cn("inline-flex items-center justify-center gap-2 rounded-md bg-[#25D366] px-4 text-sm font-semibold text-[#06260f] transition-all hover:bg-[#20bd5a] active:scale-[0.98]", className)}
    >
      <MessageCircle className="h-4 w-4" aria-hidden /> {label}
    </a>
  );
}

export function HelpButton() {
  return (
    <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5">
      <Link
        to="/faq"
        className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2.5 text-sm font-medium shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary"
      >
        <HelpCircle className="h-4 w-4" /> Need help?
      </Link>
      <a
        href={whatsappUrl()}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("whatsapp_click", { location: "floating" })}
        aria-label={`Chat with us on WhatsApp at ${SITE.whatsapp.display}`}
        className="inline-flex h-11 items-center gap-2 rounded-full bg-[#25D366] px-3.5 text-sm font-semibold text-[#06260f] shadow-lg shadow-black/25 transition-all hover:-translate-y-0.5 hover:bg-[#20bd5a] sm:px-4"
      >
        <MessageCircle className="h-5 w-5" aria-hidden /> <span className="hidden sm:inline">WhatsApp</span>
      </a>
    </div>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">Skip to content</a>
      <Navbar />
      <main id="main" className="flex-1">{children}</main>
      <Footer />
      <HelpButton />
    </div>
  );
}

// ---- Waitlist --------------------------------------------------------------
export function WaitlistForm({ source, cta = "Join waitlist", compact }: { source: string; cta?: string; compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<{ status: "idle" | "loading" | "ok" | "error"; message: string }>({ status: "idle", message: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email)) return setState({ status: "error", message: "Please enter a valid email address." });
    setState({ status: "loading", message: "" });
    const r = await joinWaitlist(email, source);
    if (r.ok) track("waitlist_signup", { source });
    setState({ status: r.ok ? "ok" : "error", message: r.message });
  }

  if (state.status === "ok") {
    return (
      <div className="flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 p-3 text-sm">
        <CheckCircle2 className="h-4 w-4 text-primary" /> {state.message}
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="w-full space-y-2">
      <div className={cn("flex gap-2", compact && "flex-col sm:flex-row")}>
        <Input type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email address" required maxLength={254} />
        <Button type="submit" disabled={state.status === "loading"}>
          {state.status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />} {cta}
        </Button>
      </div>
      {state.status === "error" && <p className="text-sm text-destructive">{state.message}</p>}
    </form>
  );
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        if (await copyText(text)) {
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        }
      }}
    >
      {done ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />} {done ? "Copied" : label}
    </Button>
  );
}

export function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-secondary/40">
      <div className="flex items-center justify-between border-b px-3 py-1.5">
        <span className="text-xs text-muted-foreground">{label ?? "Copy and run"}</span>
        <CopyButton text={code} />
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-xs leading-6">{code}</pre>
    </div>
  );
}

