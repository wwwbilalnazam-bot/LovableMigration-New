import { appBackendConfigured, appSupabaseKey, appSupabaseUrl } from "./supabase";

/** `token` = OAuth access token (preferred). serviceKey/pat = manual fallback. */
export interface Creds {
  url: string;
  ref: string;
  serviceKey: string;
  pat: string;
  token?: string;
}

export interface SbProject {
  ref: string;
  name: string;
  region?: string;
  status?: string;
}

export class ProxyError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

// OAuth tokens live in module memory only (never persisted).
let tokens: { access: string; refresh: string | null } | null = null;
export const setTokens = (access: string, refresh: string | null) => {
  tokens = { access, refresh };
};
export const clearTokens = () => {
  tokens = null;
};
export const getAccessToken = () => tokens?.access ?? "";

async function raw(body: Record<string, unknown>) {
  if (!appBackendConfigured) {
    throw new ProxyError("The migration service isn't configured yet. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY and deploy the migration-proxy function.");
  }
  let res: Response;
  try {
    res = await fetch(`${appSupabaseUrl}/functions/v1/migration-proxy`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: appSupabaseKey, Authorization: `Bearer ${appSupabaseKey}` },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ProxyError("Couldn't reach the migration service. Check your internet connection and try again.");
  }
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* fall through */
  }
  if (!res.ok || !data?.ok) {
    throw new ProxyError(data?.error || `The migration service returned an error (${res.status}). Please try again.`, data?.code);
  }
  return data;
}

async function call<T = any>(body: Record<string, any>, retried = false): Promise<T> {
  // Always use the freshest token (it may have been refreshed since the caller built `creds`).
  if (body.creds?.token && tokens) body = { ...body, creds: { ...body.creds, token: tokens.access } };
  if (body.action === "projects" && tokens) body = { ...body, token: tokens.access };
  try {
    return await raw(body);
  } catch (e) {
    if (e instanceof ProxyError && e.code === "token_expired" && !retried && tokens?.refresh) {
      const r = await raw({ action: "oauth_refresh", refreshToken: tokens.refresh });
      tokens = { access: r.accessToken, refresh: r.refreshToken ?? tokens.refresh };
      return call<T>(body, true);
    }
    throw e;
  }
}

export const api = {
  oauthExchange: async (code: string, codeVerifier: string, redirectUri: string) => {
    const r = await raw({ action: "oauth_exchange", code, codeVerifier, redirectUri });
    setTokens(r.accessToken, r.refreshToken);
    return r.accessToken as string;
  },
  githubExchange: async (code: string, codeVerifier: string, redirectUri: string) =>
    (await raw({ action: "github_exchange", code, codeVerifier, redirectUri })).accessToken as string,
  projects: async () => (await call<{ projects: SbProject[] }>({ action: "projects", token: tokens?.access ?? "" })).projects,
  test: (creds: Creds) => call<{ projectName: string; warning: string | null }>({ action: "test", creds }),
  sql: async (creds: Creds, query: string) => (await call<{ result: any }>({ action: "sql", creds, query })).result,
  keys: (creds: Creds) => call<{ publishableKey: string | null }>({ action: "keys", creds }),
  insert: (creds: Creds, table: string, rows: Record<string, unknown>[]) =>
    call<{ inserted: number }>({ action: "insert", creds, table, rows }),
  importUsers: (creds: Creds, users: Record<string, unknown>[]) =>
    call<{ users: number; identities: number; submitted: number }>({ action: "import_users", creds, users }),
  createBucket: (creds: Creds, name: string, isPublic: boolean) =>
    call<{ existed: boolean }>({ action: "create_bucket", creds, name, public: isPublic }),
  upload: (creds: Creds, bucket: string, path: string, data: string, contentType: string) =>
    call({ action: "upload", creds, bucket, path, data, contentType }),
};
