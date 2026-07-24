## ADDED Requirements

### Requirement: Graph stores and retrieves items
The TraceabilityGraph SHALL store items and allow retrieval by various criteria.

#### Scenario: Add single item
- **WHEN** addItem() is called with a valid Item
- **THEN** item is stored and can be retrieved via getAllItems()

#### Scenario: Add multiple items
- **WHEN** addItem() is called multiple times with different Items
- **THEN** all items are stored and can be retrieved

#### Scenario: Get items by role
- **WHEN** getItemsByRole() is called with an existing role
- **THEN** method returns all items with that role

#### Scenario: Get items by non-existent role
- **WHEN** getItemsByRole() is called with a non-existent role
- **THEN** method returns empty array

---

### Requirement: Graph stores and retrieves relationships
The TraceabilityGraph SHALL store relationships between items and allow retrieval.

#### Scenario: Add relationship between items
- **WHEN** addRelationship() is called with a valid ItemRelationship
- **THEN** relationship is stored and can be retrieved via getAllRelationships()

#### Scenario: Get relationships from item
- **WHEN** getRelationships() is called with an item ID
- **THEN** method returns all relationships from that item

#### Scenario: Get relationships with filter
- **WHEN** getRelationships() is called with an item ID and type filter
- **THEN** method returns only relationships of that type from the item

---

### Requirement: Graph provides related items queries
The TraceabilityGraph SHALL provide methods to query related items.

#### Scenario: Get items related to a given item
- **WHEN** getRelatedItems() is called with an item ID
- **THEN** method returns all items reachable from the given item

#### Scenario: Get items with relation to a given item
- **WHEN** getItemsWithRelationTo() is called with an item ID
- **THEN** method returns all items that have relationships pointing to the given item

#### Scenario: Get relationships by roles
- **WHEN** getRelationshipsByRoles() is called with source and target roles
- **THEN** method returns all relationships from source role to target role

---

### Requirement: Graph validates relations based on configuration
The TraceabilityGraph SHALL validate relations based on role configuration.

#### Scenario: Validate with valid relations
- **WHEN** validate() is called on a graph with only valid relations
- **THEN** validation returns no errors

#### Scenario: Validate with invalid relation
- **WHEN** addRelationship() is called with a relation not allowed by configuration
- **THEN** relation is still added but a warning is generated

#### Scenario: Validate with unknown role
- **WHEN** addItem() is called with an item with unknown role
- **THEN** item is added but a warning is generated

---

### Requirement: Graph provides path finding
The TraceabilityGraph SHALL find paths between items.

#### Scenario: Find path between connected items
- **WHEN** findPath() is called with two item IDs that are connected
- **THEN** method returns array of item IDs representing the path

#### Scenario: Find path between disconnected items
- **WHEN** findPath() is called with two item IDs with no path between them
- **THEN** method returns null

#### Scenario: Find path with max depth
- **WHEN** findPath() is called with a maxDepth parameter
- **THEN** method only searches up to maxDepth levels

---

### Requirement: Graph provides impact analysis
The TraceabilityGraph SHALL analyze impact of items.

#### Scenario: Get impact analysis
- **WHEN** getImpactAnalysis() is called with an item ID
- **THEN** method returns all item IDs reachable from the given item

---

### Requirement: Graph provides statistics
The TraceabilityGraph SHALL provide role statistics.

#### Scenario: Get role statistics
- **WHEN** getRoleStatistics() is called
- **THEN** method returns object with counts per role

#### Scenario: Statistics with no items
- **WHEN** getRoleStatistics() is called on empty graph
- **THEN** method returns empty object

---

### Requirement: Graph supports merging
The TraceabilityGraph SHALL support merging with another graph.

#### Scenario: Merge empty graph
- **WHEN** merge() is called with an empty graph
- **THEN** original graph remains unchanged

#### Scenario: Merge graph with items
- **WHEN** merge() is called with a graph containing items
- **THEN** all items from other graph are added to this graph

#### Scenario: Merge graph with duplicate items
- **WHEN** merge() is called with a graph containing items with duplicate IDs
- **THEN** duplicate items are added (ID conflicts are allowed)
