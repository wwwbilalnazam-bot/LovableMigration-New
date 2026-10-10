import fs from "node:fs";
import { createRequire } from "node:module";
const src = fs.readFileSync("supabase/functions/migration-proxy/index.ts", "utf8");
const m = src.match(/const sql = `([\s\S]*?)`;\n\n  const result = await runSql/);
const users = [
  { id: "11111111-1111-4111-8111-111111111111", email: "t1@example.com", encrypted_password: "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012", email_confirmed_at: "2024-01-01T00:00:00Z", raw_user_meta_data: { name: "O'Brien $x$ \"q\"" }, raw_app_meta_data: null, created_at: "2024-01-01T00:00:00Z" },
  { id: "22222222-2222-4222-8222-222222222222", email: "t2@example.com", encrypted_password: null, email_confirmed_at: null, raw_user_meta_data: null, raw_app_meta_data: null, created_at: null },
];
const payload = JSON.stringify(users);
const q = "$jtest123$";
const sql = m[1].replaceAll("${q}", q).replace("${payload}", payload);
fs.writeFileSync(process.argv[2], "begin;\n" + sql + "\n");
