import { DatabaseSync } from "node:sqlite";
export class SqliteStore {
    db;
    starts;
    constructor(path, starts) {
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
    async nextId(tenant, prefix) {
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
            .get(tenant, prefix, start);
        return row.n;
    }
    close() {
        this.db.close();
    }
}
