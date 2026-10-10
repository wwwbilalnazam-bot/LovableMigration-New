import { useState } from "react";
import { ExternalLink, Image as ImageIcon } from "lucide-react";
import { StepShell } from "@/components/wizard-ui";
import { Checkbox } from "@/components/ui/form";
import { Card } from "@/components/ui/misc";
import { useWizard } from "@/lib/wizard";
import { track } from "@/lib/analytics";

// Drop more screenshots into public/screenshots/ and set `image` below to show them.
const items: { title: string; body: string; link?: string; linkLabel?: string; image?: string; w?: number; h?: number; alt?: string }[] = [
  {
    title: "Create a free Supabase account",
    body: "Go to supabase.com and sign up. “Continue with GitHub” is the fastest. Or use your email and a password, then confirm the email Supabase sends you.",
    link: "https://supabase.com/dashboard/sign-up",
    linkLabel: "Open Supabase sign-up",
    image: "/screenshots/01-create-account.webp",
    w: 500,
    h: 800,
    alt: "Supabase sign-up page with Continue with GitHub and email options",
  },
  {
    title: "Create a new project",
    body: "On your Projects page click the green “New project” button, pick a name, choose a region close to your users and save the database password somewhere safe. Your new project then appears in the list.",
    image: "/screenshots/02-projects.webp",
    w: 613,
    h: 693,
    alt: "Supabase Projects page listing the new project",
  },
  {
    title: "Wait until it's ready",
    body: "Setup takes 1–2 minutes. Open your project and wait until the Status shows “Healthy”. Then you're good to go.",
    image: "/screenshots/03-project-healthy.webp",
    w: 922,
    h: 825,
    alt: "Supabase project overview with Status: Healthy",
  },
];

function Shot({ n, image, alt, w, h }: { n: number; image?: string; alt?: string; w?: number; h?: number }) {
  const [failed, setFailed] = useState(false);
  if (image && !failed) {
    return (
      <a href={image} target="_blank" rel="noreferrer" className="block w-full shrink-0 overflow-hidden rounded-md border sm:w-56" title="Click to enlarge">
        <img src={image} alt={alt ?? ""} width={w} height={h} loading="lazy" decoding="async" onError={() => setFailed(true)} className="h-auto w-full" />
      </a>
    );
  }
  return (
    <div className="grid h-24 w-full shrink-0 place-items-center rounded-md border border-dashed bg-secondary/40 text-muted-foreground sm:w-56" aria-label="Screenshot placeholder">
      <span className="flex flex-col items-center gap-1 text-xs"><ImageIcon className="h-5 w-5" /> Screenshot {n}</span>
    </div>
  );
}

export default function Step1Project() {
  const { state, set, go } = useWizard();
  return (
    <StepShell title="Create your Supabase project" description="Your data will move into a project that you own. This takes about two minutes." canContinue={state.projectReady} onContinue={() => { track("start_migration"); go(1); }}>
      <div className="space-y-3">
        {items.map((it, i) => (
          <Card key={it.title} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
            <Shot n={i + 1} image={it.image} alt={it.alt} w={it.w} h={it.h} />
            <div className="space-y-1.5">
              <p className="font-medium"><span className="mr-2 text-primary">{i + 1}.</span>{it.title}</p>
              <p className="text-sm text-muted-foreground">{it.body}</p>
              {it.link && (
                <a href={it.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                  {it.linkLabel ?? "Open Supabase"} <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </Card>
        ))}
      </div>
      <label className="flex cursor-pointer items-center gap-3 rounded-lg border bg-card p-4">
        <Checkbox checked={state.projectReady} onCheckedChange={(v) => set({ projectReady: v === true })} />
        <span className="text-sm font-medium">My project is ready</span>
      </label>
    </StepShell>
  );
}
