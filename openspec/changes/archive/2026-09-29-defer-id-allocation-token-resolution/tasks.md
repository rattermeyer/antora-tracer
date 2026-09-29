## 1. Decouple Configuration Loading

- [x] 1.1 Defer `idAllocation.token` interpolation during shared config loading while retaining endpoint interpolation and validation; verify existing config-loader cases still pass and add an assertion that an unset token does not prevent loading the config.
- [x] 1.2 Verify the Antora extension loads the configured roles and matrices with the allocator token unset; add a focused regression check that generated matrix attachment xrefs resolve in the site build.

## 2. Enforce Credentials at Remote Allocation

- [x] 2.1 Resolve the configured token only when `next-id` selects remote allocation; verify an unset token exits with the variable name before any allocator request or ID output.
- [x] 2.2 Verify `next-id --local` succeeds with the same unset remote token and returns the locally scanned next ID.
- [x] 2.3 Preserve bearer authentication when the token is configured literally or through an environment variable; verify the remote-allocation CLI cases pass.

## 3. Update Contract and Verify Site Build

- [x] 3.1 Update CLI and configuration reference text to distinguish site/config loading from remote `next-id` credential requirements; verify the documented examples and reference pages match the behavior.
- [x] 3.2 Run the Antora example-site build without `TRACER_ID_TOKEN` and verify it loads custom traceability configuration with no unresolved generated-matrix xrefs.
- [x] 3.3 Run the relevant config-loader and CLI tests and verify unset credentials fail only on remote allocation, not config loading or local allocation.
