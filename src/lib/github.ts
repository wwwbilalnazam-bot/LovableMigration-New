// "Connect GitHub" — GitHub App user authorization (code + PKCE). The token stays in memory only.
import { findSecrets, sortMigrations, type EdgeFunction, type ProjectScan } from "./files";

const CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID as string | undefined;
const APP_SLUG = import.meta.env.VITE_GITHUB_APP_SLUG as string | undefined;

export const githubConfigured = Boolean(CLIENT_ID);
export const githubInstallUrl = APP_SLUG ? `https://github.com/apps/${APP_SLUG}/installations/new` : "https://github.com/settings/installations";
export const githubRedirectUri = () => `${window.location.origin}/github/callback`;

let token = "";
export const setGithubToken = (t: string) => {
  token = t;
};
export const getGithubToken = () => token;

const b64url = (buf: Uint8Array) => btoa(String.fromCharCode(...buf)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const rand = (n: number) => b64url(crypto.getRandomValues(new Uint8Array(n)));

export async function startGithubAuth() {
  if (!CLIENT_ID) throw new Error("GitHub login isn't configured yet.");
  const verifier = rand(48);
  const state = rand(16);
  const challenge = b64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));
  sessionStorage.setItem("migrator.github", JSON.stringify({ verifier, state }));
  const q = new URLSearchParams({ client_id: CLIENT_ID, redirect_uri: githubRedirectUri(), state, code_challenge: challenge, code_challenge_method: "S256" });
  window.location.href = `https://github.com/login/oauth/authorize?${q}`;
}

export function takeGithubSession(): { verifier: string; state: string } | null {
  try {
    const raw = sessionStorage.getItem("migrator.github");
    sessionStorage.removeItem("migrator.github");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function gh<T>(path: string, accept = "application/vnd.github+json"): Promise<T> {
  const res = await fetch(`https://api.github.com${path}`, { headers: { Authorization: `Bearer ${token}`, Accept: accept, "X-GitHub-Api-Version": "2022-11-28" } });
  if (res.status === 401) throw new Error("Your GitHub connection expired. Please connect GitHub again.");
  if (res.status === 403 || res.status === 404) throw new Error("GitHub says this app can't access that repository. Make sure the app is installed on it.");
  if (!res.ok) throw new Error(`GitHub returned an error (${res.status}). Please try again.`);
  return (accept.includes("raw") ? await res.text() : await res.json()) as T;
}

export interface Repo {
  full_name: string;
  default_branch: string;
  private: boolean;
}

/** Repositories the user has granted to the app (across all installations). */
export async function listRepos(): Promise<{ repos: Repo[]; installations: number }> {
  const inst = await gh<{ installations: { id: number }[] }>("/user/installations?per_page=100");
  const repos: Repo[] = [];
  for (const i of inst.installations) {
    const r = await gh<{ repositories: Repo[] }>(`/user/installations/${i.id}/repositories?per_page=100`);
    repos.push(...r.repositories);
  }
  repos.sort((a, b) => a.full_name.localeCompare(b.full_name));
  return { repos, installations: inst.installations.length };
}

export async function scanRepo(repo: Repo): Promise<ProjectScan> {
  const tree = await gh<{ tree: { path: string; type: string }[]; truncated: boolean }>(`/repos/${repo.full_name}/git/trees/${encodeURIComponent(repo.default_branch)}?recursive=1`);
  const raw = (path: string) =>
    gh<string>(`/repos/${repo.full_name}/contents/${path.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(repo.default_branch)}`, "application/vnd.github.raw");

  const migPaths = tree.tree.filter((t) => t.type === "blob" && /(^|\/)supabase\/migrations\/[^/]+\.sql$/i.test(t.path)).map((t) => t.path);
  const fnFiles = tree.tree.filter((t) => t.type === "blob" && /(^|\/)supabase\/functions\/[^/_][^/]*\/.+/.test(t.path));

  const migrations: { name: string; sql: string }[] = [];
  for (let i = 0; i < migPaths.length; i += 8) {
    const chunk = migPaths.slice(i, i + 8);
    const texts = await Promise.all(chunk.map(raw));
    chunk.forEach((p, j) => migrations.push({ name: p.split("/").pop()!, sql: texts[j] }));
  }

  const names = new Map<string, Set<string>>();
  for (const f of fnFiles) {
    const m = f.path.match(/supabase\/functions\/([^/]+)\/(.+)$/)!;
    const set = names.get(m[1]) ?? new Set<string>();
    if (/\.(ts|js|mjs|tsx)$/.test(m[2])) findSecrets(await raw(f.path)).forEach((s) => set.add(s));
    names.set(m[1], set);
  }
  const functions: EdgeFunction[] = [...names.entries()].map(([name, s]) => ({ name, secrets: [...s].sort() })).sort((a, b) => a.name.localeCompare(b.name));
  return { migrations: sortMigrations(migrations), functions };
}
