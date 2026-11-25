## ADDED Requirements

### Requirement: Structured output goes to stdout, progress to stderr
Every CLI command SHALL write only its primary output to stdout and SHALL write progress, status, and confirmation lines to stderr, so a command's stdout can be piped directly into a parser. This applies to machine-readable output (`matrix -f json|csv`, `seed`, `site-graph`, `diff-graphs --json`, `query --json`) and to human-facing banners and confirmations alike.

#### Scenario: matrix JSON is parseable without stripping a line
- **WHEN** user runs `antora-tracer matrix -i docs --config traceability.yml -t requirements-tests -f json` and captures stdout
- **THEN** stdout SHALL be the JSON document alone
- **AND** parsing it SHALL succeed with no line skipped

#### Scenario: matrix CSV starts at the header row
- **WHEN** user runs the same command with `-f csv`
- **THEN** the first line of stdout SHALL be the CSV header row

#### Scenario: seed output is parseable YAML
- **WHEN** user runs `antora-tracer seed -i docs` and captures stdout
- **THEN** stdout SHALL be the YAML document alone

#### Scenario: Progress is still visible to a human
- **WHEN** any command writes a progress or confirmation line
- **THEN** it SHALL appear on stderr
- **AND** it SHALL NOT appear on stdout

#### Scenario: Writing to a file leaves stdout empty
- **WHEN** a command writes its output to a file via `-o`
- **THEN** stdout SHALL be empty
- **AND** the confirmation SHALL appear on stderr
