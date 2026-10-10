import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Creds } from "./proxy";
import type { DbSchema } from "./importer";
import type { EdgeFunction, SqlFile } from "./files";

export const STEP_TITLES = ["Create project", "Connect", "Schema", "Table data", "Auth users", "Storage", "Functions", "Done"];

export type FileStatus = "pending" | "running" | "success" | "error" | "skipped";

export interface Report {
  tables: { name: string; rows: number; total: number; status: "done" | "error" | "partial"; error?: string }[];
  schemaFiles: { name: string; status: FileStatus; error?: string }[];
  users: { imported: number; failed: number; total: number; errors: string[] };
  storage: { buckets: number; files: number; failed: number; errors: string[] };
  errors: string[];
}

const emptyReport = (): Report => ({
  tables: [],
  schemaFiles: [],
  users: { imported: 0, failed: 0, total: 0, errors: [] },
  storage: { buckets: 0, files: 0, failed: 0, errors: [] },
  errors: [],
});

/** Persisted in sessionStorage. Secrets and file contents are NEVER in here. */
interface Persisted {
  step: number;
  projectReady: boolean;
  connected: boolean;
  projectUrl: string;
  projectRef: string;
  report: Report;
  statsSent: boolean;
}

/** Memory only. Gone on refresh by design. */
interface Volatile {
  token: string; // OAuth access token (preferred)
  serviceKey: string;
  pat: string;
  migrations: SqlFile[];
  functions: EdgeFunction[];
  dbSchema: DbSchema | null;
}

export type WizardState = Persisted & Volatile;

const KEY = "migrator.wizard.v1";

const defaults: WizardState = {
  step: 0,
  projectReady: false,
  connected: false,
  projectUrl: "",
  projectRef: "",
  report: emptyReport(),
  statsSent: false,
  token: "",
  serviceKey: "",
  pat: "",
  migrations: [],
  functions: [],
  dbSchema: null,
};

function load(): WizardState {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw), report: { ...emptyReport(), ...(JSON.parse(raw).report ?? {}) } };
  } catch {
    /* ignore */
  }
  return defaults;
}

interface Ctx {
  state: WizardState;
  set: (patch: Partial<WizardState>) => void;
  patchReport: (fn: (r: Report) => Report) => void;
  go: (step: number) => void;
  creds: Creds;
  hasSecrets: boolean;
  reset: () => void;
}

const WizardContext = createContext<Ctx | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WizardState>(load);

  useEffect(() => {
    const p: Persisted = {
      step: state.step,
      projectReady: state.projectReady,
      connected: state.connected,
      projectUrl: state.projectUrl,
      projectRef: state.projectRef,
      report: state.report,
      statsSent: state.statsSent,
    };
    try {
      sessionStorage.setItem(KEY, JSON.stringify(p));
    } catch {
      /* storage may be unavailable */
    }
  }, [state]);

  const set = useCallback((patch: Partial<WizardState>) => setState((s) => ({ ...s, ...patch })), []);
  const patchReport = useCallback((fn: (r: Report) => Report) => setState((s) => ({ ...s, report: fn(s.report) })), []);
  const go = useCallback((step: number) => {
    setState((s) => ({ ...s, step: Math.max(0, Math.min(STEP_TITLES.length - 1, step)) }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  const reset = useCallback(() => {
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    setState({ ...defaults, report: emptyReport() });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      state,
      set,
      patchReport,
      go,
      reset,
      creds: { url: state.projectUrl.trim(), ref: state.projectRef.trim(), serviceKey: state.serviceKey.trim(), pat: state.pat.trim(), ...(state.token ? { token: state.token } : {}) },
      hasSecrets: Boolean(state.projectRef && (state.token || (state.serviceKey && state.pat))),
    }),
    [state, set, patchReport, go, reset],
  );

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useWizard() {
  const c = useContext(WizardContext);
  if (!c) throw new Error("useWizard outside provider");
  return c;
}
