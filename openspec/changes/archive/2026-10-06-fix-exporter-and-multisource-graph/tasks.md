## 1. Scoped Graph Identity

- [x] 1.1 Add and test a shared identity-key utility matching component, version, and ID while preserving bare IDs for unscoped items
- [x] 1.2 Update graph item storage, lookup, and role indexes to preserve duplicate IDs across scopes; verify same-scope duplicates remain deduplicated
- [x] 1.3 Carry component and version on parsed relationships and resolve scoped endpoints deterministically; verify same-ID relationships stay within their component and ambiguous external targets warn without arbitrary resolution
- [x] 1.4 Update relationship deduplication, indexes, and graph traversal for scoped endpoints; verify existing unscoped graph queries retain behavior

## 2. Neo4j Export

- [x] 2.1 Export canonical identity and component/version fields for nodes in CSV and Cypher; verify same-ID scoped items produce distinct nodes
- [x] 2.2 Export CSV and Cypher relationships using canonical scoped endpoints while preserving authored IDs; verify endpoints resolve to their matching scoped nodes
- [x] 2.3 Verify local unscoped exports keep bare-ID node identity and relationship endpoints in both formats

## 3. Integration and Documentation

- [x] 3.1 Exercise a multi-component playbook export containing repeated IDs and relationships; verify both scoped nodes and correctly scoped endpoints appear in the generated Neo4j files
- [x] 3.2 Update Neo4j export reference documentation to explain scoped node identity and CSV endpoint fields; verify documented names and behavior match generated output