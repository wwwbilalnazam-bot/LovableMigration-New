import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/shared";
import { WizardProvider } from "@/lib/wizard";
import { initAnalytics, pageView } from "@/lib/analytics";
import Landing from "@/pages/Landing";
import GuidePage from "@/pages/GuidePage";
import { About, Blog, Compare, FaqPage, GuideIndex, NotFound, Privacy, Terms, Troubleshooting } from "@/pages/Content";

// The wizard and OAuth callbacks are client-only and code-split, so content pages stay light.
const Migrate = lazy(() => import("@/pages/Migrate"));
const OAuthCallback = lazy(() => import("@/pages/OAuthCallback"));
const GithubCallback = lazy(() => import("@/pages/GithubCallback"));

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    initAnalytics();
  }, []);
  useEffect(() => {
    pageView(pathname);
    if (hash) {
      const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" }), 80);
      return () => clearTimeout(t);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

const Fallback = () => <div className="min-h-screen" aria-busy="true" />;
const lazyEl = (el: ReactNode) => <Suspense fallback={<Fallback />}>{el}</Suspense>;

export default function App() {
  return (
    <ThemeProvider>

        <WizardProvider>
          <ScrollManager />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/guide" element={<GuideIndex />} />
            <Route path="/guide/:slug" element={<GuidePage />} />
            <Route path="/compare/lovable-cloud-vs-supabase" element={<Compare />} />
            <Route path="/troubleshooting" element={<Troubleshooting />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/migrate" element={lazyEl(<Migrate />)} />
            <Route path="/oauth/callback" element={lazyEl(<OAuthCallback />)} />
            <Route path="/github/callback" element={lazyEl(<GithubCallback />)} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </WizardProvider>

    </ThemeProvider>
  );
}
