# Implementation Tasks: Example Antora Site

## Overview

This change creates an example Antora site that demonstrates the Requirements Traceability Extension. The site will serve as both documentation and a live demonstration.

## Phase 1: Minimal Example (MVP)

### Task 1: Create Directory Structure
**Status**: Not Started
**Estimate**: 15 minutes
**Dependencies**: None

- Create `example-site/` directory
- Create `example-site/docs/modules/ROOT/pages/` directory
- Create `example-site/docs/modules/ROOT/nav/` directory
- Add `.gitignore` for example-site

### Task 2: Configure Antora
**Status**: Not Started
**Estimate**: 30 minutes
**Dependencies**: Task 1

- Create `example-site/antora.yml` with:
  - Site title and start page
  - Content source configuration
  - UI bundle configuration
  - Extension registration (local reference)
- Test that Antora can read the configuration

### Task 3: Setup package.json
**Status**: Not Started
**Estimate**: 20 minutes
**Dependencies**: Task 1

- Create `example-site/package.json` with:
  - Name and description
  - Local dependency on the extension (`file:..`)
  - Scripts for build and demo
  - Antora and Asciidoctor dependencies
- Run `npm install` to verify setup

### Task 4: Create Welcome Page
**Status**: Not Started
**Estimate**: 30 minutes
**Dependencies**: Task 2, Task 3

- Create `example-site/docs/modules/ROOT/pages/index.adoc`
- Add welcome message
- Add overview of the extension
- Add quick start guide (how to run the example)
- Add links to other sections

### Task 5: Create Example Requirements
**Status**: Not Started
**Estimate**: 45 minutes
**Dependencies**: Task 4

- Create `example-site/docs/modules/ROOT/pages/requirements.adoc`
- Add 4 example requirements using `[req]` block macros:
  - EXAMPLE-001: Welcome Page
  - EXAMPLE-002: Requirement Definition
  - EXAMPLE-003: Traceability Linking
  - EXAMPLE-004: Matrix Generation
- Each requirement should have:
  - Unique ID
  - Title
  - Descriptive content
  - Status

### Task 6: Create Architecture Documentation
**Status**: Not Started
**Estimate**: 1 hour
**Dependencies**: Task 5

- Create `example-site/docs/modules/ROOT/pages/architecture.adoc`
- Add 4 architecture components:
  - AsciiDoc Processor (satisfies:EXAMPLE-002[])
  - Traceability Graph (satisfies:EXAMPLE-002[], implements:EXAMPLE-003[], implements:EXAMPLE-004[])
  - Matrix Generator (implements:EXAMPLE-004[])
  - Antora Extension (implements:EXAMPLE-001[])
- Each component should have:
  - Title
  - Description
  - Traceability macros linking to requirements

### Task 7: Create Matrix Explanation
**Status**: Not Started
**Estimate**: 30 minutes
**Dependencies**: Task 6

- Create `example-site/docs/modules/ROOT/pages/matrices.adoc`
- Explain what traceability matrices are
- Explain the different matrix types (req-impl, req-test, full)
- Explain how to read matrices
- Explain status indicators (✓ Complete, ⚠ Partial, ✗ Missing)
- Explain coverage calculation
- Link to the generated matrices (will be created during build)

### Task 8: Create Sphinx Needs Comparison
**Status**: Not Started
**Estimate**: 45 minutes
**Dependencies**: Task 7

- Create `example-site/docs/modules/ROOT/pages/sphinx-comparison.adoc`
- Create comparison table with at least 5 features:
  - Requirement definition
  - Implementation definition
  - Test definition
  - Relationship types
  - Matrix generation
  - Integration method
  - Language
  - Configuration
- Add notes about advantages of this extension

### Task 9: Create Navigation
**Status**: Not Started
**Estimate**: 15 minutes
**Dependencies**: Task 8

- Create `example-site/docs/modules/ROOT/nav/main.yml`
- Add navigation entries for:
  - Home (index.adoc)
  - Requirements (requirements.adoc)
  - Architecture (architecture.adoc)
  - Matrices (matrices.adoc)
  - Sphinx Comparison (sphinx-comparison.adoc)

### Task 10: Test the Build
**Status**: Not Started
**Estimate**: 30 minutes
**Dependencies**: Task 9

- From example-site directory, run `npm install`
- Run `npx antora antora.yml`
- Verify build completes without errors
- Verify _site/ directory is created
- Verify _site/index.html exists and is viewable
- Verify traceability/ directory exists in _site/
- Verify matrix files are generated (matrix-req-impl.html, etc.)
- Verify coverage.html is generated

### Task 11: Verify Content
**Status**: Not Started
**Estimate**: 30 minutes
**Dependencies**: Task 10

- Open _site/index.html in browser
- Verify navigation works
- Verify requirements page shows all 4 requirements
- Verify architecture page shows all 4 components
- Verify architecture page shows traceability links
- Verify matrices page explains matrices
- Verify Sphinx comparison page shows table
- Verify matrices are visible and correct
- Verify coverage report is visible and correct

### Task 12: Add README
**Status**: Not Started
**Estimate**: 20 minutes
**Dependencies**: Task 11

- Create `example-site/README.md`
- Explain what the example site is
- Explain how to run it
- Explain what to expect
- Link to main documentation

---

## Phase 2: Enhanced Example (Future Iterations)

### Task 13: Add Real Spec Requirements
**Status**: Not Started
**Estimate**: 1 hour
**Dependencies**: Task 12

- Copy requirements from the extension's spec to a new section
- Update IDs to avoid conflicts (or keep them and document)
- Link architecture to these real requirements
- Verify matrices show both example and real requirements

### Task 14: Add Test Examples
**Status**: Not Started
**Estimate**: 45 minutes
**Dependencies**: Task 13

- Add test examples using `[test]` block macros
- Link tests to requirements
- Show test coverage in matrices

### Task 15: Add Interactive Tutorial
**Status**: Not Started
**Estimate**: 2 hours
**Dependencies**: Task 14

- Create step-by-step tutorial
- Each step shows a concept and has a "try it" example
- Users can modify the examples and see results

---

## Summary

| Phase | Tasks | Est. Time | Priority |
|-------|-------|-----------|----------|
| 1: MVP | 1-12 | ~6.5 hours | High |
| 2: Enhanced | 13-15 | ~3.75 hours | Medium |
| **Total** | **15** | **~10.25 hours** | - |

## Dependencies

- Node.js 14+
- npm
- Antora 3.x
- Requirements Traceability Extension (local development version)

## Risks and Mitigation

### Technical Risks
- **Extension compatibility**: Extension might not work with Antora in example context
  - *Mitigation*: Test early and often, use same Antora version
- **Path resolution**: Local dependency (`file:..`) might not resolve correctly
  - *Mitigation*: Test the npm install process
- **Build errors**: Antora might have issues with the example content
  - *Mitigation*: Start simple, add complexity gradually

### Schedule Risks
- **Underestimated complexity**: Example site might be more complex than expected
  - *Mitigation*: Start with minimal example, iterate
- **Dependency issues**: Might have issues with Antora or Node.js versions
  - *Mitigation*: Test with multiple versions

### Quality Risks
- **Incomplete demonstration**: Example might not show all features
  - *Mitigation*: Focus on core features first, add others later
- **Poor documentation**: Example might be hard to understand
  - *Mitigation*: Add clear explanations and comments
