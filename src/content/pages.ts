import { guides, type Faq } from "./guides";

export interface PageMeta {
  path: string;
  title: string; // 50-60 chars
  description: string; // 140-160 chars
  ogName: string; // file name in /og
  ogLabel: string; // text rendered on the OG image
  noindex?: boolean;
  priority: number;
}

export const staticPages: PageMeta[] = [
  {
    path: "/",
    title: "Lovable Cloud to Supabase Migration Tool (Free, 3 Steps)",
    description:
      "The free Lovable Cloud to Supabase migration tool: move your database, users and files to your own Supabase project in minutes. Secure, no coding needed.",
    ogName: "home",
    ogLabel: "Lovable Cloud to Supabase Migration Tool",
    priority: 1,
  },
  {
    path: "/guide",
    title: "Lovable Cloud to Supabase Guides and Tutorials (2026)",
    description:
      "All our guides for moving a Lovable project to Supabase: export the database, migrate auth users and storage, deploy edge functions and update your env.",
    ogName: "guides",
    ogLabel: "Lovable Cloud to Supabase Guides",
    priority: 0.8,
  },
  {
    path: "/compare/lovable-cloud-vs-supabase",
    title: "Lovable Cloud vs Supabase: Which Backend Should You Use?",
    description:
      "Compare Lovable Cloud and Supabase on pricing, ownership, database access, scaling and vendor lock-in, and learn when it makes sense to move your backend.",
    ogName: "compare-lovable-cloud-vs-supabase",
    ogLabel: "Lovable Cloud vs Supabase: Which Backend Should You Use?",
    priority: 0.8,
  },
  {
    path: "/troubleshooting",
    title: "Lovable to Supabase Migration Errors and How to Fix Them",
    description:
      "Fix common Lovable to Supabase migration errors: foreign key violations, duplicate keys, RLS blocking data, login failures, missing migrations and secrets.",
    ogName: "troubleshooting",
    ogLabel: "Lovable to Supabase Migration Errors and How to Fix Them",
    priority: 0.8,
  },
  {
    path: "/faq",
    title: "Lovable Cloud to Supabase Migration FAQ: Safety, Cost, Time",
    description:
      "Answers to the most common questions about migrating Lovable Cloud to Supabase: is it safe, how long it takes, what it costs and whether you can lose data.",
    ogName: "faq",
    ogLabel: "Lovable Cloud to Supabase Migration FAQ",
    priority: 0.7,
  },
  {
    path: "/about",
    title: "About the Lovable Cloud to Supabase Migrator Project",
    description:
      "Who builds the free Lovable Cloud to Supabase migrator, why it exists, how it handles security and privacy, and how to contact us with feedback or questions.",
    ogName: "about",
    ogLabel: "About the Lovable Cloud to Supabase Migrator",
    priority: 0.4,
  },
  {
    path: "/privacy",
    title: "Privacy Policy: How the Migrator Handles Your Data",
    description:
      "Our privacy policy explains what the migrator stores (waitlist emails and anonymous counters), what it never stores (keys, tokens, your data) and your rights.",
    ogName: "privacy",
    ogLabel: "Privacy Policy",
    priority: 0.3,
  },
  {
    path: "/terms",
    title: "Terms of Service for the Lovable to Supabase Migrator",
    description:
      "The terms for using the free Lovable Cloud to Supabase migrator: acceptable use, no warranty, your responsibility to keep backups and limits of liability.",
    ogName: "terms",
    ogLabel: "Terms of Service",
    priority: 0.3,
  },
  {
    path: "/blog",
    title: "Lovable and Supabase Blog: Migration Tips and Updates",
    description:
      "News, tips and tutorials about Lovable, Supabase and moving between backends. New posts are coming soon; meanwhile read our step-by-step migration guides.",
    ogName: "blog",
    ogLabel: "Lovable and Supabase Blog",
    priority: 0.4,
  },
];

export const guidePages: PageMeta[] = guides.map((g) => ({
  path: `/guide/${g.slug}`,
  title: g.title,
  description: g.description,
  ogName: `guide-${g.slug}`,
  ogLabel: g.h1,
  priority: g.slug === "lovable-cloud-to-supabase" ? 0.95 : 0.8,
}));

