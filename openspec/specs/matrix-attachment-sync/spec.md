# matrix-attachment-sync

## Purpose

Register generated matrix files in the Antora content catalog as `attachment`-family files during the `contentClassified` event, before document conversion. This ensures `attachment$traceability/...` xrefs in AsciiDoc navigation and pages resolve without manual copying or committing matrix output.

## Requirements

### Requirement: Matrix files registered in the content catalog
The system SHALL register generated matrix files (HTML, CSV, JSON) as site attachments before document conversion, so that `attachment$traceability/...` xrefs in pages and navigation resolve correctly. Registration SHALL occur per component version and under every module that has AsciiDoc content. A committed copy, if present, SHALL have its contents refreshed in place.

#### Scenario: Matrices are registered for each component version
- **WHEN** the `contentClassified` event fires and a component version has traceable items
- **THEN** matrix files are added to the content catalog via `contentCatalog.addFile()` for that component version
- **AND** `attachment$traceability/...` xrefs in AsciiDoc navigation and pages resolve to the registered files

#### Scenario: Matrices are registered under every module with content
- **WHEN** a component version has AsciiDoc content in multiple modules
- **THEN** matrix files are registered under each such module
- **AND** module-relative `attachment$traceability/...` xrefs resolve from any of those modules

#### Scenario: A committed copy is refreshed in place
- **WHEN** an attachment with the same component, version, module, and relative path already exists in the content catalog
- **THEN** its contents are replaced with the freshly generated matrix output
- **AND** no duplicate attachment error is raised

#### Scenario: No traceable items
- **WHEN** a component version has no traceable items
- **THEN** no matrix files are registered

#### Scenario: Registration failure does not crash the build
- **WHEN** `contentCatalog.addFile()` throws (e.g., duplicate or malformed metadata)
- **THEN** a warning is logged
- **AND** the Antora build continues normally
