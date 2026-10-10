// migration-proxy
// Forwards wizard requests to the USER's Supabase project (Management API, REST, Auth, Storage).
// Credentials arrive in each request body, are used in memory, and are never stored or logged.
// Do not add console.log of request bodies, headers or credentials here.

const MAX_BODY_BYTES = 12 * 1024 * 1024; // 12 MB per request
const MAX_SQL_CHARS = 2_000_000;
const MAX_ROWS_PER_INSERT = 1000;
const MAX_USERS_PER_CALL = 100;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

class HttpError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

interface Creds {
  url: string;
  ref: string;
  serviceKey: string;
  pat: string; // Management API bearer: OAuth access token or personal access token
  oauth: boolean;
}

const REF_RE = /^[a-z0-9]{20}$/;
const TABLE_RE = /^[A-Za-z_][A-Za-z0-9_]{0,62}$/;
const BUCKET_RE = /^[a-z0-9][a-z0-9._-]{1,62}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// In-memory only, short-lived cache so batch imports don't re-fetch the key on every request.
const keyCache = new Map<string, { key: string; exp: number }>();

/**
 * Two ways to authenticate:
 *  - OAuth (preferred): { ref, token }. The service role key is fetched here via the Management API.
 *  - Manual fallback: { url, ref, serviceKey, pat }.
 */
