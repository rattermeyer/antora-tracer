## 1. Config + auth

- [x] 1.1 Swap `config.ts` token parsing to `tenant → token` (interpolate the token value); verify `npm run build` compiles
- [x] 1.2 Change `auth.ts` `resolve` to reverse-lookup the tenant by token value; verify the auth scenarios pass

## 2. Tests

- [x] 2.1 Update test token maps to `tenant → token` and confirm independent-tenant + 401 scenarios still pass

## 3. Docs

- [x] 3.1 Update the `how-to/run-id-server.adoc` token example to `tenant → token`; verify the Antora site still builds
