import { readFile, writeFile, mkdir } from "node:fs/promises";
const config = JSON.parse(
  await readFile(new URL("../project-meta.json", import.meta.url), "utf8"),
);
const root = new URL("../dist/", import.meta.url);
const source = (await readFile(new URL("index.html", root), "utf8"))
  .replace(/<meta\s+(?:property="og:[^"]+"|name="twitter:[^"]+")[^>]*>/g, "")
  .replace(/<link\s+rel="canonical"[^>]*>/g, "");
const escape = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
function render(route) {
  const item = config.routes[route];
  const title = `${item.label} · ${config.name}`;
  const url = `${config.origin}${route}`;
  const tags = `<title>${escape(title)}</title>
<meta name="description" content="${escape(item.description)}" />
<link rel="canonical" href="${url}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="${escape(config.name)}" />
<meta property="og:title" content="${escape(title)}" />
<meta property="og:description" content="${escape(item.description)}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${config.origin}/social-preview.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="${escape(config.imageAlt)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escape(title)}" />
<meta name="twitter:description" content="${escape(item.description)}" />
<meta name="twitter:image" content="${config.origin}/social-preview.png" />
<meta name="twitter:image:alt" content="${escape(config.imageAlt)}" />`;
  return source
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+name="description"[\s\S]*?\/>/i, "")
    .replace("</head>", `${tags}\n</head>`);
}
for (const route of Object.keys(config.routes)) {
  const directory = new URL(`.${route}/`, root);
  await mkdir(directory, { recursive: true });
  await writeFile(new URL("index.html", directory), render(route));
}
await writeFile(new URL("index.html", root), render("/overview"));
console.log(
  `Built initial HTML metadata for ${Object.keys(config.routes).length} routes.`,
);
