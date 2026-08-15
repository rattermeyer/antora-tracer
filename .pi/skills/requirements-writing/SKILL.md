---
name: requirements-writing
description: Create or review functional requirements (REQ items) in AsciiDoc/Antora Tracer format. Enforces the core principle — state what the system must do, never how it must do it. Use when writing new REQ items, reviewing existing ones for solution prescription, or checking requirement quality (testable, atomic, unambiguous).
---

# Requirements Writing Skill

Help the user create or review functional requirements stored as Antora Tracer `[item]` blocks with `role=requirement`.

## When to Use

- User asks to "write a requirement" or "add a REQ item"
- User says "review requirements" or "check my requirements"
- User asks whether a requirement prescribes a solution
- User wants to verify requirements are testable and unambiguous
- User mentions "what not how", "solution prescription", or "technology in requirements"

## Core Principle: What, Not How

A functional requirement states **what the system must do** — the observable behaviour, outcome, or constraint — not **how it must do it**.

The "how" belongs in design documents, ADRs, or architecture records.

| Wrong — prescribes solution | Right — states behaviour |
|---|---|
| "The system SHALL use regex to parse items" | "The system SHALL detect item declarations in AsciiDoc source files" |
| "The system SHALL build an in-memory graph" | "The system SHALL answer structural questions about items and their relationships" |
| "The system SHALL render a GraphViz diagram" | "The system SHALL render a relationship diagram for the enclosing item" |
| "The system SHALL use Mustache partials" | "The template SHALL be split into reusable partial fragments" |
| "The DocumentParser SHALL skip..." | "The system SHALL NOT register..." |
| "During the `contentClassified` event, the system SHALL..." | "The system SHALL compute X exactly once per page file" |
| "The system SHALL define a `PreparedFile` type containing..." | "The system SHALL cache the parsed state of each source file..." |
| "The LinkResolver SHALL generate links..." | "The system SHALL generate links..." |
| "compatible with the asciidoctor-pdf backend" | "compatible with both HTML and PDF rendering backends" |

## Solution Prescription Categories

When reviewing, check for these specific patterns:

### Technology names
Named tools, libraries, frameworks, or external services that are an implementation choice:
`Mustache`, `GraphViz`, `Vega-Lite`, `Tailwind CSS`, `Roboto`, `PlantUML`, `asciidoctor-pdf`, `pandoc` (when the feature is not the tool itself)

**Exception**: When the integration or export IS the feature — e.g., "Neo4j export", "Antora extension", "AsciiDoc parsing" — naming the technology is acceptable because it defines the scope of the requirement.

### Algorithm or data-structure names
`regex`, `in-memory`, `BFS`, `DFS`, `depth-first`, `breadth-first`, `cache`, `hash`, `sort` (as an implementation qualifier, not a behavioural constraint)

**Note**: "shortest path" is a behavioural constraint if shortest is genuinely required — acceptable.

### Internal component, class, or method names
Class names (`DocumentParser`, `TraceabilityGraph`, `MatrixGenerator`, `LinkResolver`, `PreparedFile`), method names (`toDot`, `toVegaLite`, `prepareFile`, `generateRequirementsMatrix`), internal constants (`INVERSE_MAP`), internal file paths (`src/templates/partials/`, `lib/src/antora-pdf-extension.cjs`)

**Fix**: Replace the component name with "the system" or describe the behaviour it provides.

### Internal event names or lifecycle hooks
Framework-internal events (`contentClassified`, `sitePublished`) used as functional triggers.

**Fix**: Describe the observable trigger ("once per page file", "before document conversion") rather than the framework hook.

### Hex codes, font names, specific UI values
Colour hex codes (`#108193`), named fonts (`Roboto`, `Inter`), CDN URLs — these are design decisions.

**Exception**: Brand requirements may legitimately reference a design system name at the brand level, but not hex codes or specific font families.

## Creating a Requirement

### Step 1: Get the Next ID

```bash
antora-tracer next-id --prefix REQ -i docs/
```

### Step 2: Write the Item Block

```asciidoc
[#REQ-NNN, item, role=requirement, title="<short title>"]
--
The system SHALL <observable behaviour or outcome>.

<additional constraints, scope, or boundary conditions if needed.>

is_addressed_by:UC-XXX[]

traceability:outgoing[]
traceability:incoming[]
--
```

### SHALL Statement Guidelines

- **One SHALL per requirement.** Multiple SHALLs in one block usually means two requirements — split them.
- **Subject is "the system" or a user-facing feature name**, never an internal component name.
- **Verb is observable**: "provide", "display", "generate", "register", "validate", "notify" — not "define a type", "build a graph", "use a library".
- **Object is a user-visible outcome or data artefact**, not an internal data structure.
- **Avoid "by"**: "The system SHALL generate links by using LinkResolver" — the "by" clause is the how. Drop it.
- **Avoid technology qualifiers**: "The system SHALL render a **GraphViz** diagram" → "The system SHALL render a diagram".

### Title Format

Short, noun-phrase or outcome-phrase. Used in matrices and dashboards.

- Good: "Relationship diagram for item", "Coverage chart", "Shortest path between items"
- Bad: "GraphViz rendering", "Use Mustache partials", "LinkResolver indexify support"

## Reviewing a Requirement

When asked to review, check every item against this list. Do NOT silently accept vague or prescriptive content — flag it with a specific question and a suggested rewrite.

### Quality Checklist

**Solution prescription**
- [ ] No technology name (tool, library, framework) unless the technology IS the feature
- [ ] No algorithm name (`regex`, `in-memory`, `BFS`, `DFS`, `sort`)
- [ ] No internal component or class name (`DocumentParser`, `TraceabilityGraph`, etc.)
- [ ] No internal method, constant, or file path
- [ ] No internal event or lifecycle hook name (`contentClassified`, `sitePublished`)
- [ ] No UI implementation detail (hex code, font name, CDN URL)

**Testability**
- [ ] A tester can verify whether the system passes or fails without reading the source code
- [ ] No vague terms: "user-friendly", "fast", "appropriate", "reasonable", "simple"
- [ ] Quantified where measurable: not "low latency" but "responds within 200ms"

**Atomicity**
- [ ] One SHALL, one observable behaviour — not two requirements joined by "and"
- [ ] Exception: "and" connecting aspects of the same observable outcome is acceptable ("displays X and Y in the same view")

**Unambiguity**
- [ ] Only one interpretation possible
- [ ] Scope is clear: "per page file", "for the enclosing item", "across all component versions"

**Completeness**
- [ ] Boundary conditions stated: what happens when input is empty, missing, or invalid
- [ ] Exception behaviour documented

### If a Requirement Is Prescriptive

1. Identify the prescription (which category above).
2. Ask: "What is the observable outcome a user or tester would see?"
3. Rewrite the SHALL to state that outcome, dropping the technology/component reference.
4. Move the technology detail to a design document or ADR if it represents a deliberate decision.

## Relationship to Use Cases

Functional requirements refine use cases — they answer "what exactly must the system do" for each step of a use case flow.

- Use cases carry `leads_to:REQ-XXX[]` relationships to the requirements they derive.
- Requirements use `is_addressed_by:UC-XXX[]` (or the configured inverse relation) to link back.
- If a requirement cannot be traced to any use case, question whether it is needed.

## Related Commands

```bash
antora-tracer next-id --prefix REQ -i docs/
antora-tracer validate -i docs/
antora-tracer matrix -i docs/
```
