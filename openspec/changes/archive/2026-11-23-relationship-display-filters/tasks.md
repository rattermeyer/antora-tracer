## 1. Policy configuration and matching

- [x] 1.1 Add `linkDisplayPolicies` types and validation for named rules and references; verify valid policies load and malformed or unknown references produce actionable errors.
- [x] 1.2 Implement the shared matcher for relation type, current item, related item, optional role, and attributes; verify AND/OR matching and inverse-direction normalization with focused tests.

## 2. Item-page rendering

- [x] 2.1 Resolve `traceability-link-policy` from site/component defaults and page headers, including `none`; verify precedence and unknown-policy errors.
- [x] 2.2 Apply the matcher to automatic and explicit outgoing, incoming, and combined link output; verify a matching link is hidden only on the matching item's view, nonmatching links remain, and graph relationships are unchanged.
- [x] 2.3 Generate policy-guarded variants for partial relationship macros; verify the same partial renders differently when included by pages selecting different policies and remains unfiltered when no policy is selected.

## 3. Matrix integration

- [x] 3.1 Apply optional `MatrixDefinition.linkDisplayPolicy` to row/cell relationships before coverage calculation; verify L2-to-L3 filtering, reverse-endpoint visibility, unchanged behavior without a policy, and composition with `coverageRelations`.

## 4. Documentation and integration verification

- [x] 4.1 Update configuration, traceability-macro, and relevant matrix guidance; verify docs cover policy rules, attribute precedence including partials, matrix opt-in, and coverage effects.
- [x] 4.2 Run `pnpm test` and `pnpm exec antora antora-playbook.yml`; verify the example site builds and inspect rendered relationship links and matrix output for the selected policy behavior.
