import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import "@fontsource-variable/inter";
import App from "./App";
import "./index.css";

const tree = (
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>
);

const root = document.getElementById("root")!;
// Public pages are pre-rendered (hydrate); /migrate and OAuth callbacks are client-only (render).
if (root.hasChildNodes()) hydrateRoot(root, tree);
else createRoot(root).render(tree);
