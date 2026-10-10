import Papa from "papaparse";

export interface ColumnInfo {
  name: string;
  dataType: string; // information_schema data_type
  udt: string;
}

export interface DbSchema {
  tables: Record<string, ColumnInfo[]>;
  deps: Record<string, string[]>; // table -> parent tables it references
}

export const SCHEMA_SQL = {
  columns: `select table_name, column_name, data_type, udt_name from information_schema.columns
where table_schema = 'public' and table_name in (select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE')
order by table_name, ordinal_position;`,
  fks: `select cl.relname as tbl, rf.relname as parent from pg_constraint c
join pg_class cl on cl.oid = c.conrelid join pg_namespace n on n.oid = cl.relnamespace
join pg_class rf on rf.oid = c.confrelid join pg_namespace n2 on n2.oid = rf.relnamespace
where c.contype = 'f' and n.nspname = 'public' and n2.nspname = 'public';`,
};

export function buildSchema(columns: any[], fks: any[]): DbSchema {
  const tables: Record<string, ColumnInfo[]> = {};
  for (const c of columns ?? []) {
    (tables[c.table_name] ??= []).push({ name: c.column_name, dataType: c.data_type, udt: c.udt_name });
  }
  const deps: Record<string, string[]> = {};
  for (const t of Object.keys(tables)) deps[t] = [];
  for (const f of fks ?? []) {
    if (f.tbl !== f.parent && deps[f.tbl] && !deps[f.tbl].includes(f.parent)) deps[f.tbl].push(f.parent);
  }
  return { tables, deps };
}

/** Parents first (Kahn). Tables in a cycle are appended at the end. */
export function sortByDependencies(selected: string[], deps: Record<string, string[]>): string[] {
  const set = new Set(selected);
  const remaining = new Map<string, Set<string>>();
  for (const t of selected) remaining.set(t, new Set((deps[t] ?? []).filter((p) => set.has(p))));
  const order: string[] = [];
  while (remaining.size) {
    const ready = [...remaining.entries()].filter(([, d]) => d.size === 0).map(([t]) => t).sort();
    if (!ready.length) {
      order.push(...[...remaining.keys()].sort());
      break;
    }
    for (const t of ready) {
      order.push(t);
      remaining.delete(t);
    }
    for (const d of remaining.values()) for (const t of ready) d.delete(t);
  }
  return order;
}

/** Guess which table a CSV export belongs to from its filename. */
export function guessTable(filename: string, tables: string[]): string {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/\.csv$/, "")
      .replace(/\s*\(\d+\)$/, "")
      .replace(/[-_ ]?(rows|export|data|table)$/g, "")
      .replace(/[^a-z0-9]/g, "");
  const f = norm(filename);
  const exact = tables.find((t) => norm(t) === f);
  if (exact) return exact;
  const partial = tables.find((t) => f.startsWith(norm(t)) || norm(t).startsWith(f));
  return partial && f.length > 2 ? partial : "";
}

export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const res = Papa.parse<Record<string, string>>(text.replace(/^﻿/, ""), { header: true, skipEmptyLines: "greedy" });
  return { headers: res.meta.fields ?? [], rows: res.data };
}

const TRUE = new Set(["true", "t", "1", "yes", "y"]);
const FALSE = new Set(["false", "f", "0", "no", "n"]);

