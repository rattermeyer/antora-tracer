## MODIFIED Requirements

### Requirement: File state is prepared once per file
The system SHALL compute document attributes and source-file metadata exactly once per page file during the `contentClassified` event. Content and item block positions SHALL be recomputed in each macro-expansion pass to ensure position accuracy after previous passes may have modified the content.

#### Scenario: Single preparation per file
- **WHEN** the `contentClassified` event fires with 9 page files
- **THEN** `parseDocAttributes` SHALL be called 9 times (once per file)
- **AND** content string reading and item block scanning SHALL occur in each expand method using the latest file content

#### Scenario: Macro expansion output accumulates across passes
- **WHEN** a file contains `traceability:outgoing[]`, `traceability:incoming[]`, `traceability:links[]`, `traceability:graph[]`, and `traceability:graph-coverage[]` macros
- **THEN** the rendered AsciiDoc output SHALL include ALL expanded macros
- **AND** no raw macro text (e.g., `traceability:links[]`) SHALL appear in the output
- **AND** all inline relationship macros (e.g., `addresses:REQ-001[]`) SHALL be substituted with xrefs

### Requirement: PreparedFile carries immutable processing state
The system SHALL define a `PreparedFile` type containing the raw Antora file reference, parsed document attributes, and normalized source-file metadata. Content and item block positions are not cached because they may become stale across mutation passes.

#### Scenario: PreparedFile provides docAttrs to expand methods
- **WHEN** `expandRelationMacros` receives a `PreparedFile`
- **THEN** the method SHALL use `prepared.docAttrs` instead of calling `parseDocAttributes`
- **AND** the method SHALL read content from `prepared.file.contents` for the latest accumulated state

#### Scenario: PreparedFile is scoped to one file iteration
- **WHEN** the file loop moves to the next file
- **THEN** the previous `PreparedFile` SHALL become eligible for garbage collection
- **AND** no cross-file state SHALL be retained
