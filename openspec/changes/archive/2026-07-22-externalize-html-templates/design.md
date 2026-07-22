## Context

The current `MatrixGenerator` class in `src/MatrixGenerator.ts` contains two HTML export methods:
- `exportToHTML()` - generates HTML for requirements matrices (req-impl, req-test, etc.)
- `exportDesignMatrixToHTML()` - generates HTML for design matrices

Both methods use the same approach: building HTML strings through hundreds of `html.push()` calls. Analysis shows:
- ~200 lines of duplicated CSS between the two methods
- ~150 lines of duplicated HTML structure (header, footer, table layout)
- Only the data rows and column headers differ between matrix types
- Total embedded HTML: ~400 lines across both methods

The code is difficult to maintain, test, and customize. Users cannot override the HTML output without forking the extension.

## Goals / Non-Goals

**Goals:**
- Eliminate code duplication in HTML generation
- Separate presentation logic from business logic
- Enable user customization of HTML templates
- Maintain backward compatibility (same HTML output by default)
- Keep performance impact minimal
- Support both requirements and design matrix types

**Non-Goals:**
- Refactor CSV export (out of scope for this change)
- Add new matrix types (focus on existing types only)
- Change the HTML output format or styling (maintain current appearance)
- Support template hot-reloading (templates loaded once at initialization)

## Decisions

### 1. Use Mustache for Templating

**Decision**: Use Mustache as the templating engine.

**Rationale**:
- Logic-less templates force clean separation of concerns
- Well-known, simple syntax that's easy for users to understand
- Minimal footprint (~20KB minified)
- No runtime dependencies beyond the mustache package
- Supports partials for reusable components
- Works well with TypeScript

**Alternatives Considered**:
- **Handlebars**: More powerful but larger, has logic which we don't need
- **EJS**: Has logic, larger footprint
- **Liquid**: Good but primarily for Shopify, less common in Node.js
- **Custom template literals**: Zero dependencies but no external file support, harder for users to customize
- **No templating**: Keep current approach - rejected due to maintenance issues

### 2. Template File Structure

**Decision**: Use a flat template structure with partials in a `src/templates/` directory.

```
src/templates/
  matrix.html.mustache          # Main requirements matrix template
  design-matrix.html.mustache   # Design matrix template
  partials/
    header.mustache
    footer.mustache
    styles.mustache
    breadcrumb.mustache
    summary.mustache
    requirement-row.mustache
    design-row.mustache
```

**Rationale**:
- Partials allow reuse of common components (header, footer, styles)
- Separate files for each matrix type allow specialization
- `.mustache` extension clearly identifies template files
- Co-located with source code for easy reference

**Alternatives Considered**:
- Single monolithic template with conditionals - rejected as harder to maintain
- Template per matrix type without partials - rejected due to duplication

### 3. Template Loading Strategy

**Decision**: Load templates synchronously at module initialization, compile once, cache for reuse.

**Rationale**:
- Templates are small and load quickly
- Compilation happens once at startup, not per-request
- Synchronous loading simplifies error handling
- No need for async/await in the MatrixGenerator

**Implementation**:
```typescript
class TemplateRenderer {
  private templates: Map<string, string> = new Map();

  constructor(private templateDir: string) {
    this.loadTemplates();
  }

  private loadTemplates(): void {
    // Load and compile all templates from templateDir
  }

  render(templateName: string, data: any): string {
    const template = this.templates.get(templateName);
    return mustache.render(template, data);
  }
}
```

**Alternatives Considered**:
- Load on first use (lazy loading) - adds complexity, minimal benefit
- Load asynchronously - requires async methods throughout, not worth it

### 4. User Customization API

**Decision**: Allow users to specify a custom template directory via MatrixGenerator options.

```typescript
interface MatrixGeneratorOptions {
  templateDir?: string;  // Path to custom templates directory
}

class MatrixGenerator {
  constructor(
    private readonly graph: TraceabilityGraph,
    private readonly options: MatrixGeneratorOptions = {}
  ) {
    this.templateRenderer = new TemplateRenderer(
      options.templateDir || defaultTemplateDir
    );
  }
}
```

