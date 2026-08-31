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
    const aggregate = await aggregateContent(playbook);
    const contentCatalog = classifyContent(playbook, aggregate, {});
    const files = [];
    for (const family of ["page", "partial"]) {
        for (const file of contentCatalog.findBy({ family }) ?? []) {
            if (!file.src?.path?.endsWith(".adoc"))
                continue;
            const content = file.contents?.toString?.("utf8");
            if (content == null)
                continue;
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
