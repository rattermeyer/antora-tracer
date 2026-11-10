## Why

Rendered item blocks expose only the item's semantic role as a CSS class (`class="openblock requirement"`), so a site stylesheet has no way to decorate an item from its own metadata. Adding a status badge or state icon next to an item today requires copying the value into authoring or post-processing generated HTML.

## What Changes

- Emit a status-derived CSS class on rendered item blocks, so a site stylesheet can attach badges, icons, or state styling to items whose status matches.
- Derive the class from the item's `status` attribute with a documented slug rule; items without a status emit no class.
- Namespace the class away from the matrix's existing coverage classes, which already use a bare `status-` prefix for a different meaning.
- Add no configuration option: the class is inert until a stylesheet styles it, so the stylesheet is the opt-in and no page or site attribute is required.
- Accept arbitrary role-class prefixes in item headers, so a class written by hand (or emitted by this change) is recognized instead of silently ignored.
- Fix superseded-item stripping, which currently matches only the `.tracer` header form and therefore leaves superseded items written with a status class visible in output.

Non-goals: icons beside items in generated relationship lists; icon output in the PDF and DOCX builds; any change to matrix or graph behavior.

## Capabilities

### New Capabilities
- `item-status-classes`: Derive a namespaced CSS class from item metadata and emit it on rendered item blocks for stylesheet-driven decoration.

### Modified Capabilities
- `item-header-syntax`: Item headers SHALL accept arbitrary role-class prefixes, not only the `tracer` role, in every path that recognizes, transforms, or locates item blocks.

## Impact

- Header rewriting in the Antora extension; item-header recognition in the document parser, the Antora extension, and the CLI.
- `reference/item-macro.adoc` (class emission, slug rule, stylesheet example) and `reference/configuration.adoc` (no new option; records that the class is unconditional).
- The `antora-ui-conemso` theme gains default badges for five common statuses, published as a new release; the extension's playbook pins move to it. Projects on another theme get the class with no badge.
- Tests for recognition of class-prefixed headers, superseded stripping under that form, and slug derivation from free-form status values.
