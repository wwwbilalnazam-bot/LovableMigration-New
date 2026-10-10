import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { PageShell, Seo } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/misc";
import { api } from "@/lib/proxy";
import { redirectUri, takeOAuthSession } from "@/lib/oauth";
import { useWizard } from "@/lib/wizard";

export default function OAuthCallback() {
  const nav = useNavigate();
  const { set, go } = useWizard();
  const [error, setError] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // StrictMode double-run would burn the one-time code
    ran.current = true;
    (async () => {
      const q = new URLSearchParams(window.location.search);
      const saved = takeOAuthSession();
      if (q.get("error")) return setError("You cancelled the connection, or Supabase denied access. You can try again.");
      const code = q.get("code");
      if (!code || !saved || saved.state !== q.get("state")) return setError("That sign-in link isn't valid or has expired. Please start again.");
      try {
        const token = await api.oauthExchange(code, saved.verifier, redirectUri());
        set({ token, connected: false, projectRef: "", projectUrl: "" });
        go(1);
        nav("/migrate", { replace: true });
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, [go, nav, set]);

  return (
    <PageShell>
      <Seo path="/oauth/callback" noindex title="Connecting to Supabase" description="Finishing your Supabase connection." />
      <div className="container max-w-md space-y-4 py-24 text-center">
        {error ? (
          <>
            <Alert tone="error" title="Couldn't connect to Supabase">{error}</Alert>
            <Button onClick={() => nav("/migrate", { replace: true })}>Back to the wizard</Button>
          </>
        ) : (
          <p className="inline-flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Finishing your Supabase connection…</p>
        )}
      </div>
    </PageShell>
  );
}
