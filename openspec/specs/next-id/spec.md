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

### Requirement: next-id uses a configured remote allocator
The CLI SHALL request the next ID from a remote allocator when `idAllocation.endpoint` is configured, instead of scanning local files.

#### Scenario: Remote allocation is used when configured
- **WHEN** `antora-tracer next-id --prefix REQ -i docs/` is run with `idAllocation.endpoint` set to `https://ids.example.com`
- **THEN** the CLI requests `GET https://ids.example.com/next-id?prefix=REQ`
- **AND** outputs the `id` field of the JSON response verbatim as a plain string on stdout
- **AND** exits with code 0

#### Scenario: Token is sent as bearer auth
- **WHEN** `idAllocation.token` is set
- **THEN** the request includes an `Authorization: Bearer <token>` header

#### Scenario: Token and endpoint read from the environment
- **WHEN** `idAllocation.endpoint` is set to `${ID_ALLOC_ENDPOINT}` and `idAllocation.token` is set to `${ID_ALLOC_TOKEN}`, with both environment variables defined
- **THEN** the values are resolved to their environment contents before any request
- **AND** the request targets the resolved endpoint with `Authorization: Bearer <resolved token>`

### Requirement: next-id fails closed when the allocator is unavailable
A configured-but-unreachable allocator SHALL cause `next-id` to exit with an error, never silently fall back to a local scan.

#### Scenario: Allocator returns an error status
- **WHEN** the allocator responds with a non-2xx status
- **THEN** the command exits with code 1 and an error message naming the failure
- **AND** does not emit an ID

#### Scenario: Allocator is unreachable
- **WHEN** the allocator request fails (network error or timeout)
- **THEN** the command exits with code 1 and an error message
- **AND** does not emit an ID

#### Scenario: Allocator rejects credentials
- **WHEN** the allocator responds with a `401` or `403` status
- **THEN** the command exits with code 1 and an error message naming authentication failure (checking `idAllocation.token`)
- **AND** does not emit an ID

#### Scenario: Allocator returns invalid JSON
- **WHEN** the allocator responds with a body lacking a string `id` field
- **THEN** the command exits with code 1 and an error message
- **AND** does not emit an ID

### Requirement: --local forces a local scan
A `--local` flag SHALL bypass a configured allocator and use the existing local `max+1` scan.

#### Scenario: --local overrides the allocator
- **WHEN** `antora-tracer next-id --prefix REQ -i docs/ --local` is run with `idAllocation.endpoint` configured
- **THEN** the command performs the local scan and ignores the allocator
- **AND** outputs the local `max+1` result

### Requirement: idAllocation config is validated
An `idAllocation.endpoint` that is not a non-empty HTTP(S) URL SHALL cause configuration loading to fail.

#### Scenario: Invalid endpoint is rejected
- **WHEN** a config with `idAllocation.endpoint` set to an empty string or a non-URL is loaded
- **THEN** configuration loading throws an error
- **AND** `next-id` exits with code 1

#### Scenario: Unset environment variable is rejected
- **WHEN** a config references `${ID_ALLOC_TOKEN}` but the variable is not defined in the environment
- **THEN** configuration loading throws an error naming the variable
- **AND** `next-id` exits with code 1
