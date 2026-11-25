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
/**
 * Harvest a playbook and feed every file into the target's graph.
 *
 * Canonicalization runs once after the last file. A reverse-authored relation
 * (`verified_by:` for a `verifies:` primary) is only flipped to its primary
 * direction when both endpoints already exist in the graph, so without this
 * pass the stored direction depends on which endpoint's file was ingested
 * first — and harvest order is not guaranteed (ADR-015).
 */
export async function harvestIntoGraph(target, playbookPath) {
    const files = await harvestSiteFiles(playbookPath);
    for (const file of files) {
        target.process(file.content, {
            sourceFile: file.path,
            component: file.component,
            module: file.module,
            version: file.version,
            pubUrl: file.pubUrl,
            sourceRoot: file.sourceRoot,
        });
    }
    target.graph.canonicalizeRelationships();
}
/**
 * Locate the antora-tracer extension entry in a playbook. Shared by the
 * extension's `loadConfig` and the CLI harvest path so the `require`-match
 * list has a single home.
 */
export function findTraceabilityExtensionEntry(playbook) {
    if (typeof playbook !== "object" || playbook === null)
        return undefined;
    const root = playbook;
    const antora = root.antora;
    const antoraRoot = typeof antora === "object" && antora !== null
        ? antora
        : undefined;
    const extensions = antoraRoot?.extensions ?? root.extensions;
    if (!Array.isArray(extensions))
        return undefined;
    for (const entry of extensions) {
        if (typeof entry !== "object" || entry === null)
            continue;
        const candidate = entry;
        const requireValue = typeof candidate.require === "string" ? candidate.require : undefined;
        const name = typeof candidate.name === "string" ? candidate.name : undefined;
        if (requireValue === "@antora-tracer/core/antora-extension" ||
            requireValue === "./lib/src/antora-extension.js" ||
            (requireValue?.includes("antora-tracer") ?? false) ||
            name === "antora-requirements-traceability") {
            return candidate;
        }
    }
    return undefined;
}
async function loadAntoraModule(name) {
    try {
        const mod = (await import(name));
        return (mod.default ?? mod);
    }
    catch {
        throw new Error(`'site-graph' requires '${name}', which is not installed. ` +
            `Install it (npm install ${name}) to harvest site graphs.`);
    }
}
/**
 * Resolve a playbook to its content catalog and return every `.adoc` page and
 * partial with its component, module, and version scope.
 */
export async function harvestSiteFiles(playbookPath) {
    const buildPlaybook = await loadAntoraModule("@antora/playbook-builder");
    const aggregateContent = await loadAntoraModule("@antora/content-aggregator");
    const classifyContent = await loadAntoraModule("@antora/content-classifier");
    const playbook = buildPlaybook(["--playbook", playbookPath]);
    const extEntry = findTraceabilityExtensionEntry(playbook);
    const rawConfig = extEntry && typeof extEntry.config === "object" && extEntry.config !== null
        ? extEntry.config
        : extEntry;
    const excludeList = rawConfig?.excludeComponents ?? rawConfig?.excludecomponents;
    const excludeComponents = Array.isArray(excludeList)
        ? excludeList.filter((c) => typeof c === "string")
        : [];
    const aggregate = await aggregateContent(playbook);
    const contentCatalog = classifyContent(playbook, aggregate, {});
    const files = [];
    for (const family of ["page", "partial"]) {
        for (const file of contentCatalog.findBy({ family }) ?? []) {
            if (!file.src?.path?.endsWith(".adoc"))
                continue;
            if (excludeComponents.includes(file.src.component))
                continue;
            const content = file.contents?.toString?.("utf8");
            if (content == null)
                continue;
            const origin = file.src.origin;
            // The content source's root is the repository worktree joined with the
            // source's start path. A source read from the git tree (bare repo) has
            // `worktree` false and provides no root; leave it unset rather than
            // inventing one.
            const worktree = origin?.worktree;
            const startPath = origin?.startPath;
            const sourceRoot = typeof worktree === "string" && worktree.length > 0
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
    // Antora's `findBy` order is not guaranteed stable across runs, and the
    // caller's graph records edges in ingestion order. Sort by the fields that
    // scope a file so two harvests of the same tree ingest identically.
    files.sort((a, b) => (a.component ?? "").localeCompare(b.component ?? "") ||
        (a.version ?? "").localeCompare(b.version ?? "") ||
        (a.module ?? "").localeCompare(b.module ?? "") ||
        a.path.localeCompare(b.path));
    return files;
}
