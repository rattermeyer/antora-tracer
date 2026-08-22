## Why

The self-traceability example traces each functional requirement (REQ) to a design concept (ARC) via `addresses:REQ-NNN[]`, but 68 of 145 REQ items currently have no design concept. Most of the recent work is affected: the `reverse-relations`, `matrix-status`, and `preset-inheritance` changes added 15 requirements (`REQ-129`, `REQ-161/162`, `REQ-167–178`) that are required and tested but not represented in `architecture.adoc` as design concepts. `REQ-129` (bidirectional merge) is a special case — the `reverse-relations` change rewired its mechanism (merge → canonicalize + dedupe), so its old description is gone and no ARC item describes it at all.

## What Changes

- **Add four ARC design concepts** to `examples/tracer/modules/ROOT/pages/explanation/architecture.adoc`, with `addresses:` links to the missing requirements:
  - Relation reverse declaration and canonical storage (`REQ-129`, `REQ-175–178`)
  - Preset inheritance and config merge (`REQ-170–174`)
  - Display labels with humanize default (`REQ-161`, `REQ-162`)
  - Matrix status column (`REQ-167–169`)
- **Document the coverage convention** as a requirement in `doc-self-traceability`: every functional requirement SHALL be addressed by at least one design concept.
- **Leave out** the constraint-like `REQ-163–166` (PDF compatibility / source-not-modified) — they restate `CON-002`/`CON-003` and are already covered by `ARC-015` (in-memory processing).
- Pre-existing gaps (`REQ-111/112` file cache, `REQ-116–119` cross-module xref, `REQ-136–143` CLI/Kroki) are tracked separately, not in this change.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `doc-self-traceability`: adds the requirement that every functional requirement is addressed by a design concept.

## Impact

- `examples/tracer/modules/ROOT/pages/explanation/architecture.adoc` — four new `ARC-035…038` items plus `addresses:` links.
- `openspec/specs/doc-self-traceability/spec.md` — new requirement + scenario.
- No code or behaviour changes; this closes a traceability gap in the example site.
