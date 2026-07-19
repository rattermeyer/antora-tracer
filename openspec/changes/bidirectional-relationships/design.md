# Design: Bidirectional Relationships with Auto-Generated Inverse Macros

## Overview

This design document describes the architecture for implementing auto-generated inverse relationships in the Requirements Traceability Extension. The goal is to enable bidirectional querying of the traceability graph without requiring users to explicitly define both directions of each relationship.

## Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    Traceability System                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │  Parser      │    │  Graph       │    │  Generator   │   │
│  │              │───▶│              │───▶│              │   │
│  │ - Block      │    │ - Nodes      │    │ - Matrices   │   │
│  │ - Section    │    │ - Relationships│   │ - Reports    │   │
│  │ - Inline     │    │   (Bidirectional)│   │              │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
│           │                  │                    │            │
│           ▼                  ▼                    ▼            │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                  Node Types                            │ │
│  │                                                          │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │ │
│  │  │ Requirement │ │ Implementation│ │ Design      │      │ │
│  │  │             │ │             │ │ Concept     │      │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘      │ │
│  │                                                          │ │
│  │  ┌─────────────┐ ┌─────────────┐                          │ │
│  │  │ Test        │ │ Document    │                          │ │
│  │  │             │ │             │                          │ │
│  │  └─────────────┘ └─────────────┘                          │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Relationship Storage with Auto-Inverses

```
┌─────────────────────────────────────────────────────────────────┐
│              Relationship Storage Architecture                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Primary Relationship (User-Defined):                            │
│    ┌────────────────────────────────────────────────────────┐  │
│    │ DES-001 ──────addresses──────▶ REQ-001                   │  │
│    │    (explicitly defined by user)                          │  │
│    └────────────────────────────────────────────────────────┘  │
│                              │                                       │
│                              │ Auto-Generation                       │
│                              ▼                                       │
│    ┌────────────────────────────────────────────────────────┐  │
│    │ REQ-001 ──────addressed-by─────▶ DES-001                │  │
│    │    (auto-generated, read-only)                           │  │
│    └────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Both stored in: _relationships: Map<string, Relationship>      │
│  Indexed by: _inverseIndex: Map<InverseType, Map<NodeId, Rel[]>>│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Model Changes

### Relationship Type Union

```typescript
// Current (Phase 2)
type RelationshipType =
  | 'satisfies'
  | 'tests'
  | 'verifies'
  | 'documents'
  | 'depends'
  | 'requires'
  | 'addresses'
  | 'implements'
  | 'composed-of'
  | 'depends-on';

// New (Phase 3)
type RelationshipType =
  | 'satisfies' | 'satisfied-by'
  | 'tests' | 'tested-by'
  | 'verifies' | 'verified-by'
  | 'documents' | 'documented-by'
  | 'depends' | 'depended-by'
  | 'requires' | 'required-by'
  | 'addresses' | 'addressed-by'
  | 'implements' | 'implemented-by'
  | 'composed-of' | 'part-of'
  | 'depends-on' | 'depended-by';

// Helper types
type PrimaryRelationshipType =
  | 'satisfies' | 'tests' | 'verifies' | 'documents'
  | 'depends' | 'requires' | 'addresses' | 'implements'
  | 'composed-of' | 'depends-on';

type InverseRelationshipType =
  | 'satisfied-by' | 'tested-by' | 'verified-by' | 'documented-by'
  | 'depended-by' | 'required-by' | 'addressed-by' | 'implemented-by'
  | 'part-of' | 'depended-by';
```

### Relationship Interface

```typescript
interface Relationship {
  id: string;                    // Unique ID: "fromId-type-targetId"
  fromId: string;                // Source node ID
  targetId: string;              // Target node ID
  type: RelationshipType;        // Primary or inverse type
  sourceFile?: string;           // Source file where defined
  line?: number;                 // Line number
  autoGenerated: boolean;        // NEW: true for inverse relationships
  inverseOf?: string;            // NEW: ID of the primary relationship
}
```

### Inverse Relationship Map

```typescript
// For fast inverse queries
private _inverseIndex: Map<InverseRelationshipType, Map<string, Relationship[]>>;

