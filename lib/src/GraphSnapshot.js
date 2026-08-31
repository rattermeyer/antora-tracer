/**
 * Canonical graph snapshot — serialize a traceability graph to a durable JSON
 * artifact and load it back for diffing. Shared by the `site-graph` harvest,
 * the `diff-graphs` command, and the extension's per-version `graph.json`.
 */
/** Current snapshot schema version. Reject any other value on load. */
export const SNAPSHOT_FORMAT = 1;
/**
 * Serialize a graph to the canonical snapshot format. Items keep their scope
 * fields (`component`, `module`, `version`) but drop the per-page `pubUrl`,
 * which embeds the version segment and is recomputable.
 */
export function serializeSnapshot(graph) {
    const items = graph.getAllItems().map(({ pubUrl: _pubUrl, ...item }) => item);
    const relationships = graph.getAllRelationships();
    return JSON.stringify({ format: SNAPSHOT_FORMAT, items, relationships }, null, 2);
}
/**
 * Parse and validate a snapshot. Unknown `format` values fail explicitly
 * (snapshots are durable artifacts; silently mis-parsing is worse than erroring).
 */
export function deserializeSnapshot(json) {
    let data;
    try {
        data = JSON.parse(json);
    }
    catch {
        throw new Error("Snapshot is not valid JSON");
    }
    const snapshot = data;
    if (snapshot.format !== SNAPSHOT_FORMAT) {
        throw new Error(`Unsupported snapshot format '${String(snapshot.format ?? "none")}'. Re-run 'site-graph' to regenerate.`);
    }
    if (!Array.isArray(snapshot.items) ||
        !Array.isArray(snapshot.relationships)) {
        throw new Error("Invalid snapshot: expected 'items' and 'relationships' arrays");
    }
    return snapshot;
}
