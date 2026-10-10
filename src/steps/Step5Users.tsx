import { useState } from "react";
import { AlertTriangle, Loader2, Play, Users } from "lucide-react";
import { CodeBlock } from "@/components/shared";
import { Dropzone, NeedReconnect, StepShell } from "@/components/wizard-ui";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/form";
import { Alert, EmptyState } from "@/components/ui/misc";
import { api } from "@/lib/proxy";
import { parseCsv, USERS_EXPORT_SQL } from "@/lib/importer";
import type { PathedFile } from "@/lib/files";
import { fmt } from "@/lib/utils";
import { useWizard } from "@/lib/wizard";

const REQUIRED = ["id", "email", "encrypted_password"];
const BATCH = 50;

function tryJson(v: string | undefined) {
  if (!v || !v.trim()) return null;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

export default function Step5Users() {
  const { creds, hasSecrets, patchReport } = useWizard();
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [imported, setImported] = useState(0);
  const [failed, setFailed] = useState<{ email: string; reason: string }[]>([]);
  const [finished, setFinished] = useState(false);

  async function onFiles(files: PathedFile[]) {
    setError("");
    setFinished(false);
    const f = files.find((x) => x.file.name.toLowerCase().endsWith(".csv"));
    if (!f) return setError("Please upload the CSV file you exported from the SQL editor.");
    const { headers, rows } = parseCsv(await f.file.text());
    const missing = REQUIRED.filter((c) => !headers.includes(c));
    if (missing.length) return setError(`This CSV is missing the column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}. Run the query above exactly as shown and export its result.`);
    if (!rows.length) return setError("That CSV has no users in it.");
    setRows(rows);
    setFileName(f.file.name);
  }

  async function run() {
    setRunning(true);
    setFinished(false);
    setDone(0);
    setImported(0);
    setFailed([]);
    let ok = 0;
    const bad: { email: string; reason: string }[] = [];

    const toUser = (r: Record<string, string>) => ({
      id: r.id?.trim(),
      email: r.email?.trim(),
      encrypted_password: r.encrypted_password?.trim() || null,
      email_confirmed_at: r.email_confirmed_at?.trim() || null,
      raw_user_meta_data: tryJson(r.raw_user_meta_data),
      raw_app_meta_data: tryJson(r.raw_app_meta_data),
      created_at: r.created_at?.trim() || null,
    });

    for (let i = 0; i < rows.length; i += BATCH) {
      const chunk = rows.slice(i, i + BATCH).map(toUser);
      try {
        ok += (await api.importUsers(creds, chunk)).users;
      } catch {
        // One bad user shouldn't sink the batch: retry individually to pinpoint failures.
        for (const u of chunk) {
          try {
            ok += (await api.importUsers(creds, [u])).users;
          } catch (e) {
            bad.push({ email: u.email ?? "(no email)", reason: (e as Error).message });
          }
        }
      }
      setDone(Math.min(rows.length, i + BATCH));
      setImported(ok);
      setFailed([...bad]);
    }
    patchReport((r) => ({
      ...r,
      users: { imported: ok, failed: bad.length, total: rows.length, errors: bad.slice(0, 50).map((b) => `${b.email}: ${b.reason}`) },
      errors: [...r.errors.filter((x) => !x.startsWith("User ")), ...bad.slice(0, 50).map((b) => `User ${b.email}: ${b.reason}`)],
    }));
    setRunning(false);
    setFinished(true);
  }

  return (
    <StepShell
      title="Auth users (optional)"
      description="Keep your users and their passwords. They'll keep the same ids, so your data still points to the right person."
      canContinue
      continueLabel={finished ? "Continue" : "Skip / Continue"}
    >
      {!hasSecrets && <NeedReconnect />}

      <div className="space-y-2">
        <p className="text-sm font-medium">1. Run this in Lovable Cloud's SQL editor</p>
        <CodeBlock code={USERS_EXPORT_SQL} label="SQL: export users" />
        <p className="text-sm text-muted-foreground">2. Export the result as a <b>CSV</b>, then upload it here.</p>
      </div>

      <Dropzone onFiles={onFiles} accept=".csv" multiple={false} title="Drop your users CSV here" />
      {error && <Alert tone="error" title="Couldn't use that file">{error}</Alert>}

      {!rows.length ? (
        <EmptyState icon={<Users className="h-8 w-8" />} title="No users file yet">
          Don't have any users, or don't need to migrate them? Just press Continue.
        </EmptyState>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={run} disabled={running || !hasSecrets}>
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Import {fmt(rows.length)} user{rows.length === 1 ? "" : "s"}
            </Button>
            <span className="font-mono text-xs text-muted-foreground">{fileName}</span>
          </div>
          {(running || finished) && (
            <div className="space-y-1.5">
              <Progress value={(done / rows.length) * 100} />
              <p className="text-sm text-muted-foreground">{fmt(done)} / {fmt(rows.length)} processed · <span className="text-primary">{fmt(imported)} imported</span> · {fmt(failed.length)} failed</p>
            </div>
          )}
          {finished && failed.length === 0 && imported < rows.length && (
            <Alert tone="info">{fmt(rows.length - imported)} user{rows.length - imported === 1 ? " was" : "s were"} already in your project and left unchanged.</Alert>
          )}
          {failed.length > 0 && (
            <Alert tone="error" title={`${failed.length} user${failed.length === 1 ? "" : "s"} couldn't be imported`}>
              <ul className="mt-1 max-h-40 list-disc space-y-1 overflow-y-auto pl-5 text-xs">
                {failed.slice(0, 50).map((f, i) => <li key={i}><b>{f.email}</b>: {f.reason}</li>)}
              </ul>
            </Alert>
          )}
        </div>
      )}

      <Alert tone="warn" title="Re-enable Google and other login providers">
        <span className="inline-flex items-start gap-2"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        In your Supabase dashboard go to Authentication → Sign In / Providers and turn Google (and any others) back on with your own OAuth credentials. Only email + password logins are migrated.</span>
      </Alert>
    </StepShell>
  );
}
