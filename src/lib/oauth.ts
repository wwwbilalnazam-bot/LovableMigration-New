// "Connect with Supabase" — OAuth 2.0 authorization code flow with PKCE.
const CLIENT_ID = import.meta.env.VITE_SUPABASE_OAUTH_CLIENT_ID as string | undefined;

export const oauthConfigured = Boolean(CLIENT_ID);
export const redirectUri = () => `${window.location.origin}/oauth/callback`;

const b64url = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const randomString = (bytes = 48) => b64url(crypto.getRandomValues(new Uint8Array(bytes)));

export async function startOAuth() {
  if (!CLIENT_ID) throw new Error("Supabase login isn't configured yet.");
  const verifier = randomString(48);
  const state = randomString(16);
  const challenge = b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
  // The verifier is a one-time value, useless without the code; it must survive the redirect.
  sessionStorage.setItem("migrator.oauth", JSON.stringify({ verifier, state }));
  const q = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri(),
    response_type: "code",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  window.location.href = `https://api.supabase.com/v1/oauth/authorize?${q}`;
}

export function takeOAuthSession(): { verifier: string; state: string } | null {
  try {
    const raw = sessionStorage.getItem("migrator.oauth");
    sessionStorage.removeItem("migrator.oauth");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
