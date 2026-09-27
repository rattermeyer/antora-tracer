## 1. Graph query

- [x] 1.1 Add an outgoing transitive traversal that visits each item once, terminates on cycles, follows arbitrary path lengths, filters collected results by role, and excludes the start item. Verify convergent paths, a cycle, and traversal through intermediate roles.

## 2. CLI

- [x] 2.1 Add `query linked <id> <role>` with current local `--input` support, consistent table/JSON output, empty results, and the existing unknown-ID error behavior. Verify with a CLI fixture containing a multi-hop branch and inbound-only neighbor.
- [x] 2.2 Add `--snapshot <path>` for linked queries using the canonical `site-graph` snapshot format; reject simultaneous explicit local input and snapshot sources. Verify querying a snapshot containing nodes from multiple components and repositories.

## 3. Documentation

- [x] 3.1 Update the graph-query how-to and CLI reference with local and snapshot workflows, arbitrary-distance forward traversal semantics, and the global ID uniqueness prerequisite. Recommend `@antora-tracer/id-server` seeded from the playbook, with shared allocation settings.

## 4. Verification

- [x] 4.1 Run focused query-command and graph traversal checks, including the local multi-hop example and snapshot-backed multi-source query.
