import { DatabaseSync } from "node:sqlite";

/**
 * Atomic ID counter. The seam exists so a Postgres backend can replace
 * SQLite later without touching the HTTP layer or auth.
 */
export interface AllocatorStore {
  /** Atomically increment and return the counter for (tenant, prefix). */
  nextId(tenant: string, prefix: string): Promise<number>;
  close(): void;
}

export class SqliteStore implements AllocatorStore {
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
      )
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

  close(): void {
    this.db.close();
  }
}