// Structure:
// _inverseIndex['addressed-by']['REQ-001'] = [
//   { id: 'REQ-001-addressed-by-DES-001', fromId: 'REQ-001', targetId: 'DES-001', type: 'addressed-by', ... }
// ]
```

## Relationship Type Mapping

### Mapping Table

```typescript
const INVERSE_MAP: Record<PrimaryRelationshipType, InverseRelationshipType> = {
  'satisfies': 'satisfied-by',
  'tests': 'tested-by',
  'verifies': 'verified-by',
  'documents': 'documented-by',
  'depends': 'depended-by',
  'requires': 'required-by',
  'addresses': 'addressed-by',
  'implements': 'implemented-by',
  'composed-of': 'part-of',
  'depends-on': 'depended-by',
};

const PRIMARY_MAP: Record<InverseRelationshipType, PrimaryRelationshipType> = {
  'satisfied-by': 'satisfies',
  'tested-by': 'tests',
  'verified-by': 'verifies',
  'documented-by': 'documents',
  'depended-by': 'depends',
  'required-by': 'requires',
  'addressed-by': 'addresses',
  'implemented-by': 'implements',
  'part-of': 'composed-of',
  'depended-by': 'depends-on',
};
```

## Implementation Strategy

### Step 1: Type System Updates

**File: `src/types.ts`**

```typescript
// Add inverse relationship types
export type RelationshipType =
  | PrimaryRelationshipType
  | InverseRelationshipType;

// Add helper types
export type PrimaryRelationshipType = ...;
export type InverseRelationshipType = ...;

// Update Relationship interface
export interface Relationship {
  id: string;
  fromId: string;
  targetId: string;
  type: RelationshipType;
  sourceFile?: string;
  line?: number;
  autoGenerated: boolean;    // NEW
  inverseOf?: string;       // NEW: references primary relationship ID
}
```

### Step 2: Graph Storage Updates

**File: `src/TraceabilityGraph.ts`**

```typescript
// Add inverse index
private _inverseIndex: Map<InverseRelationshipType, Map<string, Relationship[]>> = new Map();

// Update addRelationship to auto-generate inverses
addRelationship(rel: Omit<Relationship, 'id' | 'autoGenerated' | 'inverseOf'>): string {
  // Generate relationship ID
  const relId = `${rel.fromId}-${rel.type}-${rel.targetId}`;

  // Check if this is a primary relationship type
  if (isPrimaryRelationshipType(rel.type)) {
    // Store primary relationship
    const primaryRel: Relationship = {
      ...rel,
      id: relId,
      autoGenerated: false,
    };
    this._relationships.set(relId, primaryRel);

    // Auto-generate inverse
    const inverseType = INVERSE_MAP[rel.type];
    const inverseId = `${rel.targetId}-${inverseType}-${rel.fromId}`;
    const inverseRel: Relationship = {
      id: inverseId,
      fromId: rel.targetId,
      targetId: rel.fromId,
      type: inverseType,
      autoGenerated: true,
      inverseOf: relId,
    };
    this._relationships.set(inverseId, inverseRel);

    // Update inverse index
    this._updateInverseIndex(inverseRel);

    return relId;
  }

  // Handle inverse relationships (should not happen in normal use)
  // But allow for completeness
  else if (isInverseRelationshipType(rel.type)) {
    // This is an inverse being defined explicitly - warn
    this.logger.warn(`Explicit inverse relationship defined: ${rel.fromId} ${rel.type} ${rel.targetId}. Inverses are auto-generated.`);

    // Store it anyway
    const inverseRel: Relationship = {
      ...rel,
      id: relId,
      autoGenerated: false,
    };
    this._relationships.set(relId, inverseRel);
    this._updateInverseIndex(inverseRel);

    return relId;
  }

  throw new Error(`Invalid relationship type: ${rel.type}`);
}

