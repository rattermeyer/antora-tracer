---
name: requirements-writing
description: Create or review functional requirements (requirement items) in AsciiDoc/Antora Tracer format. Requirements must follow EARS style (Ubiquitous, Event-Driven, State-Driven, Unwanted Behaviour, Optional Feature) and state what the system must do, never how. Use when writing new requirement items, reviewing existing ones for solution prescription, or checking requirement quality (testable, atomic, unambiguous).
license: MIT
---

# Requirements Writing Skill

Help the user create or review functional requirements stored as Antora Tracer `[item]` blocks.

This skill is project-agnostic: the EARS patterns, the "what not how" principle, and the quality checklist are universal. Only the role names, relation types, and ID prefix vary per project — those are discovered from the project's own `traceability.yml` (see below).

## When to Use

- User asks to "write a requirement" or "add a requirement item"
- User says "review requirements" or "check my requirements"
- User asks whether a requirement prescribes a solution
- User wants to verify requirements are testable and unambiguous
- User mentions "what not how", "solution prescription", or "technology in requirements"
- User asks about EARS, requirement patterns, or how to structure a SHALL statement
- User pastes a single requirement item block and asks to review or check it

## Discover the Project's Traceability Model

Before writing or reviewing, learn the project's model. The single source of truth is the project's traceability config (`traceability.yml` or `traceability.yaml`) — the same file every antora-tracer project uses. If it extends a preset, the preset fills in any values the file omits.

```bash
# Find the config (it may extend a built-in preset)
ls traceability.yml traceability.yaml 2>/dev/null

# Learn the ID prefixes already in use
grep -rhoE '\[#[A-Za-z]+-[0-9]+' --include='*.adoc' . | sort -u | head -20

# Learn the role vocabulary already in use
grep -rhoE 'role=[a-z_]+' --include='*.adoc' . | sort -u

# Learn the relation types already in use (before the first colon)
grep -rhoE '[a-z_]+:[A-Z]+-[0-9]+\[\]' --include='*.adoc' . | sort -u | head -20
```

From the config (`roles:`, `relations:`, `inverseLabels:`, `extends:`) and the grep results, resolve these placeholders used throughout this skill:

