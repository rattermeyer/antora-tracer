## ADDED Requirements

### Requirement: Neo4j CSV export

The system SHALL export the traceability graph to Neo4j CSV format for import into Neo4j database.

#### Scenario: Export nodes as CSV
- **WHEN** user requests Neo4j CSV export
- **THEN** system creates `nodes.csv` file
- **AND** file contains header row with `id`, `role`, `title` columns
- **AND** each subsequent row represents one traceability item

#### Scenario: Export relationships as CSV
- **WHEN** user requests Neo4j CSV export
- **THEN** system creates `relationships.csv` file
- **AND** file contains header row with `source`, `target`, `type` columns
- **AND** each subsequent row represents one relationship

#### Scenario: CSV files are valid for Neo4j import
- **WHEN** CSV files are generated
- **THEN** files use comma delimiter
- **AND** string values are properly quoted and escaped
- **AND** files can be imported using Neo4j's `LOAD CSV` command

### Requirement: Neo4j Cypher export

The system SHALL export the traceability graph to Neo4j Cypher format for direct execution.

#### Scenario: Export as Cypher CREATE statements
- **WHEN** user requests Neo4j Cypher export
- **THEN** system creates `import.cypher` file
- **AND** file contains CREATE statements for all nodes
- **AND** file contains CREATE statements for all relationships

#### Scenario: Cypher includes labels
- **WHEN** exporting to Cypher
- **THEN** each node has `:Item` label
- **AND** each node has an additional label matching its role (e.g., `:Requirement`)
- **AND** relationships have labels matching their type (e.g., `:ADDRESSES`)

#### Scenario: Cypher file is executable
- **WHEN** Cypher file is generated
- **THEN** file can be executed using `cypher-shell`
- **AND** all statements use valid Cypher syntax
- **AND** special characters in values are properly escaped

### Requirement: Export command in CLI

The system SHALL provide a CLI command for Neo4j export.

#### Scenario: CLI export command
- **WHEN** user runs `antora-traceability export-neo4j -i docs/ -o output/`
- **THEN** system processes all AsciiDoc files in `docs/`
- **AND** system exports to `output/` directory
- **AND** system creates nodes.csv, relationships.csv, and import.cypher

#### Scenario: CLI export with format option
- **WHEN** user specifies `--format csv` or `--format cypher`
- **THEN** system exports only the requested format
- **AND** system creates appropriate files for that format

### Requirement: Export includes all item attributes

The system SHALL include all available attributes in the Neo4j export.

#### Scenario: Node export with attributes
- **WHEN** exporting an item with custom attributes
- **THEN** system includes all attributes as node properties
- **AND** attributes are properly formatted for CSV/Cypher

#### Scenario: Handle special characters
- **WHEN** an item has attributes with special characters (quotes, commas, newlines)
- **THEN** system properly escapes these characters
- **AND** export remains valid for Neo4j import

### Requirement: Export is optional

The Neo4j export functionality SHALL be completely optional and not affect normal extension operation.

#### Scenario: Normal operation without Neo4j
- **WHEN** user does not use Neo4j export
- **THEN** extension works normally
- **AND** no Neo4j dependencies are required at runtime

#### Scenario: Missing Neo4j has no impact
- **WHEN** Neo4j is not installed
- **THEN** export command still works
- **AND** export generates files that can be imported later
