# Role Abstraction Review

## Purpose

Provide a same-role slice of one document's items as judgeable input, so abstraction-level drift within a role can be detected and classified — by an LLM judge or a human reviewer — into actionable verdicts.

## ADDED Requirements

### Requirement: Role extraction returns same-role items in document order
The system SHALL provide an extraction that returns all current (non-superseded) items of a given role, ordered by their position in the source document, each carrying its ID, title, content, and source location.

#### Scenario: Extract a role from a document
- **WHEN** a document contains multiple items of the requested role alongside items of other roles
- **THEN** the extraction returns only the requested role's current items, in source-document order

#### Scenario: Superseded items are excluded
- **WHEN** the requested role includes an item that a successor supersedes
- **THEN** the extraction omits the superseded item

#### Scenario: Role with no items in the document
- **WHEN** the requested document contains no current items of the requested role
- **THEN** the extraction result is empty and the operation succeeds

### Requirement: Extraction carries skeleton context for relocation
The extraction SHALL support including a skeleton of the same document's items of other roles, consisting of ID and title only, so a judge can reason about moving an item to a different section of the same document.

#### Scenario: Skeleton includes other-role items
- **WHEN** the extraction includes skeleton context and the document contains items of other roles
- **THEN** the skeleton lists each other-role item's ID and title without its content

#### Scenario: Skeleton omits the extracted role
- **WHEN** skeleton context is included
- **THEN** the skeleton does not duplicate the extracted role's items

### Requirement: Abstraction review applies a three-verdict model
An abstraction review of an extracted role slice SHALL classify findings into exactly three verdicts: *rewrite* (the item sits in the right document and role but its text is at the wrong abstraction level), *move within document* (the item belongs in a different section of the same document), and *investigate elsewhere* (the item's role or home document appears wrong).
The review SHALL NOT answer where an *investigate elsewhere* item should go; it flags the item for follow-up.

#### Scenario: Wrong altitude, right home
- **WHEN** an item's text uses the vocabulary and detail of a different abstraction level than its same-role siblings in the same document
- **THEN** the review classifies it as *rewrite*

#### Scenario: Wrong section, right document
- **WHEN** an item fits the document's role but belongs in a different section, as evidenced by the skeleton context
- **THEN** the review classifies it as *move within document*

#### Scenario: Suspected wrong role or document
- **WHEN** an item's abstraction level matches a role other than its assigned role
- **THEN** the review classifies it as *investigate elsewhere* and does not propose a destination

#### Scenario: Consistent slice
- **WHEN** all items of the extracted slice sit at the same abstraction level
- **THEN** the review reports no findings