| Placeholder | Meaning | Example (antora-tracer's own site) |
|---|---|---|
| `{{ID_PREFIX}}` | Requirement ID prefix | `REQ` |
| `{{ROLE}}` | The requirement role name | `requirement` |
| `{{UC_ROLE}}` | The use-case role name (if the project uses use cases) | `use_case` |
| `{{UC_TO_REQ}}` | Relation from use case to requirement (from `relations:`) | `leads_to` |
| `{{REQ_TO_UC}}` | Inverse relation from requirement to use case (from `relations:`), if any | `is_derived_from` |
| `{{PRESET}}` | Active preset (`extends:` or playbook config) | `requirements-engineering` |

If no `traceability.yml` exists, the project runs on a built-in preset — note the preset name and use its role/relation vocabulary. Do not invent role or relation names; take them from the config.

## Guardrails

**Do not silently accept prescriptive or vague content.** When a requirement names a technology, internal component, algorithm, or event hook — flag it with the specific category, a pointed question, and a suggested rewrite. Do not rewrite without asking first unless the user explicitly says "fix it".

**Do not fabricate relation IDs or target IDs.** If the user hasn't provided an ID to link to, leave the traceability relation out and note it needs adding. Take relation type names from the project's `relations:` config, not from memory.

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
| "The `DocumentParser` SHALL skip..." | "The system SHALL NOT register..." |
| "During the `contentClassified` event, the system SHALL..." | "The system SHALL compute X exactly once per page file" |
| "The system SHALL define a `PreparedFile` type containing..." | "The system SHALL cache the parsed state of each source file..." |
| "The `LinkResolver` SHALL generate links..." | "The system SHALL generate links..." |
| "compatible with the asciidoctor-pdf backend" | "compatible with both HTML and PDF rendering backends" |

The concrete class and event names above are antora-tracer internals used as illustration. When reviewing a different project, substitute its actual component names.

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
Class names, method names, internal constants, and internal file paths. In antora-tracer these are names like `DocumentParser`, `TraceabilityGraph`, `MatrixGenerator`, `LinkResolver`, `PreparedFile`, `toDot`, `INVERSE_MAP`, `src/templates/partials/`. In your project, they are your own class, module, constant, and path names.

**Fix**: Replace the component name with "the system" or describe the behaviour it provides.

### Internal event names or lifecycle hooks
Framework-internal events used as functional triggers (e.g. antora-tracer's `contentClassified`, `sitePublished`).

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

### Pattern 2 — Event-Driven

Use when the behaviour is triggered by a specific event.

```
When <trigger>, the <system> shall <response>.
```

### Pattern 3 — State-Driven

Use when the behaviour applies continuously while the system is in a given state. The state is a runtime condition, not a configuration presence (that is Pattern 5).

```
While <state>, the <system> shall <response>.
```

### Pattern 4 — Unwanted Behaviour

Use when specifying the required response to an undesired situation or error condition. Use `shall NOT` to express a prohibition.

```
If <unwanted condition>, then the <system> shall <response>.
If <unwanted condition>, then the <system> shall NOT <prohibited response>.
```

### Pattern 5 — Optional Feature

Use when the behaviour applies only if an optional feature or configuration is present.

```
Where <feature is included>, the <system> shall <response>.
```

### Pattern 6 — Complex

Combine patterns when both a precondition (state) and a trigger (event) apply. Include `If-Then` for error handling in complex scenarios.

```
While <precondition>, when <trigger>, the <system> shall <response>.
```

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
antora-tracer next-id --prefix {{ID_PREFIX}} -i <docs-dir>
```

### Step 2: Write the Item Block

```asciidoc
[#{{ID_PREFIX}}-NNN, item, role={{ROLE}}, title="<short title>"]
--
The system SHALL <observable behaviour or outcome>.

<additional constraints, scope, or boundary conditions if needed.>

traceability:outgoing[]
traceability:incoming[]
--
```

Traceability links from requirements back to use cases depend on the relation types configured in `traceability.yml`. In the `{{PRESET}}` preset the link runs from use case to requirement (`{{UC_TO_REQ}}:{{ID_PREFIX}}-NNN[]` in the use-case block). Add a reverse relation only if your config defines one.

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
- [ ] No internal component or class name
- [ ] No internal method, constant, or file path
- [ ] No internal event or lifecycle hook name
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

- Use cases (`{{UC_ROLE}}`) carry `{{UC_TO_REQ}}:{{ID_PREFIX}}-XXX[]` relationships to the requirements they derive.
- Requirements link back only if the project's `relations:` config defines an inverse (`{{REQ_TO_UC}}`). If it does not, the relationship is one-directional from use case to requirement — do not invent a reverse link.
- If a requirement cannot be traced to any use case, question whether it is needed.

## After Changing Requirements

When a requirement is rewritten, split, removed, or renumbered, the change ripples into every artefact that references it. Sweep these layers in the same commit:

- The requirement's own source/spec document (statement + scenarios)
- Design or architecture records that `addresses` the ID
- Test files whose descriptions or comments cite the ID or the old behaviour
- Test-plan / coverage documents that `verifies` the ID
- Generated matrices or dashboards (regenerate if present)

To find every reference to a changed ID:

```bash
grep -rn '{{ID_PREFIX}}-NNN' .
```

Project-specific layouts need a project-specific sweep. Identify where requirements, design, tests, and coverage documents live in your project and update them together.

## Related Commands

```bash
antora-tracer next-id --prefix {{ID_PREFIX}} -i <docs-dir>
antora-tracer validate -i <docs-dir>
antora-tracer matrix -i <docs-dir>
```
