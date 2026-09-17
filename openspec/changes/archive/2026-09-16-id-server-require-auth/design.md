## Context

See proposal.md — Why. `StaticTokenAuth` is the self-hosted auth backend behind the `Auth` seam (see the archived `id-allocation-server` design).

## Goals / Non-Goals

**Goals:**
- All-or-nothing authentication: no anonymous `default` tenant when tokens are configured.

**Non-Goals:**
- A separate `allowAnonymous` flag — the user rejected mixed mode; inference from the `tokens` map is the contract.
- The hosted `AccountApiKeyAuth` backend (unchanged; it already rejects absent tokens).

## Decisions

### 1. Infer auth from the `tokens` map
`resolve` checks the `tokens` map first: empty → `"default"` for every request (single-tenant, auth off); non-empty → an absent or malformed token returns `undefined` (→ 401), a known token returns its tenant, and an unknown token returns `undefined`.
Rationale: authentication is all-or-nothing. A mixed mode (anonymous default plus named tenants) leaves a write path that defeats the allocator's collision guarantee.
Alternative: an `allowAnonymous` flag — rejected because it keeps the mixed mode possible.

## Risks / Trade-offs

- [Breaking] deployments that relied on "absent token → default" with tokens configured now get `401` → intended; that mix was the vulnerability this change closes.
