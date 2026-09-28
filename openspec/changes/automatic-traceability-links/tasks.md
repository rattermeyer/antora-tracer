## 1. Automatic relationship rendering

- [x] 1.1 Render combined links for enabled items without explicit rendering macros; verify automatic output includes both relationship directions and configured styles.
- [x] 1.2 Resolve partial link enablement from component attributes instead of forcing it on; verify enabled and disabled partials follow their component setting despite including page headers.
- [x] 1.3 Preserve explicit macro placement and direction while avoiding automatic duplicates; verify explicit `links`, `outgoing`, and `incoming` macros each suppress automatic output for that item.

## 2. Documentation and integration

- [x] 2.1 Update link-macro and partial documentation for automatic rendering and component-level partial behavior; verify documented precedence matches the spec.
- [x] 2.2 Move example component link settings to component-level attributes and remove redundant page headers; build the example site and verify relationship links appear once per item.
