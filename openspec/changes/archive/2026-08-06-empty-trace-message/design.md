## Context

The three rendering macros (`traceability:outgoing[]`, `traceability:incoming[]`, `traceability:links[]`) currently produce empty output when the item has no relationships. This is intentional — the spec says "expands to nothing (empty, no error)." But it's indistinguishable from a broken macro. Adding a configurable placeholder message improves the authoring experience.

## Goals / Non-Goals

**Goals:**
- Show a visible placeholder when a macro has nothing to render
- Make the style configurable: none, italic, or admonition
- Keep `none` as default for backward compatibility
- Per-direction messages for `links[]` (separate outgoing/incoming empty states)

**Non-Goals:**
- Changing the macro expansion behavior for non-empty cases
- Adding per-item override (document attribute is page-level)
- Internationalization of the message text

## Decisions

### Decision 1: `:traceability-empty:` document attribute

```asciidoc
:traceability-empty: italic      # _No outgoing relationships._
:traceability-empty: admonition  # [NOTE] block
:traceability-empty: none        # default, current behavior
```

Follows the existing pattern of `:traceability-style:`, `:traceability-order:`, and `:traceability-collapsible:` — all are page-level document attributes parsed by helper methods on `AntoraTraceabilityExtension`.

### Decision 2: Per-direction messages in `links[]`

`traceability:links[]` renders both directions. When only one direction has data, the other shows the empty message:

```
traceability:links[] (has outgoing, no incoming):
  [Addresses]
  REQ-001
  _No incoming relationships._
```

This is more informative than silent skipping. When both are empty, both messages appear:

```
traceability:links[] (both empty):
  _No outgoing relationships._
  _No incoming relationships._
```

### Decision 3: Message text

| Direction | Message |
|---|---|
| outgoing | `No outgoing relationships.` |
| incoming | `No incoming relationships.` |

Simple, unambiguous. No template variables or format strings — hardcoded English for now.

### Decision 4: Default is `none` for backward compatibility

Existing pages without the attribute continue to produce empty output. Authors opt in by adding `:traceability-empty: italic` to their page header.

## Risks / Trade-offs

- **[Risk] `admonition` style may be too noisy**: A NOTE block for every empty relationship list could clutter the page. → The author chooses the style; `italic` is the recommended default.
- **[Risk] Tests need updating**: Several tests assert that empty macros produce empty output. → All tests updated as part of the change.
