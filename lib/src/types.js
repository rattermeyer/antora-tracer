/**
 * Type definitions for unified item architecture
 * This file contains the types for requirements traceability
 */
/**
 * Maps each primary relationship type to its inverse
 */
export const INVERSE_MAP = {
    implements: "implemented-by",
    satisfies: "satisfied-by",
    tests: "tested-by",
    verifies: "verified-by",
    documents: "documented-by",
    depends: "depended-by",
    requires: "required-by",
    addresses: "addressed-by",
    "composed-of": "part-of",
    "depends-on": "is-a-dependency-of",
    refines: "refined-by",
    "leads-to": "led-by",
};
export const PRIMARY_MAP = {
    "implemented-by": "implements",
    "satisfied-by": "satisfies",
    "tested-by": "tests",
    "verified-by": "verifies",
    "documented-by": "documents",
    "depended-by": "depends",
    "required-by": "requires",
    "addressed-by": "addresses",
    "part-of": "composed-of",
    "is-a-dependency-of": "depends-on",
    "refined-by": "refines",
    "led-by": "leads-to",
};
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
// ============================================================================
// Type Guards
// ============================================================================
/**
 * Check if a relationship type is primary
 */
export function isPrimaryRelationshipType(type) {
    return type in INVERSE_MAP;
}
/**
 * Check if a relationship type is inverse
 */
export function isInverseRelationshipType(type) {
    return type in PRIMARY_MAP;
}
