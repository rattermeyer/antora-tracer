/**
 * Resolves a request's credentials to a tenant. The seam exists so a hosted
 * backend (accounts + API keys) can replace the project store later
 * without touching the route or store.
 */
export interface Auth {
  /**
   * Resolve a request's bearer token to a tenant, or return `undefined` to
   * reject the request with 401.
   */
  resolve(authorization: string | undefined): string | undefined;
}

/** Narrow seam over the project store that tenancy resolution needs. */
export interface TokenStore {
  hasProjects(): boolean;
  resolveTenant(token: string): string | undefined;
}

export function extractBearer(authorization: string): string | undefined {
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  return match ? match[1].trim() : undefined;
}

/**
 * Resolves a bearer token against the persisted project set.
 *
 * `defaultWhenEmpty` is true in single-team mode (no admin token configured):
 * with no projects, every request is attributed to the `default` tenant.
 * When false (an admin token is configured), a project token is always
 * required — even with zero projects — so removing the last project can
 * never silently open the allocator.
 */
export class StaticTokenAuth implements Auth {
  constructor(
    private readonly store: TokenStore,
    private readonly defaultWhenEmpty: boolean,
  ) {}

  resolve(authorization: string | undefined): string | undefined {
    if (this.defaultWhenEmpty && !this.store.hasProjects()) return "default";
    if (authorization === undefined) return undefined;
    const token = extractBearer(authorization);
    if (token === undefined) return undefined;
    return this.store.resolveTenant(token);
  }
}