async function resolveCreds(raw: any, need: { service?: boolean; pat?: boolean }): Promise<Creds> {
  if (!raw || typeof raw !== "object") throw new HttpError(400, "Missing Supabase credentials.");
  const ref = String(raw.ref ?? "").trim();
  if (!REF_RE.test(ref)) throw new HttpError(400, "The Project Ref should be 20 lowercase letters and numbers (find it in your Supabase project URL).");
  const url = `https://${ref}.supabase.co`; // only ever talk to the matching *.supabase.co host

  const token = String(raw.token ?? "").trim();
  if (token) {
    if (token.length > 4000) throw new HttpError(400, "The access token looks invalid.");
    let serviceKey = "";
    if (need.service) {
      const ck = `${ref}:${token.slice(-24)}`;
      const hit = keyCache.get(ck);
      if (hit && hit.exp > Date.now()) serviceKey = hit.key;
      else {
        const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys?reveal=true`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await readJson(res);
        if (res.status === 401) throw new HttpError(401, "Your Supabase connection expired. Please reconnect.", "token_expired");
        if (!res.ok) throw new HttpError(res.status, friendly(res.status, data, "Couldn't read your project's API keys."));
        const list = Array.isArray(data) ? data : [];
        const sk = list.find((k: any) => k.name === "service_role") ?? list.find((k: any) => k.type === "secret");
        if (!sk?.api_key) throw new HttpError(400, "Couldn't find a service role key for this project.");
        serviceKey = sk.api_key;
        keyCache.set(ck, { key: serviceKey, exp: Date.now() + 5 * 60_000 });
      }
    }
    return { url, ref, serviceKey, pat: token, oauth: true };
  }

  const serviceKey = String(raw.serviceKey ?? "").trim();
  const pat = String(raw.pat ?? "").trim();
  if (need.service && (serviceKey.length < 20 || serviceKey.length > 4000)) throw new HttpError(400, "The Service Role Key looks missing or invalid.");
  if (need.pat && (!pat.startsWith("sbp_") || pat.length > 200)) throw new HttpError(400, "The Personal Access Token should start with sbp_.");
  return { url, ref, serviceKey, pat, oauth: false };
}

// ---- OAuth (Supabase "Connect with Supabase") --------------------------------
async function tokenRequest(params: Record<string, string>) {
  const id = Deno.env.get("OAUTH_CLIENT_ID");
  const secret = Deno.env.get("OAUTH_CLIENT_SECRET");
  if (!id || !secret) throw new HttpError(503, "Supabase login isn't configured on this server yet (missing OAUTH_CLIENT_ID / OAUTH_CLIENT_SECRET).");
  const res = await fetch("https://api.supabase.com/v1/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json", Authorization: `Basic ${btoa(`${id}:${secret}`)}` },
    body: new URLSearchParams(params),
  });
  const data = await readJson(res);
  if (!res.ok || !data?.access_token) throw new HttpError(400, "Supabase didn't accept that sign-in. Please try connecting again.", "oauth_failed");
  return { ok: true, accessToken: data.access_token, refreshToken: data.refresh_token ?? null, expiresIn: data.expires_in ?? null };
}

async function actionOauthExchange(body: any) {
  const code = String(body.code ?? "");
  const verifier = String(body.codeVerifier ?? "");
  const redirectUri = String(body.redirectUri ?? "");
  if (!code || code.length > 2000 || verifier.length < 43 || verifier.length > 128 || !/^https?:\/\//.test(redirectUri)) throw new HttpError(400, "Invalid sign-in response.");
  return tokenRequest({ grant_type: "authorization_code", code, code_verifier: verifier, redirect_uri: redirectUri });
}

async function actionOauthRefresh(body: any) {
  const rt = String(body.refreshToken ?? "");
  if (!rt || rt.length > 2000) throw new HttpError(400, "Missing refresh token.");
  return tokenRequest({ grant_type: "refresh_token", refresh_token: rt });
}

async function actionGithubExchange(body: any) {
  const id = Deno.env.get("GITHUB_CLIENT_ID");
  const secret = Deno.env.get("GITHUB_CLIENT_SECRET");
  if (!id || !secret) throw new HttpError(503, "GitHub login isn't configured on this server yet.");
  const code = String(body.code ?? "");
  const redirectUri = String(body.redirectUri ?? "");
  const verifier = String(body.codeVerifier ?? "");
  if (!code || code.length > 500 || !/^https?:\/\//.test(redirectUri) || verifier.length < 43 || verifier.length > 128) throw new HttpError(400, "Invalid sign-in response.");
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ client_id: id, client_secret: secret, code, redirect_uri: redirectUri, code_verifier: verifier }),
  });
  const data = await readJson(res);
  if (!res.ok || !data?.access_token) throw new HttpError(400, "GitHub didn't accept that sign-in. Please try connecting again.", "oauth_failed");
  return { ok: true, accessToken: data.access_token };
}

async function actionProjects(body: any) {
  const token = String(body.token ?? "").trim();
  if (!token || token.length > 4000) throw new HttpError(400, "Missing access token.");
  const res = await fetch("https://api.supabase.com/v1/projects", { headers: { Authorization: `Bearer ${token}` } });
  const data = await readJson(res);
  if (res.status === 401) throw new HttpError(401, "Your Supabase connection expired. Please reconnect.", "token_expired");
  if (!res.ok) throw new HttpError(res.status, friendly(res.status, data, "Couldn't list your Supabase projects."));
  const projects = (Array.isArray(data) ? data : []).map((p: any) => ({ ref: p.id ?? p.ref, name: p.name, region: p.region, status: p.status, org: p.organization_id }));
  return { ok: true, projects };
}

async function readJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { message: text.slice(0, 500) };
  }
}

function friendly(status: number, body: any, fallback: string): string {
  const msg = body?.message || body?.error_description || body?.error || body?.msg || "";
  if (status === 401) return "Supabase rejected the credentials (401). Double-check the key or token you pasted.";
  if (status === 403) return "Supabase says this token or key is not allowed to do that (403). Make sure you used the Service Role key (not the anon key) and a valid Personal Access Token.";
  if (status === 404) return msg ? String(msg) : "Supabase could not find that project or resource (404). Check the Project Ref.";
  if (status === 429) return "Supabase is rate limiting requests. Wait a few seconds and retry.";
  return msg ? String(msg).slice(0, 800) : fallback;
}

async function runSql(c: Creds, query: unknown) {
  if (typeof query !== "string" || !query.trim()) throw new HttpError(400, "The SQL text is empty.");
  if (query.length > MAX_SQL_CHARS) throw new HttpError(413, "That SQL file is too large to run in one go (limit 2 MB).");
  const res = await fetch(`https://api.supabase.com/v1/projects/${c.ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${c.pat}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const body = await readJson(res);
  if (res.status === 401 && c.oauth) throw new HttpError(401, "Your Supabase connection expired. Please reconnect.", "token_expired");
  if (!res.ok) {
    throw new HttpError(res.status === 400 || res.status === 500 ? 422 : res.status, friendly(res.status, body, "The database rejected this SQL."));
  }
  return body;
}

// ---- actions ---------------------------------------------------------------

async function actionTest(raw: any) {
  const c = await resolveCreds(raw, { service: true, pat: true });

  const proj = await fetch(`https://api.supabase.com/v1/projects/${c.ref}`, { headers: { Authorization: `Bearer ${c.pat}` } });
  if (!proj.ok) {
    throw new HttpError(
      proj.status === 404 ? 404 : 400,
      proj.status === 401
        ? "Your Personal Access Token was rejected. Create a new one at supabase.com/dashboard/account/tokens."
        : friendly(proj.status, await readJson(proj), "Could not reach your project with that Personal Access Token."),
    );
  }
  const p = await readJson(proj);

  const admin = await fetch(`${c.url}/auth/v1/admin/users?per_page=1`, {
    headers: { apikey: c.serviceKey, Authorization: `Bearer ${c.serviceKey}` },
  });
  if (!admin.ok) {
    throw new HttpError(
      400,
      admin.status === 401 || admin.status === 403
        ? "The Service Role Key was rejected. Use the 'service_role' secret key, not the anon/publishable key."
        : friendly(admin.status, await readJson(admin), "Could not verify the Service Role Key."),
    );
  }

  const warning = p?.status && p.status !== "ACTIVE_HEALTHY" ? `Project status is ${p.status}. Wait until it shows as healthy in the dashboard.` : null;
  return { ok: true, projectName: p?.name ?? c.ref, warning };
}

async function actionSql(body: any) {
  const c = await resolveCreds(body.creds, { pat: true });
  const result = await runSql(c, body.query);
  return { ok: true, result };
}

async function actionKeys(body: any) {
  const c = await resolveCreds(body.creds, { pat: true });
  const res = await fetch(`https://api.supabase.com/v1/projects/${c.ref}/api-keys`, { headers: { Authorization: `Bearer ${c.pat}` } });
  const data = await readJson(res);
  if (!res.ok) throw new HttpError(res.status, friendly(res.status, data, "Could not read the project API keys."));
  const list = Array.isArray(data) ? data : [];
  const publishable = list.find((k: any) => k.type === "publishable") ?? list.find((k: any) => k.name === "anon");
  // Only the public (publishable/anon) key is returned. The service role key is never sent back.
  return { ok: true, publishableKey: publishable?.api_key ?? null };
}

async function actionInsert(body: any) {
  const c = await resolveCreds(body.creds, { service: true });
  const table = String(body.table ?? "");
  if (!TABLE_RE.test(table)) throw new HttpError(400, "Invalid table name.");
  const rows = body.rows;
  if (!Array.isArray(rows) || rows.length === 0) throw new HttpError(400, "No rows to insert.");
  if (rows.length > MAX_ROWS_PER_INSERT) throw new HttpError(413, `Too many rows in one request (max ${MAX_ROWS_PER_INSERT}).`);
  const res = await fetch(`${c.url}/rest/v1/${encodeURIComponent(table)}`, {
    method: "POST",
    headers: {
      apikey: c.serviceKey,
      Authorization: `Bearer ${c.serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const b = await readJson(res);
    const detail = [b?.message, b?.details, b?.hint].filter(Boolean).join(" — ");
    throw new HttpError(422, detail ? detail.slice(0, 800) : friendly(res.status, b, "The database rejected these rows."));
  }
  return { ok: true, inserted: rows.length };
}

function dollarQuote(payload: string): string {
  // Random tag that is guaranteed not to appear inside the payload, so the JSON can never break out of the literal.
  for (let i = 0; i < 10; i++) {
    const tag = "j" + crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    if (!payload.includes(tag)) return tag;
  }
  throw new HttpError(400, "Could not safely encode the user data.");
}

async function actionImportUsers(body: any) {
  const c = await resolveCreds(body.creds, { pat: true });
  const users = body.users;
  if (!Array.isArray(users) || users.length === 0) throw new HttpError(400, "No users to import.");
  if (users.length > MAX_USERS_PER_CALL) throw new HttpError(413, `Too many users in one request (max ${MAX_USERS_PER_CALL}).`);

  const obj = (v: any) => (v && typeof v === "object" && !Array.isArray(v) ? v : null);
  const clean = users.map((u: any, i: number) => {
    if (!u || !UUID_RE.test(String(u.id))) throw new HttpError(400, `User #${i + 1} has an invalid id.`);
    const email = String(u.email ?? "").trim();
    if (!email || email.length > 320) throw new HttpError(400, `User #${i + 1} has an invalid email.`);
    return {
      id: String(u.id).toLowerCase(),
      email,
      encrypted_password: typeof u.encrypted_password === "string" ? u.encrypted_password.slice(0, 255) : null,
      email_confirmed_at: u.email_confirmed_at ? String(u.email_confirmed_at) : null,
      raw_user_meta_data: obj(u.raw_user_meta_data),
      raw_app_meta_data: obj(u.raw_app_meta_data),
      created_at: u.created_at ? String(u.created_at) : null,
    };
  });

  const payload = JSON.stringify(clean);
  const q = "$" + dollarQuote(payload) + "$";
  const sql = `
with src as (
  select * from jsonb_to_recordset(${q}${payload}${q}::jsonb)
  as t(id uuid, email text, encrypted_password text, email_confirmed_at timestamptz,
       raw_user_meta_data jsonb, raw_app_meta_data jsonb, created_at timestamptz)
),
u as (
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change)
  select '00000000-0000-0000-0000-000000000000'::uuid, id, 'authenticated', 'authenticated', email,
    coalesce(encrypted_password, ''), email_confirmed_at,
    coalesce(raw_app_meta_data, '{"provider":"email","providers":["email"]}'::jsonb),
    coalesce(raw_user_meta_data, '{}'::jsonb),
    coalesce(created_at, now()), now(), '', '', '', ''
  from src
  on conflict (id) do nothing
  returning id
),
i as (
  insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  select gen_random_uuid(), s.id, s.id::text, 'email',
    jsonb_build_object('sub', s.id::text, 'email', s.email,
      'email_verified', s.email_confirmed_at is not null, 'phone_verified', false),
    now(), coalesce(s.created_at, now()), now()
  from src s join u on u.id = s.id
  where coalesce(s.encrypted_password, '') <> ''
  on conflict do nothing
  returning 1
)
select (select count(*) from u)::int as users, (select count(*) from i)::int as identities;`;

  const result = await runSql(c, sql);
  const row = Array.isArray(result) ? result[0] : null;
  return { ok: true, users: row?.users ?? 0, identities: row?.identities ?? 0, submitted: clean.length };
}

async function actionCreateBucket(body: any) {
  const c = await resolveCreds(body.creds, { service: true });
  const name = String(body.name ?? "");
  if (!BUCKET_RE.test(name)) throw new HttpError(400, "Bucket names must be 2–63 characters: lowercase letters, numbers, dots, dashes or underscores.");
  const res = await fetch(`${c.url}/storage/v1/bucket`, {
    method: "POST",
    headers: { apikey: c.serviceKey, Authorization: `Bearer ${c.serviceKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ id: name, name, public: Boolean(body.public) }),
  });
  const b = await readJson(res);
  if (!res.ok) {
    const text = JSON.stringify(b ?? {}).toLowerCase();
    if (res.status === 409 || text.includes("already exists")) return { ok: true, existed: true };
    throw new HttpError(res.status === 400 ? 422 : res.status, friendly(res.status, b, "Could not create the bucket."));
  }
  return { ok: true, existed: false };
}

async function actionUpload(body: any) {
  const c = await resolveCreds(body.creds, { service: true });
  const bucket = String(body.bucket ?? "");
  const path = String(body.path ?? "");
  if (!BUCKET_RE.test(bucket)) throw new HttpError(400, "Invalid bucket name.");
  if (!path || path.length > 900 || path.startsWith("/") || path.split("/").some((s) => s === ".." || s === "")) {
    throw new HttpError(400, "Invalid file path.");
  }
  if (typeof body.data !== "string") throw new HttpError(400, "Missing file data.");
  let bytes: Uint8Array;
  try {
    bytes = Uint8Array.from(atob(body.data), (ch) => ch.charCodeAt(0));
  } catch {
    throw new HttpError(400, "File data was not valid.");
  }
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  const res = await fetch(`${c.url}/storage/v1/object/${bucket}/${encoded}`, {
    method: "POST",
    headers: {
      apikey: c.serviceKey,
      Authorization: `Bearer ${c.serviceKey}`,
      "Content-Type": String(body.contentType || "application/octet-stream").slice(0, 200),
      "x-upsert": "true",
    },
    body: bytes,
  });
  if (!res.ok) throw new HttpError(res.status === 400 ? 422 : res.status, friendly(res.status, await readJson(res), "Upload failed."));
  return { ok: true };
}

// ---- entrypoint ------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ ok: false, error: "Use POST." }, 405);

  try {
    const tooBig = "That request is too large. Try fewer or smaller files at once.";
    if (Number(req.headers.get("content-length") ?? "0") > MAX_BODY_BYTES) throw new HttpError(413, tooBig);
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) throw new HttpError(413, tooBig);
    let body: any;
    try {
      body = JSON.parse(text);
    } catch {
      throw new HttpError(400, "The request was not valid JSON.");
    }

    switch (body?.action) {
      case "oauth_exchange": return json(await actionOauthExchange(body));
      case "oauth_refresh": return json(await actionOauthRefresh(body));
      case "projects": return json(await actionProjects(body));
      case "github_exchange": return json(await actionGithubExchange(body));
      case "test": return json(await actionTest(body.creds));
      case "sql": return json(await actionSql(body));
      case "keys": return json(await actionKeys(body));
      case "insert": return json(await actionInsert(body));
      case "import_users": return json(await actionImportUsers(body));
      case "create_bucket": return json(await actionCreateBucket(body));
      case "upload": return json(await actionUpload(body));
      default: throw new HttpError(400, "Unknown action.");
    }
  } catch (e) {
    if (e instanceof HttpError) return json({ ok: false, error: e.message, code: e.code }, e.status);
    // Intentionally generic: never echo internals or request contents.
    return json({ ok: false, error: "Something went wrong on our side. Please try again." }, 500);
  }
});
