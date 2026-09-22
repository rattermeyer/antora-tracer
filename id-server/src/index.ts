import { config } from "dotenv";

// Load a `.env` file from the working directory so `${VAR}` interpolation in
// configuration resolves without manual shell setup.
config({ quiet: true });

import { pathToFileURL } from "node:url";
import { StaticTokenAuth } from "./auth.js";
import { runProjectsCommand } from "./cli.js";
import { loadConfig } from "./config.js";
import { createIdServer } from "./server.js";
import { SqliteStore } from "./store.js";

export { type Auth, StaticTokenAuth } from "./auth.js";
export { type IdServerConfig, loadConfig } from "./config.js";
export { createIdServer, type IdServerOptions } from "./server.js";
export {
  type AllocatorStore,
  type ProjectStore,
  SqliteStore,
} from "./store.js";

/**
 * Load config, seed projects, wire the store/auth, and start listening.
 * Returns the server so callers (and tests) can close it.
 */
export function start(configPath?: string) {
  const config = loadConfig(configPath);
  const widths = new Map<string, number>();
  const starts = new Map<string, number>();
  for (const [prefix, p] of config.prefixes) {
    if (p.width !== undefined) widths.set(prefix, p.width);
    if (p.start !== undefined) starts.set(prefix, p.start);
  }
  const widthOf = (tenant: string, prefix: string): number =>
    config.tenantPrefixes.get(tenant)?.get(prefix)?.width ??
    widths.get(prefix) ??
    config.defaultWidth;
  const startOf = (tenant: string, prefix: string): number =>
    config.tenantPrefixes.get(tenant)?.get(prefix)?.start ??
    starts.get(prefix) ??
    1;
  const store = new SqliteStore(config.db, startOf);
  store.seedProjects(config.tokens);
  const auth = new StaticTokenAuth(store, config.adminToken === undefined);
  const server = createIdServer({
    store,
    auth,
    prefixes: widthOf,
    adminToken: config.adminToken,
  });
  server.listen(config.port, () => {
    console.log(
      `antora-id-server listening on http://localhost:${config.port}`,
    );
  });
  return server;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const command = process.argv[2];
  if (command === "projects") {
    runProjectsCommand(process.argv.slice(3)).catch((err: unknown) => {
      console.error(err instanceof Error ? err.message : String(err));
      process.exitCode = 1;
    });
  } else {
    start(command);
  }
}
