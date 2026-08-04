# matrix-attachment-sync

## Purpose

Automatically sync generated matrix files (HTML and CSV) from the global traceability output directory to each component version's `_attachments/traceability/` directory during the `sitePublished` event. This ensures `attachment$traceability/...` links in AsciiDoc navigation resolve to the latest matrix output without manual copying.

## Requirements

### Requirement: Matrix files synced to component _attachments
The system SHALL automatically sync generated matrix files (HTML and CSV) from the global traceability output directory to each component version's `_attachments/traceability/` directory during the `sitePublished` event. The sync SHALL resolve the correct version URL segment (e.g., `latest` instead of `0.7.0`) using the content catalog.

#### Scenario: Matrices are synced to all component versions
- **WHEN** the `sitePublished` event fires and matrices have been generated
- **THEN** generated matrix files are copied to `<component>/<version>/_attachments/traceability/` for each component version
- **AND** `attachment$traceability/...` links in AsciiDoc navigation resolve to the synced files

#### Scenario: Version URL segment uses catalog resolution
- **WHEN** matrix sync discovers a version segment via attachment file paths in the content catalog
- **THEN** the discovered segment (e.g., `latest`) is used instead of the raw version string (e.g., `0.7.0`)

#### Scenario: Fallback when content catalog has no attachment files
- **WHEN** the content catalog has no attachment files yet (first build)
- **THEN** the sync falls back to component version strings from `getComponents()`

#### Scenario: Stale files from previous builds are cleaned
- **WHEN** matrices are synced to `_attachments/traceability/`
- **THEN** existing files in the target directory are removed before copying
- **AND** only the current build's matrices remain

#### Scenario: No contentCatalog available
- **WHEN** the `sitePublished` event has no `contentCatalog` property
- **THEN** the sync is skipped with a warning
- **AND** no error is thrown

#### Scenario: Sync failure does not crash the build
- **WHEN** an I/O error occurs during sync (e.g., permission denied)
- **THEN** a warning is logged
- **AND** the Antora build continues normally
