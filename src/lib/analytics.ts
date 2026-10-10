import { SITE } from "@/content/site";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Loads GA4 after the page is idle. No-op unless VITE_GA_ID is set. */
export function initAnalytics() {
  if (typeof window === "undefined" || !SITE.gaId || window.gtag) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", SITE.gaId, { anonymize_ip: true, send_page_view: false });
  const load = () => {
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(SITE.gaId)}`;
    document.head.appendChild(s);
  };
  if ("requestIdleCallback" in window) (window as any).requestIdleCallback(load, { timeout: 4000 });
  else setTimeout(load, 2000);
}

export function pageView(path: string) {
  if (typeof window !== "undefined") window.gtag?.("event", "page_view", { page_path: path, page_location: window.location.href });
}

/** Events: start_migration, github_connected, supabase_connected, migration_success, migration_error, waitlist_signup */
export function track(name: string, params: Record<string, unknown> = {}) {
  if (typeof window !== "undefined") window.gtag?.("event", name, params);
}
