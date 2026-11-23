## MODIFIED Requirements

### Requirement: Harvested items carry component, module, and version scope

When items are harvested from a playbook, each item SHALL record the component, module, and version
of the content source it came from, and the content-source root that its relative source path belongs
to, so that same-ID items are disambiguated across sources and each item resolves to exactly one file
on disk.

#### Scenario: harvested item carries its scope

- **WHEN** an item is harvested from component `foo`, module `ROOT`, version `main`
- **THEN** the item SHALL record `component` as `foo`, `module` as `ROOT`, and version as `main`
- **AND** it SHALL record the content-source root the file was harvested from

#### Scenario: harvested item resolves to one file

- **WHEN** two content sources both define an item whose `sourceFile` is
  `modules/ROOT/pages/index.adoc`
- **THEN** each item SHALL resolve to the file in its own content-source root
- **AND** the two items SHALL NOT resolve to the same file
