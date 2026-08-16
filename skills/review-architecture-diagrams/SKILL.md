---
name: review-architecture-diagrams
description: Review architecture diagrams against better-architecture-diagrams principles. Use when the user asks to review, audit, or improve diagrams — phrases like "review my diagrams", "check my PlantUML", "is this diagram clear", "audit architecture diagrams", "check diagram quality", "improve diagram readability", or mentions "better architecture diagrams" / InnoQ diagram review. Works with PlantUML (.puml, .plantuml), Mermaid (.mmd), D2 (.d2), and Graphviz DOT (.dot, .gv).
license: MIT
---

# Review Architecture Diagrams

Review all architecture diagrams in the project against the 11 principles from
[Better Architecture Diagrams](https://www.innoq.com/de/blog/2022/09/better-architecture-diagrams/)
by Gernot Starke (INNOQ). First audit all diagrams, report findings, then offer
to apply fixes.

## Workflow

### Phase 1 — Discover

Find all diagrams in the project:

```bash
find . -type f \( -name "*.puml" -o -name "*.plantuml" -o -name "*.mmd" -o -name "*.mermaid" -o -name "*.d2" -o -name "*.dot" -o -name "*.gv" \) ! -path "*/.devbox/*" ! -path "*/node_modules/*" ! -path "*/.git/*"
```

Also find where they're included (AsciiDoc `include::`, markdown image refs, etc.) to understand context — for example, a `.puml` file included from an architecture page via `include::example$name.puml[]`.

For each diagram:
1. Read the diagram file completely.
2. Read the surrounding documentation section (the paragraph before the `include::` and its section heading) to understand the diagram's stated purpose before evaluating it against the checklist.

### Phase 2 — Audit

Evaluate each diagram against the 11-point checklist below. For each diagram, classify findings as:

| Severity | Meaning |
|----------|---------|
| 🔴 High | Breaks a core principle — diagram is confusing, misleading, or unmaintainable |
| 🟡 Medium | Degrades readability but doesn't break understanding |
| 🟢 Low | Minor polish, would improve but not urgent |

Skip trivial internal diagrams (e.g., spec fixtures, test data). Only review
diagrams that appear in documentation.

### Phase 3 — Report

Present findings as a compact table, one row per diagram:

```
| Diagram | Elements | Tip violations | Severity | Fix |
```

Keep it to one line per finding. Group by diagram, highest severity first.

After the table, ask the user which fixes to apply. Offer to fix any
combination — the user picks, you implement one at a time.

### Phase 4 — Apply

When the user picks a fix, edit the diagram source directly. Keep changes
minimal — the article says "sparse details" and "single purpose" are the
highest-leverage principles. When splitting a diagram, create a new file
alongside the original and update the documentation include to reference both.

After each fix, show the before/after element + relation counts. Then re-run the violated checklist items against the updated diagram and confirm each violation is resolved. If a fix introduces a new violation (e.g., splitting a diagram removes line crossings but now each half lacks a legend), flag it.

## The 11-Point Checklist

Apply every point to every diagram. Skip only when a point is genuinely
not applicable (e.g., line crossings in a single-element diagram).

### 1. Single purpose
Does the diagram convey exactly one kind of information? If it needs the word
"and" to describe its purpose, it should be split.

- ❌ "Component dependencies AND deployment topology AND data flow"
- ✅ "Component dependencies at build time"

### 2. Legend
Are all symbol types explained? Boxes, arrows, line styles, colors — if the
viewer has to guess what an arrow means, add a legend or use a consistent
notation (UML, C4, etc.) where arrow types are predefined.

### 3. Established notation
Is the diagram using a recognized notation (UML, C4, SysML, etc.)? If not, is
the custom notation at least explained? Free-form boxes-and-lines needs a legend
(tip 2). Standard notations carry their own semantics — but mixed use is a violation:
if a diagram uses UML component boxes but non-UML arrow semantics, it needs a legend.

Heuristic: if an arrow could mean "calls", "depends on", "sends data to", or "is
contained in" and the reader can't tell which — add a legend or switch to a
notation where the arrow type carries that meaning.

### 4. Element name explanations
Are the names in the diagram explained somewhere accessible (table in the same
page, tooltip, caption)? A box labeled "Dispatcher" without explanation forces
the reader to guess or hunt.

### 5. Sparse details
Could any visual detail be explained better in prose? Cut it. This is the
highest-leverage principle:

- Method signatures → reference docs
- Internal substeps → text or a separate activity diagram
- Implementation details that change often → text (easier to update)
- If a diagram exceeds the element limit (tip 6), cutting detail is the first fix

### 6. Element count
Count boxes (nodes) and lines (edges) separately:

| Diagram type | Max nodes | Max edges |
|-------------|-----------|-----------|
| Structural (component, class, deployment) | ~12 | ~15 |
| Dynamic (sequence, activity, flow) | ~20 | ~25 |

If over limit: split, cluster/abstract, or move detail to text.

### 7. Visual style consistency
Check: colors (same meaning across diagram?), line styles (dashed vs solid
consistent?), arrow heads (same type for same semantics?), font sizes (uniform?),
icon usage (sparse and meaningful?). If a color means "database" in one place and
"external system" in another, that's a violation.

### 8. Central placement
Is the most important element visually central? Context diagrams: system in
center, neighbors around it. Component diagrams: core component central, less
important ones at edges. State diagrams: main/stable state central.

### 9. Readable labels
Would labels be readable when the diagram is rendered at its target size
(A4 landscape, web column, slide)? Check: font size, contrast, line length,
abbreviation overuse.

### 10. Layout basics
Check: scale (do important things look bigger?), whitespace (breathing room
between elements?), alignment (elements on a grid or snapped?), proximity
(related things near each other?), balance (not all elements crammed in one
corner?), typography (single font family, no Comic Sans).

### 11. Line crossings
Are there line crossings? If unavoidable, are crossing points clearly indicated
(e.g., PlantUML renders a small arc at crossing points — that's acceptable)?
A diagram with tangled lines is a diagram that needs layout work.

## What NOT to review

- Spec fixtures (test data diagrams)
- Diagrams in `.devbox/`, `node_modules/`, `.git/`
- Diagrams not referenced by any documentation page
- Diagrams that are obviously work-in-progress sketches

## Diagram format notes

- **PlantUML** (`.puml`, `.plantuml`): Use `skinparam` for consistent style.
  `left to right direction` often reduces crossings in component diagrams.
- **Mermaid** (`.mmd`, `.mermaid`): `%%{init: ...}%%` for theming.
- **D2** (`.d2`): `direction: right` for left-to-right, `classes` for consistent styling.
- **Graphviz DOT** (`.dot`, `.gv`): `rankdir=LR` for left-to-right, `splines=ortho` to reduce crossings.

## Example report format

```
## Diagram Audit — 5 diagrams found in docs

### 🔴 High

| Diagram | Elements | Tips violated | Suggested fix |
|---------|----------|---------------|---------------|
| sequence-diagram.puml | 8n, 30e | #1 multi-purpose, #5 too detailed, #6 over limit | Split into init + per-pass detail |

### 🟡 Medium

| Diagram | Elements | Tips violated | Suggested fix |
|---------|----------|---------------|---------------|
| bb-overview.puml | 12n, 15e | #2 no legend, #11 line crossings | Add legend, remove package boxes |

### 🟢 Low

| Diagram | Elements | Tips violated | Suggested fix |
|---------|----------|---------------|---------------|
| config-resolution.puml | 10n, 10e | #7 inconsistent stereotypes | Use plain components |

Which fixes should I apply?
```
