export function extractBearer(authorization) {
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
export class StaticTokenAuth {
    store;
    defaultWhenEmpty;
    constructor(store, defaultWhenEmpty) {
        this.store = store;
        this.defaultWhenEmpty = defaultWhenEmpty;
    }
    resolve(authorization) {
        if (this.defaultWhenEmpty && !this.store.hasProjects())
            return "default";
        if (authorization === undefined)
            return undefined;
        const token = extractBearer(authorization);
        if (token === undefined)
            return undefined;
        return this.store.resolveTenant(token);
    }
}
