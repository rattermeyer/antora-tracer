# Semantic Relation Review

## Purpose

Review the outgoing traceability relationships in a selected document for semantic support, triage actionable findings by impact, and let the user discuss them before optionally creating a review report.

## ADDED Requirements

### Requirement: Review covers outgoing relations in a selected document
The review SHALL accept a document as its scope and inspect the outgoing relationships declared by traceable items in that document. For each relation, the review SHALL consider the full source and target item content, item IDs and roles, configured relation type, and any available project-specific definition of that relation.

#### Scenario: Document contains outgoing relations
- **WHEN** the selected document contains traceable items with outgoing relations to existing items
- **THEN** the review evaluates each configured relation using the source and target item content and reports only actionable semantic findings

#### Scenario: Target item is outside the selected document
- **WHEN** an outgoing relation targets an item in another document
- **THEN** the review retrieves and considers the target item's content without expanding the review scope to that target document's outgoing relations

#### Scenario: Document has no outgoing relations
- **WHEN** the selected document contains no traceable outgoing relations
- **THEN** the review reports that no relations were found and does not invent findings

### Requirement: Review uses configured relation meanings
The review SHALL use the project's configured roles and relation types and apply explicit project-specific relation criteria when available. It SHALL NOT assume that a relation name has one universal meaning. If no explicit semantic criteria are available, it SHALL state that limitation and make judgments cautiously from the configured relation, inverse label, roles, and item content.

#### Scenario: Explicit criteria available
- **WHEN** the project provides criteria for a configured relation type
- **THEN** the review evaluates the source and target content against those criteria

#### Scenario: Criteria unavailable
- **WHEN** no project-specific criteria define a configured relation's semantic meaning
- **THEN** the review identifies the missing criteria as a limitation and does not present an uncertain interpretation as a fact

### Requirement: Structural validity is kept separate from semantic review
The review SHALL NOT duplicate structural validation of allowed role-relation pairs or target existence. Relations that are structurally invalid or have missing targets SHALL be excluded from semantic findings and identified as requiring the project's structural validation workflow.

#### Scenario: Structurally invalid or dangling relation
- **WHEN** evidence gathering identifies a relation that is disallowed by configuration or has a missing target
- **THEN** the review SHALL defer semantic judgment for that relation and distinguish the structural issue from semantic findings

### Requirement: Findings are prioritized by impact with confidence reported separately
Each actionable finding SHALL have a HIGH, MEDIUM, or LOW impact severity, a confidence indication separate from severity, a concise statement of the problem, and a concise suggested action. Severity SHALL reflect the likely impact of leaving the relationship as written; confidence SHALL reflect the strength of evidence for the judgment. Relationships with no actionable semantic concern SHALL be omitted from the findings list.

#### Scenario: Clearly misleading relation
- **WHEN** a relation is strongly contradicted by the linked item content and could mislead traceability or design-control decisions
- **THEN** the review reports a HIGH-severity finding, states the mismatch, suggests a concrete next action, and reports confidence separately

#### Scenario: Material but uncertain relation
- **WHEN** a relation may be valid but available content is insufficient or permits materially different interpretations
- **THEN** the review reports a MEDIUM-severity finding with appropriately qualified confidence and asks for human judgment rather than asserting it is wrong

#### Scenario: Minor actionable relation concern
- **WHEN** a relation is substantially supported but a limited clarification would improve traceability quality
- **THEN** the review MAY report a LOW-severity finding with a concise suggested improvement

#### Scenario: Relation is adequately supported
- **WHEN** the linked content supports the configured relation and there is no actionable concern
- **THEN** the review does not emit a finding for that relation

### Requirement: Findings are presented interactively before any report is written
The review SHALL first present a concise document-level count or summary, then present actionable findings in severity order with their source item, relation, target item, problem, suggested action, and confidence. It SHALL allow the user to discuss or clarify findings and SHALL ask whether to create an AsciiDoc report only after presenting the findings. It SHALL NOT modify source documents or create a report without explicit user approval.

#### Scenario: Interactive findings review
- **WHEN** the document review produces actionable findings
- **THEN** the review presents them in HIGH, MEDIUM, LOW order and invites the user to discuss or clarify them before offering a report

#### Scenario: No actionable findings
- **WHEN** all structurally valid outgoing relations are adequately supported
- **THEN** the review reports no actionable semantic findings and does not create a report

### Requirement: Optional AsciiDoc report is safe and user-directed
If the user approves creating a report, the review SHALL confirm the destination path before writing. The report SHALL contain the agreed findings and SHALL NOT contain traceable `[item]` blocks or relationship macros. Before writing next to an Antora-managed document, the review SHALL warn that Antora may publish or process the report. The report SHALL not be placed beside the source document without explicit path approval.

#### Scenario: User requests a report
- **WHEN** the user approves an AsciiDoc report and confirms its destination
- **THEN** the review creates a plain AsciiDoc report at that destination containing the approved findings

#### Scenario: User declines report or has not approved path
- **WHEN** the user declines the report or has not confirmed its destination
- **THEN** no report file is written

#### Scenario: Report adjacent to Antora source
- **WHEN** the user proposes placing the report beside a document managed by Antora
- **THEN** the review explains the publication/processing risk and waits for confirmation of that destination before writing

### Requirement: Review remains distinct from abstraction-level review
The review SHALL assess the meaning of outgoing relationships between linked items, including items of different roles. It SHALL NOT replace or duplicate the `abstraction-level-review` skill's judgment about altitude consistency among same-role items in one document.

#### Scenario: Design links to requirement
- **WHEN** a design item links to a requirement item using a configured relation such as `addresses`
- **THEN** the review judges the semantic support of that link from both items' content

#### Scenario: Requirement refines requirement
- **WHEN** a requirement links to another requirement using a configured relation such as `refines`
- **THEN** the review judges whether the linked content supports refinement without reviewing the document's overall abstraction consistency