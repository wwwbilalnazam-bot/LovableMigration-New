import { useEffect, useState } from "react";
import { Database, FileSpreadsheet, Loader2, Play, RefreshCw, X } from "lucide-react";
import { Dropzone, NeedReconnect, StepShell } from "@/components/wizard-ui";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/form";
import { Progress } from "@/components/ui/form";
import { Alert, Card, EmptyState } from "@/components/ui/misc";
import { api } from "@/lib/proxy";
import { buildSchema, convertRows, guessTable, parseCsv, SCHEMA_SQL, sortByDependencies } from "@/lib/importer";
import type { PathedFile } from "@/lib/files";
import { fmt } from "@/lib/utils";
import { useWizard, type Report } from "@/lib/wizard";

interface CsvItem {
  id: string;
  name: string;
  headers: string[];
  rows: Record<string, string>[];
  table: string;
}
interface Prog {
  done: number;
  total: number;
  status: "pending" | "running" | "done" | "error";
  error?: string;
  ignored?: string[];
}

const BATCH = 500;

export default function Step4Data() {
  const { state, set, patchReport, creds, hasSecrets } = useWizard();
  const [scanError, setScanError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [items, setItems] = useState<CsvItem[]>([]);
  const [progress, setProgress] = useState<Record<string, Prog>>({});
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [readError, setReadError] = useState("");

  const schema = state.dbSchema;
  const tableNames = schema ? Object.keys(schema.tables).sort() : [];

  async function scan() {
    setScanning(true);
    setScanError("");
    try {
      const [cols, fks] = await Promise.all([api.sql(creds, SCHEMA_SQL.columns), api.sql(creds, SCHEMA_SQL.fks)]);
      set({ dbSchema: buildSchema(cols, fks) });
    } catch (e) {
      setScanError((e as Error).message);
    } finally {
      setScanning(false);
    }
  }

  useEffect(() => {
    if (hasSecrets && !schema) void scan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onFiles(files: PathedFile[]) {
    setReadError("");
    const csvs = files.filter((f) => f.file.name.toLowerCase().endsWith(".csv"));
    if (!csvs.length) return setReadError("Those don't look like CSV files. Export each table from Lovable as a .csv file.");
    const added: CsvItem[] = [];
    for (const f of csvs) {
      try {
        const { headers, rows } = parseCsv(await f.file.text());
        added.push({ id: crypto.randomUUID(), name: f.file.name, headers, rows, table: guessTable(f.file.name, tableNames) });
      } catch {
        setReadError(`Couldn't read ${f.file.name}. Is it a valid CSV?`);
      }
    }
    setItems((cur) => [...cur, ...added]);
    setFinished(false);
  }

  const mapped = items.filter((i) => i.table);
  const order = schema ? sortByDependencies([...new Set(mapped.map((i) => i.table))], schema.deps) : [];
  const ordered = [...mapped].sort((a, b) => order.indexOf(a.table) - order.indexOf(b.table));

  async function run() {
    if (!schema) return;
    setRunning(true);
    setFinished(false);
    const reportRows: Report["tables"] = [];
    const errors: string[] = [];
    const init: Record<string, Prog> = {};
    for (const it of ordered) init[it.id] = { done: 0, total: it.rows.length, status: "pending" };
    setProgress(init);

    for (const it of ordered) {
      const { rows, ignored } = convertRows(it.rows, schema.tables[it.table]);
      const upd = (p: Partial<Prog>) => setProgress((s) => ({ ...s, [it.id]: { ...s[it.id], ...p } }));
      upd({ status: "running", total: rows.length, ignored });
      let done = 0;
      try {
        for (let i = 0; i < rows.length; i += BATCH) {
          const batch = rows.slice(i, i + BATCH);
          await api.insert(creds, it.table, batch);
          done += batch.length;
          upd({ done });
        }
        upd({ status: "done", done });
        reportRows.push({ name: it.table, rows: done, total: rows.length, status: "done" });
      } catch (e) {
        const msg = (e as Error).message;
        upd({ status: "error", error: msg, done });
        reportRows.push({ name: it.table, rows: done, total: rows.length, status: done ? "partial" : "error", error: msg });
        errors.push(`Table ${it.table}: ${msg}`);
      }
    }
    patchReport((r) => ({ ...r, tables: reportRows, errors: [...r.errors.filter((x) => !x.startsWith("Table ")), ...errors] }));
    setRunning(false);
    setFinished(true);
  }

  const totalRows = ordered.reduce((n, i) => n + i.rows.length, 0);

  return (
    <StepShell
      title="Table data"
      description="Import your rows from the CSV files you export from Lovable. Parent tables are loaded before child tables automatically."
      canContinue={finished}
      footerNote={
        !finished && !running ? (
          <button className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground" onClick={() => setFinished(true)}>
            No table data to import. Skip
          </button>
        ) : null
      }
    >
      {!hasSecrets && <NeedReconnect />}

      <Alert tone="info" title="How to export your data from Lovable">
        In Lovable, open <b>Cloud → Database</b>, open each table and export it as <b>CSV</b>. Name them after the table (e.g. <code>profiles.csv</code>) so we can match them automatically.
      </Alert>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Database className="h-4 w-4 text-muted-foreground" />
        {scanning ? (
          <span className="inline-flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Reading your new database…</span>
        ) : schema ? (
          <span className="text-muted-foreground">Found {tableNames.length} table{tableNames.length === 1 ? "" : "s"} in your new database.</span>
        ) : (
          <span className="text-muted-foreground">Database not scanned yet.</span>
        )}
        <Button variant="ghost" size="sm" onClick={scan} disabled={scanning || !hasSecrets}><RefreshCw className="h-3.5 w-3.5" /> Rescan</Button>
      </div>
      {scanError && <Alert tone="error" title="Couldn't read your database">{scanError}</Alert>}
      {schema && tableNames.length === 0 && (
        <Alert tone="warn" title="No tables found">Your new database has no tables yet. Go back and run the schema migration first.</Alert>
      )}

      <Dropzone onFiles={onFiles} accept=".csv" title="Drop your CSV files here" hint="One CSV per table. You can add them in several batches." />
      {readError && <Alert tone="error">{readError}</Alert>}

      {items.length === 0 ? (
        <EmptyState icon={<FileSpreadsheet className="h-8 w-8" />} title="No CSV files added">Add your exported CSVs above, then check that each one matches the right table.</EmptyState>
      ) : (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b px-4 py-3 text-sm">
            <span className="font-medium">Match files to tables</span>
            <span className="text-xs text-muted-foreground">{mapped.length}/{items.length} mapped · {fmt(totalRows)} rows</span>
          </div>
          <ul className="divide-y">
            {(ordered.length ? [...ordered, ...items.filter((i) => !i.table)] : items).map((it) => {
              const p = progress[it.id];
              return (
                <li key={it.id} className="space-y-2 px-4 py-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-xs">{it.name}</p>
                      <p className="text-xs text-muted-foreground">{fmt(it.rows.length)} rows · {it.headers.length} columns</p>
                    </div>
                    <NativeSelect className="sm:w-56" value={it.table} disabled={running} onChange={(e) => setItems((cur) => cur.map((x) => (x.id === it.id ? { ...x, table: e.target.value } : x)))} aria-label={`Table for ${it.name}`}>
                      <option value="">— Skip this file —</option>
                      {tableNames.map((t) => <option key={t} value={t}>{t}</option>)}
                    </NativeSelect>
                    <Button variant="ghost" size="icon" disabled={running} onClick={() => setItems((cur) => cur.filter((x) => x.id !== it.id))} aria-label={`Remove ${it.name}`}><X className="h-4 w-4" /></Button>
                  </div>
                  {p && (
                    <div className="space-y-1">
                      <Progress value={p.total ? (p.done / p.total) * 100 : 100} />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{fmt(p.done)} / {fmt(p.total)} rows</span>
                        <span className="capitalize">{p.status}</span>
                      </div>
                      {p.ignored && p.ignored.length > 0 && <p className="text-xs text-amber-500">Ignored columns not in your database: {p.ignored.join(", ")}</p>}
                      {p.error && <Alert tone="error" title="Some rows weren't imported">{p.error}</Alert>}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {ordered.length > 0 && !running && order.length > 1 && (
        <p className="text-xs text-muted-foreground">Import order: {order.join(" → ")}</p>
      )}

      {mapped.length > 0 && (
        <div className="flex items-center gap-3">
          <Button onClick={run} disabled={running || !hasSecrets}>
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} {finished ? "Import again" : "Import data"}
          </Button>
          {finished && !running && <span className="text-sm text-muted-foreground">Finished. Review any errors above, then continue.</span>}
        </div>
      )}
    </StepShell>
  );
}
