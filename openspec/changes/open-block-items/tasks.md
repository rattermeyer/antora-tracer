# Tasks: Open Block Items

## 1. DocumentParser Update

- [ ] 1.1 Update `extractBlock()` to accept both `====` and `--` delimiters
- [ ] 1.2 Use the found delimiter for closing detection (if opened with `--`, close with `--`)

## 2. Example Site Conversion

- [ ] 2.1 Replace `====` with `--` in `requirements.adoc` (36 items)
- [ ] 2.2 Replace `====` with `--` in `architecture.adoc` (3 items using `====`)
- [ ] 2.3 Replace `====` with `--` in `test-plan.adoc` (8 items)
- [ ] 2.4 Verify ARC-001 already uses `--` and continues to work

## 3. Verification

- [ ] 3.1 Run `npm test` — all tests pass
- [ ] 3.2 Run `npx antora antora-playbook.yml` — zero errors
- [ ] 3.3 Run `node examples/run-example.js` — items parse correctly with `--`
- [ ] 3.4 Verify rendered output shows clean block titles without "Example N." prefix
