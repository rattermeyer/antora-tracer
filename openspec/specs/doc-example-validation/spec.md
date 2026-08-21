# doc-example-validation Specification

## Purpose

Validate the `[item]` block examples shown in the example site's prose pages against the traceability configuration, so documentation examples cannot drift into invalid roles, relations, or syntax.

## Requirements

### Requirement: Doc examples validate against the traceability configuration
The system SHALL provide a check that extracts `[item]` blocks from the example site's prose documentation pages and validates them against the example traceability configuration (`examples/traceability.yml`). The check SHALL fail on unknown roles, disallowed relations, and item blocks that fail to parse.

#### Scenario: Valid doc examples pass
- **WHEN** the check runs and every extracted item block uses known roles and allowed relations
- **THEN** the check passes

#### Scenario: Unknown role in a doc example fails
- **WHEN** a doc example declares an item with a role not in the example configuration
- **THEN** the check fails and reports the page and role

#### Scenario: Disallowed relation in a doc example fails
- **WHEN** a doc example declares a relationship not allowed between the two roles by the configuration
- **THEN** the check fails and reports the page and relation

#### Scenario: Unparseable item block fails
- **WHEN** a doc example contains an item block that the parser cannot parse
- **THEN** the check fails and reports the page

