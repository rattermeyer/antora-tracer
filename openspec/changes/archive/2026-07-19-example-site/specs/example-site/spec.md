# Example Site Specification

## Capability: example-site

### Requirement: Minimal Working Example

**ID**: EXAMPLE-001
**Title**: Provide a minimal working example
**Status**: Approved
**Priority**: High

The example site must provide a minimal, working demonstration of the Requirements Traceability Extension that users can run with a single command.

**Acceptance Criteria**:
- Users can run `npx antora antora.yml` from the example-site directory
- The build completes without errors
- The output site (_site/) contains rendered HTML pages
- The output site contains traceability matrices in the traceability/ directory
- Users can open _site/index.html in a browser and navigate the site

**Examples**:
```bash
cd example-site
npx antora antora.yml
# Build succeeds
open _site/index.html
# Site displays with traceability matrices visible
```

---

### Requirement: Demonstrate Requirement Definition

**ID**: EXAMPLE-002
**Title**: Show how to define requirements
**Status**: Approved
**Priority**: High

The example site must demonstrate how to define requirements using the extension's syntax.

**Acceptance Criteria**:
- The example site contains at least 4 example requirements defined using `[req]` block macros
- Each requirement has a unique ID
- Each requirement has a title
- Each requirement has descriptive content
- Requirements use the standard ID format (TYPE-NUMBER)

**Examples**:
```asciidoc
[req, id=EXAMPLE-001, title="Welcome Page"]
====
The example site must have a welcome page.
====
```

---

### Requirement: Demonstrate Traceability Linking

**ID**: EXAMPLE-003
**Title**: Show how to create traceability links
**Status**: Approved
**Priority**: High

The example site must demonstrate how to create relationships between requirements, implementations, tests, and documents.

**Acceptance Criteria**:
- The example site contains at least 4 implementations defined using `[imp]` block macros
- The example site contains at least 2 inline relationship macros (satisfies, implements, tests, etc.)
- Relationships reference valid node IDs
- All relationship types are demonstrated somewhere in the site

**Examples**:
```asciidoc
[imp, id=IMP-001]
====
Welcome page implementation
====

implements:EXAMPLE-001[]
```

---

### Requirement: Demonstrate Matrix Generation

**ID**: EXAMPLE-004
**Title**: Show generated traceability matrices
**Status**: Approved
**Priority**: High

The example site must generate and display traceability matrices showing the relationships between requirements and other elements.

**Acceptance Criteria**:
- The build process generates at least 3 matrix files (req-impl, req-test, full)
- The matrices are generated in HTML format
- The matrices are generated in CSV format
- The matrices include all defined requirements and implementations
- The matrices show correct relationship information

**Examples**:
```
Generated files:
- traceability/matrix-req-impl.html
- traceability/matrix-req-impl.csv
- traceability/matrix-req-test.html
- traceability/matrix-req-test.csv
```

---

### Requirement: Document Architecture

**ID**: EXAMPLE-005
**Title**: Include architecture documentation
**Status**: Approved
**Priority**: Medium

The example site must include documentation of the extension's architecture.

**Acceptance Criteria**:
- The example site contains an architecture page
- The architecture page describes at least 4 components of the extension
- Each component is linked to the requirements it satisfies or implements
- Architecture documentation uses traceability macros

**Examples**:
```asciidoc
= AsciiDoc Processor

The processor parses AsciiDoc content.

satisfies:EXAMPLE-002[]
```

---

### Requirement: Side-by-Side Comparison

**ID**: EXAMPLE-006
**Title**: Provide Sphinx Needs comparison
**Status**: Approved
**Priority**: Medium

The example site must include a comparison with Sphinx Needs to help users migrating from that tool.

**Acceptance Criteria**:
- The example site contains a comparison page
- The comparison includes at least 5 feature comparisons
- The comparison shows equivalent syntax for common operations
- The comparison highlights advantages of this extension

**Examples**:
```
| Feature | Sphinx Needs | This Extension |
|---------|--------------|-----------------|
| Requirement | `:need:` | `[req]` |
```

---

### Requirement: Clear Navigation

**ID**: EXAMPLE-007
**Title**: Provide intuitive site navigation
**Status**: Approved
**Priority**: Medium

The example site must have clear navigation so users can easily find all sections.

**Acceptance Criteria**:
- The site has a navigation menu
- The navigation includes links to all major sections
- The navigation is consistent across all pages
- Users can navigate from any page to any other page in 2-3 clicks

---

### Requirement: Coverage Report

**ID**: EXAMPLE-008
**Title**: Show coverage metrics
**Status**: Approved
**Priority**: Low

The example site must generate and display a coverage report.

**Acceptance Criteria**:
- The build process generates a coverage report (coverage.html)
- The coverage report shows total requirements
- The coverage report shows requirements with implementations
- The coverage report shows requirements with tests
- The coverage report shows implementation coverage percentage
- The coverage report shows test coverage percentage
