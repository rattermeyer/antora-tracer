## 1. Support both item-header forms

- [x] 1.1 Update `DocumentParser` item recognition and add tests verifying the new header produces the same ID, role, title, content, and relationships as the existing form
- [x] 1.2 Update Antora item-block discovery, indentation, title injection, and supersession transforms; verify both header forms retain IDs and the new form retains its `tracer` class in converted HTML
- [x] 1.3 Update CLI item-block location and lifecycle tests to verify the new header locates the complete block by ID

## 2. Document and verify the contract

- [x] 2.1 Update `reference/item-macro.adoc` with the alternative header syntax and its CSS role behavior; verify examples document both forms without changing existing syntax
- [x] 2.2 Run the focused parser, Antora extension, and CLI tests plus OpenSpec validation; verify verbatim examples remain ignored and both forms pass validation
