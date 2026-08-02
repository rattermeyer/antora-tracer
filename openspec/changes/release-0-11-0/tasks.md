## 1. Version bump

- [x] 1.1 Update version in `package.json` from `0.10.0` to `0.11.0` and `examples/antora.yml` from `0.10` to `0.11`

## 2. Changelog

- [x] 2.1 Add `[0.11.0]` section to `CHANGELOG.md` with Added, Fixed, and Changed entries

## 3. Build and verify

- [x] 3.1 Run `npm install` to update `package-lock.json`
- [x] 3.2 Run `npm run build` to verify clean compilation
- [x] 3.3 Run `npm test` to verify 249 tests pass

## 4. Commit and tag

- [ ] 4.1 Commit version bump and changelog: `chore: bump to 0.11.0, update changelog`
- [ ] 4.2 Create annotated tag: `git tag -a v0.11.0 -m "v0.11.0"`
- [ ] 4.3 Push commit and tag: `git push && git push --tags`

## 5. Publish

- [ ] 5.1 Run `npm publish` to publish to npm
