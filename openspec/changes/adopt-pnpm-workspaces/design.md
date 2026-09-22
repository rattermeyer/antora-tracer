## Context

The repo currently uses npm with no workspace: the root is `@antora-tracer/core`, and `id-server/` is a sibling `@antora-tracer/id-server` package with its own `package-lock.json` and its own `node_modules/` (duplicate typescript, mocha, chai, etc.). Two dependencies are patched via `patch-package` (`@antora/assembler`, `@antora/lunr-extension`). CI (`ci.yml`, `pages.yml`, `release.yml`), the `Dockerfile`, and `devbox.json`'s init hook all run `npm ci`/`npm install`. The forthcoming `@antora-tracer/vscode` package will import `@antora-tracer/core`, which needs a real cross-package dependency.

See `proposal.md` for motivation.

## Goals / Non-Goals

**Goals:**

- One lockfile and one deduplicated install across `core` and `id-server`.
- Strict dependency enforcement (no phantom imports) via pnpm's symlinked `node_modules`.
- Native patching (`patchedDependencies`) replacing `patch-package`.
- A `workspace:*` pattern the VS Code extension can consume from day one.

**Non-Goals:**

- No directory restructuring (root stays `@antora-tracer/core`; no move into a `core/` subdir).
- No change to traceability behavior, public API, or output.
- No repository split (stays a monorepo, per the `add-vscode-extension` design).

## Decisions

### 1. pnpm over npm workspaces or yarn

pnpm was chosen for: strict `node_modules` (catches undeclared transitive imports — valuable for a strict-TS codebase), native `patchedDependencies` (removes `patch-package` + `postinstall`), the `workspace:*` protocol (rewritten to a real version at publish), faster/disk-efficient installs across the three CI jobs and Docker build, and `pnpm -r` recursive scripts.

**Alternatives considered:** npm workspaces (rejected — keeps phantom-dep leniency and `patch-package`, no `workspace:*`); yarn (rejected — no additional benefit over pnpm here).

### 2. Root-as-core layout, no restructuring

`pnpm-workspace.yaml` declares `packages: [id-server]` (and later `vscode-extension`). The root remains `@antora-tracer/core` — pnpm treats the root as a workspace package too, so no files move.

**Alternative considered:** restructuring into `core/`/`id-server/`/`vscode/` subdirs under a bare workspace root — rejected: a massive, risky move of `src/`, `test/`, `openspec/`, `examples/`, and git history for no functional gain.

### 3. Single root lockfile, delete the duplicate

Generate `pnpm-lock.yaml` at the root and remove `id-server/package-lock.json` and `id-server/node_modules`, so dependency resolution is centralized.

### 4. Convert patches natively

Move `patches/@antora+assembler+*.patch` and `patches/@antora+lunr-extension+*.patch` into `package.json` `pnpm.patchedDependencies`, and drop `patch-package` and its `postinstall` script.

### 5. Sweep all tooling to pnpm

`npm ci` → `pnpm install --frozen-lockfile`; `npm run` → `pnpm run`; `npx` → `pnpm exec`/`pnpm dlx`. Update the three CI workflows, the `Dockerfile`, `devbox.json` (`init_hook` → `pnpm install`), and `.pre-commit-config.yaml`.

### 6. Resolve phantom dependencies explicitly

After the switch, pnpm's strict install will fail on any transitively-imported-but-undeclared dependency. Add each to the correct `package.json` (root or `id-server`) rather than relaxing strictness.

## Risks / Trade-offs

- **[Phantom-dep breakage]** → surfaced by strict install; fix by declaring deps, not by disabling strictness.
- **[CI/Docker breakage during migration]** → land the workspace + lockfile + CI sweep in one change and verify all three workflows and the Docker build before merge.
- **[Patch conversion correctness]** → verify the two patched packages still behave (lunr indexing, assembler) after moving to `patchedDependencies`.
- **[Node/corepack version skew]** → pin the pnpm version via `packageManager` (corepack) so local, CI, and Docker resolve the same pnpm.

## Migration Plan

1. Add `pnpm-workspace.yaml` + `packageManager` field, generate `pnpm-lock.yaml`.
2. Convert patches; drop `patch-package`.
3. Run `pnpm install`; declare any newly-surfaced phantom deps.
4. Update CI, Dockerfile, devbox, pre-commit in the same change.
5. Verify: `pnpm install --frozen-lockfile`, `pnpm -r build`, `pnpm test`, `pnpm lint`, and the `id-server` Docker build.
6. Rollback is reverting to the npm lockfile and `package.json` state; no data migration.

## Open Questions

- Whether to fold `skills/`/`evals/` (currently content shipped inside `@antora-tracer/core`, not separate packages) into workspace packages — deferred, not needed for this change.
- Non-VS Code consumers of the future `@antora-tracer/vscode` package — out of scope here, but `workspace:*` keeps the door open.
