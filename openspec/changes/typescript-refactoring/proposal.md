# TypeScript Refactoring

## Summary

Refactor the requirements traceability codebase to address a set of structural, type-safety, and hygiene issues identified during a senior TypeScript developer review. The code currently works but is hard to navigate, has unclear boundaries between concerns, uses `any` in places where proper types are possible, and contains duplication that has already caused bugs during development.

## Problem Statement

The entire implementation lives in a single 737-line `src/index.ts` file. One class — `RequirementsTraceabilityExtension` — is responsible for Asciidoctor extension registration, AsciiDoc parsing, graph management, matrix generation, and coverage analysis simultaneously. This makes the file hard to read, hard to test in isolation, and fragile to change.

Beyond the architecture, several concrete issues compound the problem:

- The `TraceabilityGraph` is not a class but a plain object built by a factory method. Its methods close over a `self` reference on the parent class, making reasoning about state difficult and causing the `targetId`/`toId` debugging mystery we hit during development.
- The four node types (`Requirement`, `Implementation`, `Test`, `Document`) repeat the same 8 fields with only optionality differences. There is no shared base.
- Relationship types are plain `string`, making typos silently wrong at runtime.
- Relationship data is stored in two places simultaneously (the central `Map` and on each source node), creating a consistency risk.
- `processSync` and `process` are near-identical methods; the sync version is already broken with Asciidoctor.js v4.
- 20 uses of `any`, many of which can be replaced with real types.
- Dead code (`validateRequirementId` is defined but never called).
- Stale compiled `.js` files and a `.backup` file are sitting in `src/`.
- Tests are plain JavaScript, getting no benefit from TypeScript.

## Proposed Solution

Split the single file into focused modules, each with one job. Make `TraceabilityGraph` a proper class. Establish a shared `TraceableNode` base interface. Introduce a `RelationshipType` union. Eliminate the data duplication in relationship storage. Clean up `any`, dead code, and stale files. Convert the test suite to TypeScript.

## Scope

### In Scope
- Splitting `src/index.ts` into `types.ts`, `TraceabilityGraph.ts`, `RequirementParser.ts`, `MatrixGenerator.ts`, `AsciidoctorExtension.ts`, and a thin `index.ts` orchestrator
- Converting `TraceabilityGraph` from a factory-built plain object to a proper class
- Introducing `TraceableNode` base interface shared by all four node types
- Introducing `RelationshipType` union type
- Removing duplicated relationship storage from node objects
- Removing `processSync` (only `async process()` is supported by Asciidoctor.js v4)
- Typing matrix return values instead of using `any[]`
- Moving `findPathRecursive` from the public interface to a private method
- Removing dead code (`validateRequirementId`)
- Removing stale files from `src/` (`*.js`, `*.backup`)
- Converting test files from JavaScript to TypeScript

### Out of Scope
- Fixing the Asciidoctor.js API integration bug (tracked separately)
- Adding new features
- Changing the public-facing behaviour of any method
- CI/CD setup

## Success Criteria

- All 29 currently passing tests continue to pass after refactoring
- No new `any` annotations introduced; existing avoidable ones removed
- `tsc --strict` compiles with zero errors
- No file in `src/` exceeds ~200 lines
- `src/` contains only `.ts` files
- A typo in a relationship type (`'implments'`) is caught at compile time

## Non-Goals

- This refactoring does not change runtime behaviour
- It does not fix existing failing tests (those are Asciidoctor.js API issues)
- It does not add ESLint or other new tooling (can follow later)
