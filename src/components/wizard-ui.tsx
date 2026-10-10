import { useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2, CheckCircle2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/misc";
import { cn } from "@/lib/utils";
import { collectDropped, fromInput, type PathedFile } from "@/lib/files";
import { STEP_TITLES, useWizard } from "@/lib/wizard";

// ---- Wizard bits -----------------------------------------------------------
export function Stepper() {
  const { state, go } = useWizard();
  return (
    <>
      <ol className="hidden items-center md:flex" aria-label="Progress">
        {STEP_TITLES.map((t, i) => {
          const done = i < state.step;
          const active = i === state.step;
          return (
            <li key={t} className="flex flex-1 items-center last:flex-none">
              <button
                type="button"
                disabled={i > state.step}
                onClick={() => go(i)}
                className="group flex flex-col items-center gap-1.5 disabled:cursor-default"
                aria-current={active ? "step" : undefined}
              >
                <span
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-full border text-xs font-semibold transition-all",
                    done && "border-primary bg-primary text-primary-foreground",
                    active && "border-primary bg-primary/15 text-primary ring-4 ring-primary/10",
                    !done && !active && "text-muted-foreground",
                  )}
                >
                  {done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                </span>
                <span className={cn("text-[11px]", active ? "font-medium text-foreground" : "text-muted-foreground")}>{t}</span>
              </button>
              {i < STEP_TITLES.length - 1 && <div className={cn("mx-2 mb-5 h-px flex-1 transition-colors", done ? "bg-primary" : "bg-border")} />}
            </li>
          );
        })}
      </ol>
      <div className="md:hidden">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">{STEP_TITLES[state.step]}</span>
          <span className="text-muted-foreground">Step {state.step + 1} of {STEP_TITLES.length}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
          <motion.div className="h-full bg-primary" animate={{ width: `${((state.step + 1) / STEP_TITLES.length) * 100}%` }} />
        </div>
      </div>
    </>
  );
}

export function StepShell({
  title,
  description,
  children,
  canContinue = true,
  continueLabel = "Continue",
  onContinue,
  hideBack,
  hideNav,
  footerNote,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  canContinue?: boolean;
  continueLabel?: string;
  onContinue?: () => void;
  hideBack?: boolean;
  hideNav?: boolean;
  footerNote?: ReactNode;
}) {
  const { state, go } = useWizard();
  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      <div className="space-y-5">{children}</div>
      {!hideNav && (
        <div className="flex items-center justify-between gap-3 border-t pt-5">
          {hideBack || state.step === 0 ? <span /> : (
            <Button variant="outline" onClick={() => go(state.step - 1)}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          )}
          <div className="flex items-center gap-3">
            {footerNote}
            <Button disabled={!canContinue} onClick={() => (onContinue ? onContinue() : go(state.step + 1))}>
              {continueLabel} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </motion.section>
  );
}

export function NeedReconnect() {
  const { go } = useWizard();
  return (
    <Alert tone="warn" title="Please reconnect first">
      For your safety your keys are only kept in memory, so they're gone after a page refresh.{" "}
      <button className="font-medium text-primary underline underline-offset-4" onClick={() => go(1)}>Go back to Connect</button> and test the connection again.
    </Alert>
  );
}


export function Dropzone({
  onFiles,
  accept,
  multiple = true,
  allowFolder,
  title = "Drop files here",
  hint,
}: {
  onFiles: (files: PathedFile[]) => void;
  accept?: string;
  multiple?: boolean;
  allowFolder?: boolean;
  title?: string;
  hint?: string;
}) {
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const folder = useRef<HTMLInputElement>(null);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={async (e) => {
        e.preventDefault();
        setOver(false);
        const files = await collectDropped(e.dataTransfer);
        if (files.length) onFiles(files);
      }}
      className={cn("flex flex-col items-center gap-3 rounded-lg border-2 border-dashed p-6 text-center transition-colors", over ? "border-primary bg-primary/5" : "border-input hover:border-primary/50")}
    >
      <UploadCloud className="h-8 w-8 text-muted-foreground" />
      <div>
        <p className="font-medium">{title}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => input.current?.click()}>Choose files</Button>
        {allowFolder && (
          <Button type="button" variant="secondary" size="sm" onClick={() => folder.current?.click()}>Choose folder</Button>
        )}
      </div>
      <input ref={input} type="file" hidden multiple={multiple} accept={accept} onChange={(e) => { onFiles(fromInput(e.target.files)); e.target.value = ""; }} />
      {allowFolder && (
        <input
          ref={folder}
          type="file"
          hidden
          // @ts-expect-error non-standard but widely supported
          webkitdirectory=""
          onChange={(e) => { onFiles(fromInput(e.target.files)); e.target.value = ""; }}
        />
      )}
    </div>
  );
}

export function StatusIcon({ status }: { status: "pending" | "running" | "success" | "error" | "skipped" }) {
  if (status === "running") return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
  if (status === "success") return <CheckCircle2 className="h-4 w-4 text-primary" />;
  if (status === "error") return <span className="h-4 w-4 rounded-full bg-destructive" />;
  if (status === "skipped") return <span className="h-4 w-4 rounded-full border border-dashed" />;
  return <span className="h-4 w-4 rounded-full border" />;
}
