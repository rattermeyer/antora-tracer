# Design: TypeScript Refactoring

## Module Structure

The single `src/index.ts` file is split into six focused modules. Each module has one clear job.

```
src/
  types.ts                 ← All shared interfaces and union types
  TraceabilityGraph.ts     ← Pure graph class: nodes, edges, traversal, coverage
  RequirementParser.ts     ← Extracts requirements from AsciiDoc string content
  MatrixGenerator.ts       ← Produces coverage reports and traceability matrices
  AsciidoctorExtension.ts  ← Wires up the Asciidoctor [req] block processor
  index.ts                 ← Public API: thin orchestrator, re-exports
  cli.ts                   ← CLI entry point (unchanged)
```

Dependency flow is strictly one-way: nothing in the lower modules imports from the orchestrator.

```
          cli.ts
            │
          index.ts  (orchestrates)
          │   │   │   │
   Parser │   │   │   │ AsciidoctorExtension
          │   │   │   │
          │ Graph  │   │
          │         │   │
          │      MatrixGenerator
          │
       types.ts  (imported by everyone, imports nothing)
```

## `types.ts` — Shared Type Definitions

### TraceableNode base interface

All four node types share the same shape. Only `Requirement` makes fields required; the others keep them optional. A single base interface captures this:

```typescript
export interface TraceableNode {
  id: string;
  title: string;
  content?: string;
  status?: string;
  attributes?: Record<string, string>;
  sourceFile?: string;
  sourceLine?: number;
  relationships?: Relationship[];
}

export interface Requirement extends TraceableNode {
  content: string;
  status: string;
  sourceFile: string;
  sourceLine: number;
  relationships: Relationship[];
}

// Implementation, Test, Document all extend TraceableNode without overrides
export interface Implementation extends TraceableNode {}
export interface Test extends TraceableNode {}
export interface Document extends TraceableNode {}

export type AnyNode = Requirement | Implementation | Test | Document;
```

### RelationshipType union

Relationship types are closed. A union type catches typos at compile time:

```typescript
export type RelationshipType =
  | 'implements'
  | 'satisfies'
  | 'tests'
  | 'verifies'
  | 'documents'
  | 'depends'
  | 'requires';

export interface Relationship {
  fromId: string;
  targetId: string;
  type: RelationshipType;
}
```

### Matrix types

Return types for matrix generation are made explicit:

```typescript
export interface CoverageReport {
  totalRequirements: number;
  requirementsWithImplementation: number;
  requirementsWithTests: number;
  implementationCoverage: number;
  testCoverage: number;
}

export interface RequirementDetail {
  id: string;
  title: string;
  status: string;
  satisfiedBy: string[];
  implementedBy: string[];
  testedBy: string[];
  verifiedBy: string[];
  documentedBy: string[];
}

export interface TraceabilityMatrix {
  type: string;
  coverage: CoverageReport;
  requirements: RequirementRow[];
  generatedAt: string;
}
```

### ProcessOptions

```typescript
export interface ProcessOptions {
  sourceFile?: string;
}
```

## `TraceabilityGraph.ts` — Graph Class

The graph becomes a proper class with private state. External code can no longer reach into the raw Maps.

### Why this matters

The current factory-object pattern means `this.graph.requirements === this.requirements` — the same Map is aliased in two places. This was the root cause of the debugging confusion: state lives on the parent but is accessed through the child. Making `TraceabilityGraph` a standalone class with its own private Maps ends the aliasing.

### Public API

```typescript
export class TraceabilityGraph {
  // Node management
  addNode(node: AnyNode, kind: NodeKind): void;
  getNode(id: string): AnyNode | undefined;
  getRequirement(id: string): Requirement | undefined;
  getImplementation(id: string): Implementation | undefined;
  getTest(id: string): Test | undefined;
  getDocument(id: string): Document | undefined;

  // Relationship management
  addRelationship(relationship: Relationship): void;
  getRelationships(fromId: string, type?: RelationshipType): Relationship[];
  getReverseRelationships(toId: string, type?: RelationshipType): Relationship[];

  // Analysis
  getCoverage(): CoverageReport;
  getUncoveredRequirements(): Requirement[];
  findPath(fromId: string, toId: string, maxDepth?: number): string[] | null;
  getImpactAnalysis(id: string): string[];

  // Introspection
  getAllRequirements(): Requirement[];
  getAllImplementations(): Implementation[];
  getAllTests(): Test[];
  size(): number;

  // Lifecycle
  clear(): void;
}
```

### Relationship storage

Relationships are stored **once** in a private `Map<string, Relationship>`. The node-level `relationships` array on `TraceableNode` is removed. All traversal queries go through `getRelationships()` / `getReverseRelationships()`, which scan the Map. This is a single source of truth.

