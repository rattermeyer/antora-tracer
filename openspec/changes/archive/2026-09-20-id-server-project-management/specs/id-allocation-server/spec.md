## MODIFIED Requirements

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
