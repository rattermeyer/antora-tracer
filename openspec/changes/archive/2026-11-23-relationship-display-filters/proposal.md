## Why

Users need to hide selected cross-level relationships on one endpoint's rendered item view while retaining the graph relationship and showing it from the other endpoint. Direction-only rendering cannot express this when relationships may be authored in either direction, and projects may use different abstraction levels and roles.

## What Changes

- Add named relationship display policies that match a normalized relation type and metadata on the item being displayed and the related item.
- Let site/component AsciiDoc attributes select a default policy, with a page header overriding it for all items rendered in that page, including items included from partials.
- Allow a matrix to opt into a named policy; matching relationships are omitted from cells and do not count toward coverage. Matrix behavior remains unchanged unless a policy is selected.
- Keep policies display-only: do not remove or alter graph relationships. With no policy selected, preserve current output.

## Capabilities

### New Capabilities
- `relationship-display-filters`: Define reusable, endpoint-aware relationship display policies and apply them to item link rendering and explicitly opted-in matrices.

### Modified Capabilities
- `traceability-links-macro`: Apply the selected policy to outgoing, incoming, and combined relationship links, resolving page overrides for items included from partials.

## Impact

- Configuration types and validation; matrix generation and relationship macro expansion.
- Configuration and traceability-macro reference documentation, plus tests for direction-independent matching and matrix coverage.
