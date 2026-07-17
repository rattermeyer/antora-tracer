# Tasks: TypeScript Refactoring

Each task is independently completable and leaves the test suite green. Run `npm test` after each task.

---

## Phase 1: Hygiene (no logic changes)

### - [x] Task 1: Remove stale files from src/
**Spec**: REF-010  
**Estimate**: 15 min

- Delete `src/cli.js`
- Delete `src/index.js`
- Delete `src/index.js.backup`
- Delete `src/package.json`
- Add `src/**/*.js` to `.gitignore`
- Update `scripts/build.js` to remove any src→lib copy logic that is no longer needed

---

### - [x] Task 2: Remove dead code
**Spec**: REF-009  
**Estimate**: 15 min

- Delete the `validateRequirementId` method from `src/index.ts`
- Confirm the inline duplicate-ID check in `parseRequirementsFromContent` is intact
- Run `npm run build` to confirm no compile errors

---

### - [x] Task 3: Replace export = with named exports
**Spec**: REF-011  
**Estimate**: 15 min

- Change `export = RequirementsTraceabilityExtension` to `export { RequirementsTraceabilityExtension }`
- Update test files that do `require('../lib/index.js')` to use the named export
- Run `npm test` to confirm all tests still pass

---

## Phase 2: Type improvements (no structural changes)

### - [x] Task 4: Introduce RelationshipType union
**Spec**: REF-004  
**Estimate**: 30 min

- In `src/index.ts`, add `RelationshipType` union above the `Relationship` interface:
  ```typescript
  export type RelationshipType =
    | 'implements' | 'satisfies' | 'tests' | 'verifies'
    | 'documents' | 'depends' | 'requires';
  ```
- Change `Relationship.type` from `string` to `RelationshipType`
- Update `addRelationship(fromId, toId, type)` parameter type to `RelationshipType`
- Update `getRelationships(id, type?)` and `getReverseRelationships(id, type?)` parameter types
- Run `npm run build` — fix any resulting type errors
- Run `npm test`

---

### - [x] Task 5: Introduce TraceableNode base interface
**Spec**: REF-003  
**Estimate**: 30 min

- Add `TraceableNode` base interface in `src/index.ts`
- Make `Requirement`, `Implementation`, `Test`, `Document` extend it
- Remove duplicated field declarations from the extending interfaces
- Add `export type AnyNode = Requirement | Implementation | Test | Document`
- Run `npm run build` — fix any resulting type errors
- Run `npm test`

---

### - [x] Task 6: Type matrix return values
**Spec**: REF-007  
**Estimate**: 45 min

- Add `RequirementRow`, `RequirementDetail`, `ImplementationDetail`, `TestDetail`, `TraceabilityMatrix`, `DetailedTraceabilityMatrix` interfaces to `src/index.ts`
- Change `generateMatrix()` return type from `any` to `TraceabilityMatrix`
- Change `generateDetailedMatrix()` return type from `any` to `DetailedTraceabilityMatrix`
- Change `getRequirementsWithDetails()` return type from `any[]` to `RequirementDetail[]`
- Change `getImplementationsWithDetails()` return type from `any[]` to `ImplementationDetail[]`
- Change `getTestsWithDetails()` return type from `any[]` to `TestDetail[]`
- Run `npm run build` — fix any resulting type errors
- Run `npm test`

---

## Phase 3: Data model fix

### - [x] Task 7: Remove relationship data duplication
**Spec**: REF-005  
**Estimate**: 1 hour

This is the most impactful data correctness fix.

- Remove the `relationships` field from `TraceableNode` (and from `Requirement` where it is currently required)
- Remove the code in `graph.addRelationship()` that pushes to `sourceNode.relationships`
- Verify that `getRelationships()` and `getReverseRelationships()` query only the central Map (they already do)
- Verify that `getImpactAnalysis()` and `findPath()` use only `getRelationships()`/`getReverseRelationships()` (they already do)
- Remove the `relationships: []` initialisation from `parseRequirementsFromContent()`
- Run `npm run build` — fix any resulting type errors
- Run `npm test` — all currently-passing tests should still pass

