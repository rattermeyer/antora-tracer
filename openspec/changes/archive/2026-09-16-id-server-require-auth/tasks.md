## 1. Auth

- [x] 1.1 Reorder `StaticTokenAuth.resolve` so an empty token map short-circuits to `default` and a non-empty map rejects absent/malformed tokens; verify the auth scenarios pass

## 2. Tests

- [x] 2.1 Update auth tests: absent token with tokens configured → 401, absent token with no tokens → default tenant

## 3. Docs

- [x] 3.1 Update `how-to/run-id-server.adoc` token semantics; verify the Antora site still builds
