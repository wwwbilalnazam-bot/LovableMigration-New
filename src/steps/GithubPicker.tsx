import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, GitBranch as Github, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/form";
import { Alert, Card } from "@/components/ui/misc";
import type { ProjectScan } from "@/lib/files";
import { getGithubToken, githubConfigured, githubInstallUrl, listRepos, scanRepo, startGithubAuth, type Repo } from "@/lib/github";

export default function GithubPicker({ onLoaded }: { onLoaded: (scan: ProjectScan, repo: string) => void }) {
  const [connected] = useState(Boolean(getGithubToken()));
  const [repos, setRepos] = useState<Repo[] | null>(null);
  const [installs, setInstalls] = useState(0);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loadedRepo, setLoadedRepo] = useState("");

  useEffect(() => {
    if (!connected) return;
    setBusy(true);
    listRepos()
      .then((r) => {
        setRepos(r.repos);
        setInstalls(r.installations);
        if (r.repos.length === 1) setSelected(r.repos[0].full_name);
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setBusy(false));
  }, [connected]);

  async function load() {
    const repo = repos?.find((r) => r.full_name === selected);
    if (!repo) return;
    setBusy(true);
    setError("");
    try {
      const scan = await scanRepo(repo);
      if (!scan.migrations.length) throw new Error("No supabase/migrations/*.sql files were found in that repository's default branch.");
      onLoaded(scan, repo.full_name);
      setLoadedRepo(repo.full_name);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!githubConfigured) return null;

  return (
    <Card className="space-y-3 p-5">
      <p className="flex items-center gap-2 font-medium"><Github className="h-4 w-4" /> Read it straight from GitHub</p>
      {!connected ? (
        <>
          <p className="text-sm text-muted-foreground">Connect the GitHub account that holds your Lovable project. We only read files, and only from repositories you allow.</p>
          <Button onClick={() => startGithubAuth().catch((e) => setError((e as Error).message))}><Github className="h-4 w-4" /> Connect GitHub</Button>
        </>
      ) : (
        <>
          {busy && !repos && <p className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading your repositories…</p>}
          {repos && repos.length === 0 && (
            <Alert tone="warn" title={installs ? "No repositories shared" : "The app isn't installed yet"}>
              Install the GitHub app on your Lovable repository, then reload this page.{" "}
              <a className="inline-flex items-center gap-1 font-medium text-primary underline underline-offset-4" href={githubInstallUrl} target="_blank" rel="noreferrer">Install on GitHub <ExternalLink className="h-3 w-3" /></a>
            </Alert>
          )}
          {repos && repos.length > 0 && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <NativeSelect value={selected} onChange={(e) => setSelected(e.target.value)} aria-label="Repository">
                <option value="">Choose your Lovable repository…</option>
                {repos.map((r) => <option key={r.full_name} value={r.full_name}>{r.full_name}{r.private ? " 🔒" : ""}</option>)}
              </NativeSelect>
              <Button onClick={load} disabled={!selected || busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Load files</Button>
            </div>
          )}
          {loadedRepo && <p className="flex items-center gap-2 text-sm text-primary"><CheckCircle2 className="h-4 w-4" /> Loaded from {loadedRepo}</p>}
        </>
      )}
      {error && <Alert tone="error">{error}</Alert>}
    </Card>
  );
}
