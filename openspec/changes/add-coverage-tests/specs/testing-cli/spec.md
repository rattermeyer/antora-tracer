## ADDED Requirements

### Requirement: CLI process command executes successfully
The CLI SHALL execute the process command and return the expected output for valid input.

#### Scenario: Process single file
- **WHEN** user runs `antora-req-trace process -i <valid-file> -f html`
- **THEN** system processes the file and writes HTML output to ./output/traceability.html

#### Scenario: Process with missing input
- **WHEN** user runs `antora-req-trace process` without -i option
- **THEN** system exits with error code 1 and displays error message

#### Scenario: Process with invalid file
- **WHEN** user runs `antora-req-trace process -i <non-existent-file>`
- **THEN** system exits with error code 1 and displays "Input file not found" error

---

### Requirement: CLI matrix command generates matrices
The CLI SHALL generate traceability matrices from processed items.

#### Scenario: Generate default matrix
- **WHEN** user runs `antora-req-trace matrix -i <valid-file>`
- **THEN** system generates a CSV matrix and outputs to stdout

#### Scenario: Generate HTML matrix
- **WHEN** user runs `antora-req-trace matrix -i <valid-file> -f html`
- **THEN** system generates an HTML matrix and outputs to stdout

#### Scenario: Matrix with no input
- **WHEN** user runs `antora-req-trace matrix` without -i option
- **THEN** system exits with error code 1 and displays error message

---

### Requirement: CLI validate command checks traceability
The CLI SHALL validate traceability and report errors.

#### Scenario: Validate valid file
- **WHEN** user runs `antora-req-trace validate -i <valid-file>`
- **THEN** system reports no validation errors

#### Scenario: Validate with orphaned items
- **WHEN** user runs `antora-req-trace validate -i <file-with-orphans>`
- **THEN** system reports validation errors for orphaned items

#### Scenario: Validate with no input
- **WHEN** user runs `antora-req-trace validate` without -i option
- **THEN** system exits with error code 1

---

### Requirement: CLI export neo4j command works
The CLI SHALL export traceability data to Neo4j format.

#### Scenario: Export to CSV format
- **WHEN** user runs `antora-req-trace export neo4j -i <valid-file> -f csv -o <output-dir>`
- **THEN** system creates nodes.csv and relationships.csv in output directory

#### Scenario: Export to Cypher format
- **WHEN** user runs `antora-req-trace export neo4j -i <valid-file> -f cypher -o <output-dir>`
- **THEN** system creates import.cypher in output directory

#### Scenario: Export with no input
- **WHEN** user runs `antora-req-trace export neo4j` without -i option
- **THEN** system exits with error code 1

---

### Requirement: CLI stats command displays statistics
The CLI SHALL display traceability statistics.

#### Scenario: Stats for valid file
- **WHEN** user runs `antora-req-trace stats -i <valid-file>`
- **THEN** system displays item counts by role and relationship statistics

#### Scenario: Stats with no input
- **WHEN** user runs `antora-req-trace stats` without -i option
- **THEN** system exits with error code 1

---

### Requirement: CLI preset commands work
The CLI SHALL provide preset management commands.

#### Scenario: List presets
- **WHEN** user runs `antora-req-trace preset list`
- **THEN** system displays list of available presets with descriptions

#### Scenario: Show preset details
- **WHEN** user runs `antora-req-trace preset show <preset-name>`
- **THEN** system displays detailed preset configuration

#### Scenario: Initialize from preset
- **WHEN** user runs `antora-req-trace preset init <preset-name> -o <output-dir>`
- **THEN** system creates traceability.yml and sample requirements.adoc in output directory

#### Scenario: Show non-existent preset
- **WHEN** user runs `antora-req-trace preset show <non-existent-preset>`
- **THEN** system exits with error code 1 and displays error message

---

### Requirement: CLI help displays for all commands
The CLI SHALL display help text for all commands.

#### Scenario: Main help
- **WHEN** user runs `antora-req-trace --help`
- **THEN** system displays list of all commands with descriptions

#### Scenario: Command-specific help
- **WHEN** user runs `antora-req-trace process --help`
- **THEN** system displays help for process command with all options

#### Scenario: Version flag
- **WHEN** user runs `antora-req-trace --version`
- **THEN** system displays package version
