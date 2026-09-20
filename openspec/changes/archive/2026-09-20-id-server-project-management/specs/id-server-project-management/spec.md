## Purpose

Manage projects (tenants) on the ID allocation server at runtime — add, list, update, and remove — without restarting the service.

## ADDED Requirements

### Requirement: Admin API is gated by an admin token
The admin endpoints SHALL require a bearer token matching the configured `adminToken`. When no `adminToken` is configured, the admin endpoints SHALL not exist and requests to them SHALL return `404`.

#### Scenario: No admin token configured
- **WHEN** no `adminToken` is configured and a request is made to `/admin/projects`
- **THEN** the service responds `404`

#### Scenario: Missing admin token
- **WHEN** an `adminToken` is configured and a request to `/admin/projects` carries no bearer token
- **THEN** the service responds `401`

#### Scenario: Wrong admin token
- **WHEN** an `adminToken` is configured and a request carries a token that does not match it
- **THEN** the service responds `401`

#### Scenario: Project token cannot administer
- **WHEN** a request to `/admin/projects` carries a valid project token instead of the admin token
- **THEN** the service responds `401`

### Requirement: List projects
`GET /admin/projects` SHALL return the tenant names of all projects.

#### Scenario: List projects
- **WHEN** an authorized admin requests `GET /admin/projects`
- **THEN** the service responds `200` with the tenant names and no token values

### Requirement: Add a project
`POST /admin/projects` with a tenant name and token SHALL create a project. The new token SHALL immediately resolve to that tenant for `GET /next-id`.

#### Scenario: Add project
- **WHEN** an authorized admin posts a tenant name and token
- **THEN** the service responds `201` and the token immediately resolves to that tenant

#### Scenario: Duplicate tenant
- **WHEN** an authorized admin posts a tenant name that already exists
- **THEN** the service responds `409` and the existing project is unchanged

#### Scenario: Missing field
- **WHEN** an authorized admin posts a body missing a tenant name or token
- **THEN** the service responds `400`

### Requirement: Update a project token
`PUT /admin/projects/:tenant` SHALL replace the token for an existing project. The old token SHALL immediately stop resolving.

#### Scenario: Update token
- **WHEN** an authorized admin updates a project's token
- **THEN** the new token resolves and the old token returns `401`

#### Scenario: Unknown tenant
- **WHEN** an authorized admin updates a tenant that does not exist
- **THEN** the service responds `404`

### Requirement: Remove a project
`DELETE /admin/projects/:tenant` SHALL remove a project. Its token SHALL immediately stop resolving.

#### Scenario: Remove project
- **WHEN** an authorized admin removes a project
- **THEN** the service responds `200` and the removed token returns `401` on subsequent `GET /next-id`

#### Scenario: Unknown tenant
- **WHEN** an authorized admin removes a tenant that does not exist
- **THEN** the service responds `404`

### Requirement: Tokens are stored hashed at rest
Project tokens SHALL be stored as hashes so plaintext tokens are never persisted or returned by the API.

#### Scenario: List omits tokens
- **WHEN** an authorized admin lists projects
- **THEN** the response contains tenant names only, not token values

### Requirement: CLI manages projects
The `antora-id-server projects` subcommand SHALL provide `list`, `add`, `update`, and `remove` operations that call the admin API.

#### Scenario: CLI add
- **WHEN** a user runs `antora-id-server projects add <tenant> --token <token>` against a running server
- **THEN** the project is created and its token works for `GET /next-id`
