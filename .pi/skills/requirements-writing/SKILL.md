---
name: requirements-writing
description: Create or review functional requirements (REQ items) in AsciiDoc/Antora Tracer format. Requirements must follow EARS style (Ubiquitous, Event-Driven, State-Driven, Unwanted Behaviour, Optional Feature) and state what the system must do, never how. Use when writing new REQ items, reviewing existing ones for solution prescription, or checking requirement quality (testable, atomic, unambiguous).
---

# Requirements Writing Skill

Help the user create or review functional requirements stored as Antora Tracer `[item]` blocks with `role=requirement`.

## When to Use

- User asks to "write a requirement" or "add a REQ item"
- User says "review requirements" or "check my requirements"
- User asks whether a requirement prescribes a solution
- User wants to verify requirements are testable and unambiguous
- User mentions "what not how", "solution prescription", or "technology in requirements"
- User asks about EARS, requirement patterns, or how to structure a SHALL statement
- User pastes a single REQ item block and asks to review or check it

## Guardrails

**Do not silently accept prescriptive or vague content.** When a requirement names a technology, internal component, algorithm, or event hook — flag it with the specific category, a pointed question, and a suggested rewrite. Do not rewrite without asking first unless the user explicitly says "fix it".

**Do not fabricate relation IDs.** If the user hasn't provided a UC ID to link to, leave the traceability relation out and note it needs adding.

**Do not add both SHALL and SHALL NOT in one block.** Positive and negative obligations are separate requirements — split them.

**Do not use EARS keywords interchangeably.** `When` is for events, `While` is for states, `Where` is for optional features, `If … then` is for unwanted behaviour. Wrong keyword = wrong meaning.

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
`regex`, `in-memory`, `BFS`, `DFS`, `depth-first`, `breadth-first`, `hash`, `sort` (as an implementation qualifier, not a behavioural constraint)

**Note**: "cache" as a verb describing observable behaviour is acceptable — "the system SHALL cache parsed file state" states what is observable. What is prescriptive is naming the *type* of cache: `LRU`, `in-memory hash map`, `write-through`. Flag the qualifier, not the word.

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

## EARS: Easy Approach to Requirements Syntax

All requirements SHALL be written in EARS style (Alistair Mavin, IEEE RE 2009).
EARS provides five patterns — choose based on whether the behaviour is always active, triggered by an event, dependent on a state, a response to an error, or conditional on an optional feature.

### Generic EARS structure

Clauses always appear in this order:

```
While <precondition(s)>, when <trigger>, the <system name> shall <system response>
```

Rules:
- **Zero or many** `While` preconditions
- **Zero or one** `When` trigger
- **Exactly one** system name
- **One or many** system responses

### Pattern 1 — Ubiquitous

Use when the behaviour always applies — no condition, no trigger.

```
The <system> shall <response>.
```

Project examples:
- `The system shall accept a traceability configuration file in YAML format.`
- `The system shall assign each item a unique identifier within its component.`
- `The CLI shall display a human-readable error message when validation fails.`

### Pattern 2 — Event-Driven

Use when the behaviour is triggered by a specific event.

```
When <trigger>, the <system> shall <response>.
```

Project examples:
- `When an item declaration is detected in a source file, the system shall register the item in the traceability graph.`
- `When the user runs the validate command, the system shall report all items with missing required attributes.`
- `When a relationship references an item ID that does not exist, the system shall emit a validation warning.`

### Pattern 3 — State-Driven

Use when the behaviour applies continuously while the system is in a given state. The state is a runtime condition, not a configuration presence (that is Pattern 5).

```
While <state>, the <system> shall <response>.
```

Project examples:
- `While the traceability graph is being populated, the system shall preserve all previously registered items.`
- `While an Antora build is in progress, the system shall not write to the content catalog after the conversion phase.`

### Pattern 4 — Unwanted Behaviour

Use when specifying the required response to an undesired situation or error condition. Use `shall NOT` to express a prohibition.

```
If <unwanted condition>, then the <system> shall <response>.
If <unwanted condition>, then the <system> shall NOT <prohibited response>.
```

Project examples:
- `If an item ID is declared more than once across all source files, then the system shall report a duplicate ID error.`
- `If the configuration file cannot be parsed, then the system shall halt the build and display the parse error with file location.`
- `If a relationship macro appears inside a backtick-enclosed code span, then the system shall NOT register it as a traceability relationship.`

### Pattern 5 — Optional Feature

Use when the behaviour applies only if an optional feature or configuration is present.

```
Where <feature is included>, the <system> shall <response>.
```

Project examples:
- `Where Neo4j export is enabled, the system shall generate CSV node and relationship files compatible with Neo4j import.`
- `Where a Kroki server URL is configured, the system shall delegate diagram rendering to that server rather than using a local renderer.`
- `Where a custom preset is specified in the configuration, the system shall apply it instead of the built-in default.`
- `Where a Kroki server URL is configured, the system shall render diagrams via that server.`

