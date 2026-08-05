## ADDED Requirements

### Requirement: File state is prepared once per file
The system SHALL compute file content (buffer→string), document attributes, and item block positions exactly once per page file during the `contentClassified` event, and SHALL reuse the computed values across all macro-expansion passes for that file.

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
The system SHALL define a `PreparedFile` type containing the raw Antora file reference, the full content string, parsed document attributes, item block position array, and normalized source-file metadata.

#### Scenario: PreparedFile provides content to expand methods
- **WHEN** `expandRelationMacros` receives a `PreparedFile`
- **THEN** the method SHALL use `prepared.content` instead of calling `buf→string`
- **AND** the method SHALL use `prepared.docAttrs` instead of calling `parseDocAttributes`
- **AND** the method SHALL use `prepared.blocks` instead of calling `findItemBlocks`

#### Scenario: PreparedFile is scoped to one file iteration
- **WHEN** the file loop moves to the next file
- **THEN** the previous `PreparedFile` SHALL become eligible for garbage collection
- **AND** no cross-file state SHALL be retained
