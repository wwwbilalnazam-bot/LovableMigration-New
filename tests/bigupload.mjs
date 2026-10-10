import { execSync } from "node:child_process";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env", "utf8").split(/\r?\n/).filter(Boolean).map((l) => l.split(/=(.*)/s).slice(0, 2)));
const BASE = env.VITE_SUPABASE_URL, PUB = env.VITE_SUPABASE_PUBLISHABLE_KEY, ref = BASE.match(/https:\/\/(.*)\.supabase\.co/)[1];
const keys = JSON.parse(execSync(`npx supabase projects api-keys --project-ref ${ref} -o json`, { encoding: "utf8" }));
const SERVICE = (keys.find((k) => k.name === "service_role") ?? keys.find((k) => k.type === "secret")).api_key;
const legacy = { url: BASE, ref, serviceKey: SERVICE, pat: "" };
const post = async (b) => { const r = await fetch(`${BASE}/functions/v1/migration-proxy`, { method: "POST", headers: { "Content-Type": "application/json", apikey: PUB, Authorization: `Bearer ${PUB}` }, body: JSON.stringify(b) }); let j = null; try { j = await r.json(); } catch {} return { s: r.status, j }; };
const bucket = `big-test-${Date.now()}`;
console.log("bucket", (await post({ action: "create_bucket", creds: legacy, name: bucket, public: false })).j?.ok);
for (const mb of [1, 4, 6, 8]) {
  const data = Buffer.alloc(mb * 1024 * 1024, 7).toString("base64");
  const t = Date.now(); const r = await post({ action: "upload", creds: legacy, bucket, path: `f${mb}.bin`, data, contentType: "application/octet-stream" });
  console.log(`${mb} MB ->`, r.s, r.j?.ok ? "ok" : JSON.stringify(r.j), `${Date.now() - t}ms`);
}
const h = { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "Content-Type": "application/json" };
await fetch(`${BASE}/storage/v1/object/${bucket}`, { method: "DELETE", headers: h, body: JSON.stringify({ prefixes: [1, 4, 6, 8].map((m) => `f${m}.bin`) }) });
console.log("cleanup", (await fetch(`${BASE}/storage/v1/bucket/${bucket}`, { method: "DELETE", headers: h })).status);
