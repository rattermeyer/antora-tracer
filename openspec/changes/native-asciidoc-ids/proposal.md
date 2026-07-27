# Proposal: Use Native Asciidoctor ID Syntax

## Why

Items currently use a custom `id=REQ-001` attribute embedded in the `[item]` macro attribute list. The extension then injects `[[REQ-001]]` anchors via in-memory content substitution to make xrefs resolvable. This is fragile, requires regex manipulation of source content, and adds maintenance burden.

Asciidoctor has a native shorthand for assigning block IDs: `[#REQ-001]`. This creates `<div id="REQ-001">` automatically with no injection needed. Using it would let us delete the entire `injectItemHeadings` method and simplify contentClassified to only handle link substitution.

## What Changes

- **BREAKING**: Item syntax changes from `[item, id=REQ-001, role=req]` to `[#REQ-001, item, role=req]`
- **Removed**: `injectItemHeadings()` method — no longer needed. Asciidoctor handles anchors natively
- **Modified**: DocumentParser extracts `id` from the `#ID` prefix in the attribute list instead of `id=` attribute
- **Modified**: Title prepending (`REQ-001 — Title`) moves from extension injection to DocumentParser — parser sets `title` on the Item with ID prepended
- **Modified**: Example site — 48 items converted to `[#ID, item, ...]` syntax

### Before vs After

```
Before:                              After:
═══════                               ══════
[item, id=REQ-001,                    [#REQ-001, item,
 role=requirement,                     role=requirement,
 title="User Auth"]                    title="User Auth"]
--                                    --
Content                               Content
--                                    --
                                      <div id="REQ-001" class="openblock">
Extension injects:                       .REQ-001 — User Auth
  [[REQ-001]]                            Content
  .REQ-001 — User Auth                </div>
```

### Impact

- **Code**: Delete ~20 lines of injection code, change 1 regex in parser
- **Example site**: 48 items updated, title attributes unchanged
- **Backward compatibility**: None — old `id=` syntax no longer supported
