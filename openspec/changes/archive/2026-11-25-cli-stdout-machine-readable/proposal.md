## Why

`antora-tracer matrix` writes its progress banner to stdout, so `-f json` and
`-f csv` output cannot be piped into a parser:

```
$ antora-tracer matrix -i docs --config traceability.yml -t requirements-tests -f json | head -1
Generating traceability matrix...
```

A caller must know to skip the first line — a hidden coupling that breaks
silently if the banner text or ordering changes. `query --json` already keeps
stdout clean, so the same CLI is inconsistent about what stdout means.

## What Changes

- Every command SHALL write only its primary output to stdout, and route
  progress, status, and confirmation lines to stderr. This covers `matrix`
  (the reported case), plus `seed`, `site-graph`, and `diff-graphs`, whose
  stdout is likewise structured data, and the human-facing banners of
  `process`, `validate`, `neo4j`, `stats`, `preset`, and config `validate`.
- A `status()` helper centralizes the stderr routing so the split cannot drift
  per command.
- The CLI reference SHALL state the stdout/stderr contract.

No change to any command's exit code, options, or primary output content.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `cli-query`: the CLI gains a stated stdout contract — stdout carries only the
  command's primary output, progress and status go to stderr — which the query
  subcommands already satisfy and every other command now matches.
- `doc-reference`: the CLI reference documents which stream carries what.

## Impact

- `src/cli.ts` — `status()` helper; banners and confirmations routed to stderr
- `test/cli.test.ts` — stdout-purity regression tests
- `openspec/specs/cli-query/spec.md`, `openspec/specs/doc-reference/spec.md`
- `examples/tracer/modules/ROOT/pages/reference/cli.adoc`
- `examples/tracer/modules/requirements/pages/index.adoc` — REQ item for the
  stdout contract
