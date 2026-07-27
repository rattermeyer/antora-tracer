# Proposal: Display Item IDs as Headings

## Why

When viewing rendered output (HTML or PDF), there's no visible indication of which `[item]` a block represents. The `id` and `title` attributes are metadata used by the traceability graph and xref resolution, but they never appear in the rendered page. Users navigating to `requirements.html#REQ-001` or clicking a `xref:#REQ-001` link see the content but have no visual anchor showing the item identity.

The example site items use bold text as a manual heading (e.g., `*Single [item] macro replaces all block macros*`), which duplicates the purpose of the `title` attribute.

## What Changes

- **New**: Inject `[[ID]]` anchor and heading line into item content during `contentClassified` in-memory substitution
- **Modified**: `substituteRelationshipLinks` extended to also inject item headings (or a new method added alongside it)
- **Modified**: Example site items refactored to use `title` attribute instead of bold manual headings
- **New**: Heading format: `REQ-001 — Single [item] macro replaces all block macros` (ID — title)

### How It Works

During the `contentClassified` pass 2 (link substitution), also inject an anchor and heading for each item:

```
Before (in .adoc):               After (in-memory):
═════════════════                  ══════════════════
[item, id=REQ-001,                [item, id=REQ-001,
 role=requirement,                 role=requirement,
 title="User Auth"]                title="User Auth"]
====                              ====
The system shall...                [[REQ-001]]
====                              == REQ-001 — User Auth
                                   The system shall...
                                   ====
```

The `[[REQ-001]]` creates an anchor that `xref:#REQ-001` resolves to. The heading line shows the ID and title. Both HTML and PDF renderers process anchors and headings natively.

If no `title` is set, the heading shows just the ID: `== REQ-001`.

### Impact

- **Code**: Small addition to `AntoraTraceabilityExtension` — single method injection in Pass 2
- **Example site**: Refactor 48 items to move bold headings into `title` attributes
- **No breaking changes**: Injection is additive, anchor + heading visible in output
- **PDF**: Works identically — source-level change is format-agnostic
