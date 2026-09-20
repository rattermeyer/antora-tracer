import { readFileSync } from "node:fs";
import { load as yamlLoad } from "js-yaml";

/**
 * Per-prefix allocation configuration.
 */
export interface PrefixConfig {
  /** Minimum zero-padding width. */
  width?: number;
  /** First ID number allocated for this prefix (default 1). */
  start?: number;
}

/**
 * Resolved server configuration.
 */
export interface IdServerConfig {
  /** HTTP port to listen on. */
  port: number;
  /** Path to the SQLite database file. */
  db: string;
  /** Map of tenant -> token. Empty means single-tenant (all requests default). */
  tokens: Map<string, string>;
  /** Bearer token enabling the `/admin/projects` routes; absent disables them. */
  adminToken: string | undefined;
  /** Map of prefix -> width/start configuration. */
  prefixes: Map<string, PrefixConfig>;
  /** Fallback width for prefixes not listed in `prefixes`. */
  defaultWidth: number;
}

/**
 * Interpolate `${VAR}` references against `process.env`, throwing when a
 * referenced variable is unset.
 */
function interpolateEnv(value: string): string {
  return value.replace(
    /\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g,
    (_match, name: string) => {
      const resolved = process.env[name];
      if (resolved === undefined) {
        throw new Error(`Environment variable '${name}' is not set`);
      }
      return resolved;
    },
  );
}

/**
 * Load and validate server configuration from a YAML file. When no path is
 * given, sensible defaults are used (port 8080, ./ids.sqlite).
 */
export function loadConfig(configPath?: string): IdServerConfig {
  const raw = configPath ? readFileSync(configPath, "utf8") : "";
  const data = (
    raw.trim() ? (yamlLoad(raw) as Record<string, unknown>) : {}
  ) as Record<string, unknown>;

  const tokens = new Map<string, string>();
  const rawTokens = (data.tokens ?? {}) as Record<string, unknown>;
  for (const [tenant, token] of Object.entries(rawTokens)) {
    tokens.set(interpolateEnv(tenant), interpolateEnv(String(token)));
  }

  const prefixes = new Map<string, PrefixConfig>();
  const rawPrefixes = (data.prefixes ?? {}) as Record<string, unknown>;
  for (const [prefix, value] of Object.entries(rawPrefixes)) {
    if (typeof value === "number") {
      prefixes.set(prefix, { width: value });
    } else if (value !== null && typeof value === "object") {
      const v = value as Record<string, unknown>;
      const entry: PrefixConfig = {};
      if (v.width !== undefined) entry.width = Number(v.width) || 3;
      if (v.start !== undefined) {
        const start = Number(v.start);
        entry.start =
          Number.isFinite(start) && start >= 1 ? Math.floor(start) : 1;
      }
      prefixes.set(prefix, entry);
    }
  }

  return {
    port: Number(data.port ?? 8080) || 8080,
    db: interpolateEnv(String(data.db ?? "./ids.sqlite")),
    tokens,
    adminToken:
      data.adminToken === undefined
        ? undefined
        : interpolateEnv(String(data.adminToken)),
    prefixes,
    defaultWidth: 3,
  };
}
