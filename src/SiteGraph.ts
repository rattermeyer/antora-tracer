/**
 * Site-graph harvest — build the complete cross-source traceability graph for
 * an Antora playbook without generating any site output.
 *
 * Reuses Antora's `playbook-builder`, `content-aggregator`, and
 * `content-classifier` (loaded lazily so the CLI works without them) to
 * resolve the content catalog, then returns each AsciiDoc page/partial with
 * its `component`, `module`, and version scope for the caller to feed into the
 * core parser. No `convertDocuments`/`composePage`/`publishFiles` runs.
 */

import { join } from "node:path";

/** A harvested AsciiDoc file with its Antora scope metadata. */
export interface HarvestedFile {
  path: string;
  content: string;
  component?: string;
  module?: string;
  version?: string;
  pubUrl?: string;
  /**
   * Absolute directory of the content source this file came from — the
   * repository worktree joined with the source's start path. Joining `path`
   * to it yields exactly one file on disk, even when two sources declare the
   * same relative path. Unset when the source provides no worktree (e.g. a
   * bare repository read from the git tree).
   */
  sourceRoot?: string;
}

type PlaybookBuilder = (args: string[]) => Record<string, any>;
type AggregateContent = (playbook: any) => Promise<any[]>;
type ClassifyContent = (playbook: any, aggregate: any[], config: any) => any;

/**
 * Locate the antora-tracer extension entry in a playbook. Shared by the
 * extension's `loadConfig` and the CLI harvest path so the `require`-match
 * list has a single home.
 */
export function findTraceabilityExtensionEntry(
  playbook: unknown,
): Record<string, unknown> | undefined {
  if (typeof playbook !== "object" || playbook === null) return undefined;
  const root = playbook as Record<string, unknown>;
  const antora = root.antora;
  const antoraRoot =
    typeof antora === "object" && antora !== null
      ? (antora as Record<string, unknown>)
      : undefined;
  const extensions = antoraRoot?.extensions ?? root.extensions;
  if (!Array.isArray(extensions)) return undefined;
  for (const entry of extensions) {
    if (typeof entry !== "object" || entry === null) continue;
    const candidate = entry as Record<string, unknown>;
    const requireValue =
      typeof candidate.require === "string" ? candidate.require : undefined;
    const name =
      typeof candidate.name === "string" ? candidate.name : undefined;
    if (
      requireValue === "@antora-tracer/core/antora-extension" ||
      requireValue === "./lib/src/antora-extension.js" ||
      (requireValue?.includes("antora-tracer") ?? false) ||
      name === "antora-requirements-traceability"
    ) {
      return candidate;
    }
  }
  return undefined;
}

async function loadAntoraModule<T>(name: string): Promise<T> {
  try {
    const mod = (await import(name)) as { default?: T };
    return (mod.default ?? mod) as T;
  } catch {
    throw new Error(
      `'site-graph' requires '${name}', which is not installed. ` +
        `Install it (npm install ${name}) to harvest site graphs.`,
    );
  }
}

/**
 * Resolve a playbook to its content catalog and return every `.adoc` page and
 * partial with its component, module, and version scope.
 */
export async function harvestSiteFiles(
  playbookPath: string,
): Promise<HarvestedFile[]> {
  const buildPlaybook = await loadAntoraModule<PlaybookBuilder>(
    "@antora/playbook-builder",
  );
  const aggregateContent = await loadAntoraModule<AggregateContent>(
    "@antora/content-aggregator",
  );
  const classifyContent = await loadAntoraModule<ClassifyContent>(
    "@antora/content-classifier",
  );

  const playbook = buildPlaybook(["--playbook", playbookPath]);
  const extEntry = findTraceabilityExtensionEntry(playbook);
  const rawConfig =
    extEntry && typeof extEntry.config === "object" && extEntry.config !== null
      ? (extEntry.config as Record<string, unknown>)
      : extEntry;
  const excludeList =
    rawConfig?.excludeComponents ?? rawConfig?.excludecomponents;
  const excludeComponents = Array.isArray(excludeList)
    ? excludeList.filter((c): c is string => typeof c === "string")
    : [];
  const aggregate = await aggregateContent(playbook);
  const contentCatalog = classifyContent(playbook, aggregate, {});

  const files: HarvestedFile[] = [];
  for (const family of ["page", "partial"] as const) {
    for (const file of contentCatalog.findBy({ family }) ?? []) {
      if (!file.src?.path?.endsWith(".adoc")) continue;
      if (excludeComponents.includes(file.src.component)) continue;
      const content = file.contents?.toString?.("utf8");
      if (content == null) continue;
      const origin = file.src.origin;
      // The content source's root is the repository worktree joined with the
      // source's start path. A source read from the git tree (bare repo) has
      // `worktree` false and provides no root; leave it unset rather than
      // inventing one.
      const worktree = origin?.worktree;
      const startPath = origin?.startPath;
      const sourceRoot =
        typeof worktree === "string" && worktree.length > 0
          ? join(worktree, typeof startPath === "string" ? startPath : "")
          : undefined;
      files.push({
        path: file.src.path,
        content,
        component: file.src.component,
        module: file.src.module,
        version: file.src.version,
        pubUrl: file.pub?.url,
        sourceRoot,
      });
    }
  }
  return files;
}
