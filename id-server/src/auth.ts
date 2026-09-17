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
 * Static `token -> tenant` map. An absent token resolves to the `default`
 * tenant; an unrecognized token (when tokens are configured) resolves to
 * `undefined` so the route rejects with 401.
 */
export class StaticTokenAuth implements Auth {
  constructor(private readonly tokens: ReadonlyMap<string, string>) {}

  resolve(authorization: string | undefined): string | undefined {
    if (authorization === undefined || authorization === "") {
      return "default";
    }
    const token = extractBearer(authorization);
    if (token === undefined) return undefined;
    if (this.tokens.size === 0) return "default";
    return this.tokens.get(token);
  }
}