// Helper to update inverse index
private _updateInverseIndex(rel: Relationship): void {
  if (isInverseRelationshipType(rel.type)) {
    if (!this._inverseIndex.has(rel.type)) {
      this._inverseIndex.set(rel.type, new Map());
    }
    const typeIndex = this._inverseIndex.get(rel.type)!;
    if (!typeIndex.has(rel.fromId)) {
      typeIndex.set(rel.fromId, []);
    }
    typeIndex.get(rel.fromId)!.push(rel);
  }
}

// Helper type guards
function isPrimaryRelationshipType(type: string): type is PrimaryRelationshipType {
  return PRIMARY_TYPES.includes(type as PrimaryRelationshipType);
}

function isInverseRelationshipType(type: string): type is InverseRelationshipType {
  return INVERSE_TYPES.includes(type as InverseRelationshipType);
}
```

### Step 3: Query Method Updates

**File: `src/TraceabilityGraph.ts`**

```typescript
// Existing methods work as-is, but now return results using inverse relationships
// For example, getImplementationsForRequirement now uses satisfied-by relationships

// New convenience methods for inverse queries
getRequirementsForImplementation(implId: string): Requirement[] {
  const rels = this.getRelationships(implId, 'satisfied-by');
  return rels
    .map(r => this._requirements.get(r.targetId))
    .filter((r): r is Requirement => r !== undefined);
}

getRequirementsForDesign(designId: string): Requirement[] {
  const rels = this.getRelationships(designId, 'addressed-by');
  return rels
    .map(r => this._requirements.get(r.targetId))
    .filter((r): r is Requirement => r !== undefined);
}

getImplementationsForDesign(designId: string): Implementation[] {
  const rels = this.getRelationships(designId, 'implemented-by');
  return rels
    .map(r => this._implementations.get(r.targetId))
    .filter((i): i is Implementation => i !== undefined);
}

getDesignsForImplementation(implId: string): Design[] {
  const rels = this.getRelationships(implId, 'implements');
  return rels
    .map(r => this._designs.get(r.targetId))
    .filter((d): d is Design => d !== undefined);
}

getComposingDesigns(designId: string): Design[] {
  const rels = this.getRelationships(designId, 'part-of');
  return rels
    .map(r => this._designs.get(r.targetId))
    .filter((d): d is Design => d !== undefined);
}

getDependentDesigns(designId: string): Design[] {
  const rels = this.getRelationships(designId, 'depended-by');
  return rels
    .map(r => this._designs.get(r.targetId))
    .filter((d): d is Design => d !== undefined);
}

getTestsForImplementation(implId: string): Test[] {
  const rels = this.getRelationships(implId, 'tested-by');
  return rels
    .map(r => this._tests.get(r.targetId))
    .filter((t): t is Test => t !== undefined);
}

getImplementationsForTest(testId: string): Implementation[] {
  const rels = this.getRelationships(testId, 'tests');
  return rels
    .map(r => this._implementations.get(r.targetId))
    .filter((i): i is Implementation => i !== undefined);
}

getRequirementsForTest(testId: string): Requirement[] {
  const rels = this.getRelationships(testId, 'verified-by');
  return rels
    .map(r => this._requirements.get(r.targetId))
    .filter((r): r is Requirement => r !== undefined);
}

getTestsForRequirement(reqId: string): Test[] {
  const rels = this.getRelationships(reqId, 'verifies');
  return rels
    .map(r => this._tests.get(r.targetId))
    .filter((t): t is Test => t !== undefined);
}

