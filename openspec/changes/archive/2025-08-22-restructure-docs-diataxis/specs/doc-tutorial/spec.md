## ADDED Requirements

### Requirement: Getting Started tutorial page
The example site SHALL include a single Tutorial page (`getting-started.adoc`) that guides a first-time user from zero to a working traceability setup in numbered, sequential steps.

#### Scenario: First-time user follows the tutorial
- **WHEN** a reader navigates to the Tutorial section
- **THEN** they find a single page with sequential, numbered steps from installation through viewing output
- **AND** the page contains no digressions into option listings, conceptual explanations, or configuration references

#### Scenario: Tutorial does not link out
- **WHEN** a reader follows the tutorial
- **THEN** the tutorial SHALL NOT include links to Reference or Explanation pages
- **AND** may include a single link to relevant How-to guides at the conclusion ("Next steps")

### Requirement: Tutorial in navigation
The example site navigation SHALL include a "Tutorial" section as the first top-level item, containing the Getting Started page.

#### Scenario: Navigation shows Tutorial section
- **WHEN** the example site is built with Antora
- **THEN** the navigation SHALL display "Tutorial" as a top-level section
- **AND** it SHALL be the first section in the navigation tree
