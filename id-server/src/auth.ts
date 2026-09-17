/**
 * Resolves a request's credentials to a tenant. The seam exists so a hosted
 * backend (accounts + API keys) can replace the static token map later
 * without touching the route or store.
 */
export interface Auth {
  /**
   * Resolve a request's bearer token to a tenant, or return `undefined` to
   * reject the request with 401.
   */
  resolve(authorization: string | undefined): string | undefined;
}

function extractBearer(authorization: string): string | undefined {
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  return match ? match[1].trim() : undefined;
}

/**
 * Static `token -> tenant` map. With no tokens configured, every request is
 * attributed to the `default` tenant (single-tenant, auth off). With tokens
 * configured, an absent, malformed, or unrecognized token resolves to
 * `undefined` so the route rejects with 401.
 */
export class StaticTokenAuth implements Auth {
  constructor(private readonly tokens: ReadonlyMap<string, string>) {}

  resolve(authorization: string | undefined): string | undefined {
    if (this.tokens.size === 0) return "default";
    if (authorization === undefined) return undefined;
    const token = extractBearer(authorization);
    if (token === undefined) return undefined;
    return this.tokens.get(token);
  }
}