getDocumentsForRequirement(reqId: string): Document[] {
  const rels = this.getRelationships(reqId, 'documented-by');
  return rels
    .map(r => this._documents.get(r.targetId))
    .filter((d): d is Document => d !== undefined);
}
```

### Step 4: Matrix Generator Updates

**File: `src/MatrixGenerator.ts`**

```typescript
// Add new inverse matrix types
export type MatrixType =
  | 'req-impl' | 'req-test' | 'req-design' | 'full'
  | 'impl-req' | 'test-impl' | 'test-req' | 'design-req' | 'design-impl';

// Update generateMatrix to handle inverse types
generateMatrix(type: MatrixType): TraceabilityMatrix {
  switch (type) {
    case 'req-impl':
      return this.generateRequirementsImplementationMatrix();
    case 'impl-req':
      return this.generateImplementationRequirementMatrix(); // NEW
    case 'req-test':
      return this.generateRequirementsTestMatrix();
    case 'test-req':
      return this.generateTestRequirementMatrix(); // NEW
    case 'req-design':
      return this.generateRequirementsDesignMatrix();
    case 'design-req':
      return this.generateDesignRequirementMatrix(); // NEW
    case 'design-impl':
      return this.generateDesignImplementationMatrix();
    case 'full':
      return this.generateFullMatrix();
    default:
      throw new Error(`Unknown matrix type: ${type}`);
  }
}

// New matrix generation methods
private generateImplementationRequirementMatrix(): TraceabilityMatrix {
  const implementations = this.graph.getAllImplementations();
  const requirements = this.graph.getAllRequirements();

  const matrix: TraceabilityMatrix = {
    type: 'impl-req',
    rows: implementations.map(impl => ({
      id: impl.id,
      title: impl.title,
      implementations: [],
      tests: [],
      status: '✗ Missing',
    })),
    // ... populate with satisfied-by relationships
  };

  return matrix;
}

private generateTestRequirementMatrix(): TraceabilityMatrix {
  // Similar pattern for test → requirement (verified-by)
}

private generateDesignRequirementMatrix(): TraceabilityMatrix {
  // Similar pattern for design → requirement (addressed-by)
}
```

### Step 5: Antora Extension Updates

**File: `src/antora-extension.ts`**

```typescript
// Update matrix types to generate
private generateTraceabilityFiles(event: any): void {
  const matrixTypes = [
    'req-impl', 'req-test', 'req-design', 'design-impl', 'full',
    'impl-req', 'test-impl', 'test-req', 'design-req', // NEW inverse matrices
  ];

  // ... rest of the method
}
```

### Step 6: Validation Updates

**File: `src/TraceabilityGraph.ts`**

```typescript
// Update validate method to check for circular references
validate(): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check for orphaned relationships
  for (const rel of this._relationships.values()) {
    if (!rel.autoGenerated && !this.hasNode(rel.fromId)) {
      errors.push({
        type: 'error',
        message: `Relationship source node not found: ${rel.fromId}`,
        relationshipId: rel.id,
      });
    }
    if (!this.hasNode(rel.targetId)) {
      errors.push({
        type: 'warning',
        message: `Relationship target node not found: ${rel.targetId}`,
        relationshipId: rel.id,
      });
    }
  }

  // Check for circular references (optional, can be expensive)
  const circular = this.findCircularReferences();
  for (const cycle of circular) {
    errors.push({
      type: 'warning',
      message: `Circular reference detected: ${cycle.join(' -> ')}`,
      severity: 'warning',
    });
  }

  return errors;
}

// Helper to find circular references
findCircularReferences(): string[][] {
  const visited = new Set<string>();
  const cycles: string[][] = [];
  const path: string[] = [];

  for (const node of this._allNodes) {
    if (!visited.has(node.id)) {
      this._findCycles(node.id, visited, path, cycles);
    }
  }

  return cycles;
}

