## ADDED Requirements

### Requirement: Extension processes content
The RequirementsTraceabilityExtension SHALL process AsciiDoc content with item macros.

#### Scenario: Process content with single item
- **WHEN** process() is called with content containing one [item] macro
- **THEN** method returns ParserResult with one item and the graph contains the item

#### Scenario: Process content with multiple items
- **WHEN** process() is called with content containing multiple [item] macros
- **THEN** method returns ParserResult with all items and the graph contains all items

#### Scenario: Process content with relationships
- **WHEN** process() is called with content containing items with inline relationships
- **THEN** method returns ParserResult with items and relationships, and graph contains both

#### Scenario: Process empty content
- **WHEN** process() is called with empty content
- **THEN** method returns ParserResult with empty items array

---

### Requirement: Extension processes multiple files
The RequirementsTraceabilityExtension SHALL process multiple files at once.

#### Scenario: Process multiple files
- **WHEN** processFiles() is called with array of file objects
- **THEN** all files are processed and their items/relationships are added to the graph

#### Scenario: Process multiple files with same item IDs
- **WHEN** processFiles() is called with files containing duplicate item IDs
- **THEN** all items are added to the graph (duplicates are allowed)

---

### Requirement: Extension provides query methods
The RequirementsTraceabilityExtension SHALL provide methods to query the graph.

#### Scenario: Get all items
- **WHEN** getAllItems() is called
- **THEN** method returns all items in the graph

#### Scenario: Get items by role
- **WHEN** getItemsByRole() is called with a role name
- **THEN** method returns all items with that role

#### Scenario: Get all relationships
- **WHEN** getAllRelationships() is called
- **THEN** method returns all relationships in the graph

#### Scenario: Get relationships from item
- **WHEN** getRelationships() is called with an item ID
- **THEN** method returns all relationships from that item

#### Scenario: Get related items
- **WHEN** getRelatedItems() is called with an item ID
- **THEN** method returns all items reachable from the given item

#### Scenario: Get role statistics
- **WHEN** getRoleStatistics() is called
- **THEN** method returns object with counts per role

---

### Requirement: Extension validates content
The RequirementsTraceabilityExtension SHALL validate the traceability graph.

#### Scenario: Validate with no errors
- **WHEN** validate() is called on a valid graph
- **THEN** method returns ValidationResult with empty errors array

#### Scenario: Validate with configuration errors
- **WHEN** getConfigErrors() is called without configuration loaded
- **THEN** method returns array with error message

---

### Requirement: Extension provides Neo4j export
The RequirementsTraceabilityExtension SHALL export data to Neo4j format.

#### Scenario: Create Neo4j exporter
- **WHEN** createNeo4jExporter() is called
- **THEN** method returns a Neo4jExporter instance initialized with the graph

#### Scenario: Export to Neo4j CSV
- **WHEN** exportToNeo4jCSV() is called with valid options
- **THEN** method returns Neo4jExportResult with node and relationship data

---

### Requirement: Extension provides coverage reports
The RequirementsTraceabilityExtension SHALL provide coverage analysis.

#### Scenario: Get coverage report
- **WHEN** getCoverageReport() is called
- **THEN** method returns object with role counts and matrix-specific coverage

#### Scenario: Get matrix definitions
- **WHEN** getMatrixDefinitions() is called
- **THEN** method returns array of configured matrix definitions

---

### Requirement: Extension provides role validation
The RequirementsTraceabilityExtension SHALL validate roles against configuration.

#### Scenario: Check known role
- **WHEN** isKnownRole() is called with a role from configuration
- **THEN** method returns true

#### Scenario: Check unknown role
- **WHEN** isKnownRole() is called with a role not in configuration
- **THEN** method returns false

#### Scenario: Check allowed relation
- **WHEN** isRelationAllowed() is called with allowed source/target/relation
- **THEN** method returns true

#### Scenario: Check disallowed relation
- **WHEN** isRelationAllowed() is called with disallowed source/target/relation
- **THEN** method returns false

#### Scenario: Get allowed relations
- **WHEN** getAllowedRelations() is called with source and target roles
- **THEN** method returns array of allowed relation types

---

### Requirement: Extension provides preset management
The RequirementsTraceabilityExtension SHALL list and retrieve presets.

#### Scenario: List presets
- **WHEN** listPresets() is called
- **THEN** method returns array of preset metadata objects

#### Scenario: Get preset
- **WHEN** getPreset() is called with valid preset name
- **THEN** method returns Preset object

---

### Requirement: Extension provides lifecycle methods
The RequirementsTraceabilityExtension SHALL provide methods for graph lifecycle management.

#### Scenario: Clear graph
- **WHEN** clear() is called
- **THEN** graph is cleared of all items and relationships

#### Scenario: Reset with new configuration
- **WHEN** resetWithConfig() is called with a new ConfigLoader
- **THEN** extension is reconfigured with new configuration and graph is updated