export const noindexPages: PageMeta[] = [
  { path: "/404", title: "Page not found | Lovable Cloud to Supabase Migrator", description: "The page you requested could not be found.", ogName: "home", ogLabel: "", noindex: true, priority: 0 },
];

export const allPages: PageMeta[] = [...staticPages, ...guidePages];
export const pageMeta = (path: string) => [...allPages, ...noindexPages].find((p) => p.path === path)!;

// ---------------------------------------------------------------- FAQ (shared)
export const faqs: Faq[] = [
  { q: "Is it safe to migrate Lovable Cloud to Supabase with this tool?", a: "Yes. You sign in with Supabase's official OAuth screen and GitHub access is read-only. Credentials are used in memory during a request and are never stored or logged. The tool only writes to your new project and never changes Lovable Cloud, so your original data stays intact." },
  { q: "How long does a Lovable Cloud to Supabase migration take?", a: "Most projects finish in 20 to 40 minutes including creating the Supabase project. Large tables take longer because rows are inserted in batches of 500." },
  { q: "Can I lose data during the migration?", a: "The migration only copies data into a new project. Lovable Cloud is never modified, so nothing is deleted and you can repeat the process. Keep your CSV exports as a backup anyway." },
  { q: "How much does it cost?", a: "The migrator is free. Supabase has a free tier, and larger projects may need a paid plan. See supabase.com/pricing for current limits." },
  { q: "Will my users keep their passwords?", a: "Yes for email and password accounts. User ids and bcrypt password hashes are copied exactly, so existing logins keep working. Social logins like Google must be re-enabled in your Supabase dashboard." },
  { q: "Do I need to know how to code?", a: "No. The wizard guides you step by step. You only copy and paste a couple of SQL queries and drop files into the page." },
  { q: "What about edge functions and secrets?", a: "Code is deployed with the Supabase CLI. The tool lists your functions, the secret names they use and the exact commands. Secret values are never exported, so you re-enter them." },
  { q: "What if my Lovable project has no supabase/migrations folder?", a: "The tool includes a SQL query that rebuilds your schema from the live database. It is a best-effort rebuild, so review the result before running it." },
  { q: "Can I move back to Lovable Cloud later?", a: "Your Lovable project still points to its original backend until you change the environment variables, so you can switch back by restoring the old values." },
  { q: "How much does Lovable Cloud cost?", a: "Lovable Cloud is billed by usage on top of your Lovable plan, so the cost depends on database size, storage, bandwidth and function calls. Our [Lovable Cloud pricing guide](/guide/lovable-cloud-pricing) explains what drives the cost and how to estimate it." },
  { q: "Can I self-host a Lovable app?", a: "Yes. Export the code through GitHub, build it, host the static files anywhere and point it at your own Supabase project. See [how to self-host a Lovable app](/guide/self-host-lovable-app)." },
  { q: "How do I export my project from Lovable?", a: "Sync it to GitHub for the code, export each table as CSV, export users with a SQL query and download your storage files. The [export guide](/guide/export-lovable-project) combines all four." },
  { q: "Does Supabase have vendor lock-in?", a: "Less than most backend platforms: it is built on open-source Postgres and can be self-hosted, and your data exports in standard formats. See the [portability section](/compare/lovable-cloud-vs-supabase#vendor-lock-in) of our comparison." },
  { q: "Does Lovable offer a migration service?", a: "Check the official Lovable documentation for what Lovable itself offers. This site is an independent free tool, and a done-for-you migration service is on the waitlist." },
  { q: "Can someone migrate my Lovable prototype to a real backend for me?", a: "You can do it yourself in about 20 to 40 minutes with the free tool. If you would rather have it done for you, join the done-for-you waitlist." },
  { q: "Is this affiliated with Lovable or Supabase?", a: "No. This is an independent community tool. Lovable and Supabase are trademarks of their respective owners." },
];

// ------------------------------------------------------- Troubleshooting
export interface TroubleItem {
  id: string;
  h2: string;
  symptom: string;
  causes: string[];
  fix: string[];
  code?: { label: string; code: string };
}

