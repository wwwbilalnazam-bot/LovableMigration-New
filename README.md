# Lovable Cloud → Supabase Migrator

A free step-by-step wizard that moves a Lovable Cloud backend (schema, table data, auth users, storage files) into the user's own Supabase project.

Stack: Vite · React · TypeScript · Tailwind · shadcn-style components (Radix) · framer-motion · lucide.

## Setup

1. Create a Supabase project that will host **this app** (waitlist, anonymous stats, the proxy function).
2. Apply the schema and deploy the proxy:
   ```bash
   supabase link --project-ref <APP_PROJECT_REF>
   supabase db push                              # waitlist + migrations_stats
   supabase functions deploy migration-proxy --no-verify-jwt
   ```
   Also set `project_id` in `supabase/config.toml`.
3. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. `npm install && npm run dev` (port 8080), or `npm run build` for production.

## Security model

- The wizard keeps the Service Role Key and Personal Access Token **in memory only**. `sessionStorage` holds just progress (step, project URL/ref, report).
- `migration-proxy` receives credentials per request, uses them, and discards them. It never logs bodies, and only talks to `https://<ref>.supabase.co` and `api.supabase.com`.
- The app database stores only `waitlist` (email) and `migrations_stats` (counters). Both are insert-only for anonymous users.

## Notes / limits

- Storage uploads go through the proxy as base64 (8 MB per file cap, 12 MB per request).
- Users with an empty password hash (social-only logins) are imported without an email identity.
- Tables in a foreign-key cycle are imported last and may need a second pass.
- Consider adding rate limiting (e.g. Supabase/Cloudflare) in front of `migration-proxy` before a public launch.

## "Connect Supabase" (OAuth) setup

Users sign in with Supabase instead of pasting keys. Register an OAuth app once:

1. Supabase dashboard → Organization settings → **OAuth Apps** → New app.
   Redirect URI: `https://YOUR-DOMAIN/oauth/callback` (and `http://localhost:8080/oauth/callback` for dev).
   Scopes: read/write for Projects, Database, Secrets (needed to read the API keys), Auth, Storage.
2. Put the client id in `.env` as `VITE_SUPABASE_OAUTH_CLIENT_ID`.
3. Set the secrets on the proxy:
   ```bash
   supabase secrets set OAUTH_CLIENT_ID=... OAUTH_CLIENT_SECRET=...
   ```

The proxy then fetches the target project's service role key itself (held in memory for ≤5 min), so the browser never sees it. Manual key entry remains as a fallback.

## "Connect GitHub" setup

Step 3 can read the Lovable repo directly through a GitHub App (user authorization, PKCE).

1. GitHub App settings: **Callback URL** `https://YOUR-DOMAIN/github/callback` (+ `http://localhost:8080/github/callback`), permission **Contents: read-only**, "Request user authorization (OAuth) during installation" optional.
2. `.env`: `VITE_GITHUB_CLIENT_ID` (and `VITE_GITHUB_APP_SLUG` for the install link).
3. `supabase secrets set GITHUB_CLIENT_ID=... GITHUB_CLIENT_SECRET=...` and redeploy `migration-proxy`.

The user token stays in browser memory; repo files are fetched by the browser from api.github.com. The proxy only exchanges the OAuth code. Users must install the app on their Lovable repository.

## SEO setup

Public pages are pre-rendered to static HTML at build time (React SSR + a prerender script), so full text is in the page source. `/migrate` and the OAuth callbacks stay client-only and `noindex`.

```bash
VITE_SITE_URL=https://your-domain.com npm run build   # builds, prerenders, writes sitemap/robots/llms/OG images
npm run seo:audit                                     # checks titles, descriptions, H1s, schema, links, keywords, word counts
```

- **Must set before deploy:** `VITE_SITE_URL` (canonicals, sitemap and OG tags use it; the build warns if it is missing). Optional: `VITE_GA_ID` (GA4) and `VITE_GSC_VERIFICATION` (Search Console meta tag).
- **Hosting:** `vercel.json` (clean URLs, no trailing slash, rewrites and `X-Robots-Tag: noindex` for client-only routes) and `dist/_redirects` (Netlify) are included. The 404 page is `dist/404.html`.
- **Content:** edit `src/content/` (`guides.ts`, `pages.ts`, `site.ts`, `testimonials.ts`). Titles must be 50-60 chars and descriptions 140-160; the audit enforces this. Set the real author name and bio in `site.ts` and review the privacy and terms text.
- **Homepage counter:** run `supabase db push` to add `migration_count()`; the counter appears only after 50+ successful migrations.
- **Analytics events:** start_migration, github_connected, supabase_connected, migration_success, migration_error, waitlist_signup.
