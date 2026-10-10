import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { PageShell, Seo } from "@/components/shared";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/misc";
import { api } from "@/lib/proxy";
import { githubRedirectUri, setGithubToken, takeGithubSession } from "@/lib/github";
import { useWizard } from "@/lib/wizard";

export default function GithubCallback() {
  const nav = useNavigate();
  const { go } = useWizard();
  const [error, setError] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      const q = new URLSearchParams(window.location.search);
      const saved = takeGithubSession();
      if (q.get("error")) return setError("You cancelled the connection, or GitHub denied access. You can try again.");
      const code = q.get("code");
      if (!code || !saved || saved.state !== q.get("state")) return setError("That sign-in link isn't valid or has expired. Please start again.");
      try {
        setGithubToken(await api.githubExchange(code, saved.verifier, githubRedirectUri()));
        track("github_connected");
        go(2);
        nav("/migrate", { replace: true });
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, [go, nav]);

  return (
    <PageShell>
      <Seo path="/github/callback" noindex title="Connecting to GitHub" description="Finishing your GitHub connection." />
      <div className="container max-w-md space-y-4 py-24 text-center">
        {error ? (
          <>
            <Alert tone="error" title="Couldn't connect to GitHub">{error}</Alert>
            <Button onClick={() => nav("/migrate", { replace: true })}>Back to the wizard</Button>
          </>
        ) : (
          <p className="inline-flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Finishing your GitHub connection…</p>
        )}
      </div>
    </PageShell>
  );
}
