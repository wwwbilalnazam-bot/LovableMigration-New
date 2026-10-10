import { useState } from "react";
import { FolderArchive } from "lucide-react";
import { CodeBlock } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Alert, Card } from "@/components/ui/misc";
import { SCHEMA_EXPORT_SQL } from "@/lib/importer";

const Step = ({ n, children }: { n: number; children: React.ReactNode }) => (
  <li className="flex gap-3">
    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary">{n}</span>
    <span>{children}</span>
  </li>
);

export default function MissingFilesHelp({ onPaste }: { onPaste: (sql: string) => void }) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState<"zip" | "folder" | "none">("zip");

  const tab = (id: typeof open, label: string) => (
    <button onClick={() => setOpen(id)} className={`rounded-md px-3 py-1.5 text-sm transition-colors ${open === id ? "bg-primary/15 font-medium text-primary" : "text-muted-foreground hover:text-foreground"}`}>{label}</button>
  );

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center gap-2"><FolderArchive className="h-5 w-5 text-primary" /><p className="font-medium">Don't have your migration files yet? Here's how to get them</p></div>
      <div className="flex flex-wrap gap-1">{tab("zip", "Download a ZIP")}{tab("folder", "Use the folder")}{tab("none", "No migrations folder")}</div>

      {open === "zip" && (
        <ol className="space-y-2.5 text-sm text-muted-foreground">
          <Step n={1}>In Lovable, open your project and click the <b>GitHub</b> button (top right, or Project settings → GitHub). Choose <b>Connect project</b> and approve it. This pushes your code to a repository you own.</Step>
          <Step n={2}>Open that repository on github.com. Click the green <b>Code</b> button, then <b>Download ZIP</b>.</Step>
          <Step n={3}>Drop the ZIP file into the upload box above. Don't unzip it, we read it for you.</Step>
          <Step n={4}>Or skip the download: use <b>Connect GitHub</b> above and pick the repository.</Step>
        </ol>
      )}
      {open === "folder" && (
        <ol className="space-y-2.5 text-sm text-muted-foreground">
          <Step n={1}>Unzip the downloaded repository on your computer.</Step>
          <Step n={2}>Open the <code>supabase</code> folder, then the <code>migrations</code> folder. It contains files like <code>20250412093000_abc.sql</code>.</Step>
          <Step n={3}>Drag the whole <code>migrations</code> folder (or all the .sql files in it) into the upload box above. You can also use <b>Choose folder</b>.</Step>
          <Step n={4}>Want edge functions listed in Step 7 too? Upload the full ZIP or use Connect GitHub instead.</Step>
        </ol>
      )}
      {open === "none" && (
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>Some Lovable Cloud projects keep their database structure only in the database and have no <code>supabase/migrations</code> folder. No problem. We can rebuild the structure from the live database:</p>
          <ol className="space-y-2.5">
            <Step n={1}>In Lovable open <b>Cloud → Database → SQL editor</b> and run this query:</Step>
          </ol>
          <CodeBlock code={SCHEMA_EXPORT_SQL} label="SQL: export your schema" />
          <ol className="space-y-2.5" start={2}>
            <Step n={2}>The result is one cell called <code>schema_sql</code>. Click it, copy the whole text, and paste it below.</Step>
          </ol>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the schema_sql result here…"
            className="h-32 w-full rounded-md border border-input bg-background/50 p-3 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button size="sm" disabled={text.trim().length < 20} onClick={() => onPaste(text.trim())}>Use this schema</Button>
          <Alert tone="warn">This is a best-effort rebuild (tables, constraints, functions, RLS policies, triggers). Review any errors in the next step. "Skip" is safe for harmless "already exists" messages.</Alert>
        </div>
      )}
    </Card>
  );
}
