## Why

`explanation/our-traceability-model.adoc` documents this project's own roles,
relations, and generated configuration graph — demonstration content, not
user-facing documentation about how to use the tool. It sits in the
Explanation section, which the Diátaxis split reserves for concepts the reader
applies to their own project, and its "Our" framing reads as a first-person
aside among otherwise domain-neutral explanation pages.

The Self-Traceability section already exists for exactly this content and is
specified as holding demonstration artifacts, not documentation.

## What Changes

- Move `examples/tracer/modules/ROOT/pages/explanation/our-traceability-model.adoc`
  to `examples/tracer/modules/ROOT/pages/self-traceability/our-traceability-model.adoc`.
- Update the navigation entry: remove it from Explanation, add it to
  Self-Traceability.
- Update the cross-reference in `explanation/traceability-model.adoc` that
  points at the moved page.
- Extend the Self-Traceability page enumeration in the
  `doc-self-traceability` spec and the mirrored REQ item in the example
  requirements index.

Page content, title, and generated `tracer:config-graph[]` output are
unchanged. The page contains no `[item]` blocks, so the traceability graph and
matrix coverage are unaffected.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `doc-self-traceability`: the "Self-Traceability nav section groups demo pages"
  requirement enumerates the section's child pages; that list gains the moved
  "Our Traceability Model" page.

## Impact

- `examples/tracer/modules/ROOT/pages/explanation/our-traceability-model.adoc`
  (moved)
- `examples/tracer/modules/ROOT/nav.adoc`
- `examples/tracer/modules/ROOT/pages/explanation/traceability-model.adoc`
  (one xref)
- `openspec/specs/doc-self-traceability/spec.md`
- `examples/tracer/modules/requirements/pages/index.adoc` (REQ-197 body)

No code, API, configuration, or CLI changes. The published URL for the page
changes from `/explanation/our-traceability-model.html` to
`/self-traceability/our-traceability-model.html`; nothing links to the old URL
externally.