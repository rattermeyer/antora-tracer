# Proposal: Clickable Relationship Links

## Why

Inline relationship macros (`addresses:REQ-001[]`, `verifies:REQ-001[]`) appear as plain text in the rendered Antora site. Users reading architecture documents or test plans can't click through to see the referenced requirement. The traceability graph knows all the relationships, but the rendered HTML doesn't connect them.

This makes the example site less useful as a demonstration and prevents users from navigating traceability links in their own documentation.

## What Changes

- **New**: Render inline relationship macros as clickable HTML links during the Antora extension's page processing
- **New**: Links navigate to the target item's source page with an anchor (e.g., `<a href="requirements.html#REQ-001">REQ-001</a>`)
- **Modified**: `AntoraTraceabilityExtension` page processor to post-process rendered HTML and replace relationship text with links

### How It Works

The extension already processes every `.adoc` page during `contentClassified`. After the page is rendered to HTML, a post-processing step scans for `<em>addresses</em>:REQ-001[]<em></em>` patterns (how Asciidoctor renders inline text) and replaces them with anchor links to the target item's page.

The DocumentParser already stores `sourceFile` on every item during `contentClassified`, so the target page URL is known:

```
addresses:REQ-001[]  →  graph.getItem('REQ-001').sourceFile
                       →  "requirements.adoc"
                       →  <a href="requirements.html#REQ-001" class="traceability-link">REQ-001</a>
```

### Impact

- **Code**: Light touch — add HTML post-processing in the page processor
- **API**: No breaking changes to public API
- **Dependencies**: No new dependencies
- **Files**: Modified `src/antora-extension.ts`, new post-processor logic
- **User Impact**: Better navigation in Antora sites using the extension
