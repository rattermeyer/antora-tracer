## Context

See proposal.md - Why. `query` and `site-graph` already keep stdout clean;
`matrix` and `seed` do not, and several human-facing commands put banners on
stdout. There is no spec for CLI output streams.

## Goals / Non-Goals

**Goals:**
- stdout carries only a command's primary output, everywhere, so piping is
  always safe.
- One helper owns the split so a new command cannot silently reintroduce a
  stdout banner.

**Non-Goals:**
- A `--quiet` flag. Routing progress to stderr makes stdout clean without a
  flag to remember; a flag would leave the default broken.
- Changing any command's exit code, options, or output content.
- Suppressing progress. stderr is still written, so interactive use is
  unchanged; only a caller who redirects stdout sees a difference.

## Decisions

**Route banners to stderr rather than adding `--quiet`.** The bug is that the
default output is unparseable; a flag that fixes it leaves the default wrong and
adds something to remember. stderr is the conventional place for progress, and
`query` already demonstrates the pattern working.

**A `status()` helper, not scattered `console.error` calls.** Every progress and
confirmation line goes through one function, so the contract is greppable
(`status(` vs a bare `console.log`) and a reviewer can tell data writes from
status writes at a glance.

**Keep data writes as `console.log`.** Only the primary output uses `console.log`;
that asymmetry is the contract, and the helper's name makes it explicit.

## Risks / Trade-offs

- [A caller that captured `2>&1` and parsed the combined stream sees the banner
  move within the stream] → The banner was never data; such a caller was already
  broken. `2>/dev/null` now yields clean output.
- [Confirmations ("written to …") become stderr, so a script that read them from
  stdout sees nothing] → Intended: a confirmation is status, not data. The file
  itself is the observable result.
- [Commands not audited could still leak] → The regression tests cover the four
  data-producing commands; the helper plus the spec make the contract explicit
  for new commands.
