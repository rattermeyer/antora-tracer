## 1. Create PlantUML diagrams

- [x] 1.1 Create `examples/component-one/modules/ROOT/examples/api-overview.puml` — class diagram showing all key component interfaces and their public method signatures
- [x] 1.2 Create `examples/component-one/modules/ROOT/examples/parser-flow.puml` — activity diagram of DocumentParser's multi-step regex pipeline
- [x] 1.3 Create `examples/component-one/modules/ROOT/examples/graph-lifecycle.puml` — state diagram of TraceabilityGraph lifecycle (Empty → Populated → Complete)
- [x] 1.4 Create `examples/component-one/modules/ROOT/examples/prepared-file-caching.puml` — activity diagram of PreparedFile caching feeding five expand methods

## 2. Integrate diagrams into architecture document

- [x] 2.1 Add `api-overview.puml` include to Building Block View (ARC-002), after the component diagram
- [x] 2.2 Add `parser-flow.puml` include to the DocumentParser component description (ARC-017)
- [x] 2.3 Add `graph-lifecycle.puml` include to the TraceabilityGraph component description (ARC-015)
- [x] 2.4 Add `prepared-file-caching.puml` include to the contentClassified processing flow area (ARC-003 or ARC-016), with a brief explanation tying it to the pass pipeline diagram
- [x] 2.5 Add descriptive prose introducing each diagram (1–2 sentences explaining what the reader should take away)

## 3. Update the update-example-site skill

- [x] 3.1 Replace the current architecture section (step 4) in `SKILL.md` with an expanded version that includes:
  - Diagram checklist per arc42 section (expected diagrams, when to update)
  - Diagram type decision guide (component vs class vs sequence vs activity vs state)
  - Placement conventions (`examples/` directory, `include::example$name.puml[]` syntax)
  - Guidance: when a component's internal logic spans more than ~20 lines of prose, add an activity diagram
- [x] 3.2 Update ARC item count expectations in the skill (new diagrams may warrant new ARC items or update existing ones)

## 4. Verify

- [x] 4.1 Run `npx antora antora-playbook.yml` to verify all diagrams render without errors
- [x] 4.2 Run `node examples/run-example.js` to regenerate traceability matrices
- [x] 4.3 Run `npm test` to verify no regressions
