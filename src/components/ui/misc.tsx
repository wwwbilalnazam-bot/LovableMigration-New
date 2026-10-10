import * as React from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props} />
);

export const Badge = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn("inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary", className)} {...props} />
);

// ---- Alert
export function Alert({ tone = "info", title, children, className }: { tone?: "info" | "error" | "success" | "warn"; title?: string; children?: React.ReactNode; className?: string }) {
  const map = {
    info: { Icon: Info, cls: "border-border bg-secondary/50 text-foreground" },
    error: { Icon: AlertCircle, cls: "border-destructive/40 bg-destructive/10 text-foreground" },
    success: { Icon: CheckCircle2, cls: "border-primary/40 bg-primary/10 text-foreground" },
    warn: { Icon: AlertCircle, cls: "border-amber-500/40 bg-amber-500/10 text-foreground" },
  }[tone];
  const iconColor = { info: "text-muted-foreground", error: "text-destructive", success: "text-primary", warn: "text-amber-500" }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex gap-3 rounded-lg border p-3.5 text-sm", map.cls, className)}>
      <map.Icon className={cn("mt-0.5 h-4 w-4 shrink-0", iconColor)} />
      <div className="min-w-0 flex-1 space-y-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className="break-words text-muted-foreground">{children}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, children }: { icon: React.ReactNode; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
      <div className="text-muted-foreground">{icon}</div>
      <p className="font-medium">{title}</p>
      {children && <p className="max-w-sm text-sm text-muted-foreground">{children}</p>}
    </div>
  );
}
