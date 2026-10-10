import { useRef, useState } from "react";
import { FileCode2, Loader2, Play, RotateCw, SkipForward, Square } from "lucide-react";
import { CodeBlock } from "@/components/shared";
import { Dropzone, NeedReconnect, StatusIcon, StepShell } from "@/components/wizard-ui";
import { Button } from "@/components/ui/button";
import { Alert, Card } from "@/components/ui/misc";
import { api } from "@/lib/proxy";
import GithubPicker from "./GithubPicker";
import MissingFilesHelp from "./MissingFilesHelp";
import { readSqlFiles, scanZip, sortMigrations, type PathedFile } from "@/lib/files";
import { useWizard, type FileStatus } from "@/lib/wizard";

type Decision = "retry" | "skip" | "stop";

export default function Step3Schema() {
  const { state, set, patchReport, creds, hasSecrets } = useWizard();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, { status: FileStatus; error?: string }>>({});
  const [pending, setPending] = useState<string | null>(null); // file awaiting a decision
  const resolver = useRef<((d: Decision) => void) | null>(null);
  const [finished, setFinished] = useState(false);

  async function onFiles(files: PathedFile[]) {
    setError("");
    setLoading(true);
    setFinished(false);
    setStatuses({});
    try {
      const zip = files.find((f) => f.file.name.toLowerCase().endsWith(".zip"));
      if (zip) {
        const scan = await scanZip(zip.file);
        if (!scan.migrations.length) throw new Error("This ZIP has no supabase/migrations/*.sql files. See the help box below for how to get them, or how to rebuild your schema without them.");
        set({ migrations: scan.migrations, functions: scan.functions });
      } else {
        const inMigrations = files.filter((f) => f.file.name.toLowerCase().endsWith(".sql"));
        if (!inMigrations.length) throw new Error("No .sql files found. Drop the contents of your supabase/migrations folder or the whole project ZIP. If you have neither, see the help box below.");
        const merged = new Map(state.migrations.map((m) => [m.name, m]));
        for (const m of await readSqlFiles(inMigrations.map((f) => f.file))) merged.set(m.name, m);
        set({ migrations: sortMigrations([...merged.values()]) });
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const setStatus = (name: string, status: FileStatus, err?: string) => {
    setStatuses((s) => ({ ...s, [name]: { status, error: err } }));
  };

  function decide(d: Decision) {
    resolver.current?.(d);
    resolver.current = null;
    setPending(null);
  }

  async function run() {
    setRunning(true);
    setFinished(false);
    let stopped = false;
    const results: { name: string; status: FileStatus; error?: string }[] = [];
    for (const f of state.migrations) {
      if (statuses[f.name]?.status === "success") {
        results.push({ name: f.name, status: "success" });
        continue;
      }
      let done = false;
      while (!done) {
        setStatus(f.name, "running");
        try {
          await api.sql(creds, f.sql);
          setStatus(f.name, "success");
          results.push({ name: f.name, status: "success" });
          done = true;
        } catch (e) {
          const msg = (e as Error).message;
          setStatus(f.name, "error", msg);
          setPending(f.name);
          const d = await new Promise<Decision>((res) => (resolver.current = res));
          if (d === "skip") {
            setStatus(f.name, "skipped", msg);
            results.push({ name: f.name, status: "skipped", error: msg });
            done = true;
          } else if (d === "stop") {
            results.push({ name: f.name, status: "error", error: msg });
            stopped = true;
            done = true;
          }
        }
      }
      if (stopped) break;
    }
    patchReport((r) => ({
      ...r,
      schemaFiles: results,
      errors: [...r.errors.filter((x) => !x.startsWith("Schema:")), ...results.filter((x) => x.error).map((x) => `Schema: ${x.name}: ${x.error}`)],
    }));
    setRunning(false);
    setFinished(!stopped);
  }

  const total = state.migrations.length;
  const okCount = Object.values(statuses).filter((s) => s.status === "success").length;
  const canContinue = finished;

  return (
    <StepShell
      title="Database schema"
      description="We'll replay your Lovable migration files in order to rebuild your tables, functions and RLS policies."
      canContinue={canContinue}
      footerNote={
        !finished && !running ? (
          <button className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground" onClick={() => setFinished(true)}>
            My schema is already set up. Skip
          </button>
        ) : null
      }
    >
      {!hasSecrets && <NeedReconnect />}

      <GithubPicker onLoaded={(scan) => { setError(""); setFinished(false); setStatuses({}); set({ migrations: scan.migrations, functions: scan.functions }); }} />
      <p className="text-center text-xs text-muted-foreground">or upload manually</p>
      <Dropzone
        onFiles={onFiles}
        accept=".zip,.sql"
        allowFolder
        title="Upload your project ZIP or drop your supabase/migrations files"
        hint="ZIP from your Lovable GitHub export (Code → Download ZIP), or the .sql files / folder from supabase/migrations"
      />
      {loading && <Alert tone="info"><span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Reading your files…</span></Alert>}
      {error && <Alert tone="error" title="Couldn't read those files">{error}</Alert>}

      {total === 0 && !loading && (
        <MissingFilesHelp onPaste={(sql) => { setError(""); setFinished(false); setStatuses({}); set({ migrations: [{ name: "00000000000000_exported_schema.sql", sql }] }); }} />
      )}

      {total > 0 && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="text-sm font-medium">{total} migration file{total === 1 ? "" : "s"} · runs in filename order</p>
            <span className="text-xs text-muted-foreground">{okCount}/{total} done</span>
          </div>
          <ul className="max-h-80 divide-y overflow-y-auto" aria-live="polite">
            {state.migrations.map((m) => {
              const s = statuses[m.name]?.status ?? "pending";
              return (
                <li key={m.name} className="space-y-2 px-4 py-2.5">
                  <div className="flex items-center gap-3 text-sm">
                    <StatusIcon status={s} />
                    <FileCode2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate font-mono text-xs">{m.name}</span>
                    <span className="text-xs capitalize text-muted-foreground">{s}</span>
                  </div>
                  {pending === m.name && (
                    <div className="space-y-2">
                      <Alert tone="error" title="This file hit an error">
                        <code className="whitespace-pre-wrap break-words text-xs">{statuses[m.name]?.error}</code>
                        <p className="mt-1.5 text-xs">“Already exists” errors usually mean this part was already created, so Skip is safe. For anything else, fix it and Retry.</p>
                      </Alert>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => decide("retry")}><RotateCw className="h-3.5 w-3.5" /> Retry</Button>
                        <Button size="sm" variant="secondary" onClick={() => decide("skip")}><SkipForward className="h-3.5 w-3.5" /> Skip</Button>
                        <Button size="sm" variant="outline" onClick={() => decide("stop")}><Square className="h-3.5 w-3.5" /> Stop</Button>
                      </div>
                    </div>
                  )}
                  {pending !== m.name && statuses[m.name]?.status === "skipped" && <p className="pl-10 text-xs text-muted-foreground">Skipped. {statuses[m.name]?.error?.slice(0, 120)}</p>}
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {total > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={run} disabled={running || !hasSecrets}>
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} {okCount > 0 && !finished ? "Resume schema migration" : "Run schema migration"}
          </Button>
          {finished && <Alert tone="success" className="flex-1">Schema migration finished. You can continue.</Alert>}
        </div>
      )}

      <details className="rounded-lg border p-3 text-sm">
        <summary className="cursor-pointer font-medium">Where do I find these files?</summary>
        <div className="mt-3 space-y-2 text-muted-foreground">
          <p>In Lovable, connect GitHub (Settings → GitHub), then open the repository on github.com → <b>Code → Download ZIP</b>. The migrations live in:</p>
          <CodeBlock code="supabase/migrations/20250101000000_xxxxx.sql" label="Path inside the ZIP" />
        </div>
      </details>
    </StepShell>
  );
}
