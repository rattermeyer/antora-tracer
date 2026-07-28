## ADDED Requirements

### Requirement: Items inside verbatim blocks are not parsed
The system SHALL NOT register item declarations (`[#ID, item, role=...]`) found inside AsciiDoc verbatim blocks (listing blocks delimited by `----` and literal blocks delimited by `....`) as traceability items.

#### Scenario: Source block containing item examples
- **WHEN** a `[source,asciidoc]` block delimited by `----` contains item declarations like `[#REQ-001, item, role=requirement]`
- **THEN** the parser skips those declarations
- **AND** no items are registered from within the verbatim block

#### Scenario: Literal block containing item examples
- **WHEN** a literal block delimited by `....` contains item declarations
- **THEN** the parser skips those declarations

#### Scenario: Real item adjacent to verbatim block is still parsed
- **WHEN** a real item declaration appears outside any verbatim block, immediately before or after one
- **THEN** the item is parsed and registered normally

#### Scenario: Item inside verbatim block is a user guide example
- **WHEN** the project's own user guide contains `[source,asciidoc]` blocks demonstrating item syntax
- **THEN** no phantom items from those examples appear in the traceability graph

---

### Requirement: Inline macros inside verbatim blocks are not parsed
The system SHALL NOT register inline relationship macros (`relation:TARGET[]`) whose enclosing item was skipped because it fell inside a verbatim block.

#### Scenario: Inline macro inside an item within a source block
- **WHEN** a `[source,asciidoc]` block contains an item with `satisfies:REQ-001[]` in its body
- **THEN** the inline macro is NOT registered as a relationship
- **AND** the traceability graph contains no relationship from that phantom item

---

### Requirement: Old macros inside verbatim blocks do not trigger errors
The system SHALL NOT emit deprecation errors or warnings for old macro syntax (`[req, ...]`, `[imp, ...]`, etc.) when they appear inside verbatim blocks.

#### Scenario: Old macro syntax in a source block example
- **WHEN** a `[source,asciidoc]` block contains `[req, id=REQ-001]` as example text
- **THEN** the parser does not emit a deprecation error for that occurrence

#### Scenario: Old macro syntax outside verbatim blocks still errors
- **WHEN** `[req, id=REQ-001]` appears in real AsciiDoc content (not inside a verbatim block)
- **THEN** the parser still emits a deprecation error

---

### Requirement: Verbatim block detection handles standard AsciiDoc fences
The system SHALL detect verbatim blocks by matching opening and closing fence lines consisting of exactly `----` or `....` (with optional trailing whitespace), ignoring style prefix lines like `[source,asciidoc]`.

#### Scenario: Fenced with style prefix
- **WHEN** content contains `[source,asciidoc]\n----\n...\n----`
- **THEN** the block is detected as a verbatim block

#### Scenario: Fenced without style prefix
- **WHEN** content contains a bare `----\n...\n----` listing block
- **THEN** the block is detected as a verbatim block

#### Scenario: Unmatched opening fence
- **WHEN** content contains an opening `----` with no matching closing `----`
- **THEN** the parser treats content from the opening fence to end-of-file as verbatim
- **AND** logs a warning about the unmatched fence
