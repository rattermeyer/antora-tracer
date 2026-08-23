## 1. Retire CLI matrix generation

- [x] 1.1 Remove matrix generation from `examples/run-example.js` (keep file processing, validation summary, and Neo4j export)
- [x] 1.2 Delete the 12 committed matrix files from `examples/tracer/modules/ROOT/attachments/traceability/`

## 2. Update docs and specs

- [x] 2.1 Update `AGENTS.md` (two references to `run-example.js` matrix regeneration)
- [x] 2.2 Update `examples/README.adoc`, `index.adoc`, and `traceability/index.adoc`
- [x] 2.3 Update `.pi/skills/update-example-site/SKILL.md`
- [x] 2.4 Sync the two spec deltas to main specs

## 3. Verify

- [x] 3.1 Rebuild the example site and confirm matrix xrefs still resolve
- [x] 3.2 Run `node examples/run-example.js` and confirm Neo4j CSV is still generated
