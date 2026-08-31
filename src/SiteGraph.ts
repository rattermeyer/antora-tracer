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

/** A harvested AsciiDoc file with its Antora scope metadata. */
export interface HarvestedFile {
  path: string;
  content: string;
  component?: string;
  module?: string;
  version?: string;
  pubUrl?: string;
}

type PlaybookBuilder = (args: string[]) => Record<string, any>;
type AggregateContent = (playbook: any) => Promise<any[]>;
type ClassifyContent = (playbook: any, aggregate: any[], config: any) => any;

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
  const aggregate = await aggregateContent(playbook);
  const contentCatalog = classifyContent(playbook, aggregate, {});

  const files: HarvestedFile[] = [];
  for (const family of ["page", "partial"] as const) {
    for (const file of contentCatalog.findBy({ family }) ?? []) {
      if (!file.src?.path?.endsWith(".adoc")) continue;
      const content = file.contents?.toString?.("utf8");
      if (content == null) continue;
      files.push({
        path: file.src.path,
        content,
        component: file.src.component,
        module: file.src.module,
        version: file.src.version,
        pubUrl: file.pub?.url,
      });
    }
  }
  return files;
}
