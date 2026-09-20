# ID Allocation Server

## Purpose

Provide a standalone HTTP service that hands out the next sequential ID for a prefix, so distributed authors share one monotonic allocation source instead of colliding on locally computed `max+1` IDs.

## Requirements

### Requirement: Allocator returns the next ID
The service SHALL respond to `GET /next-id?prefix=<prefix>` with `200` and a JSON body `{"id": "<prefix>-NNN"}`, where `NNN` is the next sequential value for that prefix.

#### Scenario: First allocation
- **WHEN** the first request for prefix `REQ` is made
- **THEN** the service responds `200` with `{"id": "REQ-001"}`

#### Scenario: Subsequent allocation
- **WHEN** a request for prefix `REQ` is made after `REQ-001` was allocated
- **THEN** the service responds with `{"id": "REQ-002"}`

#### Scenario: Missing prefix
- **WHEN** `GET /next-id` is made without a `prefix` parameter, or with an empty one
- **THEN** the service responds `400` and allocates no ID

### Requirement: Allocation is atomic and monotonic
The service SHALL never return the same ID twice for the same tenant and prefix, even under concurrent requests, and SHALL never reuse a previously allocated ID.

#### Scenario: Concurrent requests
- **WHEN** two requests for prefix `REQ` in the same tenant arrive concurrently
- **THEN** each receives a distinct ID, with none skipped or duplicated

### Requirement: Tenancy is derived from the bearer token
Counters SHALL be keyed by tenant, resolved from the `Authorization: Bearer <token>` header. Projects SHALL be persisted in the database, each mapping a tenant name to a hashed token. The `tokens` configuration SHALL seed the initial project set when no projects exist yet. When no admin token is configured and no projects exist, the service SHALL attribute every request to a default tenant. When projects exist, or when an admin token is configured, a request with an absent, malformed, or unrecognized token SHALL be rejected with `401`, and project changes made through the project-management API SHALL take effect immediately without a restart.

#### Scenario: Independent tenants
- **WHEN** two requests use different tokens mapped to different tenants
- **THEN** each tenant's counter advances independently for the same prefix

#### Scenario: Absent token
- **WHEN** no admin token is configured, no projects exist, and a request carries no bearer token
- **THEN** the request is attributed to the default tenant

#### Scenario: Absent token with tokens configured
- **WHEN** tokens are configured and a request carries no bearer token
- **THEN** the service responds `401`

#### Scenario: Unknown token
- **WHEN** a request carries a token that is not recognized
- **THEN** the service responds `401`

#### Scenario: Admin token with no projects
- **WHEN** an admin token is configured and no projects exist
- **THEN** a request to `GET /next-id` is rejected with `401`

#### Scenario: Project added at runtime
- **WHEN** a project is added through the project-management API
- **THEN** its token resolves to that tenant for subsequent `GET /next-id` requests without a restart

#### Scenario: Project removed at runtime
- **WHEN** a project is removed through the project-management API
- **THEN** its token is rejected with `401` on subsequent `GET /next-id` requests without a restart

### Requirement: Padding honors configured width
Generated IDs SHALL be zero-padded to the configured width for the prefix, defaulting to 3, applied as a minimum so larger values grow rather than truncate.

#### Scenario: Default width
- **WHEN** prefix `REQ` has no configured width and the counter is 7
- **THEN** the service responds with `{"id": "REQ-007"}`

#### Scenario: Configured width
- **WHEN** prefix `REQ` is configured with width 4 and the counter is 7
- **THEN** the service responds with `{"id": "REQ-0007"}`

#### Scenario: Counter exceeds width
- **WHEN** prefix `REQ` uses width 3 and the counter reaches 1000
- **THEN** the service responds with `{"id": "REQ-1000"}` without truncation

### Requirement: Server honors a configured starting value per prefix
The service SHALL begin allocation for a prefix at a configured `start` value, defaulting to 1 when none is configured.

#### Scenario: Seeded prefix
- **WHEN** prefix `REQ` is configured with `start: 55`
- **THEN** the first request for `REQ` responds with `{"id": "REQ-055"}` and the next with `{"id": "REQ-056"}`

#### Scenario: Unseeded prefix starts at 1
- **WHEN** prefix `REQ` has no configured `start`
- **THEN** the first request for `REQ` responds with `{"id": "REQ-001"}`
