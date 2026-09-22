import { DatabaseSync } from "node:sqlite";
import { sha256Hex } from "./hash.js";
export class SqliteStore {
    db;
    startOf;
    constructor(path, startOf) {
        this.db = new DatabaseSync(path);
        this.startOf = startOf ?? (() => 1);
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
    async nextId(tenant, prefix) {
        // A single atomic statement: insert the configured start on first use,
        // else increment and return. Correct under concurrency without a
        // read-then-write.
        const start = this.startOf(tenant, prefix);
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
    listProjects() {
        const rows = this.db
            .prepare("SELECT tenant FROM projects ORDER BY tenant")
            .all();
        return rows.map((row) => row.tenant);
    }
    createProject(tenant, token) {
        const result = this.db
            .prepare("INSERT OR IGNORE INTO projects (tenant, token_hash) VALUES (?, ?)")
            .run(tenant, sha256Hex(token));
        return result.changes > 0;
    }
    updateProjectToken(tenant, token) {
        const result = this.db
            .prepare("UPDATE projects SET token_hash = ? WHERE tenant = ?")
            .run(sha256Hex(token), tenant);
        return result.changes > 0;
    }
    removeProject(tenant) {
        const result = this.db
            .prepare("DELETE FROM projects WHERE tenant = ?")
            .run(tenant);
        return result.changes > 0;
    }
    hasProjects() {
        const row = this.db.prepare("SELECT COUNT(*) AS n FROM projects").get();
        return row.n > 0;
    }
    resolveTenant(token) {
        const row = this.db
            .prepare("SELECT tenant FROM projects WHERE token_hash = ?")
            .get(sha256Hex(token));
        return row?.tenant;
    }
    seedProjects(tokens) {
        // Seed once: only when no projects exist yet, so runtime state wins over
        // config on subsequent boots.
        if (this.hasProjects())
            return;
        const insert = this.db.prepare("INSERT INTO projects (tenant, token_hash) VALUES (?, ?)");
        for (const [tenant, token] of tokens) {
            insert.run(tenant, sha256Hex(token));
        }
    }
    close() {
        this.db.close();
    }
}
