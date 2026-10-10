import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { Download, HeartHandshake, PartyPopper, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import { CodeBlock, WaitlistForm } from "@/components/shared";
import { StepShell } from "@/components/wizard-ui";
import { Button } from "@/components/ui/button";
import { Alert, Card } from "@/components/ui/misc";
import { api } from "@/lib/proxy";
import { recordStats } from "@/lib/supabase";
import { track } from "@/lib/analytics";
import { downloadText, fmt } from "@/lib/utils";
import { useWizard, type Report } from "@/lib/wizard";

function reportText(r: Report, ref: string) {
  const L: string[] = ["Lovable Cloud → Supabase migration report", `Project: ${ref}`, `Date: ${new Date().toISOString()}`, ""];
  L.push("TABLES");
  r.tables.forEach((t) => L.push(`  ${t.name}: ${t.rows}/${t.total} rows (${t.status})${t.error ? " - " + t.error : ""}`));
  if (!r.tables.length) L.push("  none");
  L.push("", "SCHEMA FILES");
  r.schemaFiles.forEach((f) => L.push(`  ${f.name}: ${f.status}${f.error ? " - " + f.error : ""}`));
  L.push("", `AUTH USERS: ${r.users.imported}/${r.users.total} imported, ${r.users.failed} failed`);
  L.push(`STORAGE: ${r.storage.buckets} buckets, ${r.storage.files} files, ${r.storage.failed} failed`);
  L.push("", `ERRORS (${r.errors.length})`);
  r.errors.forEach((e) => L.push("  - " + e));
  return L.join("\n");
}

export default function Step8Done() {
  const { state, set, creds, hasSecrets, reset } = useWizard();
  const r = state.report;
  const [anonKey, setAnonKey] = useState<string | null>(null);
  const [keyError, setKeyError] = useState("");
  const fired = useRef(false);

  const rows = r.tables.reduce((n, t) => n + t.rows, 0);
  const successful = r.errors.length === 0;

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    const end = Date.now() + 1200;
    (function frame() {
      confetti({ particleCount: 4, angle: 60, spread: 70, origin: { x: 0 }, colors: ["#34d399", "#10b981", "#ffffff"] });
      confetti({ particleCount: 4, angle: 120, spread: 70, origin: { x: 1 }, colors: ["#34d399", "#10b981", "#ffffff"] });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
    if (!state.statsSent) {
      set({ statsSent: true });
      track(successful ? "migration_success" : "migration_error", { tables: r.tables.length, rows, users: r.users.imported, errors: r.errors.length });
      void recordStats({ tables: r.tables.filter((t) => t.status === "done").length, rows, users: r.users.imported, success: successful });
    }
    if (hasSecrets) {
      api.keys(creds).then((k) => (k.publishableKey ? setAnonKey(k.publishableKey) : setKeyError("We couldn't find the publishable key. Copy it from Project Settings → API Keys."))).catch((e) => setKeyError((e as Error).message));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const env = `VITE_SUPABASE_URL="${state.projectUrl}"
VITE_SUPABASE_PUBLISHABLE_KEY="${anonKey ?? "<copy from Project Settings → API Keys → anon / publishable>"}"
VITE_SUPABASE_PROJECT_ID="${state.projectRef}"`;

  const stat = (label: string, value: string) => (
    <Card className="p-4 text-center">
      <p className="text-2xl font-semibold text-primary">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );

  return (
    <StepShell title="You're done!" hideNav>
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-4 rounded-xl border border-primary/30 bg-primary/10 p-5">
        <PartyPopper className="h-10 w-10 shrink-0 text-primary" />
        <div>
          <p className="text-lg font-semibold">{successful ? "Migration complete 🎉" : "Migration finished with a few issues"}</p>
          <p className="text-sm text-muted-foreground">{successful ? "Your backend now lives in your own Supabase project." : "Review the report below. Most issues can be fixed by re-running that step."}</p>
        </div>
      </motion.div>

      <div className="space-y-2">
        <h3 className="font-semibold">1. Update your app's .env</h3>
        <CodeBlock code={env} label=".env" />
        {keyError && <Alert tone="warn">{keyError}</Alert>}
        <h3 className="pt-2 font-semibold">2. Update supabase/config.toml</h3>
        <CodeBlock code={`project_id = "${state.projectRef}"`} label="supabase/config.toml" />
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold">Migration report</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stat("Tables", fmt(r.tables.filter((t) => t.status !== "error").length))}
          {stat("Rows", fmt(rows))}
          {stat("Users", fmt(r.users.imported))}
          {stat("Files", fmt(r.storage.files))}
        </div>
        {r.errors.length > 0 ? (
          <Alert tone="warn" title={`${r.errors.length} issue${r.errors.length === 1 ? "" : "s"} to review`}>
            <ul className="max-h-40 list-disc space-y-1 overflow-y-auto pl-5 text-xs">{r.errors.slice(0, 30).map((e, i) => <li key={i}>{e}</li>)}</ul>
          </Alert>
        ) : (
          <Alert tone="success">No errors were recorded.</Alert>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => downloadText("migration-report.json", JSON.stringify({ project: state.projectRef, date: new Date().toISOString(), ...r }, null, 2), "application/json")}><Download className="h-4 w-4" /> Download JSON</Button>
          <Button variant="outline" onClick={() => downloadText("migration-report.txt", reportText(r, state.projectRef))}><Download className="h-4 w-4" /> Download TXT</Button>
        </div>
      </div>

      <Alert tone="info" title="Before you finish">
        Delete the Personal Access Token you created, and re-add your edge function secrets. Then run your app against the new project and test sign-in.
      </Alert>

      <Card className="space-y-3 p-5">
        <h3 className="font-semibold">Get notified when Pro launches</h3>
        <WaitlistForm source="wizard-done" cta="Notify me" compact />
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="secondary">
          <a target="_blank" rel="noreferrer" href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("I just moved my Lovable Cloud backend to my own Supabase in minutes, for free 🚀")}&url=${encodeURIComponent(window.location.origin)}`}>
            <Share2 className="h-4 w-4" /> Share on X
          </a>
        </Button>
        <Button asChild>
          <Link to="/#waitlist"><HeartHandshake className="h-4 w-4" /> Need help? Book done-for-you migration</Link>
        </Button>
        <Button variant="ghost" onClick={reset}>Start over</Button>
      </div>
    </StepShell>
  );
}
