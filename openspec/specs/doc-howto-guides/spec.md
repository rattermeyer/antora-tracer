## Purpose

The example site documentation follows the Diátaxis framework. The How-to Guides section provides task-oriented pages that each answer a specific "How do I…?" question.

## Requirements

### Requirement: How-to guide pages exist for key tasks
The example site SHALL include How-to guide pages covering the following tasks:
- Custom domain model definition
- New project setup
- Writing traceable items
- Neo4j export
- Using partial files with items
- Adding traceability visualizations
- Troubleshooting common issues
- Contributing to the project (extracted from developer guide)

#### Scenario: Each how-to page answers a specific task
- **WHEN** a reader navigates to any How-to guide
- **THEN** the title SHALL be "How to <verb> <object>" (e.g., "How to define a custom domain model")
- **AND** the page SHALL focus on completing that one task without digressions

### Requirement: How-to guides link to Reference
Each How-to guide page SHALL include links to relevant Reference pages for option details and syntax specifications.

#### Scenario: How-to page links to Reference
- **WHEN** a how-to guide mentions a configuration option or macro syntax
- **THEN** it SHALL link to the corresponding Reference page for exhaustive details

### Requirement: How-to guides section in navigation
The example site navigation SHALL include a "How-to Guides" section containing all how-to pages, ordered by typical usage frequency.

#### Scenario: Navigation shows How-to Guides section
- **WHEN** the example site is built with Antora
- **THEN** the navigation SHALL display "How-to Guides" as a top-level section after Tutorial
- **AND** it SHALL contain all how-to pages as child items
