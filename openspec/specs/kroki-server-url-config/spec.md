# Kroki Server URL Config

## Purpose

Allow the base URL used for Kroki image generation to be configured via the extension config and overridden via an environment variable, so self-hosted or local Kroki instances can be used instead of the public `https://kroki.io` service.

## Requirements

### Requirement: Configurable Kroki server URL via extension config
The `krokiServerUrl` extension config option SHALL set the base URL used by `traceability:graph[]` and `traceability:graph-coverage[]` macros when generating Kroki image URLs. When set, the system SHALL use this URL instead of the default `https://kroki.io`.

#### Scenario: Custom server URL from extension config
- **WHEN** `krokiServerUrl: http://localhost:8000` is set in the playbook extension config
- **THEN** `traceability:graph[]` SHALL generate `image::http://localhost:8000/graphviz/svg/...[]` URLs
- **AND** `traceability:graph-coverage[]` SHALL use the same server URL

#### Scenario: Default server URL when not configured
- **WHEN** `krokiServerUrl` is not set in the extension config and `KROKI_SERVER_URL` is not set
- **THEN** Kroki URLs SHALL default to `https://kroki.io`

### Requirement: Kroki server URL via environment variable
The `KROKI_SERVER_URL` environment variable SHALL override the `krokiServerUrl` extension config option. When set, the system SHALL use its value as the Kroki server base URL.

#### Scenario: Env var overrides config
- **WHEN** `krokiServerUrl: http://other-server:8001` is in the playbook config
- **AND** `KROKI_SERVER_URL=http://env-server:8000` is set in the environment
- **THEN** Kroki URLs SHALL use `http://env-server:8000`

#### Scenario: Env var used when config is absent
- **WHEN** `krokiServerUrl` is not in the playbook config
- **AND** `KROKI_SERVER_URL=http://localhost:8000` is set in the environment
- **THEN** Kroki URLs SHALL use `http://localhost:8000`
