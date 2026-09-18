# Env File Loading

## Purpose

Make a project-local `.env` file available to configuration without manual shell setup, so `${VAR}` interpolation in `traceability.yml` and the id-server config resolves values like `idAllocation.token` automatically.

## Requirements

### Requirement: Entry points load a .env file
The CLI and the id-server SHALL load a `.env` file from the working directory into the process environment at startup, before reading configuration.

#### Scenario: .env values resolve interpolation
- **WHEN** the working directory contains a `.env` with `TRACER_ID_TOKEN=secret` and config references `${TRACER_ID_TOKEN}`
- **THEN** configuration loading resolves the reference to `secret`

#### Scenario: missing .env is not an error
- **WHEN** no `.env` file exists in the working directory
- **THEN** startup proceeds normally and behavior is unchanged

### Requirement: Process environment takes precedence
A variable already present in the process environment SHALL NOT be overridden by the `.env` file.

#### Scenario: process env wins
- **WHEN** `TRACER_ID_TOKEN` is already set in the process environment and `.env` also defines it
- **THEN** configuration resolves the process-environment value, not the `.env` value
