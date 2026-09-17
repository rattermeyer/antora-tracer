function extractBearer(authorization) {
    const match = /^Bearer\s+(.+)$/i.exec(authorization);
    return match ? match[1].trim() : undefined;
}
/**
 * Static `token -> tenant` map. With no tokens configured, every request is
 * attributed to the `default` tenant (single-tenant, auth off). With tokens
 * configured, an absent, malformed, or unrecognized token resolves to
 * `undefined` so the route rejects with 401.
 */
export class StaticTokenAuth {
    tokens;
    constructor(tokens) {
        this.tokens = tokens;
    }
    resolve(authorization) {
        if (this.tokens.size === 0)
            return "default";
        if (authorization === undefined)
            return undefined;
        const token = extractBearer(authorization);
        if (token === undefined)
            return undefined;
        return this.tokens.get(token);
    }
}
