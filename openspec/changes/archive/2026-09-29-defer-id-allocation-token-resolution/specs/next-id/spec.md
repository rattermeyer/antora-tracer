## MODIFIED Requirements

### Requirement: next-id uses a configured remote allocator
The CLI SHALL request the next ID from a remote allocator when `idAllocation.endpoint` is configured, instead of scanning local files.

#### Scenario: Remote allocation is used when configured
- **WHEN** `antora-tracer next-id --prefix REQ -i docs/` is run with `idAllocation.endpoint` set to `https://ids.example.com` and any configured token is available
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

#### Scenario: Unset token does not prevent unrelated config use
- **WHEN** a configuration references `${ID_ALLOC_TOKEN}` for `idAllocation.token` and the variable is unset
- **THEN** loading the configuration for an operation that does not request a remote ID succeeds without requiring the allocator token

#### Scenario: Remote next-id rejects an unset configured token
- **WHEN** `antora-tracer next-id --prefix REQ -i docs/` is run with `idAllocation.endpoint` configured, `idAllocation.token` referencing an unset environment variable, and without `--local`
- **THEN** the command exits with code 1 and names the unset variable
- **AND** does not contact the allocator or emit an ID

#### Scenario: Local next-id ignores an unset remote token
- **WHEN** `antora-tracer next-id --prefix REQ -i docs/ --local` is run with `idAllocation.endpoint` configured and `idAllocation.token` referencing an unset environment variable
- **THEN** the command performs the local scan and outputs its `max+1` result

### Requirement: idAllocation config is validated
An `idAllocation.endpoint` that is not a non-empty HTTP(S) URL SHALL cause configuration loading to fail. Environment variables referenced by the endpoint SHALL be resolved during configuration loading. An unset variable referenced by the optional token SHALL not prevent configuration loading; remote `next-id` SHALL report the missing variable and fail before making an allocator request.

#### Scenario: Invalid endpoint is rejected
- **WHEN** a config with `idAllocation.endpoint` set to an empty string or a non-URL is loaded
- **THEN** configuration loading throws an error
- **AND** `next-id` exits with code 1

#### Scenario: Unset endpoint environment variable is rejected during config loading
- **WHEN** a config references an unset environment variable in `idAllocation.endpoint`
- **THEN** configuration loading throws an error naming the variable

#### Scenario: Unset token environment variable is deferred to remote allocation
- **WHEN** a config references an unset environment variable in `idAllocation.token`
- **THEN** configuration loading succeeds
- **AND** remote `next-id` exits with code 1 naming the variable without contacting the allocator
- **AND** `next-id --local` remains able to scan locally
