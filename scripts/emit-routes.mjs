import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "dist");
const content = JSON.parse(await readFile(join(root, "src/data/content.json"), "utf8"));
const template = await readFile(join(output, "index.html"), "utf8");
const seen = new Set();
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]);

if (!template.includes('id="root"') || !/<script\b[^>]*\bsrc=["'][^"']+\.js["']/.test(template)) {
  throw new Error("dist/index.html is not a Vite build. Run npm run build before serving it.");
}

function entryFile(path) {
  if (typeof path !== "string" || !/^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/.test(path)) {
    throw new Error(`Unsafe or unsupported route: ${JSON.stringify(path)}`);
  }
  const file = resolve(output, `.${path}`, "index.html");
  if (!file.startsWith(`${output}${sep}`)) throw new Error(`Route escapes output directory: ${path}`);
  return file;
}

function descriptionFor(route) {
  if (route.type === "project") return content.projects.find((project) => project.slug === route.projectSlug)?.summary;
  if (route.type === "home") return content.home.intro;
  if (route.type === "legal") return content.legal.paragraphs[0];
  return content[route.type]?.intro;
}

const pages = content.routes.map((route) => {
  if (seen.has(route.path)) throw new Error(`Duplicate route: ${route.path}`);
  seen.add(route.path);
  const destination = entryFile(route.path);
  const title = `${route.title} / ${content.site.name} reference`;
  const description = descriptionFor(route) || "An independent reference implementation prepared for the BAEV website adaptation.";
  let html = template.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escape(title)}</title>`);
  const meta = `<meta name="description" content="${escape(description)}" />`;
  html = /<meta\b[^>]*\bname=["']description["'][^>]*>/i.test(html)
    ? html.replace(/<meta\b[^>]*\bname=["']description["'][^>]*>/i, meta)
    : html.replace(/<\/head>/i, `${meta}\n</head>`);
  return { path: route.path, title, destination, html };
});

// Every known route gets a genuine entry file. Unknown paths remain normal
// server 404s; this does not create a catch-all 404.html copy of the application.
for (const page of pages) {
  await mkdir(dirname(page.destination), { recursive: true });
  await writeFile(page.destination, page.html, "utf8");
}

await writeFile(join(output, "routes-manifest.json"), JSON.stringify({
  schemaVersion: 1,
  rendering: "client",
  entryCount: pages.length,
  routes: pages.map(({ path, title }) => ({ path, title, file: path === "/" ? "/index.html" : `${path}/index.html` })),
}, null, 2) + "\n", "utf8");

console.log(`Created ${pages.length} static route entry files in dist/.`);