/** Convert one CSV cell to the right JSON value for a column type. */
export function convertValue(raw: unknown, col: ColumnInfo): unknown {
  if (raw === undefined || raw === null) return null;
  const s = String(raw);
  if (s.trim() === "") return col.dataType === "text" || col.dataType === "character varying" ? null : null;
  const t = col.dataType;
  if (t === "boolean") {
    const v = s.trim().toLowerCase();
    return TRUE.has(v) ? true : FALSE.has(v) ? false : null;
  }
  if (t === "json" || t === "jsonb") {
    try {
      return JSON.parse(s);
    } catch {
      return s;
    }
  }
  if (t === "ARRAY") {
    const v = s.trim();
    if (v.startsWith("[")) {
      try {
        const parsed = JSON.parse(v);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        /* fall through */
      }
    }
    return v; // Postgres literal like {a,b} is accepted by PostgREST
  }
  if (t.startsWith("timestamp") || t === "date") {
    if (t === "date") return s.trim().slice(0, 10);
    const d = new Date(s.includes("T") || /[+-]\d\d(:?\d\d)?$|Z$/.test(s) ? s : s.replace(" ", "T") + (t === "timestamp with time zone" ? "Z" : ""));
    return isNaN(d.getTime()) ? s : d.toISOString();
  }
  if (["integer", "bigint", "smallint", "numeric", "real", "double precision"].includes(t)) {
    const n = Number(s);
    return Number.isFinite(n) && Math.abs(n) < Number.MAX_SAFE_INTEGER ? n : s.trim();
  }
  return s;
}

export function convertRows(rows: Record<string, string>[], columns: ColumnInfo[]) {
  const byName = new Map(columns.map((c) => [c.name, c]));
  const usable = Object.keys(rows[0] ?? {}).filter((h) => byName.has(h));
  const ignored = Object.keys(rows[0] ?? {}).filter((h) => !byName.has(h));
  const out = rows.map((r) => {
    const o: Record<string, unknown> = {};
    for (const h of usable) o[h] = convertValue(r[h], byName.get(h)!);
    return o;
  });
  return { rows: out, ignored };
}

export const USERS_EXPORT_SQL = `select id, email, encrypted_password, email_confirmed_at,
       raw_user_meta_data, raw_app_meta_data, created_at
from auth.users
order by created_at;`;

/**
 * Run in Lovable Cloud's SQL editor when the project has no supabase/migrations files.
 * Returns ONE cell containing CREATE statements (enums, tables, constraints, functions, RLS, policies, triggers).
 */
export const SCHEMA_EXPORT_SQL = `select string_agg(ddl, E'\n\n' order by ord, name) as schema_sql from (
  select 0 as ord, t.typname::text as name,
    format('create type public.%I as enum (%s);', t.typname, string_agg(quote_literal(e.enumlabel), ', ' order by e.enumsortorder)) as ddl
  from pg_type t join pg_enum e on e.enumtypid = t.oid
  where t.typnamespace = 'public'::regnamespace group by t.typname
  union all
  select 1, c.relname::text,
    format('create table if not exists public.%I (%s);', c.relname,
      string_agg(format('%I %s%s%s', a.attname, format_type(a.atttypid, a.atttypmod),
        case when a.attnotnull then ' not null' else '' end,
        coalesce(' default ' || pg_get_expr(d.adbin, d.adrelid), '')), ', ' order by a.attnum))
  from pg_class c
  join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
  left join pg_attrdef d on d.adrelid = c.oid and d.adnum = a.attnum
  where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' group by c.relname
  union all
  select case when contype = 'f' then 3 else 2 end, conname::text,
    format('alter table %s add constraint %I %s;', conrelid::regclass, conname, pg_get_constraintdef(oid))
  from pg_constraint where connamespace = 'public'::regnamespace and contype in ('p','u','c','f')
  union all
  select 4, p.proname::text, pg_get_functiondef(p.oid) || ';'
  from pg_proc p where p.pronamespace = 'public'::regnamespace and p.prokind = 'f' and p.prorettype <> 'event_trigger'::regtype
  union all
  select 5, c.relname::text, format('alter table public.%I enable row level security;', c.relname)
  from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and c.relrowsecurity
  union all
  select 6, policyname::text || tablename::text,
    format('create policy %I on public.%I as %s for %s to %s%s%s;', policyname, tablename, permissive, cmd,
      array_to_string(roles, ', '),
      case when qual is not null then ' using (' || qual || ')' else '' end,
      case when with_check is not null then ' with check (' || with_check || ')' else '' end)
  from pg_policies where schemaname = 'public'
  union all
  select 7, tgname::text, pg_get_triggerdef(oid) || ';'
  from pg_trigger where not tgisinternal and tgrelid::regclass::text in (select format('%I', relname) from pg_class where relnamespace = 'public'::regnamespace)
) x;`;
