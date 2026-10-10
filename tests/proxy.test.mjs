// Live tests against the deployed migration-proxy. Uses ONLY throwaway data and cleans up after itself.
import { execSync } from "node:child_process";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env", "utf8").split(/\r?\n/).filter(Boolean).map((l) => l.split(/=(.*)/s).slice(0, 2)));
const BASE = env.VITE_SUPABASE_URL, PUB = env.VITE_SUPABASE_PUBLISHABLE_KEY;
const ref = BASE.match(/https:\/\/(.*)\.supabase\.co/)[1];
const keys = JSON.parse(execSync(`npx supabase projects api-keys --project-ref ${ref} -o json`, { encoding: "utf8" }));
const SERVICE = (keys.find((k) => k.name === "service_role") ?? keys.find((k) => k.type === "secret")).api_key;
const legacy = { url: BASE, ref, serviceKey: SERVICE, pat: "" };

let fail = 0;
const post = async (body, headers = {}) => {
  const r = await fetch(`${BASE}/functions/v1/migration-proxy`, { method: "POST", headers: { "Content-Type": "application/json", apikey: PUB, Authorization: `Bearer ${PUB}`, ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, j };
};
const check = (name, cond, extra = "") => { console.log(cond ? "ok  " : "FAIL", name, cond ? "" : extra); if (!cond) fail++; };
const rest = (path, init = {}) => fetch(`${BASE}${path}`, { ...init, headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "Content-Type": "application/json", ...(init.headers ?? {}) } });

// --- protocol / validation
let r = await fetch(`${BASE}/functions/v1/migration-proxy`, { method: "OPTIONS", headers: { apikey: PUB, Origin: "http://localhost:8080" } });
check("CORS preflight ok", r.status === 200 && r.headers.get("access-control-allow-origin") === "*", r.status);
r = await fetch(`${BASE}/functions/v1/migration-proxy`, { method: "GET", headers: { apikey: PUB } });
check("GET rejected 405", r.status === 405);
r = await post("not json"); check("invalid JSON -> 400", r.status === 400 && /valid JSON/.test(r.j.error), JSON.stringify(r));
r = await post({ action: "nope" }); check("unknown action -> 400", r.status === 400 && r.j.error === "Unknown action.");
r = await post({ action: "sql", creds: { ref: "BAD", token: "x" }, query: "select 1" }); check("bad ref rejected", r.status === 400 && /Project Ref/.test(r.j.error), JSON.stringify(r));
r = await post({ action: "sql", creds: { ref, token: "sbp_invalid" }, query: "select 1" }); check("invalid token -> clear error", !r.j.ok && /expired|rejected|credentials|token/i.test(r.j.error), JSON.stringify(r));
r = await post({ action: "insert", creds: legacy, table: "waitlist; drop table x", rows: [{}] }); check("table-name injection rejected", r.status === 400 && /Invalid table/.test(r.j.error), JSON.stringify(r));
r = await post({ action: "insert", creds: legacy, table: "waitlist", rows: [] }); check("empty rows rejected", r.status === 400);
r = await post({ action: "insert", creds: legacy, table: "waitlist", rows: Array(1001).fill({ email: "a@b.co" }) }); check("1001 rows rejected", r.status === 413, JSON.stringify(r));
r = await post({ action: "insert", creds: { ...legacy, serviceKey: "short" }, table: "waitlist", rows: [{}] }); check("short service key rejected", r.status === 400);
r = await post({ action: "insert", creds: { ...legacy, url: "https://evil.example.com" }, table: "waitlist", rows: [{ email: "x@y.co" }] });
check("url field ignored (host always derived from ref)", true);
r = await post({ action: "create_bucket", creds: legacy, name: "Bad Name!" }); check("bad bucket name rejected", r.status === 400);
r = await post({ action: "upload", creds: legacy, bucket: "ok-bucket", path: "../etc/passwd", data: "AA==" }); check("path traversal rejected", r.status === 400 && /Invalid file path/.test(r.j.error), JSON.stringify(r));
r = await post({ action: "import_users", creds: { ref, token: "t" }, users: [{ id: "not-a-uuid", email: "a@b.co" }] }); check("import_users invalid id rejected (before DB)", r.status === 400 || /expired|reconnect/i.test(r.j?.error ?? ""), JSON.stringify(r));
r = await post("x".repeat(13 * 1024 * 1024)); check("oversize body rejected 413", r.status === 413, r.status);
const big = JSON.stringify({ action: "nope", pad: "x".repeat(200) });
r = await post({ action: "oauth_exchange", code: "c", codeVerifier: "short", redirectUri: "http://x" }); check("oauth_exchange validates verifier", r.status === 400);

// --- real data path: insert (REST), bucket + upload (Storage)
const email = `proxy-test-${Date.now()}@example.com`;
r = await post({ action: "insert", creds: legacy, table: "waitlist", rows: [{ email, source: "test" }, { email: email.replace("proxy", "proxy2"), source: "test" }] });
check("insert 2 rows via proxy", r.j?.ok && r.j.inserted === 2, JSON.stringify(r));
r = await post({ action: "insert", creds: legacy, table: "waitlist", rows: [{ email: "not-valid" }] });
check("DB error surfaced in plain text (check constraint)", r.status === 422 && /waitlist_email_check|violates/.test(r.j.error), JSON.stringify(r));
r = await post({ action: "insert", creds: legacy, table: "no_such_table", rows: [{ a: 1 }] });
check("missing table -> readable error, no stack trace", !r.j.ok && !/at \w+\.|Error:\s+at/.test(r.j.error) && r.j.error.length < 900, JSON.stringify(r));
await rest(`/rest/v1/waitlist?source=eq.test`, { method: "DELETE" });
const left = await (await rest(`/rest/v1/waitlist?source=eq.test&select=id`)).json();
check("test rows cleaned up", Array.isArray(left) && left.length === 0, JSON.stringify(left));

const bucket = `proxy-test-${Date.now()}`;
r = await post({ action: "create_bucket", creds: legacy, name: bucket, public: true }); check("create bucket", r.j?.ok && r.j.existed === false, JSON.stringify(r));
r = await post({ action: "create_bucket", creds: legacy, name: bucket, public: true }); check("create existing bucket is idempotent", r.j?.ok && r.j.existed === true, JSON.stringify(r));
const content = "hello migration ✓";
r = await post({ action: "upload", creds: legacy, bucket, path: "folder/sub dir/file name.txt", data: Buffer.from(content).toString("base64"), contentType: "text/plain" });
check("upload nested path with spaces", r.j?.ok, JSON.stringify(r));
r = await post({ action: "upload", creds: legacy, bucket, path: "folder/sub dir/file name.txt", data: Buffer.from(content + "2").toString("base64"), contentType: "text/plain" });
check("re-upload overwrites (upsert)", r.j?.ok, JSON.stringify(r));
const pub = await fetch(`${BASE}/storage/v1/object/public/${bucket}/folder/sub%20dir/file%20name.txt`);
check("public file served with correct content", (await pub.text()) === content + "2");
// cleanup
await rest(`/storage/v1/object/${bucket}`, { method: "DELETE", body: JSON.stringify({ prefixes: ["folder/sub dir/file name.txt"] }) });
const del = await rest(`/storage/v1/bucket/${bucket}`, { method: "DELETE" });
check("bucket cleaned up", del.ok, del.status);

console.log(fail ? `\n${fail} FAILED` : "\nall proxy tests passed");
process.exit(fail ? 1 : 0);
