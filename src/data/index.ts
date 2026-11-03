import editorialContent from "./content.json";
import localAssets from "./asset-map.json";
import type { MediaRef, Project, WebsiteContent } from "./types";

export * from "./types";

export const content = editorialContent as WebsiteContent;

const projectsBySlug = new Map(content.projects.map((project) => [project.slug, project]));
const assetMap: Readonly<Record<string, string>> = localAssets;

export function getProject(slug: string | undefined): Project | undefined {
  return slug ? projectsBySlug.get(slug) : undefined;
}

export function getNextProject(project: Project): Project | undefined {
  return getProject(project.nextProjectSlug);
}

/** Only local downloaded assets are usable. Missing assets have no remote fallback. */
export function resolveMedia(media: MediaRef | null | undefined): string | undefined {
  if (!media) return undefined;
  const path = assetMap[media.assetKey];
  return path?.startsWith("/media/") ? path : undefined;
}

export default content;
