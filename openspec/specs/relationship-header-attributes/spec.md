# relationship-header-attributes Specification

## Purpose

Lets item headers declare relationships through configured relation-type attributes, so short items can list their links on one line using comma- or whitespace-separated target IDs.

## Requirements

### Requirement: Relation-name attributes produce relationships
The system SHALL treat an item-header attribute whose name matches a configured relation type (primary or reverse) as one or more relationships from that item to the listed target IDs.

#### Scenario: Single target
- **WHEN** an item header includes `addresses="REQ-222"` and `addresses` is a configured relation type
- **THEN** the system registers an `addresses` relationship from that item to `REQ-222`

#### Scenario: Comma-separated targets
- **WHEN** an item header includes `addresses="REQ-222, QA-056, QA-057"` and `addresses` is a configured relation type
- **THEN** the system registers `addresses` relationships to `REQ-222`, `QA-056`, and `QA-057`

#### Scenario: Whitespace-separated targets
- **WHEN** an item header includes `addresses="REQ-222 QA-056 QA-057"` and `addresses` is a configured relation type
- **THEN** the system registers `addresses` relationships to `REQ-222`, `QA-056`, and `QA-057`

#### Scenario: Unrecognized attribute remains metadata
- **WHEN** an item header includes an attribute whose name is not a configured relation type
- **THEN** the attribute stays in the item's metadata and produces no relationship

### Requirement: Relation attributes match inline macro semantics
Relationships declared as header attributes SHALL follow the same canonicalization, validation, and rendering as inline relationship macros.

#### Scenario: Reverse relation name canonicalizes
- **WHEN** a relation type's reverse name is authored as a header attribute
- **THEN** the graph stores the canonical primary edge, matching inline macro behavior

#### Scenario: Header and inline duplicate reports a warning
- **WHEN** the same edge is authored both as a header attribute and as an inline macro
- **THEN** the system reports a duplicate relationship warning and validation reports it as an error

#### Scenario: Rendering includes header-authored relationships
- **WHEN** link rendering is enabled and an item has relationships authored only via header attributes
- **THEN** those relationships render like relationships authored via inline macros
