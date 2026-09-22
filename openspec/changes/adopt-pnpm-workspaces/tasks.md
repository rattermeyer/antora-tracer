## 1. Workspace setup

- [x] 1.1 Add `pnpm-workspace.yaml` declaring `packages: [id-server]`, and set the `packageManager` field to pin the pnpm version. Verify: `pnpm --version` matches the pinned version.
- [x] 1.2 Generate the root `pnpm-lock.yaml` from the existing dependency graph and remove `id-server/package-lock.json` and `id-server/node_modules`. Verify: `pnpm install --frozen-lockfile` succeeds and installs once at the root.

## 2. Patch conversion

- [x] 2.1 Move the `@antora/assembler` and `@antora/lunr-extension` patches from `patches/` into `package.json` `pnpm.patchedDependencies`, and drop `patch-package` and its `postinstall`. Verify: `pnpm install` applies both patches and the `patches/` directory is removed.

## 3. Phantom-dependency sweep

- [x] 3.1 Run `pnpm install` and add every transitively-imported-but-undeclared dependency to the correct `package.json` (root or `id-server`) until strict install passes. Verify: `pnpm install --frozen-lockfile` completes with no undeclared-dependency errors.

## 4. Tooling sweep

- [x] 4.1 Update `ci.yml`, `pages.yml`, and `release.yml` from `npm ci`/`npm run` to `pnpm install --frozen-lockfile`/`pnpm run`. Verify: a CI-style run of each command succeeds.
- [x] 4.2 Update the `Dockerfile` and `devbox.json` init hook from npm to pnpm. Verify: the `id-server` Docker image builds and `devbox shell` installs via pnpm.
- [x] 4.3 Update `.pre-commit-config.yaml` hooks (`npx biome` → `pnpm exec biome`). Verify: `pre-commit run --all-files` passes.

## 5. Cross-package dependency pattern

- [x] 5.1 Wire `id-server`'s dependency on `@antora-tracer/core` (if any) and document the `workspace:*` pattern for the forthcoming `@antora-tracer/vscode` package. Verify: a `workspace:*` reference resolves to the local package and rewrites to a real version on `pnpm pack`.

## 6. Verification

- [x] 6.1 Run `pnpm install --frozen-lockfile`, `pnpm -r build`, `pnpm test`, and `pnpm lint` across the workspace. Verify: all pass.
- [x] 6.2 Confirm the `id-server` Docker build still succeeds and the two patched packages behave (lunr indexing, assembler). Verify: the existing test suite is green end-to-end.
