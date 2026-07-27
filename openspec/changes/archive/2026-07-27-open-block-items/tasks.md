# Tasks: Open Block Items

## 1. DocumentParser Update

- [x] 1.1 Update `extractBlock()` to accept both `====` and `--` delimiters
- [x] 1.2 Use the found delimiter for closing detection (if opened with `--`, close with `--`)

## 2. Example Site Conversion

- [x] 2.1 Replace `====` with `--` in `requirements.adoc` (36 items)
- [x] 2.2 Replace `====` with `--` in `architecture.adoc` (3 items using `====`)
- [x] 2.3 Replace `====` with `--` in `test-plan.adoc` (8 items)
- [x] 2.4 Verify ARC-001 already uses `--` and continues to work

## 3. Verification

- [x] 3.1 Run `npm test` — all tests pass (194)
- [x] 3.2 Run `npx antora antora-playbook.yml` — zero errors
- [x] 3.3 Run `node examples/run-example.js` — items parse correctly with `--` (44 items, 62 relationships, 0 errors)
- [x] 3.4 Verify rendered output shows clean block titles without "Example N." prefix
