import { config } from "dotenv";

// Load a `.env` file from the working directory so `${VAR}` interpolation in
// configuration resolves without manual shell setup.
config({ quiet: true });

import { pathToFileURL } from "node:url";
import { loadConfig } from "./config.js";
import { StaticTokenAuth } from "./auth.js";
import { SqliteStore } from "./store.js";
import { createIdServer } from "./server.js";

export { loadConfig, type IdServerConfig } from "./config.js";
export { StaticTokenAuth, type Auth } from "./auth.js";
export { SqliteStore, type AllocatorStore } from "./store.js";
export { createIdServer, type IdServerOptions } from "./server.js";

/**
 * Load config, wire the store/auth, and start listening. Returns the server
 * so callers (and tests) can close it.
 */
export function start(configPath?: string) {
  const config = loadConfig(configPath);
  const widths = new Map<string, number>();
  const starts = new Map<string, number>();
  for (const [prefix, p] of config.prefixes) {
    if (p.width !== undefined) widths.set(prefix, p.width);
    if (p.start !== undefined) starts.set(prefix, p.start);
  }
  const store = new SqliteStore(config.db, starts);
  const auth = new StaticTokenAuth(config.tokens);
  const server = createIdServer({
    store,
    auth,
    prefixes: widths,
    defaultWidth: config.defaultWidth,
  });
  server.listen(config.port, () => {
    console.log(
      `antora-id-server listening on http://localhost:${config.port}`,
    );
  });
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  start(process.argv[2]);
}
