## MODIFIED Requirements

### Requirement: Tenancy is derived from the bearer token
Counters SHALL be keyed by tenant, resolved from the `Authorization: Bearer <token>` header. The `tokens` configuration SHALL map a tenant name to its token value (`tenant → token`). When no tokens are configured, the service SHALL attribute every request to a default tenant. When tokens are configured, a request with an absent, malformed, or unrecognized token SHALL be rejected with `401`.

#### Scenario: Independent tenants
- **WHEN** two requests use different tokens mapped to different tenants
- **THEN** each tenant's counter advances independently for the same prefix

#### Scenario: Absent token
- **WHEN** no tokens are configured and a request carries no bearer token
- **THEN** the request is attributed to the default tenant

#### Scenario: Absent token with tokens configured
- **WHEN** tokens are configured and a request carries no bearer token
- **THEN** the service responds `401`

#### Scenario: Unknown token
- **WHEN** a request carries a token that is not recognized
- **THEN** the service responds `401`
