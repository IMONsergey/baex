import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readJSON = (path) => JSON.parse(readFileSync(join(root, path), "utf8"));
const content = readJSON("src/data/content.json");
const assets = readJSON("src/data/asset-map.json");
const details = readJSON("src/data/asset-details.json");
const brand = readJSON("src/data/brand-map.json");
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };
const hasText = (value) => typeof value === "string" && value.trim().length > 0;
const unique = (items) => new Set(items).size === items.length;

function validRoute(path) {
  return typeof path === "string" && /^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/.test(path);
}

const routes = content.routes ?? [];
const projects = content.projects ?? [];
const projectSlugs = new Set(projects.map((project) => project.slug));
const routePaths = new Set(routes.map((route) => route.path));
const projectBySlug = new Map(projects.map((project) => [project.slug, project]));
assert(Array.isArray(content.routes), "content.routes must be an array.");
assert(Array.isArray(content.projects), "content.projects must be an array.");
assert(unique(routes.map((route) => route.path)), "Route paths are not unique.");
assert(unique(projects.map((project) => project.slug)), "Project slugs are not unique.");
assert(routePaths.has("/"), "The home route is missing.");

if (content.edition?.mode === "reference" && content.edition?.sourceBrand === "REJOUICE") {
  assert(projects.length === 19, `The captured reference edition requires 19 projects; found ${projects.length}.`);
  assert(routes.length === 25, `The captured reference edition requires 25 routes; found ${routes.length}.`);
}

for (const route of routes) {
  assert(validRoute(route.path), `Invalid route path: ${JSON.stringify(route.path)}.`);
  assert(hasText(route.title), `Missing route title: ${route.path}.`);
  if (route.type === "project") {
    const project = projectBySlug.get(route.projectSlug);
    assert(!!project, `Project route ${route.path} points to unknown slug ${route.projectSlug}.`);
    if (project) assert(project.path === route.path, `Project route and project.path disagree: ${route.path}.`);
  }
}

for (const project of projects) {
  assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.slug ?? ""), `Invalid project slug: ${project.slug}.`);
  assert(project.path === `/work/${project.slug}`, `Project path does not match its slug: ${project.slug}.`);
  assert(routePaths.has(project.path), `Missing route for project: ${project.slug}.`);
  assert(hasText(project.title), `Missing project title: ${project.slug}.`);
  assert(hasText(project.heroCaption), `Missing hero caption: ${project.slug}.`);
  assert(!!project.hero?.assetKey, `Missing hero media: ${project.slug}.`);
  assert(Array.isArray(project.gallery) && project.gallery.length > 0, `Empty or invalid gallery: ${project.slug}.`);
  assert(Array.isArray(project.introductionParagraphs) && project.introductionParagraphs.every(hasText), `Invalid introduction: ${project.slug}.`);
  assert(projectSlugs.has(project.nextProjectSlug), `Unknown next project for ${project.slug}: ${project.nextProjectSlug}.`);
  assert(project.nextProjectSlug !== project.slug, `Project points to itself as next project: ${project.slug}.`);
}

const order = content.work?.projectOrder ?? [];
const workSlides = content.work?.slides ?? [];
const slideSlugs = workSlides.filter((slide) => slide.type === "project").map((slide) => slide.projectSlug);
assert(unique(order), "Work projectOrder contains duplicates.");
assert(unique(slideSlugs), "Work project slides contain duplicates.");
assert(order.length === projects.length && order.every((slug) => projectSlugs.has(slug)), "Work projectOrder must contain every project exactly once.");
assert(slideSlugs.length === order.length && slideSlugs.every((slug, index) => slug === order[index]), "Work slide order differs from projectOrder.");
for (const [index, slide] of workSlides.entries()) {
  assert(slide.type === "project" || slide.type === "statement", `Unknown Work slide type at ${index}.`);
  if (slide.type === "statement") assert(hasText(slide.text), `Empty Work statement at ${index}.`);
  if (slide.type === "project") assert(!!slide.thumbnail?.assetKey, `Missing Work thumbnail: ${slide.projectSlug}.`);
}

for (const item of content.home?.selected ?? []) assert(projectSlugs.has(item.projectSlug), `Unknown selected project: ${item.projectSlug}.`);
assert(unique((content.home?.selected ?? []).map((item) => item.projectSlug)), "Home selected projects contain duplicates.");