private _findCycles(
  nodeId: string,
  visited: Set<string>,
  path: string[],
  cycles: string[][]
): void {
  visited.add(nodeId);
  path.push(nodeId);

  const relationships = this.getRelationships(nodeId);
  for (const rel of relationships) {
    if (path.includes(rel.targetId)) {
      // Found a cycle
      const cycleStart = path.indexOf(rel.targetId);
      cycles.push(path.slice(cycleStart).concat([rel.targetId]));
    } else if (!visited.has(rel.targetId)) {
      this._findCycles(rel.targetId, visited, new Set(visited), [...path], cycles);
    }
  }

  path.pop();
}
```

## File Structure Changes

### Source Files Modified

```
src/
├── types.ts                    # Add inverse relationship types
├── DocumentParser.ts           # No changes needed (already parses all types)
├── TraceabilityGraph.ts        # Add inverse relationship storage and queries
├── MatrixGenerator.ts          # Add inverse matrix types
├── antora-extension.ts         # Add inverse matrix generation
└── index.ts                    # Export new types
```

### Test Files Modified/Created

```
test/
├── graph.test.ts               # Add inverse relationship tests
├── matrix-generator.test.ts    # Add inverse matrix tests
└── bidirectional.test.ts       # NEW: Comprehensive bidirectional tests
```

## Backward Compatibility

### Existing Code Impact

All existing code continues to work without modification:

1. **Parser**: Already parses all inline macros. No changes needed.
2. **Graph Storage**: Existing relationships are stored as before. Inverses are added automatically.
3. **Query Methods**: Existing methods like `getImplementationsForRequirement()` continue to work. They can be optimized to use inverse relationships, but don't need to.
4. **Matrix Generation**: Existing matrices are unchanged. New inverse matrices are added.
5. **Tests**: All existing tests pass without modification.

### Migration Path

**For users:** No migration needed. Existing content works as-is. New features are opt-in through new query methods and matrix types.

**For developers:** If extending the system, be aware that relationships now have inverses. Use the new convenience methods for inverse queries.

## Error Handling

### Duplicate Relationship Prevention

```typescript
// In addRelationship, check for duplicates
addRelationship(rel: Omit<Relationship, 'id' | 'autoGenerated' | 'inverseOf'>): string {
  const relId = `${rel.fromId}-${rel.type}-${rel.targetId}`;

  // Check if this exact relationship already exists
  if (this._relationships.has(relId)) {
    throw new Error(`Duplicate relationship: ${rel.fromId} ${rel.type} ${rel.targetId}`);
  }

  // Check if the inverse already exists (shouldn't happen with auto-generation)
  if (isPrimaryRelationshipType(rel.type)) {
    const inverseType = INVERSE_MAP[rel.type];
    const inverseId = `${rel.targetId}-${inverseType}-${rel.fromId}`;
    if (this._relationships.has(inverseId)) {
      // This means we're trying to add a primary when the inverse already exists
      // This could happen if user tries to define both directions
      this.logger.warn(`Inverse relationship already exists for ${rel.fromId} ${rel.type} ${rel.targetId}`);
      // Remove the existing inverse and recreate both
      this._relationships.delete(inverseId);
      this._removeFromInverseIndex(inverseId);
    }
  }

  // ... continue with creation
}
```

## Configuration

No configuration changes required. Auto-generation of inverse relationships is always enabled.

## Performance Considerations

### Memory Impact

- Each primary relationship → 1 primary + 1 inverse = 2 relationships stored
- For 1000 primary relationships: 2000 total relationships
- Each relationship object: ~200 bytes
- Total for 1000 primary: ~400KB (negligible)

### Query Performance

| Query | Current | With Inverses | Improvement |
|-------|---------|---------------|-------------|
| getImplementationsForRequirement | O(n) traversal | O(1) direct lookup | ✅ Major |
| getRequirementsForImplementation | O(n) traversal | O(1) direct lookup | ✅ Major |
| getDesignsForRequirement | O(n) traversal | O(1) direct lookup | ✅ Major |
| getRequirementsForDesign | O(n) traversal | O(1) direct lookup | ✅ Major |

### Build Time Impact

- Auto-generation adds ~10-20μs per relationship
- For 1000 relationships: ~10-20ms total
- Negligible compared to AsciiDoc parsing time

## Future Enhancements

### Phase 3B: Transitive Coverage

With bidirectional relationships in place, implement transitive coverage:

```typescript
// If: DES-001 addresses REQ-001
// And: IMP-001 implements DES-001
// Then: IMP-001 transitively satisfies REQ-001

