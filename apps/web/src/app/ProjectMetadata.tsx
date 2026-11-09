import { useLayoutEffect } from "react";
import { useLocation } from "react-router";
import config from "../../project-meta.json";
export function ProjectMetadata() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    const route = pathname.replace(/\/$/, "") || "/overview";
    const item = config.routes[route as keyof typeof config.routes];
    if (!item) {
      document.title = `Page not found · ${config.name}`;
      return;
    }
    const title = `${item.label} · ${config.name}`;
    document.title = title;
    const meta = (selector: string, value: string) =>
      document
        .querySelector<HTMLMetaElement>(selector)
        ?.setAttribute("content", value);
    meta('meta[name="description"]', item.description);
    for (const prefix of ['property="og:', 'name="twitter:']) {
      meta(`meta[${prefix}title"]`, title);
      meta(`meta[${prefix}description"]`, item.description);
    }
    meta('meta[property="og:url"]', `${config.origin}${route}`);
    document
      .querySelector<HTMLLinkElement>('link[rel="canonical"]')
      ?.setAttribute("href", `${config.origin}${route}`);
  }, [pathname]);
  return null;
}