**Rationale**:
- Simple and flexible API
- Users can provide partial or complete template overrides
- Falls back to built-in templates if not specified
- No breaking changes to existing API (options are optional)

**Alternatives Considered**:
- Template per-matrix-type override - more complex, less flexible
- Global template registry - harder to scope to specific instances

### 5. Data Preparation for Templates

**Decision**: Prepare all data in MatrixGenerator before passing to templates, including:
- Escaped values for safe HTML output
- Formatted status badges
- Computed fields (hasImpl, hasTest, statusClass, statusText)
- Joined strings for arrays (implementations, tests)

**Rationale**:
- Keeps templates simple (logic-less)
- All business logic stays in TypeScript
- Easier to test data preparation separately
- Consistent with Mustache's philosophy

**Example Data Structure**:
```typescript
{
  type: 'req-impl',
  title: 'Traceability Matrix: req-impl',
  rows: [
    {
      id: 'REQ-001',
      title: 'User authentication',
      implementations: 'auth-service, login-page',
      tests: 'auth-test, login-test',
      statusBadge: '<span class="status-badge status-complete">✓ Complete</span>'
    }
  ],
  summary: {
    totalRequirements: 10,
    withImplementation: 8,
    withTests: 7,
    implCoverage: '80.0%',
    testCoverage: '70.0%'
  }
}
```

### 6. Backward Compatibility

**Decision**: Maintain exact same HTML output by default.

**Rationale**:
- No breaking changes for existing users
- Templates will reproduce current HTML structure exactly
- Users opt-in to customization

**Implementation**:
- Built-in templates match current HTML output exactly
- Same CSS, same structure, same classes
- Only the generation method changes, not the output

## Risks / Trade-offs

**[Risk] Template loading failures** → Provide clear error messages with path information. Fall back gracefully if possible.

**[Risk] Performance overhead** → Template compilation is fast (~1ms per template). With caching, runtime impact is negligible. Benchmark before and after.

**[Risk] Template syntax errors** → Validate templates at load time, not at render time. Fail fast with clear error messages.

**[Risk] Security (XSS)** → Mustache auto-escapes by default. We'll use `{{{triple-stash}}}` only for pre-escaped HTML (like status badges). All user data goes through `escapeHtml()` before being passed to templates.

**[Risk] Bundle size increase** → Mustache adds ~20KB. For an Antora extension running in Node.js, this is acceptable. Document the dependency.

**[Trade-off] Template flexibility vs. simplicity** → Mustache's logic-less nature limits some use cases, but this is intentional to keep templates simple and maintainable.

**[Trade-off] External files vs. embedded** → External files add deployment complexity but enable customization. Worth it for this use case.

## Migration Plan

1. **Add Mustache dependency** to `package.json`
2. **Create template files** in `src/templates/` directory
3. **Create TemplateRenderer class** with loading and caching logic
4. **Update MatrixGenerator** to use TemplateRenderer
5. **Refactor exportToHTML()** to use templates
6. **Refactor exportDesignMatrixToHTML()** to use templates (or merge into single method)
7. **Add tests** for template rendering
8. **Document** the customization API

**Rollback Strategy**:
- Changes are additive (new files, new class)
- Existing methods can be kept as fallback
- If issues arise, revert to string concatenation approach
- No database migrations or data changes involved

## Open Questions

1. **Should we support template hot-reloading in development?** - Probably not for initial implementation, but could be added later.

2. **Should templates be embeddable as strings for single-file deployments?** - Not for initial implementation, but could be a future enhancement.

3. **Should we validate template files exist at startup?** - Yes, fail fast with clear error messages.

4. **Should we support template inheritance (base template + overrides)?** - Mustache doesn't support this natively, but we could implement a simple override mechanism.
