import { useEffect, useState } from "react";
import { CheckCircle2, ChevronRight, Loader2, Lock, PlugZap } from "lucide-react";
import { StepShell } from "@/components/wizard-ui";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { Alert, Card } from "@/components/ui/misc";
import { Hint } from "@/components/ui/overlay";
import { api, getAccessToken, setTokens, type SbProject } from "@/lib/proxy";
import { oauthConfigured, startOAuth } from "@/lib/oauth";
import { useWizard } from "@/lib/wizard";
import { track } from "@/lib/analytics";

export default function Step2Connect() {
  const { state, set, creds } = useWizard();
  const [busy, setBusy] = useState(false);
  const [projects, setProjects] = useState<SbProject[] | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState<{ name: string; warning: string | null } | null>(null);
  const hasOAuth = Boolean(state.token && getAccessToken());

  // Restore in-memory token after navigating back to this step.
  useEffect(() => {
    if (state.token && !getAccessToken()) setTokens(state.token, null);
  }, [state.token]);

  useEffect(() => {
    if (!hasOAuth || projects) return;
    setBusy(true);
    api.projects().then(setProjects).catch((e) => setError((e as Error).message)).finally(() => setBusy(false));
  }, [hasOAuth, projects]);

  async function verify(patch: Record<string, any>, c = creds) {
    setBusy(true);
    setError("");
    setInfo(null);
    try {
      const r = await api.test(c);
      set({ ...patch, connected: true });
      track("supabase_connected", { method: state.token ? "oauth" : "manual" });
      setInfo({ name: r.projectName, warning: r.warning });
    } catch (e) {
      set({ ...patch, connected: false });
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const pick = (p: SbProject) => {
    const url = `https://${p.ref}.supabase.co`;
    void verify({ projectRef: p.ref, projectUrl: url }, { ...creds, ref: p.ref, url });
  };

  async function connect() {
    setError("");
    try {
      await startOAuth();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const manualFilled = creds.url && creds.ref && creds.serviceKey && creds.pat;
  const onUrl = (v: string) => {
    const ref = v.match(/^https?:\/\/([a-z0-9]{20})\.supabase\.co/i)?.[1]?.toLowerCase();
    set({ projectUrl: v, connected: false, token: "", ...(ref ? { projectRef: ref } : {}) });
  };
  const edit = (patch: Record<string, string>) => set({ ...patch, connected: false, token: "" });

  return (
    <StepShell title="Connect your Supabase account" description="Approve access once and pick your project. No keys to copy." canContinue={state.connected}>
      {!hasOAuth && (
        <Card className="flex flex-col items-start gap-4 p-6">
          <div className="space-y-1">
            <p className="font-medium">Sign in with Supabase</p>
            <p className="text-sm text-muted-foreground">You'll be sent to supabase.com to approve access, then brought straight back here.</p>
          </div>
          <Button size="lg" onClick={connect} disabled={!oauthConfigured}>
            <PlugZap className="h-4 w-4" /> Connect Supabase
          </Button>
          {!oauthConfigured && <p className="text-xs text-muted-foreground">Supabase login isn't set up on this server yet. Use the manual option below.</p>}
        </Card>
      )}

      {hasOAuth && (
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm font-medium text-primary"><CheckCircle2 className="h-4 w-4" /> Supabase account connected</p>
          <p className="text-sm text-muted-foreground">Choose the project you want to migrate <b>into</b>:</p>
          {projects && projects.length === 0 && (
            <Alert tone="warn" title="No projects found">Create a project in Supabase first (previous step), then reconnect.</Alert>
          )}
          <ul className="space-y-2">
            {projects?.map((p) => (
              <li key={p.ref}>
                <button
                  disabled={busy}
                  onClick={() => pick(p)}
                  className={`flex w-full items-center justify-between rounded-lg border p-3.5 text-left transition-colors hover:border-primary/60 disabled:opacity-60 ${state.connected && state.projectRef === p.ref ? "border-primary bg-primary/10" : "bg-card"}`}
                >
                  <span>
                    <span className="block font-medium">{p.name}</span>
                    <span className="block font-mono text-xs text-muted-foreground">{p.ref}{p.region ? ` · ${p.region}` : ""}{p.status && p.status !== "ACTIVE_HEALTHY" ? ` · ${p.status}` : ""}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {busy && <Alert tone="info"><span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Working…</span></Alert>}
      {error && <Alert tone="error" title="Couldn't connect">{error}</Alert>}
      {state.connected && info && (
        <>
          <Alert tone="success" title="Connected">Ready to migrate into “{info.name}”.</Alert>
          {info.warning && <Alert tone="warn">{info.warning}</Alert>}
        </>
      )}

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Lock className="h-3.5 w-3.5" /> Access is used only during this session and is never stored. You can revoke it any time in Supabase → Account → Authorized apps.</p>

      {!hasOAuth && (
        <details className="rounded-lg border p-4" open={!oauthConfigured}>
          <summary className="cursor-pointer text-sm font-medium">Prefer to paste keys manually?</summary>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="url">Project URL</Label>
              <Input id="url" placeholder="https://abcdefghijklmnopqrst.supabase.co" value={state.projectUrl} onChange={(e) => onUrl(e.target.value)} autoComplete="off" spellCheck={false} />
              <Hint>Project Settings → API → “Project URL”. The Project Ref is filled in for you.</Hint>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ref">Project Ref</Label>
              <Input id="ref" value={state.projectRef} onChange={(e) => edit({ projectRef: e.target.value })} autoComplete="off" spellCheck={false} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="srk">Service Role Key</Label>
              <Input id="srk" type="password" value={state.serviceKey} onChange={(e) => edit({ serviceKey: e.target.value })} autoComplete="off" spellCheck={false} />
              <Hint>Project Settings → API Keys → secret “service_role” key.</Hint>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pat">Personal Access Token</Label>
              <Input id="pat" type="password" placeholder="sbp_…" value={state.pat} onChange={(e) => edit({ pat: e.target.value })} autoComplete="off" spellCheck={false} />
              <Hint>supabase.com/dashboard/account/tokens → Generate new token.</Hint>
            </div>
          </div>
          <Button className="mt-4" variant="secondary" disabled={!manualFilled || busy} onClick={() => verify({})}>Test connection</Button>
        </details>
      )}
    </StepShell>
  );
}
