## Context

The three generate methods (`generateListStyle`, `generateTableStyle`, `generateInlineStyle`) produce flat AsciiDoc output. `generateListStyle` currently emits:

```asciidoc
.Addresses
* xref:#REQ-001[User Auth]
* xref:#REQ-006[Extension]
```

We want an optional mode that wraps each group in `[%collapsible]`:

```asciidoc
[%collapsible]
.Addresses
====
* xref:#REQ-001[User Auth]
* xref:#REQ-006[Extension]
====
```

The toggle is a new document attribute `:traceability-collapsible:`, defaulting to off.

## Goals / Non-Goals

**Goals:**
- Add `:traceability-collapsible:` attribute to enable collapsible list-style output
- Apply to both `outgoing[]` and `incoming[]` macros
- Default `false` — no change to existing output

**Non-Goals:**
- Collapsible table or inline output (out of scope)
- Nested collapsible groups (one level only)
- User-customizable collapsible labels (always uses the relation type title)

## Decisions

### Decision 1: Collapsible only for list style

**Rationale**: List style is the default and most commonly used. Each relation-type group maps naturally to a collapsible section — the group title becomes the summary. Table style uses a single table spanning all groups, making per-group wrapping awkward. Inline style is compact by design and doesn't benefit from collapsible wrappers.

### Decision 2: Document attribute `:traceability-collapsible:` with boolean value

**Rationale**: Consistent with existing boolean attributes like `:traceability-links:`. Values: `true` / `yes` / `1` enable; absent or any other value disables. No argument parsing needed — just a simple truthiness check.

### Decision 3: Thread through the existing call chain

Add `collapsible: boolean` parameter to `generateLinksAsciiDoc` → `generateListStyle`. Parse the attribute once in `expandOutgoingMacros` / `expandIncomingMacros` and pass it down. No changes to `generateTableStyle` or `generateInlineStyle` needed.

## Risks / Trade-offs

- **Risk**: `[%collapsible]` is not supported by all AsciiDoc processors → It's a standard Asciidoctor feature. Users targeting other processors can leave the attribute off.
- **Risk**: Collapsible blocks increase page height when expanded → This is the point — they reduce visual noise when collapsed. The trade-off is expected.
- **Trade-off**: Table and inline users get no collapsible option → Acceptable. If demand arises, table-style collapsible can be added as a follow-up.