const mediaReferences = [];
let checkedInternalLinks = 0;
const prohibitedCMSKeys = new Set(["link_type", "slice_type", "linked_documents", "first_publication_date", "last_publication_date", "__NUXT__", "pinia", "serverRendered", "_errors"]);

function walk(value, location = "content") {
  if (Array.isArray(value)) { value.forEach((item, index) => walk(item, `${location}[${index}]`)); return; }
  if (!value || typeof value !== "object") {
    if (typeof value === "string") assert(!/^(?:blob|javascript|data):/i.test(value), `Unsupported embedded URL at ${location}.`);
    return;
  }
  if ("assetKey" in value) mediaReferences.push({ ...value, location });
  if (typeof value.path === "string") {
    const path = value.path.split(/[?#]/, 1)[0];
    checkedInternalLinks++;
    assert(routePaths.has(path), `Unknown internal link at ${location}: ${value.path}.`);
  }
  for (const [key, item] of Object.entries(value)) {
    assert(!prohibitedCMSKeys.has(key), `Unnormalized CMS field at ${location}.${key}.`);
    walk(item, `${location}.${key}`);
  }
}
walk(content);

const checkedFiles = new Set();
function publicAsset(path, label, prefix) {
  if (typeof path !== "string" || !path.startsWith(prefix) || path.includes("?") || path.includes("#") || path.includes("\\")) {
    errors.push(`Expected a local ${prefix} path for ${label}; got ${JSON.stringify(path)}.`);
    return;
  }
  const publicRoot = resolve(root, "public");
  const file = resolve(publicRoot, `.${path}`);
  if (!file.startsWith(`${publicRoot}${sep}`) || path.split("/").includes("..")) {
    errors.push(`Unsafe local asset path for ${label}: ${path}.`);
    return;
  }
  try {
    const stat = statSync(file);
    assert(stat.isFile() && stat.size > 0, `Empty or invalid local asset: ${path}.`);
    checkedFiles.add(path);
  } catch { errors.push(`Missing local asset for ${label}: ${path}.`); }
}

for (const [key, path] of Object.entries(assets)) publicAsset(path, key, "/media/");
for (const [key, value] of Object.entries(details)) {
  assert(value.src === assets[key], `asset-details src disagrees with asset-map for ${key}.`);
  if (value.poster) publicAsset(value.poster, `${key} poster`, "/media/");
  if (value.posterPublicPath) publicAsset(value.posterPublicPath, `${key} posterPublicPath`, "/media/");
}
for (const [key, path] of Object.entries(brand)) publicAsset(path, `brand.${key}`, "/brand/");

for (const media of mediaReferences) {
  assert(media.kind === "image" || media.kind === "video", `Unknown media kind at ${media.location}.`);
  assert(hasText(media.assetKey) && !!assets[media.assetKey], `Unmapped media at ${media.location}: ${media.assetKey}.`);
  assert(!!details[media.assetKey], `Missing media metadata at ${media.location}: ${media.assetKey}.`);
  if (media.width !== undefined) assert(Number.isFinite(media.width) && media.width > 0, `Invalid media width at ${media.location}.`);
  if (media.height !== undefined) assert(Number.isFinite(media.height) && media.height > 0, `Invalid media height at ${media.location}.`);
  if (media.kind === "video") assert(!!details[media.assetKey]?.poster, `Missing local video poster at ${media.location}.`);
}

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(file) : [".ts", ".tsx"].includes(extname(file)) ? [file] : [];
  });
}
for (const file of sourceFiles(join(root, "src"))) {
  const source = readFileSync(file, "utf8");
  assert(!/__NUXT(?:_DATA)?__|@prismicio|\/api\/v2\/documents\/search|\.cdn\.prismic\.io\/api/.test(source), `Runtime source contains a source-site CMS dependency: ${file.slice(root.length + 1)}.`);
}

if (errors.length) {
  console.error(`Content verification failed (${errors.length} issue${errors.length === 1 ? "" : "s"}):\n${errors.map((error) => `- ${error}`).join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    status: "passed",
    routes: routes.length,
    projects: projects.length,
    workSlides: workSlides.length,
    galleryItems: projects.reduce((sum, project) => sum + project.gallery.length, 0),
    internalLinks: checkedInternalLinks,
    mediaReferences: mediaReferences.length,
    uniqueContentAssets: new Set(mediaReferences.map((media) => media.assetKey)).size,
    localFiles: checkedFiles.size,
    runtimeCMSDependencies: 0,
  }, null, 2));
}
