## Purpose

Scope traceability to a denylist of Antora component names, applied consistently in the Antora build and in CLI playbook harvesting, so docs from unrelated projects stay out of the graph.

## ADDED Requirements

### Requirement: Excluded components are omitted from the traceability graph
When `excludeComponents` names a component, that component's `.adoc` pages and partials SHALL be excluded from traceability processing: their items do not enter the graph, their content is not rewritten by relation/graph/coverage macros, and no generated matrices, overview, or role-guidance attachments are registered for that component.

#### Scenario: Excluded component's items stay out of the graph
- **WHEN** a site publishes components `tracer` and `blog` and the extension config sets `excludeComponents: [blog]`
- **THEN** items authored in `blog` do not appear in the traceability graph, generated matrices, or the overview, while `tracer` items are processed in full

#### Scenario: Excluded component receives no generated attachments
- **WHEN** a component `blog` is excluded
- **THEN** no matrix, graph JSON, overview, or guidance attachment is registered for the `blog` component version

### Requirement: Exclusion is hard — references into excluded components stay unresolved
Exclusion SHALL NOT fabricate stub items. A relationship macro authored in an included document whose target item lives only in an excluded component SHALL remain an unresolved "pending target" and be reported as such, exactly as if the target had never been defined.

#### Scenario: Included document references an excluded item
- **WHEN** an included `tracer` item authors `addresses:REQ-9[]` and `REQ-9` is defined only in the excluded `blog` component
- **THEN** the relationship is stored pending target and reported with a "Target item not found" warning, and no stub `REQ-9` item is created

### Requirement: CLI playbook harvesting honors the same exclusion
When a CLI command that harvests a playbook (`export neo4j`, `seed`, `site-graph`) reads the extension's `excludeComponents`, the harvested files SHALL omit excluded components so the resulting graph matches the one the Antora build produces.

#### Scenario: Playbook harvest omits excluded components
- **WHEN** the CLI harvests a playbook whose extension config sets `excludeComponents: [blog]`
- **THEN** files from the `blog` component are omitted from the harvested set and from the resulting graph

### Requirement: Unlisted components are processed unchanged
An absent or empty `excludeComponents` SHALL leave behavior unchanged, and a component not named in the list SHALL be processed in full.

#### Scenario: No exclusion configured
- **WHEN** `excludeComponents` is absent or empty
- **THEN** every component is processed as before this change

#### Scenario: Partial exclusion leaves siblings intact
- **WHEN** a site has components `tracer`, `demo`, and `blog` and `excludeComponents: [blog]`
- **THEN** `tracer` and `demo` are processed in full and `blog` is not

### Requirement: Exclusion matches exact component names
`excludeComponents` entries SHALL match the Antora component name exactly; a component whose name merely contains or resembles an entry is not excluded.

#### Scenario: No substring or glob matching
- **WHEN** `excludeComponents: [demo]` and the site also has a component named `demo-sdk`
- **THEN** `demo` is excluded and `demo-sdk` is not
