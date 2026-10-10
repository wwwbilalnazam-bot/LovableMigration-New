import type { Guide } from "./guides";

const LOVABLE_DOCS = "https://docs.lovable.dev/";
const SB_DOCS = "https://supabase.com/docs";

// Guides written from Search Console query data (pricing, export, self-hosting, integration).
export const extraGuides: Guide[] = [
  {
    slug: "lovable-cloud-pricing",
    title: "Lovable Cloud Pricing and Costs: What You Actually Pay",
    description:
      "Understand Lovable Cloud pricing and costs: what drives charges for database, storage and edge functions, how to estimate your bill and compare with Supabase.",
    h1: "Lovable Cloud Pricing and Costs: What You Actually Pay",
    keyword: "Lovable Cloud pricing",
    cardBlurb: "What drives Lovable Cloud costs, how to estimate them and how they compare with your own Supabase.",
    quick:
      "Lovable Cloud pricing is usage-based: on top of your Lovable plan you pay for what your backend uses, mainly database size, file storage, bandwidth and edge function calls, after any free allowance Lovable includes. Exact rates change, so check Lovable's pricing page, and use the estimate worksheet below to compare it with your own Supabase project.",
    intro: [
      "Lovable Cloud pricing is one of the most searched questions about the platform, and the honest answer is that it depends on how much your app uses. Lovable Cloud is billed by usage rather than as one flat fee, so a small prototype can cost very little while a busy app with large files and many users costs more.",
      "This guide explains what drives the cost, how to estimate your own bill, what the storage and quota questions really mean, and how it compares with running your own Supabase project. We deliberately do not copy price numbers here, because they change; always confirm current figures on [Lovable's pricing page](https://lovable.dev/pricing) and in the [Lovable docs](" + LOVABLE_DOCS + ").",
    ],
    sections: [
      {
        h2: "How Lovable Cloud costs are structured",
        paras: [
          "There are two separate things to keep apart. Your Lovable plan pays for building: the AI assistant, credits and workspace features. Lovable Cloud is the backend your finished app runs on, and it is metered by usage.",
          "In practice the backend charges come from the same few resources that any Postgres-based backend uses. Knowing them lets you predict a bill instead of being surprised by it.",
        ],
        bullets: [
          "**Database size and compute.** How much data you store and how hard the database works to serve requests.",
          "**File storage.** Total gigabytes in your buckets. Images, videos and PDFs add up faster than table rows.",
          "**Bandwidth (egress).** Data sent to your users. Large public files that many people download are the usual cause of a high bill.",
          "**Edge function invocations.** How many times your server-side functions run, and for how long.",
          "**Authentication.** The number of monthly active users, on some platforms.",
        ],
      },
      {
        h2: "How to estimate your own Lovable Cloud cost",
        steps: [
          { title: "Measure your database", body: ["Count your rows and estimate size. In the SQL editor, `select pg_size_pretty(pg_database_size(current_database()));` shows the total database size."], shot: "Lovable Cloud SQL editor showing a database size query used to estimate Lovable Cloud pricing" },
          { title: "Measure your storage", body: ["Add up the size of every bucket. Public buckets with big files matter most because every download counts as bandwidth."] },
          { title: "Estimate traffic", body: ["Multiply monthly visitors by the average data each visit loads (images included) to get a rough bandwidth figure."] },
          { title: "Count function calls", body: ["Estimate how many times per user per day your edge functions run, then multiply by your monthly users."] },
          { title: "Apply the current rates", body: ["Put your four numbers against the rates on the official pricing page. Repeat the same numbers against Supabase's pricing page to compare."] },
        ],
        code: { label: "SQL: size of each table, largest first", code: "select relname as table, pg_size_pretty(pg_total_relation_size(relid)) as size\nfrom pg_catalog.pg_statio_user_tables\norder by pg_total_relation_size(relid) desc;" },
      },
      {
        h2: "Lovable Cloud storage pricing and storage limits",
        paras: [
          "Searches for storage pricing, storage quota and storage limit all come down to two numbers: how much total storage you get at your price tier, and the largest single file you can upload. Both are set by the platform and can change, so read them on the official pricing page rather than relying on a blog post.",
          "When you move to your own Supabase project, the same two questions apply. Supabase publishes per-plan storage allowances and a maximum upload size that you can raise on paid plans. See the [Supabase Storage docs](" + SB_DOCS + "/guides/storage) and [pricing page](https://supabase.com/pricing). If you serve a lot of large files, also look at bandwidth, which usually costs more than storage itself.",
        ],
      },
      {
        h2: "Lovable Cloud cost vs your own Supabase project",
        paras: [
          "Because Lovable Cloud and Supabase use the same Postgres foundation, the resources you pay for are the same. The difference is how clearly you can see and control them.",
          "With your own Supabase project you see published pricing, pick the compute size, watch usage graphs in the dashboard and get an itemised bill from Supabase itself. Many builders move for exactly that predictability, plus direct database access. Others stay on Lovable Cloud because one place for the app and the backend is worth the convenience. Neither is wrong: compare your own numbers.",
        ],
        bullets: [
          "Small prototype or internal tool: the cost difference is usually small, so convenience wins.",
          "Growing app with real users: published pricing and the ability to choose compute size make costs easier to forecast.",
          "File-heavy app: compare bandwidth and storage rates carefully on both sides.",
        ],
      },
      {
        h2: "How to keep Lovable Cloud costs down",
        bullets: [
          "Compress and resize images before upload instead of storing originals.",
          "Add indexes for slow queries so the database does less work per request.",
          "Cache responses that do not change often and avoid calling edge functions on every page view.",
          "Delete unused files and old test data.",
          "Check usage regularly so a spike never goes unnoticed for a month.",
        ],
        paras: ["If you decide to move, the [complete migration guide](/guide/lovable-cloud-to-supabase) and the [free migration tool](/migrate) take about 20 to 40 minutes. Our [comparison of Lovable Cloud and Supabase](/compare/lovable-cloud-vs-supabase) covers the non-cost trade-offs."],
      },
    ],
    faq: [
      { q: "How much does Lovable Cloud cost?", a: "Lovable Cloud is billed by usage on top of your Lovable plan, so the cost depends on database size, storage, bandwidth and function calls. Check Lovable's pricing page for the current rates and free allowance." },
      { q: "Is Lovable Cloud free?", a: "Lovable usually includes some free usage, but allowances change over time. Confirm the current free allowance on the official pricing page before relying on it." },
      { q: "Why is my Lovable Cloud bill higher than expected?", a: "The usual causes are large public files served to many users (bandwidth), growing storage, and edge functions that run on every request." },
      { q: "Is my own Supabase project cheaper than Lovable Cloud?", a: "It depends on your usage. Supabase publishes its pricing and lets you choose compute size, which makes costs predictable. Compare your own numbers on both pricing pages." },
      { q: "Does moving to Supabase cost anything?", a: "Our migration tool is free. You then pay Supabase according to its plans; it has a free tier that fits many small projects." },
      { q: "What is the Lovable Cloud storage limit?", a: "Storage allowance and maximum file size depend on your plan and can change. Check the official Lovable pricing and documentation pages for the current limits." },
    ],
    related: ["lovable-cloud-to-supabase", "export-lovable-project", "self-host-lovable-app"],
  },

  {
    slug: "export-lovable-project",
    title: "How to Export Your Lovable Project: Code, Data and Files",
    description:
      "How to export your Lovable project: download the code from GitHub, export tables as CSV, copy auth users and storage files, and keep a safe backup of it all.",
    h1: "How to Export Your Lovable Project: Code, Data and Files",
    keyword: "export Lovable project",
    cardBlurb: "Everything you can export from Lovable: code, database, users, files, plus a backup checklist.",
    quick:
      "To export your Lovable project, connect it to GitHub and download the repository as a ZIP for the code, then export each database table as a CSV, export auth users with a SQL query, and download your storage files. Keep all four together as a full backup, and you can restore or migrate them to any Supabase project.",
    intro: [
      "When people search how to export from Lovable, they usually mean one of four different things: the app's code, the database, the users, or the uploaded files. You can export your Lovable project completely, but each part comes from a different place, which is why it feels confusing at first.",
      "This guide gives you one checklist for all four, explains where each export lives, and shows how to turn the pile of files into a working backup. Everything here is read-only: exporting never changes your live app. When you are ready to move, the [free migration tool](/migrate) takes these exports and loads them into your own Supabase project.",
    ],
    sections: [
      {
        h2: "The four parts of a Lovable export",
        bullets: [
          "**Code:** your front-end app and the `supabase` folder (schema migrations and edge functions). Exported through GitHub.",
          "**Database data:** the rows in each table. Exported as CSV files.",
          "**Auth users:** ids, emails and password hashes. Exported with a SQL query.",
          "**Storage files:** images, documents and other uploads. Downloaded from each bucket.",
        ],
        paras: ["Code is the only part that is not data, which is why GitHub is the first stop."],
      },
      {
        h2: "Step by step: export your Lovable project code",
        steps: [
          { title: "Connect the project to GitHub", body: ["In your Lovable project, open the GitHub connection and create a repository. The full walkthrough is in [how to sync your Lovable project to GitHub](/guide/sync-lovable-to-github)."], shot: "Lovable project settings showing how to export your Lovable project code to GitHub" },
          { title: "Download or clone it", body: ["On github.com choose **Code → Download ZIP**, or clone with git. You now own a full copy of your app's source code."], code: { label: "Terminal: clone your exported project", code: "git clone https://github.com/YOUR_USER/YOUR_REPO.git\ncd YOUR_REPO\nnpm install\nnpm run build" } },
        ],
      },
      {
        h2: "Export your database and users",
        paras: [
          "Your schema is already in the code, in `supabase/migrations`. The rows are not, so export each table as CSV from the database view in Lovable's Cloud area. Name each file after its table. The detailed steps, plus a SQL fallback when there is no migrations folder, are in [how to export your Lovable Cloud database](/guide/export-lovable-cloud-database).",
          "Auth users come from a query on `auth.users`, covered in [Migrate Lovable Cloud users to Supabase](/guide/migrate-lovable-auth-users). Treat that CSV as sensitive because it includes password hashes.",
        ],
      },
      {
        h2: "Export your storage files",
        paras: ["Download the files of every bucket and keep the folder structure and the bucket names, because database columns often store file paths. See [how to move your storage files](/guide/migrate-lovable-storage-files) for the restore side."],
      },
      {
        h2: "Make it a real backup",
        bullets: [
          "Put the four exports in one dated folder, for example `lovable-backup-2026-10-10`.",
          "Record the row count of every table so you can verify a restore.",
          "Store one copy offline or in a second cloud location, and keep the users CSV encrypted.",
          "Test the backup by restoring it into a throwaway Supabase project, not on the day you need it.",
          "Repeat before any big change and on a regular schedule if your data changes daily.",
        ],
        paras: ["The [Lovable documentation](" + LOVABLE_DOCS + ") and the [Supabase backup docs](" + SB_DOCS + "/guides/platform/backups) describe the platform-side options."],
      },
      {
        h2: "What to do with your export",
        paras: [
          "An export gives you freedom. You can keep it as insurance, [migrate to your own Supabase project](/guide/lovable-cloud-to-supabase), or [self-host the whole app](/guide/self-host-lovable-app) on infrastructure you control.",
        ],
      },
    ],
    faq: [
      { q: "How do I export my code from Lovable?", a: "Connect the project to GitHub, then download the repository as a ZIP or clone it. That gives you the complete source code, including the supabase folder." },
      { q: "Can I export my Lovable database?", a: "Yes. Export each table as CSV, take the schema from supabase/migrations in GitHub and export users with a SQL query. A migration tool can then load everything into Supabase." },
      { q: "Does exporting affect my live app?", a: "No. Every export step is read-only and does not interrupt your users." },
      { q: "Is there a one-click full export?", a: "Exports are split by type: code through GitHub, data as CSV, users via SQL and files by download. This guide combines them into one checklist." },
      { q: "Can I back up my Lovable project automatically?", a: "GitHub keeps your code history automatically. For data, schedule regular exports, or move to your own Supabase project where backup options are built into the dashboard." },
    ],
    related: ["export-lovable-cloud-database", "sync-lovable-to-github", "lovable-cloud-to-supabase"],
  },

  {
    slug: "self-host-lovable-app",
    title: "How to Self-Host a Lovable App (Frontend and Backend)",
    description:
      "Self-host your Lovable app: export the code, build it, host the front end anywhere and run the backend on your own Supabase project or a self-hosted Supabase.",
    h1: "How to Self-Host a Lovable App: Front End and Backend",
    keyword: "self-host Lovable app",
    cardBlurb: "Export, build and host your Lovable app on your own infrastructure, with your own backend.",
    quick:
      "To self-host a Lovable app, export the code through GitHub, run npm install and npm run build to produce static files, upload the dist folder to any web host, and point the app at a backend you own: either your own Supabase project, or a self-hosted Supabase running on your server. Set the three Supabase environment variables before you build.",
    intro: [
      "To self-host a Lovable app you need to solve two separate problems: where the front end runs, and where the backend lives. The good news is that a Lovable app is a standard React and Vite project, so it runs almost anywhere once you have the code.",
      "This guide covers both halves, from the quickest option (your own Supabase project and a static host) to full self-hosting on a server you control. If your main worry is vendor lock-in or moving your app to your own hosting, this is the page to follow, and the [migration tool](/migrate) handles the backend move for you.",
    ],
    sections: [
      {
        h2: "What self-hosting a Lovable app really means",
        paras: [
          "A Lovable app has a front end (the pages and logic users see) and a backend (database, users, files and functions). Self-hosting means you run both on infrastructure you choose instead of relying on a managed environment.",
          "There is a spectrum. Most people stop at the middle option, which removes day-to-day dependence while keeping operations simple.",
        ],
        bullets: [
          "**Option 1: own Supabase project + managed static host.** Front end on Vercel, Netlify or Cloudflare Pages, backend on your own Supabase account. Easiest and cheapest to operate.",
          "**Option 2: own Supabase project + your own server.** Front end served by nginx or Caddy on a VPS, backend still on Supabase.",
          "**Option 3: everything on your server.** Front end and a self-hosted Supabase (open source) running in Docker.",
        ],
      },
      {
        h2: "Step 1: Export the code and the backend",
        steps: [
          { title: "Get the code", body: ["Connect the project to GitHub and download it, as described in [how to export your Lovable project](/guide/export-lovable-project)."], shot: "Repository downloaded as a ZIP when you self-host a Lovable app" },
          { title: "Move the backend", body: ["Create your own Supabase project and migrate the database, users, files and functions with the [complete migration guide](/guide/lovable-cloud-to-supabase) or the free tool."] },
        ],
      },
      {
        h2: "Step 2: Build the front end",
        paras: ["Set the three environment variables for your new backend in a `.env` file, then build. Vite bakes these values into the build, so you must rebuild whenever they change."],
        code: { label: "Terminal: build the app", code: 'echo \'VITE_SUPABASE_URL="https://YOUR_REF.supabase.co"\nVITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"\nVITE_SUPABASE_PROJECT_ID="YOUR_REF"\' > .env\nnpm install\nnpm run build   # outputs the static site to dist/' },
      },
      {
        h2: "Step 3: Host the static files",
        paras: ["The `dist` folder is plain HTML, CSS and JavaScript. Upload it to any static host. Because the app is a single-page app, configure the host to serve `index.html` for unknown paths, otherwise a refresh on a deep link shows a 404."],
        bullets: [
          "**Vercel, Netlify, Cloudflare Pages:** connect the repository, set the build command to `npm run build` and the output folder to `dist`, and add the three environment variables in the dashboard.",
          "**Your own server:** copy `dist` to the server and serve it with nginx, as below.",
        ],
        code: { label: "nginx: serve a single-page app", code: "server {\n  listen 80;\n  server_name your-domain.com;\n  root /var/www/your-app/dist;\n  index index.html;\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n}" },
      },
      {
        h2: "Step 4 (optional): Self-host Supabase itself",
        paras: [
          "If you need the backend on your own servers too, Supabase is open source and can be run with Docker. This gives you the most control and the most responsibility: you handle backups, upgrades, security patches, monitoring and scaling. Follow the official [self-hosting guide](" + SB_DOCS + "/guides/self-hosting), and move your data with the same schema, CSV and users steps as above.",
          "Most teams find that a managed Supabase project plus their own front-end hosting is the right balance. Self-host the backend only if you have a clear compliance or cost reason and someone to operate it.",
        ],
      },
      {
        h2: "Checklist before you switch DNS",
        bullets: [
          "The app loads and you can sign in against the new backend.",
          "Auth redirect URLs and the Site URL in Supabase point to your real domain.",
          "Edge functions are [deployed](/guide/deploy-lovable-edge-functions) and their secrets are set.",
          "HTTPS is enabled, and deep links work after a refresh.",
          "You have a [backup](/guide/export-lovable-project) and a way to roll back.",
        ],
      },
    ],
    faq: [
      { q: "Can I self-host a Lovable app?", a: "Yes. A Lovable app is a standard React and Vite project. Export the code from GitHub, build it and host the static files anywhere, with your backend on your own Supabase project." },
      { q: "Do I have to self-host the database too?", a: "No. Most people use their own managed Supabase project. Self-hosting Supabase with Docker is optional and adds operational work." },
      { q: "Why does my self-hosted app show a 404 on refresh?", a: "It is a single-page app. Configure your host to serve index.html for unknown paths, as in the nginx example." },
      { q: "Why does my build still use the old backend?", a: "Vite bakes environment variables into the build. Change them in .env or your host settings and rebuild." },
      { q: "Is self-hosting cheaper?", a: "A static host plus a Supabase project is often inexpensive, but full self-hosting adds your time for maintenance. Compare using the [pricing guide](/guide/lovable-cloud-pricing)." },
    ],
    related: ["lovable-cloud-to-supabase", "export-lovable-project", "update-env-after-migration"],
  },

  {
    slug: "connect-supabase-to-lovable",
    title: "How to Connect Supabase to Lovable: Integration Guide",
    description:
      "How to connect Supabase to Lovable: Lovable Cloud vs your own project, setting the URL and keys, configuring auth, and adding edge function secrets safely.",
    h1: "How to Connect Supabase to Lovable: Integration Guide",
    keyword: "connect Supabase to Lovable",
    cardBlurb: "Link your own Supabase project to a Lovable app: keys, auth, edge functions and secrets.",
    quick:
      "To connect Supabase to Lovable, use your own Supabase project's URL and publishable key as the app's environment variables, make sure its schema, auth settings and Row Level Security policies exist, and add your edge function secrets in Supabase. Lovable's own documentation describes its Supabase integration, and our migration tool moves an existing Lovable Cloud backend into your project.",
    intro: [
      "Many builders ask how to connect Supabase to Lovable, and the answer depends on which starting point you have: a new app that should use your own Supabase from day one, or an existing app on Lovable Cloud that you want to move. The two paths end in the same place: an app talking to a Supabase project that you own.",
      "This guide explains how the connection works, which values matter, and how to set up authentication and edge functions correctly. Lovable's interface changes over time, so use the official [Lovable documentation](" + LOVABLE_DOCS + ") for the exact buttons, and this guide for what the values mean and how to verify them.",
    ],
    sections: [
      {
        h2: "How the Lovable and Supabase connection works",
        paras: [
          "A Lovable app talks to Supabase through the Supabase client library. The client needs only two things: the project URL and a publishable (anon) key. Those are normally supplied through environment variables, `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, plus a project id used by tooling.",
          "Everything else, your tables, auth settings, storage buckets and functions, lives inside the Supabase project. So connecting your own project means making sure that project contains what the app expects.",
        ],
      },
      {
        h2: "Connect Supabase to Lovable: start a new app on your own project",
        steps: [
          { title: "Create the Supabase project", body: ["Sign up at supabase.com and create a project, then note its URL and publishable key from Project Settings → API."], shot: "Supabase project settings showing the URL and keys needed to connect Supabase to Lovable" },
          { title: "Connect it in Lovable", body: ["Follow the Supabase integration steps in the Lovable documentation to link your project. Lovable can then generate tables, policies and functions against it."] },
          { title: "Review what was created", body: ["Open the Supabase dashboard and check the tables and Row Level Security policies that were generated, before real users arrive."] },
        ],
      },
      {
        h2: "Option B: Move an existing Lovable Cloud app to your Supabase",
        paras: [
          "If your app already runs on Lovable Cloud, you copy its backend into your own project and then switch the connection values. The free [migration tool](/migrate) automates the copy, and the [complete guide](/guide/lovable-cloud-to-supabase) explains each step. Then follow [how to update your .env after migrating](/guide/update-env-after-migration).",
        ],
      },
      {
        h2: "Set up authentication correctly",
        bullets: [
          "Set the **Site URL** and **redirect URLs** under Authentication → URL Configuration to your real domain, or sign-in links will return to the wrong place.",
          "Enable each login method you use (email, Google and others) under Authentication → Sign In / Providers. Social providers need your own OAuth credentials.",
          "Decide whether email confirmation is required and check your email templates.",
          "If you moved users from Lovable Cloud, follow [the auth users guide](/guide/migrate-lovable-auth-users) so passwords keep working.",
        ],
        paras: ["The [Supabase Auth docs](" + SB_DOCS + "/guides/auth) cover each provider."],
      },
      {
        h2: "Edge functions and secrets in the connected project",
        paras: [
          "Edge functions run inside your Supabase project and read secrets from it. Set secrets with `supabase secrets set` or in the dashboard under Edge Functions, and read them in code with `Deno.env.get`. Never put secret keys in front-end environment variables, because those are visible to every visitor. The steps are in [how to deploy Lovable edge functions](/guide/deploy-lovable-edge-functions), and the official reference is the [Supabase Edge Functions docs](" + SB_DOCS + "/guides/functions).",
        ],
      },
      {
        h2: "Test the connection",
        bullets: [
          "Sign up or sign in and confirm a row appears in the auth.users table.",
          "Create, read, edit and delete a record as a normal user, to prove RLS policies allow it.",
          "Upload a file and open it.",
          "Call an edge function and read its logs.",
          "Check the Supabase logs for permission errors.",
        ],
      },
    ],
    faq: [
      { q: "How do I connect Supabase to Lovable?", a: "Use your Supabase project's URL and publishable key as the app's environment variables, and make sure its tables, auth settings and policies exist. The Lovable documentation describes its Supabase integration step by step." },
      { q: "Is Lovable Cloud the same as a Supabase project?", a: "Lovable Cloud is a managed backend built on the same technology. A Supabase project you create yourself is one you own and manage directly." },
      { q: "Which Supabase key goes in the front end?", a: "Only the publishable (anon) key. Keep the service role key out of front-end code and use it only in server-side code and edge function secrets." },
      { q: "Why does sign-in redirect to the wrong URL?", a: "The Site URL and redirect URLs in Supabase Auth settings must match your real domain." },
      { q: "Can I switch an existing Lovable app to my own Supabase?", a: "Yes. Migrate the schema, data, users and files, then update the environment variables. Our free migration tool automates the migration." },
    ],
    related: ["update-env-after-migration", "lovable-cloud-to-supabase", "deploy-lovable-edge-functions"],
  },
];