export const troubleshooting: TroubleItem[] = [
  {
    id: "foreign-key-violation",
    h2: "Foreign key violation when importing table data",
    symptom: 'Error like: insert or update on table "comments" violates foreign key constraint "comments_post_id_fkey".',
    causes: [
      "A child table was imported before its parent table, so the referenced row does not exist yet.",
      "The table references auth.users(id) and your users have not been imported yet.",
      "A CSV file is missing rows that other tables point to.",
    ],
    fix: [
      "Import parent tables first. The migrator reads your foreign keys and sorts the tables for you; by hand, start with tables that reference nothing.",
      "If a column references auth.users, import your auth users before that table.",
      "Compare row counts of parent tables with the source to make sure no rows are missing.",
      "For circular references, import the table with the foreign key relaxed (set the constraint to DEFERRABLE) or load in two passes.",
    ],
  },
  {
    id: "duplicate-key",
    h2: "Duplicate key value violates unique constraint",
    symptom: 'Error like: duplicate key value violates unique constraint "profiles_pkey".',
    causes: [
      "You ran the same import twice, so the rows already exist.",
      "A trigger on auth.users already created the profile rows, and your CSV tries to insert them again.",
      "Two CSV files were mapped to the same table.",
    ],
    fix: [
      "If a previous run partly succeeded, truncate the affected table and import again from scratch.",
      "If a trigger creates profile rows, import the CSV first with the trigger disabled, or update the existing rows instead of inserting.",
      "Check the mapping table so each CSV maps to a different table.",
    ],
    code: { label: "SQL: clear a table before re-importing (careful, deletes rows)", code: "truncate table public.profiles restart identity cascade;" },
  },
  {
    id: "rls-blocking-data",
    h2: "Row Level Security is blocking data",
    symptom: "The import succeeds but the app shows empty lists, or inserts from the app fail with a permission error.",
    causes: [
      "RLS policies were not created because a migration file failed or was skipped.",
      "Policies reference functions (like has_role) that were not created yet.",
      "The app uses the new publishable key but the policies still expect a different role.",
    ],
    fix: [
      "In the Supabase dashboard open Authentication → Policies and confirm each table has the policies from your migration files.",
      "Re-run the schema migration; skip safe 'already exists' messages.",
      "Test as a logged-in user, not only as the service role, because the service role bypasses RLS and hides the problem.",
    ],
    code: { label: "SQL: list policies and RLS status", code: "select schemaname, tablename, policyname, cmd from pg_policies where schemaname = 'public' order by tablename;\nselect relname, relrowsecurity from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r';" },
  },
  {
    id: "users-cannot-log-in",
    h2: "Users can't log in after the migration",
    symptom: "Invalid login credentials for accounts that worked before.",
    causes: [
      "User ids or password hashes were not copied exactly.",
      "The auth.identities row for email sign-in is missing.",
      "The user signed in with Google before and has no password.",
      "The app still points at the old project, or the Site URL and redirect URLs are wrong.",
    ],
    fix: [
      "Compare one user's id and encrypted_password between the old and new projects.",
      "Check that auth.identities has an 'email' row for the user.",
      "Re-enable Google (or the provider used) under Authentication → Sign In / Providers.",
      "Verify your .env values and set the Site URL in Authentication → URL Configuration. See [Connect your Lovable app to your new Supabase project](/guide/update-env-after-migration).",
    ],
    code: { label: "SQL: check a user and identity", code: "select u.id, u.email, left(u.encrypted_password, 7) as hash_prefix, i.provider\nfrom auth.users u left join auth.identities i on i.user_id = u.id\nwhere u.email = 'person@example.com';" },
  },
  {
    id: "missing-migrations-folder",
    h2: "Missing supabase/migrations folder",
    symptom: "The repository or ZIP has no supabase/migrations files, so there is no schema to replay.",
    causes: [
      "The project was never synced to GitHub, or an older sync is being used.",
      "The structure exists only in the live database.",
      "The ZIP was downloaded from the wrong branch.",
    ],
    fix: [
      "Make sure you downloaded the default branch of the correct repository. See [How to sync your Lovable project to GitHub](/guide/sync-lovable-to-github).",
      "Use the SQL query in the [export guide](/guide/export-lovable-cloud-database) to rebuild CREATE statements from the live database, then paste the result into the migrator.",
      "Review the rebuilt schema for sequences and extensions, which are not included.",
    ],
  },
  {
    id: "edge-function-secrets-missing",
    h2: "Edge function secrets are missing",
    symptom: "A function returns 500 errors, or logs show a variable is undefined or an API key is invalid.",
    causes: [
      "Secrets are never exported from Lovable, so the new project has none.",
      "A secret was set with a typo in its name.",
      "The function was not redeployed after secrets changed.",
    ],
    fix: [
      "Search your function code for Deno.env.get( to list the exact names.",
      "Set each one again with supabase secrets set NAME=value, then check with supabase secrets list.",
      "Redeploy the function and check its logs in the Supabase dashboard. See [Deploy Lovable edge functions on your own Supabase](/guide/deploy-lovable-edge-functions).",
    ],
    code: { label: "Terminal", code: "supabase secrets set MY_KEY=value\nsupabase secrets list\nsupabase functions deploy my-function" },
  },
];

