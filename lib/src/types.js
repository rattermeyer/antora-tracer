/**
 * Type definitions for unified item architecture
 * This file contains the types for requirements traceability
 */
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