### Pattern 6 — Complex

Combine patterns when both a precondition (state) and a trigger (event) apply. Include `If-Then` for error handling in complex scenarios.

```
While <precondition>, when <trigger>, the <system> shall <response>.
```

Project example:
- `While processing a multi-module Antora component, when a partial file contains item declarations, the system shall register those items in the graph alongside items from page files.`

### Choosing the right pattern

| Question | Pattern |
|---|---|
| Always true, no conditions? | Ubiquitous |
| Triggered by a user action or system event? | Event-Driven |
| Applies continuously during a state? | State-Driven |
| Specifies response to an error or invalid input? | Unwanted Behaviour |
| Only when an optional feature/config is present? | Optional Feature |
| Both a state and a trigger? | Complex |

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

traceability:outgoing[]
traceability:incoming[]
--
```

Traceability links from requirements back to use cases depend on the relation type configured in `traceability.yml`. In the built-in `requirements-engineering` preset, the link runs from use case to requirement (`leads_to:REQ-NNN[]` in the UC block). Add a reverse relation only if your config defines one.

### SHALL Statement Guidelines

- **Choose the right EARS pattern first.** The pattern determines the sentence structure — ubiquitous, event-driven (`When`), state-driven (`While`), unwanted behaviour (`If … then`), or optional feature (`Where`). See the EARS section above.
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

**EARS pattern**
- [ ] Uses a recognised EARS pattern (Ubiquitous / Event-Driven / State-Driven / Unwanted Behaviour / Optional Feature / Complex)
- [ ] `When` used for event triggers, not `if` (reserve `If … then` for unwanted/error behaviour)
- [ ] `While` used for continuous state conditions, not `when`
- [ ] `Where` used for optional feature scope, not `if` or `when`
- [ ] Clauses in correct order: `While … When … the system shall …`
- [ ] No trigger present when behaviour is always active (ubiquitous) — remove the `When` clause

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
- [ ] All aspects of the stated behaviour are covered — nothing implied or left to interpretation
- [ ] For each error or edge case, a corresponding Unwanted Behaviour (`If … then`) requirement exists or is noted as missing
- [ ] Scope boundaries are explicit: does "all files" mean all source files, all page files, all component versions?

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

## After Changing Requirements

When a requirement is rewritten, split, removed, or has its ID changed, sweep these layers before committing. Each layer can harbour stale text that now contradicts the updated requirement.

| Layer | What to check |
|---|---|
| **Spec file** | The source spec in `openspec/specs/*/spec.md` — requirement statement and scenario bodies match the rewrite |
| **Example site index** | `examples/tracer/modules/requirements/pages/index.adoc` — same item block updated or removed |
| **Architecture doc** | `examples/tracer/modules/ROOT/pages/explanation/architecture.adoc` — any ARC item body that describes the changed behaviour; `addresses:REQ-NNN[]` links pointing to removed/split IDs |
| **Processing pipeline doc** | `examples/tracer/modules/ROOT/pages/explanation/processing-pipeline.adoc` — prose descriptions of passes or lifecycle that mention the changed behaviour |
| **Test file comments** | `test/*.test.ts` — `it("...")` descriptions and inline comments that describe old behaviour; assertions that verify the old (now wrong) outcome |
| **Test-plan doc** | `examples/tracer/modules/ROOT/pages/self-traceability/test-plan.adoc` — TST item bodies describing what the test covers; `verifies:REQ-NNN[]` links for new/removed IDs |

### Checklist for splits (REQ-N → REQ-N + REQ-X + REQ-Y)

- [ ] Old spec body replaced with first new requirement; new IDs appended in same spec file
- [ ] Example site index: old block rewritten as first ID; new blocks inserted immediately after
- [ ] Architecture doc: ARC item `addresses:` list updated to include all new IDs
- [ ] Architecture doc: ARC item body updated if it described the compound behaviour
- [ ] Test file: any `it()` whose description mentions the old compound behaviour updated
- [ ] Test-plan TST item: body mentions the expanded coverage; `verifies:` list includes new IDs

### Checklist for removals (REQ-N deleted)

- [ ] Block removed from spec file (or spec notes canonical ID elsewhere)
- [ ] Block removed from example site index
- [ ] `addresses:REQ-N[]` removed from all ARC items in architecture doc
- [ ] No `verifies:REQ-N[]` remaining in test-plan
- [ ] No `it()` description in test files references the removed requirement by number

### Grep to find stale references

```bash
# Find all references to a specific requirement ID across docs and tests
grep -rn 'REQ-NNN' examples/ test/ openspec/

# Find stale behaviour descriptions (adapt the phrase to what changed)
grep -rn 'Pass 2 skip\|skip.*partial\|partial.*only' examples/ test/
```

## Related Commands

```bash
antora-tracer next-id --prefix REQ -i docs/
antora-tracer validate -i docs/
antora-tracer matrix -i docs/
```