// -------------------------------------------------------- Compare table
export const compareRows: { topic: string; cloud: string; supabase: string }[] = [
  { topic: "Who owns the backend", cloud: "Managed inside your Lovable account", supabase: "A project in your own Supabase account and organization" },
  { topic: "Database access", cloud: "Through the Lovable interface (table view, SQL editor)", supabase: "Full Supabase dashboard, SQL editor, logs, backups, direct connection strings" },
  { topic: "Setup effort", cloud: "None. It is created for you", supabase: "Create a project and connect it (about two minutes, then a migration)" },
  { topic: "Scaling and compute", cloud: "Set by the platform", supabase: "You choose region, compute size and plan" },
  { topic: "Pricing model", cloud: "Usage-based charges on top of your Lovable plan", supabase: "Published Supabase plans plus usage, itemised on your own bill" },
  { topic: "Vendor lock-in", cloud: "Same Postgres foundation, but the project is managed inside Lovable", supabase: "Open-source Postgres, standard exports and self-hosting possible" },
  { topic: "Cost visibility", cloud: "Bundled with your Lovable usage", supabase: "Published, usage-based Supabase pricing you can monitor" },
  { topic: "Portability", cloud: "Export in pieces (schema from GitHub, CSV, SQL)", supabase: "Standard Supabase project; can be moved or self-hosted later" },
  { topic: "Integrations", cloud: "Whatever the platform exposes", supabase: "Any tool that connects to Postgres or the Supabase APIs" },
];

export const compareFaqs: Faq[] = [
  { q: "Is Lovable Cloud the same as Supabase?", a: "They are built on the same technology, but they are not the same thing. Lovable Cloud is a managed backend inside Lovable. Supabase is a backend platform you can use directly with your own account, billing and dashboard." },
  { q: "Lovable vs Supabase: which is better?", a: "They do different jobs. Lovable is an AI app builder; Supabase is the database, auth, storage and functions behind an app. The real choice is whether your app's backend is managed by Lovable (Lovable Cloud) or owned by you (your own Supabase project)." },
  { q: "Is Supabase cheaper than Lovable Cloud?", a: "It depends on your usage. Supabase publishes its pricing and lets you choose compute size, which makes costs predictable. Compare your own numbers using our [Lovable Cloud pricing guide](/guide/lovable-cloud-pricing)." },
  { q: "Does Supabase have vendor lock-in?", a: "Less than most backend platforms. It is built on open-source Postgres, can be self-hosted and exports data in standard formats. Some features, such as its auth schema and APIs, are Supabase-specific, so a move still takes planning." },
  { q: "Can I use Supabase with Lovable?", a: "Yes. A Lovable app talks to Supabase through the standard client library, using your project URL and publishable key. See [how to connect Supabase to Lovable](/guide/connect-supabase-to-lovable)." },
  { q: "Can I move from Lovable Cloud to Supabase later?", a: "Yes, and nothing in your app has to be rewritten. Follow the [complete migration guide](/guide/lovable-cloud-to-supabase) or use the free migration tool." },
  { q: "Is Supabase open source?", a: "Yes. Supabase is open source and can be self-hosted with Docker. See our [self-hosting guide](/guide/self-host-lovable-app)." },
  { q: "Can I self-host Supabase?", a: "Yes, using the official self-hosting setup. It gives you the most control and the most operational responsibility, so most teams use a managed Supabase project instead." },
];
