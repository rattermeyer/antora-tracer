# Antora Requirements Traceability Extension

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg) ![ESM](https://img.shields.io/badge/Module-ESM-red.svg)

A role-based traceability extension for Antora. Define traceability items with a single `[item]` macro, configure your own roles and relations, and let Antora generate matrices, coverage reports, and Neo4j exports — all driven by your domain model, not ours.

I am still experimenting with some aspects, so use at your own risk until it reaches 1.0.
But I am very much interested in your feedback and ideas.

## Why Traceability for AsciiDoc?

In regulated environments — medical devices (IEC 62304), automotive (ISO 26262), aerospace
(DO-178C) — traceability is not optional. It's a compliance requirement. Auditors expect a
complete chain from requirements through design and implementation to verification, with
every link documented and verifiable. Gaps mean compliance findings, delayed certification,
or worse.

AsciiDoc is a mature markup language for structured technical documentation. Paired with
Antora, it produces version-controlled, multi-component doc sites with rich cross-references
and native PDF output. But neither AsciiDoc nor Antora provides a built-in way to formally
define, validate, or audit traceability relationships between the requirements, designs,
and tests embedded in the documentation.

The reStructuredText ecosystem has https://sphinx-needs.readthedocs.io/[Sphinx-Needs] for
this purpose. AsciiDoc had no equivalent.

*antora-tracer* fills that gap: a single `[item]` macro with configurable roles, inline
relationships, matrix generation, coverage tracking, graph visualization, and Neo4j export.
All native to the AsciiDoc/Antora pipeline. All driven by your domain model — not ours —
so it fits whatever regulatory framework you work under.

---

## How It Works

```
                             ┌────────────────────────┐
                             │   traceability.yml     │
                             │  (your domain model)   │
  .adoc files                │                        │          Generated artifacts
 ┌───────────────────┐       │  roles:                │       ┌───────────────────────────┐
 │ [#REQ-001, item,  │       │  relations:            │       │  traceability/            │
 │  role=requirement]│──────▶│  matrices:             │──────▶│    matrix-*.html          │
 │ --                │       └───────────┬────────────┘       │    matrix-*.csv           │
 │ Req content       │                   │                    │    coverage.html          │
 │ --                │                   │                    │    neo4j/nodes.csv        │
 │                   │       ┌───────────▼───────────┐        │    neo4j/relationships.csv│
 │ [#IMP-001, item,  │       │    Antora Extension   │        └───────────────────────────┘
 │  role=impl]       │       │                       │
 │ --                │       │  parse → validate     │
 │ impl:REQ-001[]    │──────▶│  → graph → generate   │
 │ --                │       │                       │
 └───────────────────┘       └───────────────────────┘
```

Your AsciiDoc files use the `[item]` macro. The Antora extension picks them up during `contentClassified`, processes them against your traceability configuration (roles, relations, matrices), and generates matrices, coverage reports, and optional Neo4j CSV exports into your site’s `traceability/` directory.

---

## Quick Start

Already have an Antora site? Skip to step 2.

1. Install

   ```bash
   npm install antora-tracer --save-dev
   ```
2. Add to `antora.yml`

   ```yaml
   antora:
     extensions:
       - require: antora-tracer/antora-extension
         config:
           preset: requirements-engineering
   ```
3. Write `[item]` macros in your `.adoc` files

   ```asciidoc
   [#REQ-001, item, role=requirement]
   ====
   User Authentication

   The system shall require authentication for all protected endpoints.
   ====

   [#IMP-001, item, role=implementation]
   ====
   Auth Service

   JWT-based authentication with token refresh.

   satisfies:REQ-001[]
   ====

   [#TEST-001, item, role=test]
   ====
   Authentication Tests

   Unit and integration tests for the auth service.

   verifies:REQ-001[]
   tests:IMP-001[]
   ====
   ```
4. Build

   ```bash
   npx antora antora-playbook.yml
   ```

Open `_site/traceability/index.html` — you’ll find matrices and a coverage report.

---

## Complete Example

Here’s a complete traceability example showing requirements, design, implementation, and tests:

```asciidoc
= My Project Documentation

== Requirements

[#REQ-001, item, role=requirement, title="User Authentication"]
```
The system SHALL authenticate users via secure credentials.

Authentication MUST support:
- Username/password
- Multi-factor authentication
- Session management with timeout
```

[#REQ-002, item, role=requirement, title="Password Recovery"]
```
The system SHALL allow users to recover forgotten passwords.

Password recovery MUST:
- Send secure email with time-limited link
- Require current password for email changes
- Log all recovery attempts
```

== Design

[#DES-001, item, role=design, title="Authentication Architecture"]
```
JWT-based authentication with Redis session store.

addresses:REQ-001[]
```

== Implementation

[#IMP-001, item, role=implementation, title="AuthService Class"]
```
TypeScript implementation of the authentication service.

implements:DES-001[]
```

[#IMP-002, item, role=implementation, title="PasswordResetService"]
```
Handles password recovery workflow.

implements:DES-001[]
addresses:REQ-002[]
```

== Tests

[#TEST-001, item, role=test, title="Authentication Unit Tests"]
```
Jest unit tests for AuthService.

verifies:REQ-001[]
tests:IMP-001[]
```

[#TEST-002, item, role=test, title="Password Recovery Integration Tests"]
```
Integration tests for password recovery flow.

verifies:REQ-002[]
tests:IMP-002[]
```
```

This generates a traceability matrix showing which requirements are addressed by designs, implemented by code, and tested.

---

## Features

| Feature | Category | Description |
| --- | --- | --- |
| Single Macro | Syntax | One `[item]` macro for all traceable artifacts (requirements, designs, implementations, tests, etc.) |
| Role-Based | Architecture | Define your own roles instead of being limited to predefined types |
| Configurable | Relations | Specify which relationship types are valid between roles |
| Matrix Generation | Output | Generate HTML, CSV, or JSON traceability matrices |
| Coverage Reports | Output | Visual coverage reports showing traceability completeness |
| Neo4j Export | Integration | Export to Neo4j CSV or Cypher format for graph analysis |
| Preset System | Configuration | Built-in presets for common domains (requirements engineering, agile, medical IEC 62304) |
| Antora Integration | Integration | Seamless integration with Antora documentation pipeline |
| CLI Tool | Tooling | Command-line interface for processing, validation, and export |
| Validation | Quality | Validate traceability graph for orphaned items, missing coverage, circular references |
| Path Finding | Analysis | Find paths between items in the traceability graph |
| Impact Analysis | Analysis | Determine all items affected by a change (forward and reverse) |

---

## The `[item]` Macro

Everything starts with a single macro:

```asciidoc
[#TYPE-XXX, item, role=<role>, title="Optional Title", status="draft"]
====
Item description and content.

<relation-type>:TARGET-ID[]
====
```

### Attributes

| Attribute | Required | Description |
| --- | --- | --- |
| `id` | Yes | Unique identifier across all items |
| `role` | Yes | Must match a role defined in your configuration |
| `title` | No | Display title (defaults to the id) |
| `status` | No | Free-form status: `draft`, `reviewed`, `approved`, etc. |
| `priority` | No | Free-form priority: `high`, `medium`, `low` |

### Inline Relationships

Inline relationships use the pattern `<type>:<TARGET-ID>[]` anywhere inside the block:

```asciidoc
satisfies:REQ-001[]
implements:DES-001[]
verifies:REQ-001[]
tests:IMP-001[]
```

The valid relation types and which roles they’re allowed between are defined in your traceability configuration.

---

## Configuration

### Using a Preset

The simplest path. Pick a preset and go:

```yaml
antora:
  extensions:
    - require: antora-tracer/antora-extension
      config:
        preset: requirements-engineering
```

### Custom Configuration

Point to a traceability YAML file for full control:

```yaml
antora:
  extensions:
    - require: antora-tracer/antora-extension
      config:
        configPath: ./config/traceability.yml
```

### Playbook Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `enabled` | boolean | `true` | Enable/disable the extension |
| `preset` | string | `requirements-engineering` | Built-in preset name |
| `configPath` | string | — | Path to a custom traceability YAML file |
| `outputDir` | string | `traceability` | Output directory under site root |
| `generateMatrices` | boolean | `true` | Generate traceability matrices |
| `matrixFormats` | string[] | `['html','csv']` | Output formats |
| `includeInNavigation` | boolean | `true` | Add traceability pages to site navigation |

### Traceability YAML Structure

```yaml
traceability:
  roles:
    - requirement
    - design
    - implementation
    - test

  relations:
    requirement:
      design: [addresses]
    design:
      requirement: [implements]
    implementation:
      requirement: [satisfies]
      design: [implements]
    test:
      requirement: [verifies]
      implementation: [tests]

  matrices:
    - name: requirements-traceability
      rows: requirement
      columns: [design, implementation, test]
      coverageRelations:
        design: [addresses, implements]
        implementation: [satisfies, implements]
        test: [verifies, tests]
```

Each relation is directional: `source → target` with an allowed set of types. The extension validates every relationship at processing time — if you write `verifies:REQ-001[]` from a `document` but your config only allows `impl → requirement` with `[satisfies]`, you’ll get a clear error message.

---

## CLI

The extension also works standalone outside of Antora:

```bash
# Process AsciiDoc files and populate the graph
npx antora-tracer process -i docs/ --preset requirements-engineering

# Generate traceability matrices
npx antora-tracer matrix -t requirements-traceability -f html -o matrix.html

# Validate traceability completeness
npx antora-tracer validate
```

Additional commands: `export neo4j` (CSV/Cypher), `stats` (role statistics), `preset` (list/show/init).

---

## Presets

Four built-in presets ship with the extension:

| Preset | Roles | Best For |
| --- | --- | --- |
| `requirements-engineering` | requirement, design, implementation, test, document | Systems & software engineering |
| `agile` | user_story, task, test, epic | Agile/Scrum teams |
| `medical-iec62304` | requirement, design, unit, integration, risk_control | Medical device software (IEC 62304) |
| `minimal` | requirement, test | Getting started, simple projects |

List available presets: `npx antora-tracer preset list`

Initialize a config from one: `npx antora-tracer preset init --name medical-iec62304 -o ./config/`

---

## Generated Artifacts

After a build, you’ll find in `<site-output>/traceability/`:

| File | Description |
| --- | --- |
| `index.html` | Traceability index page |
| `matrix-<name>.html` | One HTML matrix per configured matrix |
| `matrix-<name>.csv` | One CSV matrix per configured matrix |
| `coverage.html` | Coverage report with status badges and per-role breakdown |
| `neo4j/nodes.csv` | Neo4j CSV node export |
| `neo4j/relationships.csv` | Neo4j CSV relationship export |

**Coverage** is calculated per-matrix based on `coverageRelations` in your config. Each row item gets a status badge: ✓ Complete (100%), ◐ Partial, or ✗ Missing (0%).

---

## Documentation

* [User Guide](https://antora-tracer.conemso.de/docs/tracer/latest/user-guide.html) — Full reference: macros, relations, CLI, presets
* [Developer Guide](https://antora-tracer.conemso.de/docs/tracer/latest/developer-guide.html) — API, architecture, contributing, testing

---

## Development

This project is developed using **spec-driven development** with [OpenSpec](https://openspec.dev) — an experiment in using formal specifications as the primary design artifact with minimal manual coding outside the spec workflow.

Every feature, fix, and refactor starts as a proposal with specs, design, and tasks in the `openspec/changes/` directory. The archive at `openspec/changes/archive/` preserves the complete history of every change.

---

## Contributing

Contributions are welcome. See the [Developer Guide](https://antora-tracer.conemso.de/docs/tracer/latest/developer-guide.html) for setup, code style, and testing.

```bash
git clone <repo-url>
npm install
npm test        # 194 tests
```

---

## License

MIT — see [LICENSE](LICENSE).
