import { Code2, KeyRound } from "lucide-react";
import { CodeBlock } from "@/components/shared";
import { StepShell } from "@/components/wizard-ui";
import { Alert, Card, EmptyState } from "@/components/ui/misc";
import { useWizard } from "@/lib/wizard";

export default function Step7Functions() {
  const { state } = useWizard();
  const fns = state.functions;
  const ref = state.projectRef || "YOUR_PROJECT_REF";
  const secrets = [...new Set(fns.flatMap((f) => f.secrets))].sort();

  const deploy = [
    "npm install -g supabase   # or use: npx supabase <command>",
    "supabase login",
    `supabase link --project-ref ${ref}`,
    ...fns.map((f) => `supabase functions deploy ${f.name}`),
  ].join("\n");

  const secretCmd = secrets.length ? `supabase secrets set ${secrets.map((s) => `${s}=your-value`).join(" ")}` : "";

  return (
    <StepShell title="Edge functions" description="Functions run code, so they can't be moved automatically. Deploy them with the Supabase CLI. It takes a minute.">
      {fns.length === 0 ? (
        <EmptyState icon={<Code2 className="h-8 w-8" />} title="No edge functions detected">
          We look inside <code>supabase/functions/</code> in the ZIP you uploaded in the Schema step. If you have functions, go back and upload the ZIP; otherwise just continue.
        </EmptyState>
      ) : (
        <>
          <div className="space-y-2">
            <p className="text-sm font-medium">{fns.length} function{fns.length === 1 ? "" : "s"} found</p>
            <div className="flex flex-wrap gap-2">
              {fns.map((f) => (
                <span key={f.name} className="rounded-md border bg-secondary/50 px-2.5 py-1 font-mono text-xs">{f.name}</span>
              ))}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Run these in a terminal, inside your project folder (the one that contains <code>supabase/</code>):</p>
          <CodeBlock code={deploy} label="Terminal: deploy functions" />

          <Card className="space-y-3 p-4">
            <p className="flex items-center gap-2 text-sm font-medium"><KeyRound className="h-4 w-4 text-primary" /> Secrets you need to add again</p>
            {secrets.length ? (
              <>
                <p className="text-sm text-muted-foreground">Secret values aren't exported from Lovable. Copy them from wherever you originally got them (Stripe, OpenAI, Resend…). We found these names in your function code:</p>
                <ul className="flex flex-wrap gap-2">{secrets.map((s) => <li key={s} className="rounded-md border bg-secondary/50 px-2 py-1 font-mono text-xs">{s}</li>)}</ul>
                <CodeBlock code={secretCmd} label="Terminal: set secrets (fill in the values)" />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No custom secrets were found in your function code. If a function needs API keys, set them in Edge Functions → Secrets in the Supabase dashboard.</p>
            )}
          </Card>
        </>
      )}
      <Alert tone="info">
        Functions that need to be public (webhooks) require <code>verify_jwt = false</code> in <code>supabase/config.toml</code>. Keep the settings from your Lovable project.
      </Alert>
    </StepShell>
  );
}
