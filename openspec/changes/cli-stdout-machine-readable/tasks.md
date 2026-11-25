## 1. Route progress to stderr

- [x] 1.1 Add a `status()` helper that writes to stderr, and verify the matrix banner no longer appears on stdout
- [x] 1.2 Route every progress banner and confirmation line through `status()` (matrix, seed, site-graph, process, validate, neo4j, stats, preset, config validate), and verify `pnpm run build` succeeds
- [x] 1.3 Verify `matrix -f json` stdout parses as JSON, `-f csv` starts at the header row, `seed` stdout parses as YAML, and `site-graph` stdout is unchanged

## 2. Tests

- [x] 2.1 Add CLI tests that pipe `matrix -f json`, `matrix -f csv`, and `seed` stdout into a parser, and verify the matrix tests fail when the banner is moved back to stdout
- [x] 2.2 Run `pnpm test` (627 passing) and `pnpm run lint`

## 3. Document

- [x] 3.1 Sync the delta specs into `openspec/specs/cli-query/spec.md` and `openspec/specs/doc-reference/spec.md`
- [x] 3.2 State the stdout/stderr contract in `reference/cli.adoc`, add the REQ item, and regenerate the traceability output
- [x] 3.3 Rebuild the example site and verify no regressions
