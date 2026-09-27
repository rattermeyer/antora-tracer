## Why

The repo is a multi-package monorepo (`@antora-tracer/core` + `@antora-tracer/id-server`, with a VS Code extension coming) held together without workspace tooling: `id-server` has its own lockfile and duplicate `node_modules`, and patches are managed by `patch-package`. Adopting pnpm workspaces gives a single lockfile, deduplicated installs, strict dependency enforcement, and native patching.

## What Changes

- Switch the package manager from npm to pnpm with a single root `pnpm-lock.yaml`.
- Add a workspace (root as `@antora-tracer/core`; `id-server` as a workspace package), with no directory restructuring.
- Convert the two `patch-package` patches to pnpm `patchedDependencies`.
- Update CI (`ci.yml`, `pages.yml`, `release.yml`), the Dockerfile, `devbox.json`, and the pre-commit config from `npm` to `pnpm`.
- Resolve phantom dependencies surfaced by pnpm's strict `node_modules` (declare transitive imports in the right `package.json`).
- Establish the `workspace:*` cross-package dependency pattern for the forthcoming `@antora-tracer/vscode` package.

## Capabilities

### New Capabilities

<!-- None — this is a pure tooling/infrastructure change with no product behavior change. -->
<!-- `.openspec.yaml` sets `skip_specs: true`. -->

### Modified Capabilities

<!-- None. -->

## Impact

- `package.json`, new `pnpm-workspace.yaml`, new `pnpm-lock.yaml` (replacing `package-lock.json`).
- `id-server/package.json` (+ removal of `id-server/package-lock.json` and `id-server/node_modules`).
- `patches/` → pnpm `patchedDependencies` (2 patches).
- `.github/workflows/{ci,pages,release}.yml`, `Dockerfile`, `devbox.json`, `.pre-commit-config.yaml`.
- No change to traceability behavior, the parser, graph, CLI, or extension output.
