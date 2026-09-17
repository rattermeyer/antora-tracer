function extractBearer(authorization) {
    const match = /^Bearer\s+(.+)$/i.exec(authorization);
    return match ? match[1].trim() : undefined;
}
/**
 * Static `token -> tenant` map. An absent token resolves to the `default`
 * tenant; an unrecognized token (when tokens are configured) resolves to
 * `undefined` so the route rejects with 401.
 */
export class StaticTokenAuth {
    tokens;
    constructor(tokens) {
        this.tokens = tokens;
    }
    resolve(authorization) {
        if (authorization === undefined || authorization === "") {
            return "default";
        }
        const token = extractBearer(authorization);
        if (token === undefined)
            return undefined;
        if (this.tokens.size === 0)
            return "default";
        return this.tokens.get(token);
    }
}
