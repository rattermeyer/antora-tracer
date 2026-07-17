# Design: Example Antora Site with Traceability Demonstration

## Overview

This design document describes the architecture and structure of the example Antora site that demonstrates the Requirements Traceability Extension.

## Architecture

### Directory Structure

```
example-site/
├── antora.yml                    # Antora configuration
├── package.json                  # Node.js dependencies
├── .gitignore
└── docs/
    └── modules/
        └── ROOT/
            ├── pages/
            │   ├── index.adoc              # Welcome page
            │   ├── requirements.adoc       # Example requirements
            │   ├── architecture.adoc      # Architecture documentation
            │   ├── matrices.adoc           # Matrix explanation
            │   └── sphinx-comparison.adoc  # Side-by-side with Sphinx Needs
            └── nav/
                └── main.yml               # Site navigation
```

### Component Relationships

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Example Site Architecture                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐ │
│  │   Content        │     │   Extension      │     │   Output       │ │
│  │   (AsciiDoc)     │────▶│   (Processor)    │────▶│   (HTML/CSV)   │ │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘ │
│         │                        │                        │          │
│         ▼                        ▼                        ▼          │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  Antora Build Process                                              │ │
│  │                                                                      │ │
│  │  1. Antora discovers content files                                │ │
│  │  2. Extension processes AsciiDoc files:                            │ │
│  │     • Parses [req], [imp], [test], [doc] block macros             │ │
│  │     • Parses inline relationship macros                            │ │
│  │     • Builds traceability graph                                     │ │
│  │  3. Extension generates artifacts:                                  │ │
│  │     • traceability/matrix-req-impl.html                            │ │
│  │     • traceability/matrix-req-test.html                            │ │
│  │     • traceability/matrix-full.html                                │ │
│  │     • traceability/coverage.html                                     │ │
│  │     • traceability/index.html                                        │ │
│  │  4. Antora renders all pages + traceability artifacts               │ │
│  │  5. User opens _site/index.html in browser                           │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────┘
```

## Content Structure

### Page: index.adoc

**Purpose**: Welcome page explaining the example site

**Content**:
- Overview of the Requirements Traceability Extension
- Purpose of this example site
- Quick start guide (how to run the example)
- Links to other sections

### Page: requirements.adoc

**Purpose**: Demonstrate requirement definition with traceability

**Content**:
```asciidoc
= Example Requirements

This page demonstrates how to define requirements using the extension.

== Simple Example

[req, id=EXAMPLE-001, title="Welcome Page"]
====
The example site must have a welcome page that introduces the extension.
====

[req, id=EXAMPLE-002, title="Requirement Definition"]
====
The example must demonstrate how to define requirements.
====

[req, id=EXAMPLE-003, title="Traceability Linking"]
====
The example must demonstrate how to create traceability links.
====

[req, id=EXAMPLE-004, title="Matrix Generation"]
====
The example must demonstrate matrix generation.
====

== Real-World Example: Extension Requirements

The following are the actual requirements from the extension's specification.

include::../../../../openspec/changes/archive/2026-07-17-requirements-traceability/specs/requirements-traceability/spec.md[]
```

**Relationships**:
- EXAMPLE-001 is a prerequisite for all other examples
- EXAMPLE-002, EXAMPLE-003, EXAMPLE-004 demonstrate core features

### Page: architecture.adoc

**Purpose**: Document the extension's architecture and link to requirements

**Content**:
```asciidoc
= Extension Architecture

This page documents the architecture of the Requirements Traceability Extension
and shows how each component satisfies the requirements.

== AsciiDoc Processor

The AsciiDoc Processor is responsible for parsing AsciiDoc content and extracting
traceability elements.

satisfies:EXAMPLE-002[]

=== Features

* Parses [req], [imp], [test], [doc] block macros
* Extracts inline relationship macros
* Validates requirement IDs
* Tracks source file and line information

== Traceability Graph

The Traceability Graph stores all traceability elements and their relationships.

satisfies:EXAMPLE-002[]
implements:EXAMPLE-003[]
implements:EXAMPLE-004[]

=== Features

* Stores requirements, implementations, tests, documents
* Manages relationships between elements
* Provides query methods for analysis
* Calculates coverage metrics

== Matrix Generator

The Matrix Generator creates traceability matrices in various formats.

implements:EXAMPLE-004[]

=== Features

* Generates Requirements-to-Implementation matrices
* Generates Requirements-to-Test matrices
* Generates Full traceability matrices
* Exports to CSV and HTML formats

== Antora Extension

The Antora Extension integrates the traceability features into the Antora build pipeline.

