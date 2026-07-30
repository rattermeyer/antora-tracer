# Next-ID Command

## Purpose

Provide a CLI command to determine the next available sequential ID for a given prefix, supporting consistent manual ID assignment when adding items outside of automated tooling.

## Requirements

### Requirement: CLI next-id command returns next available ID
The CLI SHALL provide a `next-id` command that accepts a `--prefix` and `-i/--input` and returns the next available sequential ID for items matching that prefix.

#### Scenario: Next ID for existing prefix
- **WHEN** `antora-tracer next-id --prefix REQ -i docs/` is run and the highest existing `REQ-NNN` is `REQ-054`
- **THEN** the command outputs `REQ-055` as a plain string on stdout
- **AND** exits with code 0

#### Scenario: Next ID for new prefix
- **WHEN** `antora-tracer next-id --prefix NEW -i docs/` is run and no items match `NEW-NNN`
- **THEN** the command outputs `NEW-001` as a plain string on stdout
- **AND** exits with code 0

#### Scenario: Padding matches existing convention
- **WHEN** existing IDs for the prefix use 4-digit padding (e.g., `REQ-0001`)
- **THEN** the output follows the same width (e.g., `REQ-0002`)
- **AND** when no existing IDs are found, defaults to 3-digit padding

#### Scenario: Missing input
- **WHEN** `antora-tracer next-id --prefix REQ` is run without `-i`
- **THEN** the command exits with an error message and code 1
