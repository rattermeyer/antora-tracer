# Neo4j Export

## Purpose

Let the `export neo4j` command build its graph from the complete cross-source catalog — every component and repository in an Antora playbook — instead of only a single local directory.

## Requirements

### Requirement: export neo4j accepts a local directory or a playbook
The `export neo4j` command SHALL accept either `-i <dir>` to process a local directory, or a playbook path to harvest every component and repository in that playbook.

#### Scenario: local directory
- **WHEN** `antora-tracer export neo4j -i docs/` is run
- **THEN** the command processes the files under `docs/` and exports them to Neo4j

#### Scenario: playbook
- **WHEN** `antora-tracer export neo4j antora-playbook.yml` is run
- **THEN** the command harvests every component and repository in the playbook and exports the complete graph to Neo4j

### Requirement: export neo4j requires an input
The `export neo4j` command SHALL require exactly one input — either `-i <dir>` or a playbook path — and SHALL exit with an error when neither is provided.

#### Scenario: missing input
- **WHEN** `antora-tracer export neo4j` is run with neither `-i` nor a playbook path
- **THEN** the command exits with a non-zero code and an error message

### Requirement: playbook export spans repositories
When a playbook is given, the exported graph SHALL include items from every component and repository in that playbook, not just a single component.

#### Scenario: multi-repository export
- **WHEN** a playbook aggregates components from multiple repositories
- **THEN** the Neo4j export includes nodes and relationships from all of them