implements:EXAMPLE-001[]
```

### Page: matrices.adoc

**Purpose**: Explain what traceability matrices are and how to use them

**Content**:
- Explanation of matrix types (req-impl, req-test, full)
- How to read matrices
- What the status indicators mean (✓ Complete, ⚠ Partial, ✗ Missing)
- How coverage is calculated
- Link to the generated matrices (which will be created during build)

### Page: sphinx-comparison.adoc

**Purpose**: Help users migrating from Sphinx Needs understand the differences

**Content**:

| Feature | Sphinx Needs | This Extension |
|---------|--------------|-----------------|
| Requirement definition | `:need:` directive | `[req]` block macro |
| Implementation | `:req:` directive | `[imp]` block macro |
| Test definition | `:test:` directive | `[test]` block macro |
| Relationships | `:satisfies:`, `:implements:` | `satisfies:`, `implements:` |
| Matrix generation | `:needflow:` directive | Auto-generated HTML/CSV |
| Integration | Sphinx extension | Antora extension |
| Language | Python | JavaScript/TypeScript |
| Configuration | needs.conf | antora.yml + package.json |

## Traceability Links

The example site will demonstrate all relationship types:

| Relationship Type | Example | Purpose |
|------------------|---------|---------|
| satisfies | `satisfies:REQ-001[]` | One element satisfies another |
| implements | `implements:REQ-001[]` | Implementation satisfies requirement |
| tests | `tests:REQ-001[]` | Test validates requirement |
| verifies | `verifies:REQ-001[]` | Test verifies requirement |
| documents | `documents:REQ-001[]` | Documentation describes requirement |
| depends | `depends:REQ-002[]` | Dependency relationship |
| requires | `requires:REQ-002[]` | Requirement relationship |

## File Templates

### antora.yml

```yaml
site:
  title: Antora Requirements Traceability Extension
  start_page: ROOT:index.adoc
  url: https://example.com

content:
  sources:
    - url: .
      branches: HEAD
      start_path: docs

ui:
  bundle:
    url: https://gitlab.com/antora/antora-ui-default/-/jobs/artifacts/HEAD/raw/build/ui-bundle.zip?job=bundle-stable
    snapshot: true

extensions:
  - require: ../  # Local reference to the extension
```

### package.json

```json
{
  "name": "antora-req-trace-example",
  "version": "0.1.0",
  "private": true,
  "description": "Example Antora site demonstrating the Requirements Traceability Extension",
  "scripts": {
    "build": "npx antora antora.yml",
    "demo": "npm install && npm run build && open _site/index.html"
  },
  "dependencies": {
    "@asciidoctor/core": "^2.2.7"
  },
  "devDependencies": {
    "antora": "^3.0.0",
    "antora-requirements-traceability": "file:.."
  }
}
```

### docs/modules/ROOT/nav/main.yml

```yaml
nav:
  - index.adoc
  - requirements.adoc
  - architecture.adoc
  - matrices.adoc
  - sphinx-comparison.adoc
```

## Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ AsciiDoc    │────▶│ Document    │────▶│ Traceability│
│ Files       │     │ Parser      │     │ Graph       │
└─────────────┘     └─────────────┘     └─────────────┘
       │                       │                    │
       ▼                       ▼                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Parsed      │     │ Nodes Added  │     │ Relationships│
│ Content     │     │ to Graph    │     │ Added       │
└─────────────┘     └─────────────┘     └─────────────┘
       │                       │                    │
       └───────────────────────┬────────────────────┘
                           ▼
                    ┌─────────────┐
                    │ Matrix       │
                    │ Generator    │
                    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ Output      │
                    │ Files       │
                    │ (HTML/CSV)  │
                    └─────────────┘
```

## Implementation Phases

### Phase 1: Minimal Example (This Change)

- [ ] Create example-site directory structure
- [ ] Add antora.yml configuration
- [ ] Add package.json with local extension dependency
- [ ] Create index.adoc
- [ ] Create requirements.adoc with 4 example requirements
- [ ] Create architecture.adoc with 4 components linked to requirements
- [ ] Create matrices.adoc explaining matrices
- [ ] Create sphinx-comparison.adoc
- [ ] Create navigation configuration
- [ ] Verify site builds and matrices are generated

### Phase 2: Enhanced Example (Future)

- [ ] Add real spec requirements as a "Real-World Example" section
- [ ] Add test examples
- [ ] Add interactive tutorial
- [ ] Add code snippets from actual implementation
- [ ] Add more detailed architecture documentation

## Assumptions

1. Users have Node.js 14+ and npm installed
2. Users have Antora 3.x installed globally or via npx
3. The extension is available locally (via file:../ reference)
4. Users are familiar with basic Antora concepts

## Constraints

1. The example site must work with the extension in its current state
2. The example site must be self-contained (no external dependencies beyond Antora and Node.js)
3. The example site must build without errors
4. The example site must generate visible traceability matrices

## Testing Strategy

1. Manual testing: Build the site and verify matrices are generated
2. Visual inspection: Check that all relationships are correctly shown
3. Coverage verification: Ensure coverage report shows correct metrics
