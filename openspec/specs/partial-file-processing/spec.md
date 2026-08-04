# partial-file-processing

## Purpose

Process items defined in AsciiDoc partial files (`family: partial`) during the `contentClassified` event, alongside page files. Partial items are registered in the traceability graph with source URLs pointing to the repository, enabling matrix links to resolve to the source. Macro expansion and link substitution passes are skipped for partials since they do not produce rendered HTML output.

## Requirements

### Requirement: Items defined in partials are processed
The system SHALL process items defined in AsciiDoc partial files (`family: partial`) during the `contentClassified` event, alongside page files. Items from partials SHALL use the file's view URL (from the Antora content source configuration) as their source file reference, enabling traceability matrix links to resolve to the source repository. Partial items SHALL be processed only for graph population (Pass 1 — parsing and registration); macro expansion and link substitution passes SHALL be skipped since partials do not produce rendered HTML output.

#### Scenario: Item in a partial is registered in the graph
- **WHEN** a partial file contains `[#REQ-100, item, role=requirement]`
- **AND** the partial is processed during `contentClassified`
- **THEN** the item is registered in the traceability graph
- **AND** the item's `sourceFile` is set to the partial's view URL (pointing to the source repository)

#### Scenario: Partial items appear in matrices with source links
- **WHEN** a matrix is generated that includes items from partials
- **THEN** the matrix links to the partial item's source location in the repository
- **AND** links use `link:` URLs (not `xref:`) since partials do not produce HTML pages

#### Scenario: Macro expansion is skipped for partials
- **WHEN** a partial file contains `traceability:outgoing[]` inside an item block
- **THEN** the macro is NOT expanded
- **AND** no Pass 2 substitution is performed on partial content

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
