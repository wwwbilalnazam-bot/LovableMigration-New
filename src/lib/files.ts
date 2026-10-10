import JSZip from "jszip";

export interface SqlFile {
  name: string;
  sql: string;
}

export interface EdgeFunction {
  name: string;
  secrets: string[];
}

export interface ProjectScan {
  migrations: SqlFile[];
  functions: EdgeFunction[];
}

export interface PathedFile {
  file: File;
  path: string; // relative path, forward slashes
}

const BUILTIN_SECRETS = /^(SUPABASE_URL|SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_DB_URL|SUPABASE_PUBLISHABLE_KEY|DENO_.*)$/;

export function sortMigrations(files: SqlFile[]): SqlFile[] {
  return [...files].sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));
}

/** Read a Lovable GitHub export (.zip) and pull out migrations + edge functions. */
export async function scanZip(file: File): Promise<ProjectScan> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    throw new Error("That doesn't look like a valid ZIP file. Download the ZIP from GitHub (Code → Download ZIP) and try again.");
  }
  const migrations: SqlFile[] = [];
  const fnSecrets = new Map<string, Set<string>>();

  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    const norm = path.replace(/\\/g, "/");
    const mig = norm.match(/(?:^|\/)supabase\/migrations\/([^/]+\.sql)$/i);
    if (mig) {
      migrations.push({ name: mig[1], sql: await entry.async("string") });
      continue;
    }
    const fn = norm.match(/(?:^|\/)supabase\/functions\/([^/]+)\/(.+)$/);
    if (fn && !fn[1].startsWith("_")) {
      const set = fnSecrets.get(fn[1]) ?? new Set<string>();
      if (/\.(ts|js|mjs|tsx)$/.test(fn[2])) {
        const text = await entry.async("string");
        for (const m of text.matchAll(/Deno\.env\.get\(\s*["'`]([A-Z0-9_]+)["'`]\s*\)/g)) {
          if (!BUILTIN_SECRETS.test(m[1])) set.add(m[1]);
        }
      }
      fnSecrets.set(fn[1], set);
    }
  }
  return {
    migrations: sortMigrations(migrations),
    functions: [...fnSecrets.entries()].map(([name, s]) => ({ name, secrets: [...s].sort() })).sort((a, b) => a.name.localeCompare(b.name)),
  };
}

/** Read loose .sql files (dragged from supabase/migrations). */
export async function readSqlFiles(files: File[]): Promise<SqlFile[]> {
  const sqls = files.filter((f) => f.name.toLowerCase().endsWith(".sql"));
  const out: SqlFile[] = [];
  for (const f of sqls) out.push({ name: f.name, sql: await f.text() });
  return sortMigrations(out);
}

// ---- drag & drop with folders ----------------------------------------------

function entryFile(entry: any): Promise<File> {
  return new Promise((resolve, reject) => entry.file(resolve, reject));
}

function readAllEntries(reader: any): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const all: any[] = [];
    const next = () =>
      reader.readEntries((batch: any[]) => {
        if (!batch.length) return resolve(all);
        all.push(...batch);
        next();
      }, reject);
    next();
  });
}

async function walk(entry: any, prefix: string, out: PathedFile[]) {
  if (entry.isFile) {
    out.push({ file: await entryFile(entry), path: prefix + entry.name });
  } else if (entry.isDirectory) {
    const children = await readAllEntries(entry.createReader());
    for (const c of children) await walk(c, prefix + entry.name + "/", out);
  }
}

/** Collect files from a drop event, keeping folder structure. */
export async function collectDropped(dt: DataTransfer): Promise<PathedFile[]> {
  const out: PathedFile[] = [];
  const items = Array.from(dt.items ?? []);
  const entries = items.map((i) => (i as any).webkitGetAsEntry?.()).filter(Boolean);
  if (entries.length) {
    for (const e of entries) await walk(e, "", out);
    return out;
  }
  return Array.from(dt.files).map((file) => ({ file, path: file.name }));
}

export function fromInput(files: FileList | null): PathedFile[] {
  return Array.from(files ?? []).map((file) => ({
    file,
    path: ((file as any).webkitRelativePath as string) || file.name,
  }));
}

export async function fileToBase64(file: File): Promise<string> {
  const buf = new Uint8Array(await file.arrayBuffer());
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < buf.length; i += chunk) bin += String.fromCharCode(...buf.subarray(i, i + chunk));
  return btoa(bin);
}

/** Custom secret names used by an edge function's source (excludes Supabase built-ins). */
export function findSecrets(source: string): string[] {
  const out = new Set<string>();
  for (const m of source.matchAll(/Deno\.env\.get\(\s*["'`]([A-Z0-9_]+)["'`]\s*\)/g)) {
    if (!BUILTIN_SECRETS.test(m[1])) out.add(m[1]);
  }
  return [...out];
}