---

## Phase 4: processSync removal

### - [x] Task 8: Remove processSync, update tests to async
**Spec**: REF-006  
**Estimate**: 30 min

- Delete the `processSync` method from `src/index.ts`
- In `test/processor.test.js`, find all calls to `processSync` and replace with `await process()`
- Mark any affected test callbacks as `async`
- Run `npm test`

---

## Phase 5: Module decomposition

These tasks split the monolith into focused files. Do them in order — each extraction leaves a stable codebase before the next begins.

### - [x] Task 9: Extract types.ts
**Spec**: REF-001, REF-003, REF-004  
**Estimate**: 30 min

- Create `src/types.ts`
- Move all interface and type definitions from `src/index.ts` into it:
  - `TraceableNode`, `Requirement`, `Implementation`, `Test`, `Document`, `AnyNode`
  - `RelationshipType`, `Relationship`
  - `CoverageReport`
  - `RequirementRow`, `RequirementDetail`, `ImplementationDetail`, `TestDetail`
  - `TraceabilityMatrix`, `DetailedTraceabilityMatrix`
  - `ProcessOptions`
- Add `export` to each definition
- Update `src/index.ts` to import from `./types`
- Run `npm run build` and `npm test`

---

### - [x] Task 10: Extract TraceabilityGraph class
**Spec**: REF-001, REF-002, REF-008  
**Estimate**: 2 hours

This is the most structurally significant task.

- Create `src/TraceabilityGraph.ts`
- Define `export class TraceabilityGraph` with:
  - Private Maps: `_requirements`, `_implementations`, `_tests`, `_documents`, `_relationships`
  - All node-management methods (`addRequirement`, `getRequirement`, `addImplementation`, etc.)
  - `addRelationship(relationship: Relationship): void` — note the signature change; the caller now provides a complete Relationship object
  - `getRelationships(fromId, type?)`, `getReverseRelationships(toId, type?)`
  - `getCoverage()`, `getRequirementsWithImplementations()`, `getRequirementsWithTests()`, `getUncoveredRequirements()`
  - `findPath(fromId, toId, maxDepth?)` — public
  - `private findPathRecursive(currentId, targetId, visited, maxDepth)` — private
  - `getImpactAnalysis(id)`, `getAllRequirements()`, `size()`, `clear()`
- In `src/index.ts`:
  - Remove `createTraceabilityGraph()` factory method
  - Remove the `TraceabilityGraph` interface (now a class)
  - Replace `this.graph: TraceabilityGraph` (interface) with `this.graph = new TraceabilityGraph()`
  - Remove the now-separate Maps (`this.requirements`, `this.implementations`, etc.) — state lives on the graph
  - Update all calls that previously went through `this.graph.addRelationship(fromId, relationship)` to pass a complete `Relationship` object
- Run `npm run build` and `npm test`

---

### - [x] Task 11: Extract RequirementParser class
**Spec**: REF-001  
**Estimate**: 1 hour

- Create `src/RequirementParser.ts`
- Define `export class RequirementParser` with:
  - `parse(content: string, sourceFile: string): Requirement[]`
  - All private regex/string-extraction helpers currently in `parseRequirementsFromContent()`
  - `private estimateLineNumber(content, position): number`
  - `private generateAutoId(): string`
- In `src/index.ts`:
  - Remove `parseRequirementsFromContent()`, `estimateLineNumber()`, `generateAutoId()`
  - Instantiate `private readonly parser = new RequirementParser()`
  - In `process()`, call `const requirements = this.parser.parse(content, sourceFile)` and then add each requirement to `this.graph`
- Run `npm run build` and `npm test`

---

### - [x] Task 12: Extract MatrixGenerator class
**Spec**: REF-001  
**Estimate**: 45 min

