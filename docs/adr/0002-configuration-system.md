# ADR 0002: Configuration System with Presets

## Status
Accepted

## Context
Users need a way to:
- Define valid roles for their project
- Specify which relationships are allowed between roles
- Configure matrix generation
- Share common configurations across projects

Without a configuration system, the extension would need to:
- Hardcode all possible roles and relationships
- Lack flexibility for different domains
- Require code changes for customization

## Decision
Implement a **YAML-based configuration system** with **preset support**.

### Key Components
1. **Configuration File**: `traceability.yml` or `traceability.yaml`
2. **Configuration Loader**: `ConfigLoader` class to load and validate configs
3. **Presets**: Built-in configurations for common use cases
4. **Extends**: Ability to extend presets with customizations

### Configuration Structure
```yaml
roles:
  - requirement
  - implementation
  - test

relations:
  requirement:
    implementation:
      - implements
      - satisfies
    test:
      - verified-by
      - tested-by

matrices:
  - name: requirements-traceability
    rows: requirement
    columns: [implementation, test]
```

### Preset System
- Built-in presets: `requirements-engineering`, `agile`, `medical-iec62304`, `minimal`
- Users can create custom presets
- Presets can extend other presets
- Presets include documentation and examples

## Consequences

### Positive
- ✅ **Flexibility**: Users can define any roles and relationships
- ✅ **Domain-Specific**: Presets tailored to different industries/standards
- ✅ **Shareable**: Presets can be shared across projects
- ✅ **Extensible**: Users can extend presets without modifying them
- ✅ **Validated**: Configuration is validated on load

### Negative
- ⚠️ **Complexity**: Another file to maintain
- ⚠️ **Learning Curve**: Users need to understand configuration syntax
- ⚠️ **Validation Overhead**: Configuration must be validated

## Alternatives Considered

### Alternative 1: JSON Configuration
**Rejected**: YAML is more human-readable for configuration files.

### Alternative 2: Code-Based Configuration
```typescript
new RequirementsTraceabilityExtension({
  roles: ['requirement', 'test'],
  relations: { /* ... */ }
});
```
**Rejected**: Less declarative, harder to share/version control.

### Alternative 3: Environment Variables
**Rejected**: Not suitable for complex configuration structures.

## Related
- Issue: #XX (Configuration system)
- Spec: `openspec/changes/configuration-system/specs/`
