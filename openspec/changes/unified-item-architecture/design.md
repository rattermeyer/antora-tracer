## Context

The current Antora Requirements Traceability Extension uses four separate block macros (`[req]`, `[imp]`, `[test]`, `[doc]`) with seven hardcoded relationship types. This architecture works for basic requirements traceability but lacks flexibility for domain-specific use cases (medical devices, aerospace, agile development, etc.).

Users have requested the ability to define their own traceability model with custom artifact types and relationships. The current fixed approach also creates maintenance burden as new artifact types require code changes.

This design introduces a unified `[item]` macro with user-defined roles, enabling complete flexibility in traceability modeling while keeping the extension maintainable.

## Goals / Non-Goals

**Goals:**
- Enable users to define their own traceability domain model
- Maintain simplicity and ease of use for common cases
- Provide presets for standard domains (requirements engineering, agile, etc.)
- Enable powerful graph queries via Neo4j export
- Keep the extension maintainable and testable
- Maintain backward compatibility where possible (though breaking changes are required)

**Non-Goals:**
- Support both old and new macro syntax simultaneously
- Build a custom query language (use Neo4j instead)
- Support template inheritance in 0.7.0
- Support hot-reloading of configuration
- Build a web-based traceability viewer (future enhancement)

## Decisions

### 1. Single `[item]` Macro with Role Attribute

**Decision**: Replace all block macros (`[req]`, `[imp]`, `[test]`, `[doc]`) with a single `[item]` macro that accepts a `role` attribute.

**Rationale**:
- Simplifies the mental model for users (one macro to learn)
- Enables user-defined roles without code changes
- Reduces code duplication in the parser
- Aligns with the principle of composition over inheritance

**Syntax:**
```asciidoc
[item, id=REQ-001, role=requirement]
====
User authentication requirement
====
```

**Alternatives Considered**:
- **Keep existing macros + add [item]**: More complex, two ways to do things
- **Role as positional parameter**: Less readable (`[item, requirement, id=REQ-001]`)
- **Different macro name**: `dci`, `traceable`, `artifact` - we chose `item` for simplicity

### 2. Configuration-Based Roles and Relations

**Decision**: Define roles, relations, and matrices in a configuration file (YAML).

**Rationale**:
- Separates concerns (configuration vs. content)
- Enables validation of relations between roles
- Allows presets for common domains
- Configuration can be version controlled

**Configuration Structure:**
```yaml
traceability:
  roles:
    - requirement
    - design
    - test
  relations:
    requirement:
      design: [addresses, satisfies]
      test: [verified_by]
    design:
      test: [validated_by]
  matrices:
    - name: requirements-traceability
      rows: requirement
      columns: [design, test]
```

**Alternatives Considered**:
- **Hardcoded roles**: Inflexible, doesn't solve the problem
- **JSON configuration**: Less human-readable than YAML
- **JavaScript configuration**: More powerful but more complex
- **Multiple config files**: Overly complex for most use cases

### 3. Role-Based Relation Validation

**Decision**: Validate at processing time that relations are allowed between the source and target roles.

**Rationale**:
- Catches configuration errors early
- Prevents invalid traceability graphs
- Provides clear error messages to users
- Enables the extension to enforce domain rules

**Validation Logic:**
```typescript
// If source has role A, target has role B, relation is X
// Check if config.relations[A][B] includes X
// If not, throw error with helpful message
```

**Error Message Example:**
```
Error: Relation "implements" from requirement to test is not allowed.
Allowed relations from requirement to test: [verified_by, validated_by]
```

**Alternatives Considered**:
- **No validation**: Allows invalid graphs, harder to debug
- **Warning only**: Less strict, but users might miss issues
- **Runtime validation**: Too late, errors would appear during generation

### 4. Mustache Templates for HTML (Keep Existing Work)

**Decision**: Keep the Mustache template work from the externalize-html-templates change.

**Rationale**:
- Already implemented and working
- Separates presentation from business logic
- Enables user customization of HTML output
- No need to reinvent

**Integration:**
- MatrixGenerator will use TemplateRenderer
- Templates can reference item roles for styling
- Custom templates can be provided per role

### 5. Neo4j Export for Queries

**Decision**: Export traceability graph to Neo4j CSV/Cypher format instead of building a custom query engine.

**Rationale**:
- Neo4j provides mature, powerful graph query capabilities
- Cypher is industry-standard for graph queries
- No need to build and maintain a query language
- Users get path queries, pattern matching, aggregations for free
- Optional dependency - users only need it if they want queries

**Export Formats:**
- **CSV**: Simple, widely supported, easy to import
- **Cypher**: Direct execution, more control

**Alternatives Considered**:
- **Custom DSL**: High implementation effort, less powerful
- **GraphQL**: Overkill, not graph-optimized
- **Custom query engine**: Reinventing the wheel
- **Gremlin**: Less popular than Cypher

### 6. Preset System

**Decision**: Ship with built-in preset configurations for common domains.

**Rationale**:
- Gives users starting points
- Reduces configuration burden
- Demonstrates best practices
- Can be extended by community

**Built-in Presets:**
- `requirements-engineering`: Standard software/systems engineering
- `agile`: Agile/Scrum with user stories, tasks, tests
- `medical-iec62304`: Medical device software (IEC 62304 compliant)
- `minimal`: Simple requirements and tests only

**Preset Features:**
- Can be extended (inherit from base preset)
- Can be customized
- Include example Cypher queries

