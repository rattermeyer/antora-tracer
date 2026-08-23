## MODIFIED Requirements

### Requirement: Self-Traceability section preserves traceable items
The restructuring SHALL keep every traceable `[item]` block in its current AsciiDoc file.

#### Scenario: Items stay in their source files
- **WHEN** the example site is restructured
- **THEN** every requirement (REQ), architecture (ARC), test (TST), use case (UC), and quality (QA) item SHALL remain in its current file