- Create `src/MatrixGenerator.ts`
- Define `export class MatrixGenerator` with:
  - Constructor: `constructor(private readonly graph: TraceabilityGraph)`
  - `generateMatrix(type?: string): TraceabilityMatrix`
  - `generateDetailedMatrix(type?: string): DetailedTraceabilityMatrix`
  - `getCoverageReport(): CoverageReport`
  - `getRequirementsWithDetails(): RequirementDetail[]`
  - `getImplementationsWithDetails(): ImplementationDetail[]`
  - `getTestsWithDetails(): TestDetail[]`
- In `src/index.ts`:
  - Remove all those methods
  - Instantiate `private readonly generator = new MatrixGenerator(this.graph)`
  - Delegate: `generateMatrix(type) { return this.generator.generateMatrix(type); }`
- Run `npm run build` and `npm test`

---

### - [x] Task 13: Extract AsciidoctorExtension class
**Spec**: REF-001  
**Estimate**: 45 min

- Create `src/AsciidoctorExtension.ts`
- Define `export class AsciidoctorExtension` with:
  - Constructor: `constructor(private readonly asciidoctor: any)`
  - `register(onRequirementFound: (req: Requirement) => void): void`
  - `convert(content: string, options?: ConvertOptions): Promise<string>`
  - Private helpers: `createReqBlockProcessor()`, `createBlock()`, `createParagraph()`, `getSourceFile()`, `getSourceLine()`, `isTerminator()`
  - Private: `registerFallback()`
- In `src/index.ts`:
  - Remove `register()`, `registerFallback()`, `createReqBlockProcessor()`, `createBlock()`, `createParagraph()`, `getSourceFile()`, `getSourceLine()`, `isTerminator()`
  - Instantiate `private readonly extension = new AsciidoctorExtension(Asciidoctor)`
  - In the constructor, call `this.extension.register(req => this.graph.addRequirement(req))`
- Run `npm run build` and `npm test`

---

### - [x] Task 14: Slim down index.ts
**Spec**: REF-001, REF-011  
**Estimate**: 30 min

After the extractions, `src/index.ts` should be a thin orchestrator. Verify:

- It imports from `./types`, `./TraceabilityGraph`, `./RequirementParser`, `./MatrixGenerator`, `./AsciidoctorExtension`
- It contains `export class RequirementsTraceabilityExtension` with only delegation methods
- It re-exports the public types: `export type { Requirement, Relationship, RelationshipType, CoverageReport, TraceabilityMatrix }`
- It is under 100 lines
- Run `npm run build` and `npm test`

---

## Phase 6: Test conversion

### - [x] Task 15: Convert tests to TypeScript
**Spec**: REF-012  
**Estimate**: 2 hours

- Install `ts-mocha` and `ts-node` as dev dependencies
- Update `package.json` test script: `"test": "ts-mocha --require ts-node/register 'test/**/*.test.ts'"`
- Rename each test file from `.test.js` to `.test.ts`
- Update all test imports to point at `../src/...` (not `../lib/...`)
- Add type annotations to test variables (`let extension: RequirementsTraceabilityExtension`)
- Fix any type errors that surface (these represent real bugs in the tests)
- Run `npm test` — all 29 currently-passing tests must pass

---

## Summary

| Phase | Tasks | Specs | Est. Time |
|-------|-------|-------|-----------|
| 1: Hygiene | 1–3 | REF-009, REF-010, REF-011 | 45 min |
| 2: Types | 4–6 | REF-003, REF-004, REF-007 | 1.75 hr |
| 3: Data model | 7 | REF-005 | 1 hr |
| 4: processSync | 8 | REF-006 | 30 min |
| 5: Decomposition | 9–14 | REF-001, REF-002, REF-008 | 6.5 hr |
| 6: Tests | 15 | REF-012 | 2 hr |
| **Total** | **15** | **12** | **~12 hr** |
