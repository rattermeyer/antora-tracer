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
