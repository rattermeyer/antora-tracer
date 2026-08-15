# file-preparation-cache

## Purpose

Cache file content, document attributes, and item block positions once per page file during the `contentClassified` event, eliminating redundant buffer→string conversions, document attribute parsing, and item block scanning across the five macro-expansion passes.

## Requirements

### Requirement: File state is prepared once per file
The system SHALL compute file content, document attributes, and item block positions exactly once per page file, and SHALL reuse the computed values across all macro-expansion passes for that file.

#### Scenario: Single preparation per file
- **WHEN** the `contentClassified` event fires with 9 page files
- **THEN** `buf→string` conversion SHALL be called 9 times (once per file)
- **AND** `parseDocAttributes` SHALL be called 9 times
- **AND** `findItemBlocks` SHALL be called 9 times
- **AND** the five expand methods SHALL receive the cached values without recomputing

#### Scenario: Macro expansion output is unchanged
- **WHEN** a file contains `traceability:outgoing[]`, `traceability:incoming[]`, `traceability:links[]`, `traceability:graph[]`, and `traceability:graph-coverage[]` macros
- **THEN** the rendered AsciiDoc output SHALL be identical to the output before the caching optimization
- **AND** all existing macro expansion tests SHALL pass without modification

### Requirement: PreparedFile carries all needed state
The system SHALL cache the parsed state of each source file — including its full content, document attributes, item block positions, and normalized source-file metadata — so that subsequent processing steps within the same file pass do not reparse it.

#### Scenario: PreparedFile provides content to expand methods
- **WHEN** `expandRelationMacros` receives a `PreparedFile`
- **THEN** the method SHALL use `prepared.content` instead of calling `buf→string`
- **AND** the method SHALL use `prepared.docAttrs` instead of calling `parseDocAttributes`
- **AND** the method SHALL use `prepared.blocks` instead of calling `findItemBlocks`

#### Scenario: PreparedFile is scoped to one file iteration
- **WHEN** the file loop moves to the next file
- **THEN** the previous `PreparedFile` SHALL become eligible for garbage collection
- **AND** no cross-file state SHALL be retained
