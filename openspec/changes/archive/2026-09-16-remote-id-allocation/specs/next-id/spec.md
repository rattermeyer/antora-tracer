## ADDED Requirements

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
