import { readFileSync } from "node:fs";
import { load as yamlLoad } from "js-yaml";
/**
 * Interpolate `${VAR}` references against `process.env`, throwing when a
 * referenced variable is unset.
 */
function interpolateEnv(value) {
    return value.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_match, name) => {
        const resolved = process.env[name];
        if (resolved === undefined) {
            throw new Error(`Environment variable '${name}' is not set`);
        }
        return resolved;
    });
}
/**
 * Parse a `{ prefix -> number | {width?, start?} }` map into prefix configs.
 * A bare number is shorthand for `{ width: number }`.
 */
function parsePrefixes(raw) {
    const prefixes = new Map();
    for (const [prefix, value] of Object.entries(raw)) {
        if (typeof value === "number") {
            prefixes.set(prefix, { width: value });
        }
        else if (value !== null && typeof value === "object") {
            const v = value;
            const entry = {};
            if (v.width !== undefined)
                entry.width = Number(v.width) || 3;
            if (v.start !== undefined) {
                const start = Number(v.start);
                entry.start =
                    Number.isFinite(start) && start >= 1 ? Math.floor(start) : 1;
            }
            prefixes.set(prefix, entry);
        }
    }
    return prefixes;
}
/**
 * Load and validate server configuration from a YAML file. When no path is
 * given, sensible defaults are used (port 8080, ./ids.sqlite).
 */
export function loadConfig(configPath) {
    const raw = configPath ? readFileSync(configPath, "utf8") : "";
    const data = (raw.trim() ? yamlLoad(raw) : {});
    const tokens = new Map();
    const rawTokens = (data.tokens ?? {});
    for (const [tenant, token] of Object.entries(rawTokens)) {
        tokens.set(interpolateEnv(tenant), interpolateEnv(String(token)));
    }
    const prefixes = parsePrefixes((data.prefixes ?? {}));
    const tenantPrefixes = new Map();
    const rawTenantPrefixes = (data.tenantPrefixes ?? {});
    for (const [tenant, raw] of Object.entries(rawTenantPrefixes)) {
        if (raw !== null && typeof raw === "object") {
            tenantPrefixes.set(interpolateEnv(tenant), parsePrefixes(raw));
        }
    }
    return {
        port: Number(data.port ?? 8080) || 8080,
        db: interpolateEnv(String(data.db ?? "./ids.sqlite")),
        tokens,
        adminToken: data.adminToken === undefined
            ? undefined
            : interpolateEnv(String(data.adminToken)),
        prefixes,
        tenantPrefixes,
        defaultWidth: 3,
    };
}
