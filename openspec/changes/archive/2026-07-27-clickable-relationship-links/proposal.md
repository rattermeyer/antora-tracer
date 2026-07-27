# Proposal: Clickable Relationship Links

## Why

Inline relationship macros (`addresses:REQ-001[]`, `verifies:REQ-001[]`) appear as plain text in the rendered Antora site and PDF output. Users reading architecture documents or test plans can't click through to see the referenced requirement. The traceability graph knows all the relationships, but the rendered output doesn't connect them.

This makes the example site less useful as a demonstration and prevents users from navigating traceability links in their own documentation — whether browsing HTML or reading a PDF.

## What Changes

- **New**: Transform inline relationship macros into Asciidoctor xrefs in-memory during the Antora extension pipeline
- **New**: `addresses:REQ-001[]` becomes `xref:REQ-001[]` (or equivalent) before Asciidoctor renders the page
- **Modified**: `AntoraTraceabilityExtension` to add a content substitution step after parsing but before rendering

### How It Works

The extension already processes every `.adoc` page during `contentClassified`. After extracting relationships from item content, it modifies the in-memory content catalog entry — replacing relationship macros with Asciidoctor cross-references. The `.adoc` file on disk is never touched.

Because the transformation happens at the source level (before rendering), it works for both HTML and PDF output:

```
Content Classified event
  │
  ├─ DocumentParser extracts relationships → graph
  ├─ Replace "addresses:REQ-001[]" with "xref:#REQ-001[REQ-001]" in-memory
  │
  ▼
Asciidoctor renders modified source
  ├─ HTML: xref → <a href="requirements.html#REQ-001">REQ-001</a>
  └─ PDF:  xref → internal link / page number
```

The DocumentParser already stores the relationship in the graph. The substitution is cosmetic — it only affects how Asciidoctor renders the text, not the traceability data.

### Impact

- **Code**: Light touch — content substitution in `AntoraTraceabilityExtension`
- **API**: No breaking changes
- **Dependencies**: None
- **Files**: Modified `src/antora-extension.ts`
- **User Impact**: Clickable traceability links in both HTML and PDF output
