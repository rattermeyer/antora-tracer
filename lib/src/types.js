/**
 * Type definitions for unified item architecture
 * This file contains the types for requirements traceability
 */
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
