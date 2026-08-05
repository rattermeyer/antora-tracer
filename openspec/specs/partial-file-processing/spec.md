# partial-file-processing

## Purpose

Process items defined in AsciiDoc partial files (`family: partial`) during the `contentClassified` event, alongside page files. Partial items are registered in the traceability graph with source URLs pointing to the repository, enabling matrix links to resolve to the source. Macro expansion and link substitution passes are skipped for partials since they do not produce rendered HTML output.

## Requirements

### Requirement: Items defined in partials are processed
The system SHALL process items defined in AsciiDoc partial files (`family: partial`) during the `contentClassified` event, alongside page files. Items from partials SHALL use the file's view URL (from the Antora content source configuration) as their source file reference, enabling traceability matrix links to resolve to the source repository. Partial items SHALL be processed for graph population (Pass 1), macro expansion (Pass 2 — rendering macros), and link substitution (Pass 3 — stripping inline macros). All three passes apply to partial files just as they do to page files, because partial content is inlined into pages by Asciidoctor and reaches the browser.

#### Scenario: Item in a partial is registered in the graph
- **WHEN** a partial file contains `[#REQ-100, item, role=requirement]`
- **AND** the partial is processed during `contentClassified`
- **THEN** the item is registered in the traceability graph
- **AND** the item's `sourceFile` is set to the partial's view URL (pointing to the source repository)

#### Scenario: Partial items appear in matrices with source links
- **WHEN** a matrix is generated that includes items from partials
- **THEN** the matrix links to the partial item's source location in the repository
- **AND** links use `link:` URLs (not `xref:`) since partials do not produce HTML pages

#### Scenario: Inline macros in partials are stripped
- **WHEN** a partial file contains `addresses:QA-055[]` inside an item block
- **AND** the partial is processed during Pass 3 (link substitution)
- **THEN** the inline macro SHALL be stripped from the partial's content
- **AND** the macro SHALL NOT appear as raw text in the rendered HTML output

#### Scenario: Rendering macros in partials are expanded
- **WHEN** a partial file contains `traceability:links[]` inside an item block
- **THEN** the macro SHALL be expanded into a formatted relationship list
- **AND** the expanded content SHALL appear in the rendered HTML when the partial is inlined into a page

#### Scenario: Partial items are version-scoped
- **WHEN** a site is built with multiple component versions
- **THEN** items from partials are grouped by version along with page items
- **AND** items from one version do not leak into another version's graph

#### Scenario: Partial with no items
- **WHEN** a partial file contains no `[item]` blocks
- **THEN** processing completes without error
- **AND** the graph is unchanged

#### Scenario: Duplicate item ID across a page and a partial
- **WHEN** the same item ID appears in both a page file and a partial file
- **THEN** the duplicate is reported as a warning
- **AND** the first occurrence (page) takes precedence
