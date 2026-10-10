import { useState } from "react";
import { FolderOpen, Loader2, Play, Plus, Trash2, UploadCloud } from "lucide-react";
import { Dropzone, NeedReconnect, StepShell } from "@/components/wizard-ui";
import { Button } from "@/components/ui/button";
import { Input, Progress, Switch } from "@/components/ui/form";
import { Alert, Card, EmptyState } from "@/components/ui/misc";
import { api } from "@/lib/proxy";
import { fileToBase64, type PathedFile } from "@/lib/files";
import { fmt } from "@/lib/utils";
import { useWizard } from "@/lib/wizard";

const MAX_FILE = 8 * 1024 * 1024;
const BUCKET_RE = /^[a-z0-9][a-z0-9._-]{1,62}$/;

interface Bucket {
  id: string;
  name: string;
  isPublic: boolean;
  files: PathedFile[];
  done: number;
  failed: number;
  status: "idle" | "running" | "done" | "error";
  errors: string[];
}

export default function Step6Storage() {
  const { creds, hasSecrets, patchReport } = useWizard();
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  const add = () => setBuckets((b) => [...b, { id: crypto.randomUUID(), name: "", isPublic: true, files: [], done: 0, failed: 0, status: "idle", errors: [] }]);
  const patch = (id: string, p: Partial<Bucket>) => setBuckets((bs) => bs.map((b) => (b.id === id ? { ...b, ...p } : b)));

  function addFiles(b: Bucket, files: PathedFile[]) {
    // When a folder named like the bucket is dropped, don't repeat its name inside the bucket.
    const cleaned = files.map((f) => {
      const parts = f.path.split("/");
      const path = parts.length > 1 && parts[0] === b.name ? parts.slice(1).join("/") : f.path;
      return { ...f, path };
    });
    const map = new Map([...b.files, ...cleaned].map((f) => [f.path, f]));
    patch(b.id, { files: [...map.values()], status: "idle", done: 0, failed: 0, errors: [] });
  }

  const valid = (b: Bucket) => BUCKET_RE.test(b.name) && b.files.length > 0;
  const nameBad = (b: Bucket) => b.name !== "" && !BUCKET_RE.test(b.name);

  async function run() {
    setRunning(true);
    setFinished(false);
    let totalFiles = 0;
    let totalFailed = 0;
    let bucketCount = 0;
    const errors: string[] = [];
    for (const b of buckets.filter(valid)) {
      patch(b.id, { status: "running", done: 0, failed: 0, errors: [] });
      const errs: string[] = [];
      try {
        await api.createBucket(creds, b.name, b.isPublic);
        bucketCount++;
      } catch (e) {
        const msg = (e as Error).message;
        patch(b.id, { status: "error", errors: [msg] });
        errors.push(`Bucket ${b.name}: ${msg}`);
        totalFailed += b.files.length;
        continue;
      }
      let done = 0;
      let failed = 0;
      for (const f of b.files) {
        try {
          if (f.file.size > MAX_FILE) throw new Error(`Larger than ${MAX_FILE / 1024 / 1024} MB. Upload this one from the Supabase dashboard.`);
          await api.upload(creds, b.name, f.path, await fileToBase64(f.file), f.file.type || "application/octet-stream");
          done++;
        } catch (e) {
          failed++;
          errs.push(`${f.path}: ${(e as Error).message}`);
        }
        patch(b.id, { done, failed, errors: errs.slice(0, 20) });
      }
      totalFiles += done;
      totalFailed += failed;
      errors.push(...errs.slice(0, 20).map((x) => `Storage ${b.name}/${x}`));
      patch(b.id, { status: failed ? "error" : "done" });
    }
    patchReport((r) => ({
      ...r,
      storage: { buckets: bucketCount, files: totalFiles, failed: totalFailed, errors: errors.slice(0, 50) },
      errors: [...r.errors.filter((x) => !x.startsWith("Storage ") && !x.startsWith("Bucket ")), ...errors.slice(0, 50)],
    }));
    setRunning(false);
    setFinished(true);
  }

  return (
    <StepShell
      title="Storage files (optional)"
      description="Re-create your buckets and upload your files, keeping folder paths."
      canContinue
      continueLabel={finished ? "Continue" : "Skip / Continue"}
    >
      {!hasSecrets && <NeedReconnect />}
      <Alert tone="info" title="Getting your files out of Lovable">
        In Lovable open <b>Cloud → Storage</b>, download each bucket's files, then drop them below under the matching bucket name. Files over 8 MB should be uploaded from your Supabase dashboard.
      </Alert>

      {buckets.length === 0 ? (
        <EmptyState icon={<FolderOpen className="h-8 w-8" />} title="No buckets added">
          No files to move? Just press Continue. Otherwise add a bucket for each one you use.
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {buckets.map((b) => (
            <Card key={b.id} className="space-y-4 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex-1 space-y-1">
                  <Input placeholder="bucket-name" value={b.name} disabled={running} onChange={(e) => patch(b.id, { name: e.target.value.trim() })} aria-label="Bucket name" />
                  {nameBad(b) && <p className="text-xs text-destructive">Use 2–63 lowercase letters, numbers, dots, dashes or underscores.</p>}
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={b.isPublic} disabled={running} onCheckedChange={(v) => patch(b.id, { isPublic: v })} /> {b.isPublic ? "Public" : "Private"}
                </label>
                <Button variant="ghost" size="icon" disabled={running} onClick={() => setBuckets((bs) => bs.filter((x) => x.id !== b.id))} aria-label="Remove bucket"><Trash2 className="h-4 w-4" /></Button>
              </div>
              <Dropzone onFiles={(f) => addFiles(b, f)} allowFolder title={b.files.length ? `${fmt(b.files.length)} file${b.files.length === 1 ? "" : "s"} ready. Drop more to add` : "Drop files or a folder for this bucket"} hint="Folder structure is kept" />
              {b.status !== "idle" && (
                <div className="space-y-1">
                  <Progress value={b.files.length ? ((b.done + b.failed) / b.files.length) * 100 : 0} />
                  <p className="text-xs text-muted-foreground">{fmt(b.done)} / {fmt(b.files.length)} uploaded{b.failed ? ` · ${b.failed} failed` : ""}</p>
                  {b.errors.length > 0 && (
                    <Alert tone="error" title="Some files didn't upload">
                      <ul className="max-h-32 list-disc space-y-0.5 overflow-y-auto pl-5 text-xs">{b.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                    </Alert>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={add} disabled={running}><Plus className="h-4 w-4" /> Add bucket</Button>
        {buckets.some(valid) && (
          <Button onClick={run} disabled={running || !hasSecrets}>
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />} <Play className="hidden" /> Upload files
          </Button>
        )}
      </div>
    </StepShell>
  );
}
