/**
 * Type definitions for unified item architecture
 * This file contains the types for requirements traceability
 */
/** Stable graph identity. Unscoped local items retain their authored ID. */
export function itemIdentity(item) {
    return item.component == null
        ? item.id
        : [item.component, item.version ?? "", item.id].join("\u0000");
}
/**
 * CSS class emitted on an item block for its status value, or undefined when
 * the item declares no status or the value normalizes to nothing.
 *
 * The `tracer-status-` namespace keeps these classes distinct from the matrix's
 * `status-done|partial|missing` coverage classes, which mean something else.
 * Status values are free-form, so each run of non-alphanumeric characters
 * collapses to a single `-`, which also neutralizes digit-leading values.
 */
export function statusClass(status) {
    const slug = (status ?? "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return slug ? `tracer-status-${slug}` : undefined;
}
// ============================================================================
// Supersession Semantics
// ============================================================================
/** The forward supersession relation type (successor → predecessor). */
export const SUPERSEDES = "supersedes";
/** The reverse supersession relation type (predecessor → successor). */
export const SUPERSEDED_BY = "superseded_by";
/**
 * Relation types that record history rather than current-state links.
 * These are excluded from stale-link warnings and impact review worklists.
 */
export const HISTORY_RELATION_TYPES = new Set([SUPERSEDES, SUPERSEDED_BY]);
// ============================================================================
// Rendering Macro Namespace
// ============================================================================
/**
 * Accepted prefixes for the rendering macros (`links`, `outgoing`, `incoming`,
 * `graph`, `graph-coverage`, `config-graph`). `tracer:` is an alias for
 * `traceability:`, supported side-by-side as a migration path.
 */
export const RENDERING_MACRO_NAMESPACES = ["traceability", "tracer"];
/** Regex alternation of the accepted rendering-macro prefixes. */
export const RENDERING_MACRO_NS = `(?:${RENDERING_MACRO_NAMESPACES.join("|")})`;
/**
 * Negative-lookahead form used to exclude rendering macros from inline
 * relationship parsing (e.g. `(?!traceability:|tracer:)`).
 */
export const RENDERING_MACRO_LOOKAHEAD = `(?!${RENDERING_MACRO_NAMESPACES.map((ns) => `${ns}:`).join("|")})`;
// ============================================================================
// Role Colors
// ============================================================================
/**
 * Role → GraphViz color mapping.
 * Shared by the data graph (`TraceabilityGraph.toDot`) and the configuration
 * graph (`toConfigDot`) so role colors stay consistent across both diagrams.
 */
export const ROLE_COLORS = {
    requirement: "#4A90D9",
    design: "#50B86C",
    architecture: "#50B86C",
    implementation: "#E8A838",
    test: "#D94A4A",
    document: "#8E6ECF",
};