```
BEFORE (two stores):
  graph._relationships Map: { 'IMP-001-REQ-001-implements': Relationship }
  imp001.relationships: [ Relationship ]   ← same data, risk of drift

AFTER (one store):
  graph._relationships Map: { 'IMP-001-REQ-001-implements': Relationship }
  // node objects have no .relationships field
```

### Private helpers

`findPathRecursive` is a private implementation detail, not part of any public interface:

```typescript
private findPathRecursive(
  currentId: string,
  targetId: string,
  visited: string[],
  maxDepth: number
): string[] | null
```

## `RequirementParser.ts` — AsciiDoc Parsing

Parsing logic is extracted into a standalone class. It takes a string of AsciiDoc content and returns a list of parsed requirements. It has no knowledge of the graph or Asciidoctor's runtime.

```typescript
export class RequirementParser {
  parse(content: string, sourceFile: string): Requirement[];
}
```

This is entirely synchronous and independently testable. The parser is the only place that contains the regex logic and block-extraction heuristics.

## `MatrixGenerator.ts` — Matrix Generation

Takes a `TraceabilityGraph` (read-only) and produces typed matrix objects. It contains no graph mutation logic.

```typescript
export class MatrixGenerator {
  constructor(private readonly graph: TraceabilityGraph) {}

  generateMatrix(type?: MatrixType): TraceabilityMatrix;
  generateDetailedMatrix(type?: MatrixType): DetailedTraceabilityMatrix;
  getCoverageReport(): CoverageReport;
  getRequirementsWithDetails(): RequirementDetail[];
}
```

## `AsciidoctorExtension.ts` — Asciidoctor Wiring

All Asciidoctor-specific code is isolated here: the block processor factory, `createBlock`, `createParagraph`, `getSourceFile`, `getSourceLine`, and the registration fallback logic. It accepts a callback so that when a requirement block is encountered, it can notify the parser/graph without depending on them directly.

```typescript
export type RequirementFoundCallback = (req: Requirement) => void;

export class AsciidoctorExtension {
  constructor(private readonly asciidoctor: any) {}

  register(onRequirementFound: RequirementFoundCallback): void;
  convert(content: string, options?: ConvertOptions): Promise<string>;
}
```

The `any` for the Asciidoctor instance remains here — it's unavoidable given the library's type coverage — but it's now contained in one file.

## `index.ts` — Public Orchestrator

The main entry point becomes a thin orchestrator. It composes the other modules and exposes the public API:

```typescript
export class RequirementsTraceabilityExtension {
  private readonly graph: TraceabilityGraph;
  private readonly parser: RequirementParser;
  private readonly generator: MatrixGenerator;
  private readonly extension: AsciidoctorExtension;

  async process(content: string, options?: ProcessOptions): Promise<string>;
  addRelationship(fromId: string, toId: string, type: RelationshipType): void;
  addImplementation(node: Implementation): void;
  addTest(node: Test): void;
  addDocument(node: Document): void;
  generateMatrix(type?: MatrixType): TraceabilityMatrix;
  generateDetailedMatrix(type?: MatrixType): DetailedTraceabilityMatrix;
  getCoverageReport(): CoverageReport;
  getImpactAnalysis(id: string): string[];
  findPath(fromId: string, toId: string): string[] | null;
  getUncoveredRequirements(): Requirement[];
  clear(): void;
}
```

No `processSync`. No `createTraceabilityGraph`. No factory methods. The class composes its dependencies; it does not build them internally.

## Exports

```typescript
// index.ts
export { RequirementsTraceabilityExtension };
export type { Requirement, Implementation, Test, Document, Relationship, RelationshipType, CoverageReport, TraceabilityMatrix };
```

Named exports replace `export =` for clarity and modern compatibility.

## Test Suite Conversion

Tests move from `.js` to `.ts`. The test runner is updated to use `ts-node` (or `ts-mocha`) so tests are type-checked as part of the test run. All test imports point to the `src/` module, not `lib/`, so tests always run against the latest source:

```typescript
// test/graph.test.ts
import { TraceabilityGraph } from '../src/TraceabilityGraph';
import type { Requirement } from '../src/types';
```

## Files to Delete

These files should be removed from the repository:

```
src/cli.js
src/index.js
src/index.js.backup
src/package.json
```

`.gitignore` gains `src/**/*.js` to prevent compiled output from landing in the source directory in future.

## tsconfig.json Changes

The `src/package.json` workaround (which set `"type": "commonjs"` inside `src/`) is no longer needed once the module system is handled cleanly via `tsconfig.json`. The config should use `"module": "commonjs"` with `"moduleResolution": "node"` to match Node.js 20+ CommonJS interop.

## Invariants Preserved

- All 29 currently-passing tests must pass after each step
- Public method signatures are unchanged (same names, same parameters, same return shapes)
- The `[req]` AsciiDoc macro syntax is unchanged
