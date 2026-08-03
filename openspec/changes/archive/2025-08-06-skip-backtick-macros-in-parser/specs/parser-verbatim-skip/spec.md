## ADDED Requirements

### Requirement: Inline macros inside backtick code spans are not parsed
The `DocumentParser` SHALL skip inline relationship macros (`relation:ID[]`) that appear inside backtick-enclosed code spans when parsing item body content for relationships.

#### Scenario: Backtick-enclosed macro is skipped
- **WHEN** an item block contains `` `addresses:TARGET[]` `` inside backtick code spans
- **THEN** the parser SHALL NOT register a relationship from the item to `TARGET`

#### Scenario: Macros outside backticks are still parsed
- **WHEN** an item block contains `addresses:REQ-001[]` outside backticks and `` `addresses:TARGET[]` `` inside backticks
- **THEN** the parser SHALL register a relationship to `REQ-001`
- **AND** the parser SHALL NOT register a relationship to `TARGET`
