// The Supabase project that hosts THIS app (waitlist, anonymous stats, migration-proxy).
// Plain fetch against the REST API: no SDK, so content pages stay light.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const appBackendConfigured = Boolean(url && key);
export const appSupabaseUrl = url ?? "";
export const appSupabaseKey = key ?? "";

const headers = (extra: Record<string, string> = {}) => ({ apikey: key ?? "", Authorization: `Bearer ${key ?? ""}`, "Content-Type": "application/json", ...extra });

export async function joinWaitlist(email: string, source: string): Promise<{ ok: boolean; message: string }> {
  if (!appBackendConfigured) return { ok: false, message: "The waitlist isn't connected yet. Please try again later." };
  try {
    const res = await fetch(`${url}/rest/v1/waitlist`, {
      method: "POST",
      headers: headers({ Prefer: "return=minimal" }),
      body: JSON.stringify({ email: email.trim().toLowerCase(), source }),
    });
    if (res.ok) return { ok: true, message: "You're on the list. We'll email you when Pro launches." };
    const body = await res.json().catch(() => ({}));
    if (res.status === 409 || body?.code === "23505") return { ok: true, message: "You're already on the list. Thanks!" };
  } catch {
    /* fall through */
  }
  return { ok: false, message: "We couldn't save your email. Please try again in a moment." };
}

export async function recordStats(s: { tables: number; rows: number; users: number; success: boolean }) {
  if (!appBackendConfigured) return;
  try {
    await fetch(`${url}/rest/v1/migrations_stats`, {
      method: "POST",
      headers: headers({ Prefer: "return=minimal" }),
      body: JSON.stringify({ tables_count: s.tables, rows_count: s.rows, users_count: s.users, success: s.success }),
    });
  } catch {
    /* stats are best-effort */
  }
}

/** Public counter of successful migrations (security-definer function that returns only a number). */
export async function getMigrationCount(): Promise<number> {
  if (!appBackendConfigured) return 0;
  try {
    const res = await fetch(`${url}/rest/v1/rpc/migration_count`, { method: "POST", headers: headers(), body: "{}" });
    return res.ok ? Number(await res.json()) || 0 : 0;
  } catch {
    return 0;
  }
}
