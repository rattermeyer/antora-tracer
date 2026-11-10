## Purpose

Derive a namespaced CSS class from an item's own metadata and emit it on the rendered item block, so a site stylesheet can attach status badges, state icons, or state styling without the extension producing presentational markup.

## ADDED Requirements

### Requirement: Rendered item blocks expose a namespaced class derived from item metadata

When an item declares a `status`, the system SHALL add a CSS class derived from that value to the item's rendered block, in addition to the existing semantic role class. The class SHALL use a distinct namespace so it cannot be confused with the coverage classes the matrix emits for a different meaning. The emitted class SHALL be inert: the system SHALL NOT render any icon, badge, text, or color for it.

#### Scenario: Item with a status carries a namespaced status class
- **WHEN** an item declares `status="draft"` and is rendered by Asciidoctor
- **THEN** the item block SHALL carry a class derived from `draft` in the status namespace
- **AND** the item's semantic role class SHALL remain present
- **AND** the item's anchor SHALL remain unchanged

#### Scenario: Item without a status carries no status class
- **WHEN** an item declares no `status`
- **THEN** the item block SHALL NOT carry any class in the status namespace
- **AND** the rest of its rendered block SHALL be unchanged

#### Scenario: Status class does not collide with matrix coverage classes
- **WHEN** an item declares a status whose derived class name is identical to a matrix coverage class name
- **THEN** the two classes SHALL remain distinguishable by their namespace
- **AND** matrix coverage styling SHALL NOT apply to the item block, and item status styling SHALL NOT apply to matrix rows

#### Scenario: Emitted class renders no visible decoration by itself
- **WHEN** an item carries a status class and the site stylesheet defines no rule for that class
- **THEN** the rendered output SHALL show no icon, badge, or other decoration for it

### Requirement: Status class names are normalized from free-form values

Item status values are free-form strings. The system SHALL normalize a status value into a class name that is valid as a CSS class and stable for a given value, and SHALL emit a class for every non-empty value. Values differing only in case SHALL produce the same class. A value that normalizes to nothing SHALL emit no class.

#### Scenario: Status with spaces and mixed case
- **WHEN** items declare `status="In Review"` and `status="in review"`
- **THEN** both SHALL carry the same normalized status class

#### Scenario: Status with punctuation
- **WHEN** an item declares `status="2.1"` or `status="open/closed"`
- **THEN** the emitted class SHALL be a valid class name derived from that value
- **AND** it SHALL be distinguishable from the class derived from any other declared value

#### Scenario: Status that normalizes to nothing
- **WHEN** an item declares a status consisting only of whitespace or non-alphanumeric characters
- **THEN** no status class SHALL be emitted for it

### Requirement: Status class emission requires no configuration

The status class SHALL be emitted for every item that declares a status, without a site, component, page, or playbook configuration option, and without an author opting in per item. Choosing whether and where the class becomes visible SHALL be the site stylesheet's responsibility.

#### Scenario: No configuration yields the class
- **WHEN** an item declares a status and no traceability status-related configuration is set anywhere
- **THEN** the item block SHALL still carry the derived status class

#### Scenario: Stylesheet controls visibility
- **WHEN** a site stylesheet defines a decoration for the derived status class
- **THEN** the decoration SHALL apply to items whose status derives that class
- **AND** stylesheet rules scoped to particular pages SHALL limit the decoration to those pages

### Requirement: Status class emission does not alter item semantics

Emitting the status class SHALL NOT change the item's ID, role, title, stored status value, tags, attributes, or relationships, and SHALL NOT affect the matrix, graph, or export output for that item.

#### Scenario: Graph data is unchanged
- **WHEN** an item declares a status and is processed by the extension
- **THEN** its stored status value, attributes, and relationships SHALL be identical to those produced without this change

#### Scenario: Matrix output is unchanged
- **WHEN** a matrix is generated for roles containing items with statuses
- **THEN** the matrix content SHALL be identical to that produced without this change
