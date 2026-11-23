## ADDED Requirements

### Requirement: One accessor reports an item block's bounds

The system SHALL expose a single function that, given source content and the position of an item
header, returns that item block's bounds. The function SHALL be exported from the package's public
entry point and SHALL be the only block-locating implementation in the package.

#### Scenario: Bounds for an item located by absolute offset

- **WHEN** the position of an item header in the source content is given as an absolute character offset
- **THEN** the returned bounds give the header, body, and closing delimiter offsets
- **AND** the item ID as authored in the header

#### Scenario: Bounds for an item located by source line

- **WHEN** the position of an item header is given as a 1-based source line
- **THEN** the returned bounds are the same as for the equivalent absolute offset
- **AND** the returned `startLine` and `endLine` are 1-based lines in the content's own numbering

#### Scenario: Report the delimiter form

- **WHEN** the block is delimited by `--`
- **THEN** the returned delimiter is `--`
- **AND** when the block is delimited by `====` the returned delimiter is `====`

#### Scenario: EOF-closed block

- **WHEN** a block's closing delimiter is the last line of the content with no trailing newline
- **THEN** the returned bounds include that closing line

### Requirement: Bounds follow the parser's block grammar

The accessor SHALL accept the same item-block forms the parser accepts, and SHALL NOT report bounds
for text the parser does not treat as an item block.

#### Scenario: Class-prefixed header

- **WHEN** the header is `[.tracer#REQ-001, item, role=requirement]`
- **THEN** bounds are returned with item ID `REQ-001`

#### Scenario: Header inside a verbatim block

- **WHEN** an item-shaped header appears inside a `----` or `....` listing block
- **THEN** no bounds are returned

#### Scenario: Header not followed by a block delimiter

- **WHEN** an item header is not followed by an opening delimiter line
- **THEN** no bounds are returned, and no error is raised

#### Scenario: Title containing a bracket

- **WHEN** the header's `title` attribute contains a `]` inside quotes
- **THEN** the header is scanned to its real closing `]` and the bounds are correct

### Requirement: Bounds are the shared implementation for consumers

Consumers that locate, move, or delete item blocks SHALL obtain block bounds from this accessor
rather than maintaining their own scan of the content.

#### Scenario: CLI lifecycle commands use the shared accessor

- **WHEN** `archive` or `remove` locates the block of an item
- **THEN** it uses the shared accessor
- **AND** its observable file behaviour is unchanged, including the refusal to change anything when
  the block cannot be located

#### Scenario: Item content extraction is unaffected

- **WHEN** the parser extracts `Item.content` for an item
- **THEN** the resulting content is unchanged by this accessor's introduction

#### Scenario: Positional relationship lines are unaffected

- **WHEN** the accessor reports a block's body offsets
- **THEN** relationship line numbers continue to be derived from absolute offsets in the document
