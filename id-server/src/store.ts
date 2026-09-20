import { DatabaseSync } from "node:sqlite";
import { sha256Hex } from "./hash.js";

/**
 * Atomic ID counter. The seam exists so a Postgres backend can replace
 * SQLite later without touching the HTTP layer or auth.
 */
export interface AllocatorStore {
  /** Atomically increment and return the counter for (tenant, prefix). */
  nextId(tenant: string, prefix: string): Promise<number>;
  close(): void;
}

/**
 * Project (tenant) persistence. The seam exists so a hosted backend can
 * replace SQLite later without touching the admin routes.
 */
export interface ProjectStore {
  listProjects(): string[];
  /** Returns false when the tenant already exists. */
  createProject(tenant: string, token: string): boolean;
  /** Returns false when the tenant does not exist. */
  updateProjectToken(tenant: string, token: string): boolean;
  /** Returns false when the tenant does not exist. */
  removeProject(tenant: string): boolean;
}

export class SqliteStore implements AllocatorStore, ProjectStore {
  private readonly db: DatabaseSync;
  private readonly starts: ReadonlyMap<string, number>;

  constructor(path: string, starts?: ReadonlyMap<string, number>) {
    this.db = new DatabaseSync(path);
    this.starts = starts ?? new Map();
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS counters (
        tenant TEXT NOT NULL,
        prefix TEXT NOT NULL,
        n INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (tenant, prefix)
      );
      CREATE TABLE IF NOT EXISTS projects (
        tenant TEXT PRIMARY KEY,
        token_hash TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      );
    `);
  }

  async nextId(tenant: string, prefix: string): Promise<number> {
    // A single atomic statement: insert the configured start on first use,
    // else increment and return. Correct under concurrency without a
    // read-then-write.
    const start = this.starts.get(prefix) ?? 1;
    const row = this.db
      .prepare(`
        INSERT INTO counters (tenant, prefix, n)
        VALUES (?, ?, ?)
        ON CONFLICT (tenant, prefix) DO UPDATE SET n = n + 1
        RETURNING n
      `)
      .get(tenant, prefix, start) as { n: number };
    return row.n;
  }

  listProjects(): string[] {
    const rows = this.db
      .prepare("SELECT tenant FROM projects ORDER BY tenant")
      .all() as Array<{ tenant: string }>;
    return rows.map((row) => row.tenant);
  }

  createProject(tenant: string, token: string): boolean {
    const result = this.db
      .prepare(
        "INSERT OR IGNORE INTO projects (tenant, token_hash) VALUES (?, ?)",
      )
      .run(tenant, sha256Hex(token));
    return result.changes > 0;
  }

  updateProjectToken(tenant: string, token: string): boolean {
    const result = this.db
      .prepare("UPDATE projects SET token_hash = ? WHERE tenant = ?")
      .run(sha256Hex(token), tenant);
    return result.changes > 0;
  }

  removeProject(tenant: string): boolean {
    const result = this.db
      .prepare("DELETE FROM projects WHERE tenant = ?")
      .run(tenant);
    return result.changes > 0;
  }

  hasProjects(): boolean {
    const row = this.db.prepare("SELECT COUNT(*) AS n FROM projects").get() as {
      n: number;
    };
    return row.n > 0;
  }

  resolveTenant(token: string): string | undefined {
    const row = this.db
      .prepare("SELECT tenant FROM projects WHERE token_hash = ?")
      .get(sha256Hex(token)) as { tenant: string } | undefined;
    return row?.tenant;
  }

  seedProjects(tokens: ReadonlyMap<string, string>): void {
    // Seed once: only when no projects exist yet, so runtime state wins over
    // config on subsequent boots.
    if (this.hasProjects()) return;
    const insert = this.db.prepare(
      "INSERT INTO projects (tenant, token_hash) VALUES (?, ?)",
    );
    for (const [tenant, token] of tokens) {
      insert.run(tenant, sha256Hex(token));
    }
  }

  close(): void {
    this.db.close();
  }
}