getTransitiveSatisfaction(implId: string): Requirement[] {
  const direct = this.getRequirementsForImplementation(implId);
  const designs = this.getDesignsForImplementation(implId);
  const transitive = designs.flatMap(d => this.getRequirementsForDesign(d.id));
  return [...new Set([...direct, ...transitive])];
}
```

### Phase 3C: Visual Hierarchy

Use `composed-of` and `part-of` relationships to show hierarchical structure in matrices:

```
REQ-001 | DES-001 (Auth System)
        |  └─ DES-002 (Password Auth)
        |      └─ DES-003 (Hashing)
        |  └─ DES-004 (OAuth)
```

### Phase 3D: Design-Design Matrix

Generate a matrix showing relationships between design concepts:

```csv
Design ID,DES-001,DES-002,DES-003
DES-001,-,composed-of,-
DES-002,part-of,-,depends-on
DES-003,-,depended-by,-
```

## Migration Guide

### For Users

No action required. Existing content works as-is. New features are automatically available.

### For Developers

If you're extending the traceability system:

1. **Adding new relationship types**: Update `INVERSE_MAP` and `PRIMARY_MAP` with new mappings
2. **Querying relationships**: Use the new convenience methods for inverse queries
3. **Matrix generation**: Consider adding inverse matrices for new relationship types
4. **Validation**: Be aware that relationships now have auto-generated inverses

## Comparison: Manual vs Auto-Generated Bidirectional

### Manual Bidirectional (Current Alternative)

```asciidoc
[design, id=DES-001]
====
addresses:REQ-001[]
====

[req, id=REQ-001]
====
# Must manually add inverse (not currently supported)
# addressed-by:DES-001[]  # This macro doesn't exist yet
====
```

**Problems:**
- Redundant definition
- Error-prone (can forget to add inverse)
- Inconsistent (can get out of sync)
- More verbose

### Auto-Generated Bidirectional (Proposed)

```asciidoc
[design, id=DES-001]
====
addresses:REQ-001[]  # Automatically creates inverse
====

[req, id=REQ-001]
====
# No need to define inverse - it's auto-generated
====
```

**Benefits:**
- Single source of truth
- Cannot get out of sync
- Less verbose
- More maintainable

## Testing Strategy

### Unit Tests

1. **Relationship Auto-Generation**
   - Test that primary relationships generate inverses
   - Test that inverse relationships have correct properties
   - Test that inverse relationships reference primary via `inverseOf`

2. **Query Methods**
   - Test all new convenience methods return correct results
   - Test that results match manual traversal

3. **Matrix Generation**
   - Test all new inverse matrices are generated correctly
   - Test matrix data matches query results

4. **Validation**
   - Test circular reference detection
   - Test orphaned relationship detection
   - Test duplicate prevention

5. **Backward Compatibility**
   - Test all existing tests still pass
   - Test existing query methods return same results

### Integration Tests

1. **Example Site**
   - Test example site builds with bidirectional relationships
   - Test all matrices are generated correctly
   - Test coverage reports include bidirectional data

2. **Cross-File Relationships**
   - Test bidirectional relationships work across files
   - Test matrices show correct data for cross-file relationships

## Rollback Plan

If issues arise, the change can be rolled back by:

1. Reverting the type system changes
2. Reverting the graph storage changes
3. Reverting the matrix generator changes
4. All changes are isolated to specific files

The change is additive - removing it would only affect new functionality, not existing behavior.
