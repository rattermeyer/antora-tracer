## MODIFIED Requirements

### Requirement: Padding honors configured width
Generated IDs SHALL be zero-padded to the configured width for the tenant and prefix, resolving the width per tenant first and falling back to the global prefix width and then a default of 3, applied as a minimum so larger values grow rather than truncate.

#### Scenario: Default width
- **WHEN** prefix `REQ` has no configured width for the tenant or globally and the counter is 7
- **THEN** the service responds with `{"id": "REQ-007"}`

#### Scenario: Configured width
- **WHEN** prefix `REQ` is configured with width 4 and the counter is 7
- **THEN** the service responds with `{"id": "REQ-0007"}`

#### Scenario: Tenant width overrides global
- **WHEN** prefix `REQ` is configured globally with width 3, tenant `acme` overrides `REQ` with width 4, and `acme`'s counter is 7
- **THEN** the service responds with `{"id": "REQ-0007"}`

#### Scenario: Counter exceeds width
- **WHEN** prefix `REQ` uses width 3 and the counter reaches 1000
- **THEN** the service responds with `{"id": "REQ-1000"}` without truncation

### Requirement: Server honors a configured starting value per prefix
The service SHALL begin allocation for a tenant and prefix at the tenant's configured `start` value for that prefix, falling back to the global prefix `start`, and defaulting to 1 when neither is configured.

#### Scenario: Seeded prefix
- **WHEN** prefix `REQ` is configured globally with `start: 55`
- **THEN** the first request for `REQ` responds with `{"id": "REQ-055"}` and the next with `{"id": "REQ-056"}`

#### Scenario: Unseeded prefix starts at 1
- **WHEN** prefix `REQ` has no configured `start`
- **THEN** the first request for `REQ` responds with `{"id": "REQ-001"}`

#### Scenario: Tenant start overrides global
- **WHEN** prefix `REQ` is configured globally with `start: 55`, tenant `acme` overrides `REQ` with `start: 100`, and no `REQ` ID has been allocated for `acme`
- **THEN** the first request for `REQ` by `acme` responds with `{"id": "REQ-100"}` and the next with `{"id": "REQ-101"}`

#### Scenario: Independent tenants with the same prefix
- **WHEN** tenants `acme` and `beta` both request prefix `REQ` and `beta` overrides `REQ` with `start: 1000`
- **THEN** `acme`'s first `REQ` responds with `{"id": "REQ-001"}` and `beta`'s first `REQ` responds with `{"id": "REQ-1000"}`, each advancing independently
