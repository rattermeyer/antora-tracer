# Specification: TypeScript Refactoring

## REF-001: Module Decomposition

**Priority**: High  
**Rationale**: `src/index.ts` is 737 lines with no clear internal boundaries. Splitting it makes each concern independently navigable and testable.

The source directory must contain exactly these TypeScript modules after refactoring:
- `types.ts` — interfaces and union types only; no logic
- `TraceabilityGraph.ts` — graph class only; no parsing or matrix logic
- `RequirementParser.ts` — parsing only; no graph mutation after returning
- `MatrixGenerator.ts` — matrix/coverage generation only; read-only graph access
- `AsciidoctorExtension.ts` — Asciidoctor API wiring only
- `index.ts` — public orchestrator; no logic, only composition
- `cli.ts` — CLI entry point; unchanged

**Acceptance criteria**:
- No file in `src/` exceeds 200 lines
- Each module imports only from modules below it in the dependency order
- `types.ts` imports nothing from the project


## REF-002: TraceabilityGraph as a Proper Class

**Priority**: High  
**Rationale**: The current factory-object pattern aliases state between the parent class and the graph object, which caused the `targetId`/`toId` debugging mystery during development.

The `TraceabilityGraph` must be a class with private internal state. Its Maps (`_requirements`, `_implementations`, `_tests`, `_documents`, `_relationships`) must not be publicly accessible.

**Acceptance criteria**:
- `TraceabilityGraph` is an exported class, not a factory function return value
- No caller can access raw Maps on the graph (no `graph.requirements`, no `graph.relationships`)
- All traversal goes through `getRelationships()` and `getReverseRelationships()`
- The class is independently instantiatable without a parent class


## REF-003: TraceableNode Base Interface

**Priority**: Medium  
**Rationale**: `Requirement`, `Implementation`, `Test`, and `Document` repeat 8 fields with only optionality differences. The duplication is noise.

All four node interfaces must extend a common `TraceableNode` base. The shared fields are defined once on the base. `Requirement` overrides fields to make them required.

**Acceptance criteria**:
- `TraceableNode` is defined in `types.ts`
- All four node interfaces extend `TraceableNode`
- The shared fields (`content`, `status`, `attributes`, `sourceFile`, `sourceLine`, `relationships`) appear exactly once in the type definitions
- The `AnyNode` union type is exported from `types.ts`


## REF-004: RelationshipType Union Type

**Priority**: Medium  
**Rationale**: Relationship types are currently unvalidated strings. A typo like `'implemens'` fails silently at runtime.

The `RelationshipType` union must cover all valid relationship types. All methods that accept or return relationship types must use `RelationshipType`, not `string`.

**Acceptance criteria**:
- `RelationshipType` is exported from `types.ts`
- `addRelationship()` accepts `RelationshipType`, not `string`
- `getRelationships()` accepts `type?: RelationshipType`, not `type?: string`
- `getReverseRelationships()` accepts `type?: RelationshipType`, not `type?: string`
- `tsc --strict` produces an error when an invalid relationship type is passed


## REF-005: Single Source of Truth for Relationships

**Priority**: High  
**Rationale**: Relationships are stored twice — in the central Map and on each source node's `.relationships` array. This is a data consistency risk that was inherited from the JavaScript prototype.

Relationships must be stored exactly once. The `relationships` array on `TraceableNode` must be removed. All traversal must query the graph's relationship Map.

**Acceptance criteria**:
- `TraceableNode` has no `relationships` field
- `Requirement`, `Implementation`, `Test`, `Document` have no `relationships` field
- `addRelationship()` writes to exactly one store
- All traversal methods (`getRelationships`, `getReverseRelationships`, `getImpactAnalysis`, `findPath`) read from exactly one store


## REF-006: Remove processSync

**Priority**: Medium  
**Rationale**: `processSync` is a near-identical duplicate of `process`. Asciidoctor.js v4 is inherently async; the sync version is broken and misleading.

`processSync` must be removed. All callers — including tests — use `await process(...)`.

**Acceptance criteria**:
- `processSync` does not exist on the class or its interface
- No test calls `processSync`
- Tests that previously called `processSync` now `await process()`
- `process()` returns `Promise<string>`


## REF-007: Type Matrix Return Values

**Priority**: Medium  
**Rationale**: `generateMatrix()` and related methods return `any`, losing type safety downstream.

Matrix methods must return typed interfaces defined in `types.ts`.

**Acceptance criteria**:
- `generateMatrix()` returns `TraceabilityMatrix`, not `any`
- `generateDetailedMatrix()` returns `DetailedTraceabilityMatrix`, not `any`
- `getRequirementsWithDetails()` returns `RequirementDetail[]`, not `any[]`
- `getImplementationsWithDetails()` returns `ImplementationDetail[]`, not `any[]`
- `getTestsWithDetails()` returns `TestDetail[]`, not `any[]`


## REF-008: findPathRecursive is Private

**Priority**: Low  
**Rationale**: A recursive helper method is an implementation detail. Exposing it on the public interface invites misuse and clutters the API surface.

**Acceptance criteria**:
- `findPathRecursive` does not appear in any exported interface
- `findPathRecursive` is a `private` method on `TraceabilityGraph`
- `findPath` remains public


## REF-009: Remove Dead Code

**Priority**: Low  
**Rationale**: `validateRequirementId` is defined but never called. Dead code creates confusion about intent.

**Acceptance criteria**:
- `validateRequirementId` does not exist in the codebase
- The duplicate-ID check in the parser continues to work (it is inline, not delegated)


## REF-010: Remove Stale Files from src/

**Priority**: Low  
**Rationale**: Compiled `.js` files and a `.backup` file are present in `src/`, which is a source directory for TypeScript.

**Acceptance criteria**:
- `src/cli.js` is deleted
- `src/index.js` is deleted
- `src/index.js.backup` is deleted
- `src/package.json` is deleted
- `.gitignore` contains `src/**/*.js` to prevent recurrence


## REF-011: Named Exports Replace export =

**Priority**: Low  
**Rationale**: `export = ClassName` is the old CJS-interop style. Named exports are the modern convention and work better with tooling.

**Acceptance criteria**:
- `index.ts` uses `export { RequirementsTraceabilityExtension }`
- All public types are re-exported from `index.ts` using `export type { ... }`
- No file uses `export =`


## REF-012: Convert Tests to TypeScript

**Priority**: Medium  
**Rationale**: Test files in JavaScript get no type checking. Typos in test code and wrong API usage are silently accepted.

**Acceptance criteria**:
- All files in `test/` have a `.ts` extension
- Tests import from `../src/...` (not `../lib/...`)
- `tsc` type-checks the test files (or `ts-mocha` does at runtime)
- All 29 currently-passing tests continue to pass
- A typo in a test's API call (e.g., wrong method name) is caught by the compiler
