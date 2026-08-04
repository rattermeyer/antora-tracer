# old-macro-detection

## Purpose

Detects legacy macro syntax (`[req]`, `[imp]`, `[test]`, `[doc]`, `[design]`) that predates the unified `[item]` macro and surfaces a deprecation error (strict mode) or warning (non-strict mode) with a suggested role-based replacement. Old macros inside verbatim blocks are intentionally ignored.

## ADDED Requirements

### Requirement: Old macro syntax generates a deprecation error or warning

The system SHALL detect legacy macro syntax (`[req]`, `[imp]`, `[test]`, `[doc]`, `[design]`) used in place of the unified `[item]` macro and SHALL generate a deprecation error (strict mode) or warning (non-strict mode) that points the user to the role-based replacement.

#### Scenario: Using old [req] macro
- **WHEN** a user writes `[req, id=REQ-001]` in AsciiDoc outside a verbatim block
- **THEN** the system generates a deprecation error or warning
- **AND** the message indicates the macro is deprecated
- **AND** the message suggests using `[item, role=requirement]` instead

#### Scenario: Using old [imp] macro
- **WHEN** a user writes `[imp, id=IMP-001]` in AsciiDoc outside a verbatim block
- **THEN** the system generates a deprecation error or warning
- **AND** the message suggests using `[item, role=implementation]` instead

#### Scenario: Old macro with attribute prefix (comma)
- **WHEN** a user writes `[design, ...]` or `[test, ...]` with trailing attributes
- **THEN** the system detects the legacy macro
- **AND** generates the corresponding deprecation error or warning

#### Scenario: Old macro with whitespace separator
- **WHEN** a user writes `[req ...]` with a space after the keyword instead of a comma
- **THEN** the system detects the legacy macro
- **AND** generates the corresponding deprecation error or warning

#### Scenario: Bare old macro
- **WHEN** a user writes `[req]` with no attributes
- **THEN** the system detects the legacy macro
- **AND** generates the corresponding deprecation error or warning

#### Scenario: Old macro inside a verbatim block is not flagged
- **WHEN** a `[source,asciidoc]` listing block (delimited by `----`) or literal block (delimited by `....`) contains old macro examples like `[req, ...]`
- **THEN** the system does NOT generate a deprecation error or warning for those occurrences

#### Scenario: Ordinary prose is not misdetected
- **WHEN** prose contains a word that merely starts with an old-macro keyword, such as the tokens in "red", "request", or "testimony"
- **THEN** the system does NOT emit a deprecation error or warning
