import assert from "node:assert/strict";
import JSZip from "jszip";
import { buildSchema, convertRows, convertValue, guessTable, parseCsv, sortByDependencies } from "../src/lib/importer";
import { scanZip, sortMigrations, findSecrets } from "../src/lib/files";

let pass = 0;
const t = (name: string, fn: () => void | Promise<void>) =>
  Promise.resolve(fn()).then(() => { pass++; console.log("ok  ", name); }, (e) => { console.log("FAIL", name, "\n   ", e.message); process.exitCode = 1; });

const col = (dataType: string) => ({ name: "c", dataType, udt: dataType });

await t("empty string -> null for every type", () => {
  for (const ty of ["text", "integer", "boolean", "jsonb", "ARRAY", "timestamp with time zone", "uuid", "numeric", "date"]) assert.equal(convertValue("", col(ty)), null, ty);
});
await t("booleans", () => {
  assert.equal(convertValue("true", col("boolean")), true);
  assert.equal(convertValue("t", col("boolean")), true);
  assert.equal(convertValue("False", col("boolean")), false);
  assert.equal(convertValue("0", col("boolean")), false);
  assert.equal(convertValue("maybe", col("boolean")), null);
});
await t("json / jsonb", () => {
  assert.deepEqual(convertValue('{"a":[1,2]}', col("jsonb")), { a: [1, 2] });
  assert.equal(convertValue("not json", col("json")), "not json");
});
await t("arrays", () => {
  assert.deepEqual(convertValue('["a","b"]', col("ARRAY")), ["a", "b"]);
  assert.equal(convertValue("{a,b}", col("ARRAY")), "{a,b}");
});
await t("timestamps", () => {
  assert.equal(convertValue("2024-05-01T10:00:00Z", col("timestamp with time zone")), "2024-05-01T10:00:00.000Z");
  assert.equal(convertValue("2024-05-01 10:00:00+00", col("timestamp with time zone")), "2024-05-01T10:00:00.000Z");
  assert.equal(convertValue("2024-05-01 10:00:00", col("timestamp with time zone")), "2024-05-01T10:00:00.000Z");
  assert.equal(convertValue("garbage", col("timestamp with time zone")), "garbage");
  assert.equal(convertValue("2024-05-01 00:00:00", col("date")), "2024-05-01");
});
await t("numbers keep value; text untouched", () => {
  assert.equal(convertValue("42", col("integer")), 42);
  assert.equal(convertValue("3.5", col("numeric")), 3.5);
  assert.equal(convertValue("  hi ", col("text")), "  hi ");
  assert.equal(convertValue("0123", col("text")), "0123");
});
await t("convertRows drops unknown columns and reports them", () => {
  const r = convertRows([{ id: "1", name: "", extra: "x" }], [{ name: "id", dataType: "integer", udt: "int4" }, { name: "name", dataType: "text", udt: "text" }]);
  assert.deepEqual(r.rows, [{ id: 1, name: null }]);
  assert.deepEqual(r.ignored, ["extra"]);
});
await t("FK topological order, parents first", () => {
  const s = buildSchema(
    ["comments", "posts", "users", "profiles", "tags"].map((t) => ({ table_name: t, column_name: "id", data_type: "uuid", udt_name: "uuid" })),
    [{ tbl: "comments", parent: "posts" }, { tbl: "posts", parent: "users" }, { tbl: "profiles", parent: "users" }, { tbl: "comments", parent: "users" }, { tbl: "users", parent: "users" }],
  );
  const o = sortByDependencies(Object.keys(s.tables), s.deps);
  assert.ok(o.indexOf("users") < o.indexOf("posts") && o.indexOf("posts") < o.indexOf("comments") && o.indexOf("users") < o.indexOf("profiles"), o.join());
  assert.equal(o.length, 5);
});
await t("FK cycle does not hang and keeps all tables", () => {
  const o = sortByDependencies(["a", "b", "c"], { a: ["b"], b: ["a"], c: [] });
  assert.equal(o[0], "c"); assert.equal(o.length, 3);
});
await t("only selected tables considered for ordering", () => {
  assert.deepEqual(sortByDependencies(["child"], { child: ["parent"] }), ["child"]);
});
await t("guessTable", () => {
  const tbl = ["profiles", "user_roles", "blog_posts"];
  assert.equal(guessTable("profiles.csv", tbl), "profiles");
  assert.equal(guessTable("profiles_rows.csv", tbl), "profiles");
  assert.equal(guessTable("User Roles (1).csv", tbl), "user_roles");
  assert.equal(guessTable("blog-posts-export.csv", tbl), "blog_posts");
  assert.equal(guessTable("zzz.csv", tbl), "");
});
await t("parseCsv: BOM, quotes, newlines in cells, blank lines", () => {
  const { headers, rows } = parseCsv('﻿id,note,meta\n1,"hello, ""world""\nline2","{""a"":1}"\n\n2,,\n');
  assert.deepEqual(headers, ["id", "note", "meta"]);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].note, 'hello, "world"\nline2');
  assert.equal(rows[1].note, "");
});
await t("sortMigrations by timestamp filename", () => {
  const s = sortMigrations([{ name: "20250102_b.sql", sql: "" }, { name: "20241231_a.sql", sql: "" }, { name: "20250102_a.sql", sql: "" }]);
  assert.deepEqual(s.map((x) => x.name), ["20241231_a.sql", "20250102_a.sql", "20250102_b.sql"]);
});
await t("scanZip finds migrations (nested root), functions and secrets", async () => {
  const z = new JSZip();
  z.file("my-app-main/supabase/migrations/20250102_b.sql", "select 2;");
  z.file("my-app-main/supabase/migrations/20250101_a.sql", "select 1;");
  z.file("my-app-main/supabase/migrations/notes.txt", "x");
  z.file("my-app-main/supabase/functions/send-mail/index.ts", 'const k = Deno.env.get("RESEND_API_KEY"); Deno.env.get("SUPABASE_URL");');
  z.file("my-app-main/supabase/functions/_shared/cors.ts", "export {}");
  z.file("my-app-main/src/App.tsx", "x");
  const buf = await z.generateAsync({ type: "uint8array" });
  const r = await scanZip(new File([buf], "p.zip"));
  assert.deepEqual(r.migrations.map((m) => m.name), ["20250101_a.sql", "20250102_b.sql"]);
  assert.deepEqual(r.functions, [{ name: "send-mail", secrets: ["RESEND_API_KEY"] }]);
});
await t("scanZip rejects non-zip with friendly message", async () => {
  await assert.rejects(() => scanZip(new File(["nope"], "x.zip")), /valid ZIP/);
});
await t("findSecrets ignores built-ins", () => {
  assert.deepEqual(findSecrets('Deno.env.get("A_B"); Deno.env.get(\'SUPABASE_SERVICE_ROLE_KEY\')'), ["A_B"]);
});
console.log(`\n${pass} passed`);
