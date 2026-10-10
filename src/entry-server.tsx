import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";

export function render(url: string) {
  const ctx: { helmet?: any } = {};
  const html = renderToString(
    <HelmetProvider context={ctx}>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </HelmetProvider>,
  );
  const h = ctx.helmet;
  const head = [h.title, h.priority, h.meta, h.link, h.script].map((x: any) => x.toString()).join("\n");
  return { html, head };
}

export { allPages, noindexPages } from "./content/pages";
export { guides } from "./content/guides";
export { SITE } from "./content/site";
