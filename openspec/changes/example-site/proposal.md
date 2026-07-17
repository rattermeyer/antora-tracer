# Proposal: Example Antora Site with Traceability Demonstration

## Summary

Create an example Antora site that demonstrates the Requirements Traceability Extension in action. This site will serve as both documentation and a live demonstration, allowing users to see traceability matrices generated from real requirements and architecture documentation.

## Problem Statement

Currently, users of the Requirements Traceability Extension have:
- A working extension with all features implemented
- Comprehensive documentation (user guide, developer guide)
- No **live, interactive demonstration** showing the extension in action

Without a concrete example, users must:
1. Install the extension themselves
2. Create their own AsciiDoc content with traceability macros
3. Configure Antora
4. Run the build
5. Hope it works

This creates a high barrier to entry and makes it difficult for users to understand the value proposition.

## Proposed Solution

Create an example Antora site that:
1. Uses the extension's own requirements (from the spec) as content
2. Documents the architecture of the extension
3. Links architecture components to requirements using traceability macros
4. Generates live traceability matrices when built
5. Can be run with a single command: `npx antora antora.yml`

This provides users with:
- A working example they can study and modify
- Immediate visual feedback of the extension's capabilities
- A reference implementation for their own projects
- A side-by-side comparison with Sphinx Needs (for users migrating from Sphinx)

## Goals

### Primary Goals
- ✅ Create a minimal, working example Antora site
- ✅ Demonstrate all major extension features (requirements, implementations, tests, relationships, matrices)
- ✅ Use real requirements from the extension's spec
- ✅ Document the architecture and link it to requirements
- ✅ Generate live traceability matrices

### Secondary Goals
- ⚠️ Add side-by-side comparison with Sphinx Needs
- ⚠️ Include test examples
- ⚠️ Add interactive tutorial

### Non-Goals
- ❌ Create a full production-ready documentation site
- ❌ Replace the existing user/developer guides
- ❌ Support all Antora features

## Success Criteria

The example site is successful if:

1. A user can clone the repo, run `npx antora antora.yml` from the example-site directory, and see a working site with traceability matrices
2. The generated matrices correctly show relationships between requirements and implementations
3. The coverage report shows accurate coverage metrics
4. A user can understand how to use the extension by studying the example

## Stakeholders

- **Primary**: Users evaluating the extension
- **Secondary**: Users migrating from Sphinx Needs
- **Tertiary**: Contributors to the extension

## Dependencies

- Antora 3.x
- Node.js 14+
- The Requirements Traceability Extension (local development version)

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Extension API changes | Low | Medium | Use stable interfaces, test with multiple Antora versions |
| Complexity creep | Medium | Low | Start minimal, iterate later |
| Maintenance burden | Medium | Low | Keep example simple, document clearly |

## Open Questions

1. Should the example site be in the same repo or a separate repo?
   - **Recommendation**: Same repo in `example-site/` directory

2. Should we use the actual spec requirements or create new example-specific ones?
   - **Recommendation**: Start with new example-specific requirements (EXAMPLE-001, etc.), then add real spec requirements as a "Real-World Example" section

3. Should we include a side-by-side comparison with Sphinx Needs?
   - **Recommendation**: Yes, as a separate page for users migrating from Sphinx

## Next Steps

1. Review and approve this proposal
2. Create detailed design and specs
3. Implement the minimal example site
4. Test with real users
5. Iterate based on feedback

## Resources

- Sphinx Needs: https://sphinx-needs.readthedocs.io/
- Antora: https://antora.org/
- AsciiDoc: https://asciidoc.org/
