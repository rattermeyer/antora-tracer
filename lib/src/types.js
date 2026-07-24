/**
 * Type definitions for unified item architecture
 * This file contains the types for requirements traceability
 */
/**
 * Mapping constants for bidirectional relationships (legacy)
 */
export const INVERSE_MAP = {
    'implements': 'implemented-by',
    'satisfies': 'satisfied-by',
    'tests': 'tested-by',
    'verifies': 'verified-by',
    'documents': 'documented-by',
    'depends': 'depended-by',
    'requires': 'required-by',
    'addresses': 'addressed-by',
    'composed-of': 'part-of',
    'depends-on': 'depends-on-by',
};
export const PRIMARY_MAP = {
    'implemented-by': 'implements',
    'satisfied-by': 'satisfies',
    'tested-by': 'tests',
    'verified-by': 'verifies',
    'documented-by': 'documents',
    'depended-by': 'depends',
    'required-by': 'requires',
    'addressed-by': 'addresses',
    'part-of': 'composed-of',
    'depends-on-by': 'depends-on',
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
/**
 * Check if a node is a Requirement
 */
export function isRequirement(node) {
    return 'satisfiedBy' in node;
}
/**
 * Check if a node is an Implementation
 */
export function isImplementation(node) {
    return 'satisfies' in node && 'testedBy' in node;
}
/**
 * Check if a node is a Test
 */
export function isTest(node) {
    return 'verifies' in node || 'tests' in node;
}
/**
 * Check if a node is a Document
 */
export function isDocument(node) {
    return 'documentedBy' in node || 'documents' in node;
}
/**
 * Check if a node is a Design
 */
export function isDesign(node) {
    return !('satisfiedBy' in node) && !('satisfies' in node) && !('verifies' in node) && !('tests' in node);
}
