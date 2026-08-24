## 1. Spike

- [x] 1.1 Verify refname projection syntax against Antora 3.1 with a throwaway playbook
- [x] 1.2 Confirm unversioned `main` (`version: ~`) is treated as latest and its URL scheme (no version segment)
- [x] 1.3 Confirm `latest_version_segment` behavior when `main` is unversioned; decide whether to keep or remove it

## 2. Component versioning

- [x] 2.1 Set `examples/tracer/antora.yml` `version: ~` on `main`
- [x] 2.2 Add the refname projection mapping `v<major>.<minor>.x` (and `v<major>.<minor>.<patch>`) to `0.20`-style semantic versions
- [x] 2.3 Update `antora-playbook-ci.yml` to build `main` plus the maintenance branch
- [x] 2.4 Remove or relocate `latest_version_segment` / `latest_prerelease_version_segment` per 1.3

## 3. Release-consistency script

- [x] 3.1 Add a `scripts/release-check.*` that validates package.json ↔ tag ↔ branch ↔ playbook refs ↔ changelog
- [x] 3.2 Wire the script into CI (and pre-commit if suitable)
- [x] 3.3 Add tests for the script's pass/fail cases from `specs/release-consistency`

## 4. Docs and skill

- [ ] 4.1 Update the `publish` skill to teach the refname versioning model and the consistency check
- [ ] 4.2 Update explanation/reference docs for the new versioning model and URL scheme
- [ ] 4.3 Rebuild the site and verify the selector shows main plus each released version
