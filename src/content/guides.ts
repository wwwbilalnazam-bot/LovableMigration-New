// Guide content. Inline markup supported in strings: **bold**, `code`, [text](/internal-or-https://external)

export interface Step {
  title: string;
  body: string[];
  code?: { label: string; code: string };
  shot?: string; // alt text for a screenshot placeholder
}
export interface Section {
  h2: string;
  paras?: string[];
  bullets?: string[];
  steps?: Step[];
  code?: { label: string; code: string };
}
export interface Faq {
  q: string;
  a: string;
}
export interface Guide {
  slug: string;
  title: string; // 50-60 chars
  description: string; // 140-160 chars
  h1: string;
  keyword: string;
  quick: string;
  intro: string[];
  sections: Section[];
  faq: Faq[];
  related: string[];
  cardBlurb: string;
}

import { extraGuides } from "./guides-extra";

const LOVABLE_DOCS = "https://docs.lovable.dev/";
const SB_DOCS = "https://supabase.com/docs";

export const USERS_SQL = `select id, email, encrypted_password, email_confirmed_at,
       raw_user_meta_data, raw_app_meta_data, created_at
from auth.users
order by created_at;`;

const baseGuides: Guide[] = [
  {
    slug: "lovable-cloud-to-supabase",
    title: "How to Migrate Lovable Cloud to Supabase (Complete Guide)",
    description:
      "Step-by-step guide to migrate Lovable Cloud to Supabase: schema, table data, auth users, storage files and edge functions, with a free tool that automates it.",
    h1: "How to Migrate from Lovable Cloud to Supabase",
    keyword: "migrate Lovable Cloud to Supabase",
    cardBlurb: "The complete pillar guide: schema, data, users, files and functions, end to end.",
    quick:
      "To migrate Lovable Cloud to Supabase, sync your project to GitHub to get the schema files, create your own Supabase project, replay the migrations, import your exported table data and auth users, copy your storage files, deploy your edge functions, and finally point your app's environment variables at the new project. The free migrator tool automates every one of those steps in your browser.",
    intro: [
      "If you want to migrate Lovable Cloud to Supabase, the good news is that Lovable Cloud runs on Postgres and Supabase technology, so nothing about your app has to be rewritten. What changes is who owns the backend: instead of a project managed inside Lovable, your database, users and files live in a Supabase project under your own account.",
      "This guide walks through the whole move in the order that avoids errors: schema first, then data, then users, then files and functions. Each step explains what is happening and why, so you can do it by hand, or let the [free migration tool](/migrate) do the repetitive parts for you. Allow roughly 20 to 40 minutes for a typical project.",
      "Whether you call it a Lovable migration, a Lovable to Supabase migration, or simply want to move from Lovable Cloud to Supabase, the process is the same, and it works for any app you built with Lovable.",
    ],
    sections: [
      {
        h2: "What is a Lovable migration?",
        paras: [
          "A Lovable migration means moving the backend of an app you built with Lovable (its database, users, files and functions) out of the managed Lovable Cloud environment and into a Supabase project you own. Your app's code stays the same. After the migration the app talks to your Supabase project instead.",
          "People search for this in many ways: migrate from Lovable, migrate Lovable to Supabase, move a Lovable app to your own hosting, or export a Lovable app. They all describe the same job, and the steps below cover it end to end. If you only want the code, see [how to export your Lovable project](/guide/export-lovable-project).",
        ],
      },
      {
        h2: "Why migrate from Lovable Cloud to your own Supabase project",
        paras: [
          "Lovable Cloud is convenient because it hides the backend. That convenience has trade-offs that start to matter once an app has real users.",
        ],
        bullets: [
          "**Ownership.** Your own Supabase project sits under your account, billing and access controls. You decide who can see the data and when to export it.",
          "**Direct database access.** You get the full Supabase dashboard: SQL editor, table editor, logs, backups and connection strings for external tools.",
          "**Scaling and limits.** You choose the compute size, region and plan, and you can upgrade when traffic grows instead of waiting on a platform limit.",
          "**Cost control.** Supabase pricing is published and predictable, so you can compare it with what you pay today. Check [supabase.com/pricing](https://supabase.com/pricing) for current numbers.",
          "**Portability.** A standard Supabase project can be self-hosted later, which makes it far easier to leave any single vendor.",
        ],
      },
      {
        h2: "What you need before you start",
        bullets: [
          "A Lovable project connected to GitHub (see [how to sync your Lovable project to GitHub](/guide/sync-lovable-to-github)).",
          "A free Supabase account. Sign up at supabase.com with GitHub or email.",
          "CSV exports of your tables and, if you have users, one CSV of your auth users.",
          "Your storage files downloaded to your computer, if your app uses uploads.",
          "About 30 minutes, and a rule: never delete anything in Lovable Cloud until you have tested the new project.",
        ],
        paras: [
          "Migration only copies data into the new project. Your Lovable Cloud backend is not modified, so you can retry as many times as you need.",
        ],
      },
      {
        h2: "Migrate Lovable Cloud to Supabase in 3 stages",
        paras: [
          "Every migration, manual or automated, boils down to the same three stages. Knowing them first makes the detailed steps below easier to follow.",
        ],
        steps: [
          { title: "Connect", body: ["Give the tool (or yourself) access to your GitHub repository and your new Supabase project. The migrator uses the official OAuth sign-in for both, and only reads from GitHub."] },
          { title: "Upload", body: ["Provide the pieces Lovable does not hand over automatically: CSV exports of each table, a CSV of your auth users, and your storage files."] },
          { title: "Migrate", body: ["Run the migration. The schema is replayed in order, rows are inserted parents-first, users keep their ids and password hashes, and files keep their folder paths."] },
        ],
      },
      {
        h2: "Step 1: Sync your Lovable project to GitHub",
        paras: [
          "Your database structure lives in your code as SQL migration files inside `supabase/migrations`. To get those files you need your project in GitHub. In Lovable, use the GitHub connection in the project settings, approve the app, and choose to create a repository.",
          "Once the repository exists, open it on github.com and use **Code → Download ZIP**, or clone it with git. Read the full walkthrough in [our GitHub sync guide](/guide/sync-lovable-to-github). The Lovable documentation at [docs.lovable.dev](" + LOVABLE_DOCS + ") describes the GitHub integration in more detail.",
        ],
      },
      {
        h2: "Step 2: Create your Supabase project",
        steps: [
          { title: "Create an account", body: ["Go to supabase.com and sign up. Continuing with GitHub is the fastest option."], shot: "Supabase sign-up page used to create a free account before migrating from Lovable Cloud" },
          { title: "Create a new project", body: ["Click **New project**, choose a name, pick a region close to your users, and save the database password in a password manager."], shot: "Supabase projects page showing a newly created project" },
          { title: "Wait for it to be healthy", body: ["Provisioning takes a minute or two. When the project overview shows the status **Healthy**, it is ready."], shot: "Supabase project overview after you migrate Lovable Cloud to Supabase, showing the Healthy status" },
        ],
      },
      {
        h2: "Step 3: Move the database schema and RLS policies",
        paras: [
          "The schema is the set of tables, functions, triggers and Row Level Security (RLS) policies. It is stored as timestamped SQL files, and the timestamp in each filename defines the order they must run in. Running them out of order is the most common cause of migration errors.",
          "You have three ways to apply them. Pick one:",
        ],
        bullets: [
          "**The migrator tool.** Upload the ZIP or connect GitHub, and it runs each file in order with live status and Retry, Skip or Stop on errors.",
          "**The Supabase CLI.** Link your project and push the files. See the [Supabase CLI docs](" + SB_DOCS + "/guides/cli).",
          "**The SQL editor.** Open each file in the Supabase SQL editor and run them oldest first.",
        ],
        code: {
          label: "Terminal: apply migrations with the Supabase CLI",
          code: "supabase login\nsupabase link --project-ref YOUR_PROJECT_REF\nsupabase db push",
        },
      },
      {
        h2: "What if there is no migrations folder?",
        paras: [
          "Some projects keep their structure only in the live database. In that case run a query in Lovable Cloud's SQL editor that rebuilds CREATE statements from the system catalogs, then run the result in Supabase. The migrator tool includes a ready-made query for this, and our [export guide](/guide/export-lovable-cloud-database) explains the approach and its limits.",
        ],
      },
      {
        h2: "Step 4: Export and import your table data",
        paras: [
          "Table data is not stored in GitHub, so you export it separately. In Lovable, open the Cloud area, go to the database view, open each table and export it as CSV. Name each file after its table, for example `profiles.csv`, so it can be matched automatically.",
          "Import order matters because of foreign keys. A child table such as `comments` cannot be loaded before the parent table `posts` it references. The tool reads the new database's foreign keys and sorts the tables for you. By hand, work from the tables nothing depends on outward.",
          "Types need care when you import CSV: empty strings must become `NULL`, `true` and `false` must become booleans, and JSON and array columns must be parsed. The tool does this per column type and inserts in batches of 500 rows.",
        ],
      },
      {
        h2: "Step 5: Migrate your auth users and keep their passwords",
        paras: [
          "Users live in the `auth` schema, which is not part of your migration files. Export them with this query in Lovable Cloud's SQL editor, then save the result as CSV.",
          "To keep logins working you must insert users into `auth.users` with the same `id` and the same bcrypt `encrypted_password`, and add a matching `auth.identities` row for email sign-in. Keeping ids identical matters just as much: it keeps your data tables pointing at the right person. The full explanation is in [Migrate Lovable Cloud users to Supabase](/guide/migrate-lovable-auth-users).",
        ],
        code: { label: "SQL: run in Lovable Cloud to export users", code: USERS_SQL },
      },
      {
        h2: "Step 6: Move your storage files",
        paras: [
          "Create each bucket in Supabase with the same name and the same public or private setting, then upload the files keeping the same folder paths. Existing URLs and database columns that store file paths then keep working. See [Move Lovable Cloud storage files to Supabase](/guide/migrate-lovable-storage-files) for details and size limits.",
        ],
      },
      {
        h2: "Step 7: Deploy your edge functions and secrets",
        paras: [
          "Functions are code, so they are deployed rather than copied. With the Supabase CLI, link your project and run `supabase functions deploy` for each function folder in `supabase/functions`.",
          "Secret values are never exported. Search each function for `Deno.env.get(` to list the names it needs, then set them again with `supabase secrets set`. The [edge functions guide](/guide/deploy-lovable-edge-functions) has the exact commands.",
        ],
      },
      {
        h2: "Step 8: Point your app at the new project",
        paras: [
          "Update three values in your `.env` file (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`) and the `project_id` in `supabase/config.toml`. Redeploy the front end. The [environment guide](/guide/update-env-after-migration) covers this and how to test it safely.",
        ],
      },
      {
        h2: "Move from Lovable Cloud to Supabase: what changes technically",
        paras: [
          "Understanding what actually changes makes the migration less intimidating. Your app code does not change: it talks to Supabase through the same client library, using a project URL and a publishable key. What changes is the project those values point to, and everything that project contains.",
          "Your database is the first thing that changes owner. In Lovable Cloud the Postgres instance is created and operated for you. In your own Supabase project you control it: you pick the region and compute size, you can see logs and query performance, and you decide how backups are handled. The tables, columns, indexes and policies are the same, because they come from the same migration files.",
          "Authentication is the second. Users are stored in the `auth` schema, with their ids, emails and password hashes. When you migrate, the same rows are created in the new project. Sessions issued by the old project are not valid in the new one, so signed-in users will be asked to sign in once more. OAuth providers such as Google must be configured again in the new project, with your own OAuth client credentials and the new callback URL that Supabase shows you.",
          "Storage and functions are the third and fourth. Files live in buckets with policies on `storage.objects`, and functions run on the Supabase Edge Functions runtime with their own secrets. None of these is stored in your table data, which is why each needs its own step.",
        ],
      },
      {
        h2: "Plan a safe cutover with no surprises",
        paras: [
          "The safest way to migrate is to treat it as a rehearsal first and a cutover second. Because the migration only reads from Lovable Cloud, you can run it into a fresh Supabase project as many times as you like without any effect on live users.",
        ],
        bullets: [
          "**Rehearse on a throwaway project.** Create a second Supabase project, run the whole migration, and fix every error while nobody is affected. Delete it when you are done.",
          "**Pick a quiet moment for the real run.** New rows written to Lovable Cloud after you export your CSV files will not be in the new project, so migrate when traffic is low, or pause writes briefly.",
          "**Do a final delta export.** If your app keeps writing during the rehearsal, export again right before the cutover and import the new rows only.",
          "**Switch the environment variables last.** Only after the new project has been tested end to end do you change the three values in your `.env` and redeploy.",
          "**Keep the old backend for a while.** Do not delete anything in Lovable Cloud until the new project has run cleanly for a few days. Rolling back is just restoring the old values.",
        ],
      },
      {
        h2: "Security checklist after you migrate",
        paras: [
          "A new project is also a chance to start clean. Spend ten minutes on these checks before you announce the switch.",
        ],
        bullets: [
          "**Rotate anything that was shared.** Delete the personal access token or OAuth authorization you used for the migration, and generate fresh API keys if you pasted any key into a tool.",
          "**Keep the service role key secret.** It bypasses Row Level Security. It belongs in server-side code and edge function secrets only, never in your front-end `.env`.",
          "**Confirm Row Level Security is on.** Every table in the public schema that holds user data should have RLS enabled with at least one policy. A table with RLS enabled and no policies denies all access, which is safe but will look like missing data.",
          "**Test as a real user.** Request data while signed in as an ordinary account and while signed out. The service role hides policy mistakes, so only an ordinary account tells you the truth.",
          "**Review Auth settings.** Set the Site URL and redirect URLs to your real domain, decide whether email confirmation is required, and review password rules.",
          "**Turn on backups.** Check the backup options for your Supabase plan and, for important data, schedule your own exports as well.",
        ],
      },
      {
        h2: "Costs and sizing your new Supabase project",
        paras: [
          "Most small Lovable apps run comfortably on a small Supabase compute size. The things that grow your bill are database size, file storage, bandwidth and, for busy apps, compute. Look at the number of rows and the size of your uploaded files before you choose a plan, and compare them with the limits on [the Supabase pricing page](https://supabase.com/pricing).",
          "A practical approach is to start on the smallest plan that fits your data, watch the usage graphs in the dashboard for a week, and only then change the plan. Because you own the project, you can scale up in minutes when you need to, and you can see exactly what you are paying for.",
        ],
      },
      {
        h2: "After the migration: backups, monitoring and next steps",
        paras: [
          "Once you are live, a few habits keep a self-managed backend healthy. Use the Supabase dashboard to watch database size and API errors. Keep your migration files in Git, and create every future schema change as a new timestamped file, so staging and production never drift apart. If you work with a team, add collaborators to the Supabase organization instead of sharing logins.",
          "Finally, keep your CSV exports and your migration report somewhere safe for a while. They are your proof of what was moved, and a quick way to compare row counts if anything ever looks wrong.",
        ],
      },
      {
        h2: "Verification checklist",
        bullets: [
          "Row counts per table match between Lovable Cloud and Supabase.",
          "You can log in with an existing account and the password still works.",
          "Row Level Security policies exist and a logged-out request cannot read private tables.",
          "Images and files load from their original paths.",
          "Each edge function responds and its secrets are set.",
          "Google or other social providers are re-enabled in the Supabase Auth settings.",
        ],
      },
      {
        h2: "Common problems and how to avoid them",
        paras: [
          "Most failures come from five causes: migrations run out of order, child rows imported before parents, empty strings in non-text columns, missing secrets, and RLS blocking an import. Every one of them is covered, with fixes, in [Lovable to Supabase migration errors and how to fix them](/troubleshooting).",
        ],
      },
      {
        h2: "How long does it take and what does it cost?",
        paras: [
          "A small app finishes in about 20 minutes. Large tables take longer because rows are inserted in batches. The migrator is free. Supabase has a free tier, and bigger projects may need a paid plan; check [Supabase pricing](https://supabase.com/pricing) before you commit.",
        ],
      },
    ],
    faq: [
      { q: "Can I migrate Lovable Cloud to Supabase for free?", a: "Yes. The migrator tool is free, and Supabase offers a free tier that is enough for many small projects. Larger databases or higher traffic may require a paid Supabase plan." },
      { q: "Will my users be able to log in after the migration?", a: "Yes for email and password accounts, as long as ids and password hashes are copied exactly. Social logins such as Google must be re-enabled in your Supabase Auth settings." },
      { q: "Does migrating delete anything from Lovable Cloud?", a: "No. Migration only reads from Lovable Cloud and writes to your new Supabase project. Your original data is untouched, so you can repeat the process." },
      { q: "Do I need to know how to code?", a: "No. The step-by-step wizard needs no coding. The manual route needs only copy and paste into the SQL editor and a terminal." },
      { q: "What about edge functions and their secrets?", a: "Functions are deployed with the Supabase CLI. Secret values cannot be exported, so you re-enter them from their original sources." },
      { q: "How do I migrate from Lovable Cloud to Supabase?", a: "Sync your project to GitHub, create a Supabase project, replay your migration files, import your table data and auth users, copy your storage files, deploy your edge functions and update your environment variables. Our free tool automates these steps in your browser." },
      { q: "Does Lovable offer a migration service?", a: "Check the official Lovable documentation for anything Lovable itself offers. This site is an independent, free migration tool, and a done-for-you service is on the waitlist if you would rather not do it yourself." },
      { q: "How much will it cost to move?", a: "The migrator is free. Afterwards you pay Supabase according to its plans, which include a free tier. See our [Lovable Cloud pricing guide](/guide/lovable-cloud-pricing) to compare costs." },
      { q: "Can I go back to Lovable Cloud afterwards?", a: "Your Lovable project still points at its old backend until you change the environment variables, so you can switch back by restoring the previous values." },
    ],
    related: ["lovable-cloud-pricing", "export-lovable-project", "self-host-lovable-app"],
  },

  {
    slug: "export-lovable-cloud-database",
    title: "How to Export Your Lovable Cloud Database (Step by Step)",
    description:
      "Learn how to export your Lovable Cloud database: get the schema from GitHub migrations, export each table as CSV and rebuild it with a SQL query.",
    h1: "How to Export Your Lovable Cloud Database",
    keyword: "export Lovable Cloud database",
    cardBlurb: "Get your schema, table data and a SQL fallback out of Lovable Cloud.",
    quick:
      "To export your Lovable Cloud database, take the schema from the SQL files in your GitHub repository's supabase/migrations folder, then export each table as a CSV from the Cloud database view. If there is no migrations folder, run a SQL query that rebuilds CREATE statements from the live database.",
    intro: [
      "You can export your Lovable Cloud database in three pieces: the structure (tables, functions and policies), the rows in each table, and the auth users. Each piece comes from a different place, which is why exports feel confusing at first.",
      "This guide shows where to find each piece, how to check that the export is complete, and what to do when the migrations folder is missing. Once you have all three, you can load them into any Postgres or Supabase project, or use the [free migration tool](/migrate).",
    ],
    sections: [
      {
        h2: "What an export of a Lovable Cloud database includes",
        bullets: [
          "**Schema:** tables, columns, constraints, functions, triggers and RLS policies.",
          "**Data:** the rows in every table in the public schema.",
          "**Auth users:** ids, emails and password hashes from the auth schema.",
          "**Storage files:** uploaded files, covered in [the storage guide](/guide/migrate-lovable-storage-files).",
        ],
      },
      {
        h2: "Export the schema from GitHub",
        steps: [
          { title: "Connect your project to GitHub", body: ["Use the GitHub option in your Lovable project settings. If you have not done this yet, follow [how to sync your Lovable project to GitHub](/guide/sync-lovable-to-github)."] },
          { title: "Open the migrations folder", body: ["In the repository, open `supabase/migrations`. Each `.sql` file is one change, named with a timestamp such as `20250412093000_create_profiles.sql`."], shot: "GitHub repository showing the supabase migrations folder with timestamped SQL files" },
          { title: "Download everything", body: ["Choose **Code → Download ZIP**. Keep the folder structure; the order of the files is the order of the filenames."] },
        ],
      },
      {
        h2: "Export your Lovable Cloud database tables as CSV",
        steps: [
          { title: "Open the database view", body: ["In Lovable, open the Cloud area and the database view. You will see a list of tables."], shot: "Lovable Cloud database view showing how to export your Lovable Cloud database as CSV" },
          { title: "Export each table", body: ["Open a table and choose the CSV export. Repeat for every table. Name files after the table, like `orders.csv`."] },
          { title: "Check the row counts", body: ["Write down the row count of each table now. After the import you will compare these numbers."] },
        ],
      },
      {
        h2: "Export your database when there is no migrations folder",
        paras: [
          "Some projects keep their structure only in the running database. You can rebuild it with a query that reads Postgres's system catalogs and prints CREATE statements for enums, tables, constraints, functions, RLS settings, policies and triggers. The migrator tool contains a tested version of this query in its schema step.",
          "Be aware of the limits: it is a best-effort rebuild, so review the output, and sequences (serial counters) are not recreated. Most Lovable tables use `uuid` ids with `gen_random_uuid()`, so this rarely matters.",
        ],
      },
      {
        h2: "Export auth users",
        paras: [
          "Run the query below in Lovable Cloud's SQL editor and export the result as CSV. The full workflow is in [Migrate Lovable Cloud users to Supabase](/guide/migrate-lovable-auth-users).",
        ],
        code: { label: "SQL: export users", code: USERS_SQL },
      },
      {
        h2: "Check that your export is complete",
        bullets: [
          "The number of CSV files equals the number of tables in your schema.",
          "Each CSV has a header row that matches the table's column names.",
          "Rows containing commas, quotes or line breaks are properly quoted. Open one file in a text editor to check.",
          "You have saved the users CSV separately.",
        ],
        paras: ["For background on Postgres exports, see the [Supabase database docs](" + SB_DOCS + "/guides/database/overview)."],
      },
    ],
    faq: [
      { q: "Is there a one-click export for Lovable Cloud?", a: "Exports are split by type. The schema comes from your GitHub repository, rows from CSV exports of each table, and users from a SQL query. A migration tool can stitch them together." },
      { q: "Does exporting affect my live app?", a: "No. Reading and exporting data does not change your Lovable Cloud project or interrupt your users." },
      { q: "Why is my CSV missing columns?", a: "Check that you exported the table itself and not a filtered view. Hidden columns in a view are left out of the export." },
      { q: "Can I export JSON columns?", a: "Yes. JSON values appear as text in the CSV. A good importer parses them back into JSON based on the destination column type." },
      { q: "How big can the export be?", a: "Large tables are fine for CSV export, but import them in batches. The migrator inserts 500 rows at a time." },
    ],
    related: ["export-lovable-project", "lovable-cloud-to-supabase", "migrate-lovable-auth-users"],
  },

  {
    slug: "migrate-lovable-auth-users",
    title: "Migrate Lovable Cloud Users to Supabase (Keep Passwords)",
    description:
      "Migrate Lovable auth users to Supabase without password resets: export auth.users, keep ids and bcrypt hashes, add identities and re-enable providers.",
    h1: "How to Migrate Lovable Auth Users to Supabase and Keep Their Passwords",
    keyword: "migrate Lovable auth users",
    cardBlurb: "Keep user ids and password hashes so nobody has to reset a password.",
    quick:
      "To migrate Lovable auth users to Supabase and keep their passwords, export id, email and encrypted_password from auth.users, then insert the same rows into the new project's auth.users with identical ids and bcrypt hashes, plus a matching auth.identities row for email login. Social logins must be re-enabled separately.",
    intro: [
      "When you migrate Lovable auth users to Supabase, the goal is simple: people sign in tomorrow exactly as they did yesterday. That works because Supabase Auth stores passwords as bcrypt hashes, and a bcrypt hash can be copied from one project to another without ever knowing the password.",
      "This guide explains what must be copied, why the user id matters so much, and how to check the result. The [migration tool](/migrate) does the import for you, but the steps are the same by hand.",
    ],
    sections: [
      {
        h2: "Why user ids and password hashes must stay identical",
        paras: [
          "Your tables refer to people by id: `profiles.user_id`, `orders.customer_id`, and so on. If a user gets a new id in the new project, every one of those references points to nobody. Copy the id exactly.",
          "Passwords are stored as bcrypt hashes in `encrypted_password`. Copying the hash means the old password keeps working. If you cannot copy hashes, the only alternative is to send a password reset email to everyone.",
        ],
      },
      {
        h2: "Step 1: Export auth users from Lovable Cloud",
        steps: [
          { title: "Open the SQL editor", body: ["In Lovable, open the Cloud area and the SQL editor."], shot: "Lovable Cloud SQL editor ready to run the query to migrate Lovable auth users" },
          { title: "Run the export query", body: ["Run the query below and export the result as a CSV file."], code: { label: "SQL: export users", code: USERS_SQL } },
        ],
      },
      {
        h2: "Step 2: Migrate Lovable auth users into the new Supabase project",
        paras: [
          "Each user needs a row in `auth.users` and, for email sign-in, a row in `auth.identities`. The identity row stores the provider (`email`), the provider id (the user id as text) and an `identity_data` JSON object with `sub`, `email` and `email_verified`.",
          "Set `aud` and `role` to `authenticated`, keep `email_confirmed_at` so users do not have to confirm again, and use empty strings for the token columns, because current Supabase Auth expects them not to be null.",
          "The migrator tool does this in batches of 50 users, uses `on conflict do nothing` so you can re-run safely, and retries one user at a time if a batch fails, so one bad row never blocks the rest.",
        ],
      },
      {
        h2: "Step 3: Handle triggers and profile tables",
        paras: [
          "Many apps have a trigger that creates a `profiles` row whenever a user is inserted into `auth.users`. If you also import a `profiles` CSV, you can end up with duplicates or a duplicate key error. Decide which source wins: either let the trigger create profiles and update them from the CSV afterwards, or disable the trigger while you import and enable it again.",
          "Also remember that any table with a foreign key to `auth.users(id)` needs the users to exist first. If you hit a foreign key error, see [the troubleshooting guide](/troubleshooting).",
        ],
      },
      {
        h2: "Step 4: Re-enable social and other providers",
        paras: [
          "Only email and password accounts can be copied this way. Providers such as Google need to be set up again in **Authentication → Sign In / Providers** in your Supabase dashboard, with your own OAuth credentials. See the [Supabase Auth docs](" + SB_DOCS + "/guides/auth) for each provider.",
          "Users who signed in with Google before will have no password hash, so import them as users without an email identity and let them sign in with Google again once the provider is on.",
        ],
      },
      {
        h2: "Test the migration",
        bullets: [
          "Sign in with a real existing account and its old password.",
          "Check that the user's data (orders, profile, posts) shows up.",
          "Request a password reset email to confirm your email settings work.",
          "Compare the user count in both projects.",
        ],
      },
    ],
    faq: [
      { q: "Do users need to reset their passwords?", a: "No, when ids and bcrypt hashes are copied exactly, the old passwords keep working." },
      { q: "Is it safe to export encrypted_password?", a: "The values are one-way bcrypt hashes, but treat the CSV as sensitive: store it securely and delete it after the migration." },
      { q: "What about users who signed in with Google?", a: "They have no password hash. Re-enable Google in your Supabase project; they sign in again and are matched by email according to your provider settings." },
      { q: "Will email confirmation be required again?", a: "Not if you keep the email_confirmed_at value from the export." },
      { q: "Can I run the import twice?", a: "Yes. A good import uses on conflict do nothing on the id, so existing users are left unchanged." },
    ],
    related: ["lovable-cloud-to-supabase", "export-lovable-cloud-database", "update-env-after-migration"],
  },

  {
    slug: "migrate-lovable-storage-files",
    title: "Move Lovable Cloud Storage Files to Supabase (Step by Step)",
    description:
      "Lovable Cloud storage export made simple: download each bucket, recreate it in Supabase with the same public or private setting and upload files with paths.",
    h1: "Lovable Cloud Storage Export: How to Move Your Files to Supabase",
    keyword: "Lovable Cloud storage export",
    cardBlurb: "Recreate buckets and upload files while keeping folder paths intact.",
    quick:
      "For a Lovable Cloud storage export, download the files of each bucket, create buckets with the same names and the same public or private setting in your Supabase project, and upload the files keeping their folder paths so existing URLs and database references keep working.",
    intro: [
      "A Lovable Cloud storage export has two parts: getting the files out, and getting them into a Supabase Storage bucket in exactly the same place. If paths change, every image URL and every database column that stores a file path breaks.",
      "This guide shows how to keep paths identical, how to treat public and private buckets, what to do about large files, and how the [migrator tool](/migrate) uploads folders for you.",
    ],
    sections: [
      {
        h2: "Step 1: Download your files from Lovable Cloud",
        steps: [
          { title: "Open storage", body: ["In Lovable, open the Cloud area and the storage view. Note every bucket name and whether it is public or private."], shot: "Lovable Cloud storage export: the storage view listing buckets and files" },
          { title: "Download each bucket", body: ["Download the files for each bucket and keep the folder structure. Put each bucket into a folder named after it."] },
        ],
      },
      {
        h2: "Step 2: Create matching buckets in Supabase",
        paras: [
          "In the Supabase dashboard, open **Storage** and create each bucket with the same name. Match the public or private setting, because public buckets serve files at a public URL while private buckets need signed URLs.",
          "Bucket names allow lowercase letters, numbers, dots, dashes and underscores. Recreate any storage policies (RLS on `storage.objects`) that your schema migrations did not already create.",
        ],
      },
      {
        h2: "Lovable Cloud storage export: upload files and keep folder paths",
        paras: [
          "Upload to the same relative path as before: a file at `avatars/42/photo.png` in the old project must be at `avatars/42/photo.png` in the new one. You can drag whole folders into the Supabase dashboard, use the Storage API, or let the migrator tool upload a dropped folder, keeping every path.",
          "The migrator uses upsert, so you can run an upload twice without errors. It handles files up to 8 MB; upload larger files directly from the Supabase dashboard or with the Storage API described in the [Supabase Storage docs](" + SB_DOCS + "/guides/storage).",
        ],
      },
      {
        h2: "Step 4: Check URLs and database references",
        bullets: [
          "Open a public file URL in the browser and confirm it loads.",
          "Check a few database rows that store file paths or full URLs.",
          "If your database stores full URLs with the old project domain, update them with an `update ... set url = replace(url, 'old', 'new')` statement.",
          "Test an upload from the app to prove policies work for new files.",
        ],
      },
    ],
    faq: [
      { q: "Will my existing image URLs keep working?", a: "Paths will match, but the domain changes with the project. Update any full URLs stored in your database, or load images through a relative path." },
      { q: "What is the maximum file size?", a: "Check the current limit for your Supabase plan in the Storage settings. The migrator tool uploads files up to 8 MB; larger files should be uploaded from the dashboard." },
      { q: "Do I need to recreate storage policies?", a: "Yes if they were not part of your migration files. Policies on storage.objects control who can read and write files." },
      { q: "Public or private bucket?", a: "Match the original. Public buckets serve files by URL; private buckets need signed URLs from your app." },
      { q: "Can I skip storage?", a: "Yes. The step is optional if your app does not use file uploads." },
    ],
    related: ["lovable-cloud-to-supabase", "deploy-lovable-edge-functions", "update-env-after-migration"],
  },

  {
    slug: "deploy-lovable-edge-functions",
    title: "Deploy Lovable Edge Functions on Your Own Supabase",
    description:
      "Deploy Lovable edge functions on your own Supabase project: install the CLI, link your project, deploy each function and set the secrets it needs again.",
    h1: "Lovable Edge Functions: How to Deploy Them on Your Own Supabase Project",
    keyword: "deploy Lovable edge functions",
    cardBlurb: "CLI commands to deploy your functions and re-add every secret.",
    quick:
      "To deploy Lovable edge functions on your own Supabase, install the Supabase CLI, run supabase link with your project ref, deploy each folder in supabase/functions with supabase functions deploy, then set every secret the functions read with supabase secrets set, because secret values are never exported.",
    intro: [
      "To deploy Lovable edge functions on your own Supabase project you do not need to rewrite anything: the functions are standard Supabase Edge Functions written for Deno, and they live in the `supabase/functions` folder of your repository.",
      "What does not move is the configuration around them: secrets, and sometimes per-function settings. This guide lists the exact commands and a checklist so none of them gets forgotten. The [migrator](/migrate) detects your functions and secret names and prints these commands for you.",
    ],
    sections: [
      {
        h2: "What are Lovable edge functions?",
        paras: [
          "Lovable edge functions, also called Lovable Cloud edge functions or Supabase edge functions, are small server-side programs written in TypeScript and run on the Deno runtime. Apps use them for work that must not happen in the browser: calling payment or AI APIs with a secret key, sending email, handling webhooks, or running logic with elevated database access.",
          "In your project they are plain folders under `supabase/functions`, one folder per function, each with an `index.ts` file. Because they are standard Supabase Edge Functions, you can deploy them to any Supabase project. The official references are the [Supabase Edge Functions docs](" + SB_DOCS + "/guides/functions) and the [secrets documentation](" + SB_DOCS + "/guides/functions/secrets), and Lovable's own explanation lives in the [Lovable docs](" + LOVABLE_DOCS + ").",
        ],
      },
      {
        h2: "Step 1: Install the Supabase CLI and log in",
        steps: [
          { title: "Install the CLI", body: ["Install it with your package manager or run it through `npx`. See the [CLI docs](" + SB_DOCS + "/guides/cli) for your system."] },
          { title: "Log in and link", body: ["Run the commands below from the root of your project (the folder that contains `supabase`)."], shot: "Terminal showing how to deploy Lovable edge functions after linking the Supabase CLI", code: { label: "Terminal: log in and link", code: "supabase login\nsupabase link --project-ref YOUR_PROJECT_REF" } },
        ],
      },
      {
        h2: "Step 2: Deploy Lovable edge functions one by one",
        paras: ["List the folders in `supabase/functions`. Folders starting with an underscore, such as `_shared`, are helpers and are not deployed on their own."],
        code: { label: "Terminal: deploy", code: "supabase functions deploy FUNCTION_NAME\n# or deploy all of them\nsupabase functions deploy" },
      },
      {
        h2: "Step 3: Find and set your secrets",
        paras: [
          "Secret values are not exported from Lovable, so you set them again from their original sources: your Stripe dashboard, OpenAI account, email provider and so on. To find the names, search your function code for `Deno.env.get(`. Supabase provides `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` automatically, so you only add custom ones.",
        ],
        code: { label: "Terminal: set secrets", code: "supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx RESEND_API_KEY=re_xxx\nsupabase secrets list" },
      },
      {
        h2: "Step 4: Keep the right JWT settings",
        paras: [
          "Functions called by logged-in users verify a JWT by default. Webhooks from outside services, such as Stripe, cannot send one, so they need `verify_jwt = false` for that function in `supabase/config.toml`. Keep the same settings your Lovable project used.",
        ],
        code: { label: "supabase/config.toml", code: "[functions.stripe-webhook]\nverify_jwt = false" },
      },
      {
        h2: "Step 5: Test every function",
        bullets: [
          "Call each function from the app and from the Supabase dashboard's function logs.",
          "Point external webhooks (Stripe, GitHub, email providers) at the new function URL, which uses your new project ref.",
          "Check the function logs for `undefined` secret errors.",
        ],
      },
    ],
    faq: [
      { q: "What are Lovable edge functions?", a: "They are server-side TypeScript functions that run on Supabase Edge Functions (Deno). Apps use them for secrets, payments, AI calls, email and webhooks." },
      { q: "Where do I set edge function secrets?", a: "With supabase secrets set NAME=value in the CLI, or in the Supabase dashboard under Edge Functions. Functions read them with Deno.env.get. Secret values are never exported from Lovable." },
      { q: "Do I need to change my function code?", a: "Usually not. The code runs on the same Supabase Edge Functions runtime. Only the project ref and secrets change." },
      { q: "Why does my function say a secret is missing?", a: "Secrets are not copied between projects. Set each one with supabase secrets set, then redeploy if needed." },
      { q: "Where do webhook URLs change?", a: "The function URL contains your project ref, so update it in services such as Stripe or GitHub to the new project." },
      { q: "Can I deploy without the CLI?", a: "The CLI is the most reliable route. The dashboard also allows editing functions, but deploying from your repository keeps code and config in sync." },
    ],
    related: ["connect-supabase-to-lovable", "lovable-cloud-to-supabase", "update-env-after-migration"],
  },

  {
    slug: "update-env-after-migration",
    title: "Connect Your Lovable App to Your New Supabase Project",
    description:
      "Connect your Lovable app to Supabase after migrating: update the three .env values, change project_id in config.toml, redeploy and test sign-in safely.",
    h1: "How to Connect Your Lovable App to Your New Supabase Project",
    keyword: "connect Lovable app to Supabase",
    cardBlurb: "Update .env and config.toml, redeploy and test the switch safely.",
    quick:
      "To connect your Lovable app to your new Supabase project, replace VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY and VITE_SUPABASE_PROJECT_ID in your .env file with the values from your new project, change project_id in supabase/config.toml, redeploy, and test sign-in, reads, writes and uploads.",
    intro: [
      "Once your data has moved, you need to connect your Lovable app to Supabase by pointing it at the new project. This is a small change, three environment variables and one config line, but it is the moment your real users switch backends, so it deserves a careful test.",
      "Below you will find where to get each value, what to edit, and a safe testing routine. If you used the [migration wizard](/migrate), the final screen shows these values ready to copy.",
    ],
    sections: [
      {
        h2: "Where to find your new project's values",
        bullets: [
          "**Project URL:** Supabase dashboard → Project Settings → API. It looks like `https://YOUR_REF.supabase.co`.",
          "**Publishable (anon) key:** Project Settings → API Keys. This key is safe to expose in a front-end app because Row Level Security protects your data.",
          "**Project ref:** the 20-character id in the URL, also in Project Settings → General.",
        ],
        paras: ["Never put the `service_role` key in front-end code or an `.env` file that is bundled into the app."],
      },
      {
        h2: "Connect your Lovable app to Supabase: edit .env and config.toml",
        code: {
          label: ".env",
          code: 'VITE_SUPABASE_URL="https://YOUR_REF.supabase.co"\nVITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"\nVITE_SUPABASE_PROJECT_ID="YOUR_REF"',
        },
        paras: ["Then open `supabase/config.toml` and change the first line:"],
        bullets: ["`project_id = \"YOUR_REF\"`"],
      },
      {
        h2: "Redeploy and clear old sessions",
        paras: [
          "Redeploy your front end so the new variables are baked in. If you host on a platform with its own environment variable settings (Vercel, Netlify), update them there as well, because they override the local file.",
          "Users who were signed in to the old backend hold tokens signed by the old project. They will be asked to sign in again, which is expected. Because their ids and password hashes were copied, their old passwords work.",
        ],
      },
      {
        h2: "Test the switch before announcing it",
        steps: [
          { title: "Sign in", shot: "Browser showing how to connect your Lovable app to Supabase and sign in with an existing account", body: ["Log in with an existing account. If it fails, see the [troubleshooting guide](/troubleshooting) section on users who cannot log in."] },
          { title: "Read and write", body: ["Open a page that lists data, then create, edit and delete something to prove RLS policies allow it."] },
          { title: "Uploads and functions", body: ["Upload a file and trigger an edge function. Check function logs in the Supabase dashboard."] },
          { title: "Check Auth settings", body: ["Set the Site URL and redirect URLs in **Authentication → URL Configuration** to your real domain so magic links and OAuth return correctly."] },
        ],
      },
      {
        h2: "Roll back if something is wrong",
        paras: ["Your Lovable Cloud backend is untouched, so rolling back means putting the three old values back and redeploying. Keep a copy of them until you are fully confident. The [pillar guide](/guide/lovable-cloud-to-supabase) lists a full verification checklist."],
      },
    ],
    faq: [
      { q: "Is the publishable key safe in my front-end code?", a: "Yes. It is designed to be public, and Row Level Security controls what it can access. Never expose the service_role key." },
      { q: "Why does my app still use the old project?", a: "Hosting platforms often have their own environment variables that override .env. Update them there and redeploy." },
      { q: "Do I need to change code files?", a: "Normally no. The client reads the URL and key from environment variables." },
      { q: "Why are users logged out?", a: "Their session tokens were issued by the old project. They sign in again and everything else continues as before." },
    ],
    related: ["connect-supabase-to-lovable", "lovable-cloud-to-supabase", "deploy-lovable-edge-functions"],
  },

  {
    slug: "sync-lovable-to-github",
    title: "How to Sync Your Lovable Project to GitHub (Step by Step)",
    description:
      "Sync your Lovable project to GitHub in minutes: connect the integration, create a repository, find the supabase folder and download or clone your code.",
    h1: "How to Sync Your Lovable Project to GitHub",
    keyword: "sync Lovable project to GitHub",
    cardBlurb: "Connect GitHub, create the repo and find your migrations and functions.",
    quick:
      "To sync your Lovable project to GitHub, open the GitHub option in your project settings, approve the Lovable GitHub app, and create a repository for the project. Your code, including supabase/migrations and supabase/functions, is then available on github.com to download as a ZIP or clone.",
    intro: [
      "To sync your Lovable project to GitHub you only need a free GitHub account and a few clicks inside Lovable. It is the first step of almost every Lovable Cloud migration, because your database structure and edge functions are stored as files in the repository.",
      "This guide shows how to connect, what appears in the repository, and how to download it. The official [Lovable documentation](" + LOVABLE_DOCS + ") covers the GitHub integration in full, and the interface may change over time, so use this guide for the overall flow.",
    ],
    sections: [
      {
        h2: "Step 1: Connect your GitHub account in Lovable",
        steps: [
          { title: "Open the GitHub option", body: ["In your Lovable project, look for the GitHub button or the GitHub section in project settings."], shot: "Lovable project settings showing how to sync your Lovable project to GitHub" },
          { title: "Approve access", body: ["Sign in to GitHub if asked, and approve the Lovable GitHub app for your account or organization."] },
        ],
      },
      {
        h2: "Step 2: Sync your Lovable project to GitHub by creating a repository",
        paras: [
          "Choose to connect the project, then create a new repository. Pick a name and decide on private or public. A **private** repository is the safer choice for a business app, since it may contain table structures and function code.",
          "After this, changes you make in Lovable are pushed to the repository, and commits made on GitHub sync back into Lovable.",
        ],
      },
      {
        h2: "Step 3: Find the files you need for a migration",
        bullets: [
          "`supabase/migrations/` holds your database structure as timestamped SQL files.",
          "`supabase/functions/` holds your edge functions, one folder each.",
          "`supabase/config.toml` holds the project id and per-function settings.",
          "`.env` is not committed to GitHub; you recreate it from your new project's values.",
        ],
      },
      {
        h2: "Step 4: Download or clone the repository",
        paras: ["On github.com open the repository, choose **Code**, and pick **Download ZIP**. Developers can clone instead:"],
        code: { label: "Terminal: clone", code: "git clone https://github.com/YOUR_USER/YOUR_REPO.git" },
      },
      {
        h2: "Connect GitHub to the migrator without downloading",
        paras: [
          "The [free migration tool](/migrate) can read the repository directly through a GitHub App with read-only access. You choose which repositories to share, and nothing is written to GitHub. If you prefer, simply upload the ZIP.",
        ],
      },
    ],
    faq: [
      { q: "Is syncing to GitHub free?", a: "Yes. GitHub offers free private repositories. Check the Lovable documentation for any plan requirements on their side." },
      { q: "Will syncing change my Lovable project?", a: "It adds a repository mirror of your code. Your app continues to work as before." },
      { q: "My repository has no supabase folder. What now?", a: "Then your schema is not in migration files. Use the SQL fallback in the [export guide](/guide/export-lovable-cloud-database)." },
      { q: "How do I export code from Lovable?", a: "Sync the project to GitHub, then download the repository as a ZIP or clone it. That gives you the full source code. See the [export guide](/guide/export-lovable-project) for data and files too." },
      { q: "Should the repository be private?", a: "Private is recommended unless you want to publish your code." },
    ],
    related: ["export-lovable-project", "export-lovable-cloud-database", "self-host-lovable-app"],
  },
];

export const guides: Guide[] = [...baseGuides, ...extraGuides];

export const guideBySlug = (slug: string) => guides.find((g) => g.slug === slug);
