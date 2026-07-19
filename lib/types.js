// Shared types and interfaces for requirements traceability
// Mapping constants for bidirectional relationships
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
// Type guards for relationship types
export function isPrimaryRelationshipType(type) {
    return type in INVERSE_MAP;
}
export function isInverseRelationshipType(type) {
    return type in PRIMARY_MAP;
}