**Alternatives Considered**:
- **No presets**: Users must define everything from scratch
- **Default roles**: Conflicts with "no defaults" principle
- **External preset registry**: More complex, add later if needed

### 7. No Default Roles

**Decision**: No default roles - users must define their own.

**Rationale**:
- Forces explicit configuration
- Prevents assumption of specific domain model
- Makes the extension truly flexible
- Users must think about their traceability model

**Mitigation:**
- Presets provide starting points
- Documentation includes examples
- Clear error messages for missing configuration

**Alternatives Considered**:
- **Default roles**: Simpler but less flexible
- **Fallback to old behavior**: Complex transition logic

### 8. Unknown Roles = Warning (Not Error)

**Decision**: Unknown roles generate warnings but don't prevent processing.

**Rationale**:
- Graceful degradation
- Allows partial configuration
- Users can add roles incrementally
- Relations involving unknown roles also warn

**Warning Message:**
```
Warning: Unknown role "usecase" used in item EP-001.
Known roles: requirement, design, test, document
```

**Alternatives Considered**:
- **Error on unknown roles**: Too strict, blocks users from experimenting
- **Silent ignore**: Users might not notice configuration issues

### 9. Documentation Structure — User Guide and Developer Guide

**Decision**: Rewrite both guides from scratch for the unified architecture. The existing guides describe the pre-unification `[req]`/`[imp]`/`[test]`/`[doc]` API and don't mention `[item]`, configuration, presets, Neo4j, or role-based validation.

**User Guide** (10 sections, follows the user journey):

1. Overview — 3-sentence pitch + key capabilities
2. Getting Started — install → preset → first `[item]` → build → look
3. The Traceability Model — roles, relations, how they connect (conceptual)
4. Configuration — presets path → custom YAML → playbook options
5. Writing Items — `[item]` macro reference, inline relationships, attributes, validation
6. Generated Output — matrices, coverage, reading the reports
7. CLI Reference — all 6 commands with examples
8. Presets Reference — table of all 4 presets with per-preset roles and relations
9. Neo4j Export — CSV/Cypher, example queries from presets
10. Recipes & Patterns — common setups, troubleshooting

**Developer Guide** (8 sections, mirrors `src/` layout):

1. Architecture Overview — real component diagram showing DocumentParser → TraceabilityGraph → MatrixGenerator/Neo4jExporter
2. Core Components — RequirementsTraceabilityExtension, TraceabilityGraph, DocumentParser, MatrixGenerator, Neo4jExporter, TemplateRenderer
3. Configuration System — ConfigLoader, presets, relation validation
4. Antora Integration — AntoraTraceabilityExtension, events, lifecycle
5. Data Model — Item, ItemRelationship, TraceabilityConfig
6. CLI Architecture — commander setup
7. Contributing — setup, testing (short overview), code style
8. Build & Release — build script, npm publish

**Dropped from old dev guide:**
- AsciidoctorExtension section (component no longer exists)
- "Bidirectional Relationships" section (was Phase 3, now role-based)
- "Extending the Extension" section (users extend via config, not code)
- v0.2.0/v0.3.0 version history (pre-dates unified architecture)

**Both guides:**
- All content references `[item]` macro, not `[req]`/`[imp]`/`[test]`/`[doc]`/`[design]`
- All relationship types are configuration-driven, not hardcoded
- Version framing is 0.7.0 (first real release), not v2.0
- No "Phase 2" or "Phase 3" framing — all features are unified

## Risks / Trade-offs

**[Risk] Breaking changes from pre-release** → Since there was no stable v1.x release or existing user base, breaking changes are acceptable. Document the current API as the first version.

**[Risk] Configuration complexity** → Provide presets and good documentation. Most users will start from a preset and customize.

**[Risk] Performance with large graphs** → Neo4j is optimized for this. For the extension itself, keep graph in memory with efficient indexes.

**[Risk] Learning curve** → Provide clear documentation, examples, and presets. The concepts (roles, relations) are familiar from other traceability tools.

**[Trade-off] Flexibility vs. simplicity** → We prioritize flexibility. Simple cases are handled by presets. Users who want simplicity use presets; users who need flexibility customize.

**[Trade-off] Neo4j dependency** → Neo4j export is optional. Users who don't need queries don't need Neo4j. The extension works without it.

**[Trade-off] Validation strictness** → Validate relations between known roles, but warn for unknown roles. This balances strictness with flexibility.

## Migration Plan

### For Users (0.7.0 Release)

1. **Update configuration**: Create `traceability.yml` with roles, relations, matrices
2. **Update AsciiDoc files**: Replace `[req]`, `[imp]`, `[test]`, `[doc]` with `[item, role=...]`
3. **Update relation syntax**: Relations remain the same (e.g., `implements:REQ-001[]`)
4. **Test**: Verify matrices generate correctly
5. **Optional**: Set up Neo4j for queries

### Migration Tools (Future)

- **Conversion script**: Automatically convert old macros to new syntax
- **Validation tool**: Check for incomplete migrations

### Rollback Strategy

Since this is the first stable release (v0.7.0), there is no previous version to roll back to.

## Open Questions

1. **Should we support incremental Neo4j updates?** - For large projects, full re-import might be slow. Could track changes and only update affected nodes/relationships.

2. **Should presets include matrix templates?** - Different domains might want different matrix layouts. Could add HTML template customization per preset.

3. **Should we support multiple configuration files?** - For large projects with multiple traceability domains, could support config inheritance or composition.
