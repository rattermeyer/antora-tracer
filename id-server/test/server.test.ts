import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect } from "chai";
import { StaticTokenAuth } from "../src/auth.js";
import { loadConfig } from "../src/config.js";
import { createIdServer } from "../src/server.js";
import { SqliteStore } from "../src/store.js";

interface Started {
  base: string;
  close: () => void;
}

const started: Array<() => void> = [];

afterEach(() => {
  while (started.length > 0) {
    started.pop()!();
  }
});

async function startServer(opts: {
  tokens?: Record<string, string>;
  prefixes?: Record<string, number>;
  starts?: Record<string, number>;
  store?: SqliteStore;
  adminToken?: string;
}): Promise<Started> {
  const dir = mkdtempSync(join(tmpdir(), "id-server-"));
  const store =
    opts.store ??
    new SqliteStore(
      join(dir, "ids.sqlite"),
      new Map(Object.entries(opts.starts ?? {})),
    );
  store.seedProjects(new Map(Object.entries(opts.tokens ?? {})));
  const auth = new StaticTokenAuth(store, opts.adminToken === undefined);
  const server = createIdServer({
    store,
    auth,
    prefixes: new Map(Object.entries(opts.prefixes ?? {})),
    defaultWidth: 3,
    adminToken: opts.adminToken,
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as { port: number }).port;
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    server.close();
    store.close();
    rmSync(dir, { recursive: true, force: true });
  };
  started.push(close);
  return { base: `http://127.0.0.1:${port}`, close };
}

async function nextId(
  base: string,
  prefix: string,
  token?: string,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const headers: Record<string, string> = {};
  if (token !== undefined) headers.authorization = `Bearer ${token}`;
  const res = await fetch(
    `${base}/next-id?prefix=${encodeURIComponent(prefix)}`,
    { headers },
  );
  return {
    status: res.status,
    body: (await res.json()) as Record<string, unknown>,
  };
}

describe("id-server", () => {
  it("returns sequential IDs for a prefix", async () => {
    const s = await startServer({});
    expect((await nextId(s.base, "REQ")).body).to.deep.equal({ id: "REQ-001" });
    expect((await nextId(s.base, "REQ")).body).to.deep.equal({ id: "REQ-002" });
  });

  it("returns 400 for a missing prefix", async () => {
    const s = await startServer({});
    const res = await fetch(`${s.base}/next-id`);
    expect(res.status).to.equal(400);
  });

  it("uses the default tenant when no tokens are configured", async () => {
    const s = await startServer({});
    expect((await nextId(s.base, "REQ")).body).to.deep.equal({ id: "REQ-001" });
  });

  it("rejects absent and unknown tokens when tokens are configured", async () => {
    const s = await startServer({ tokens: { acme: "known-secret" } });
    // absent token -> 401
    expect((await nextId(s.base, "REQ")).status).to.equal(401);
    // unknown token -> 401
    expect((await nextId(s.base, "REQ", "wrong")).status).to.equal(401);
    // known token -> its own tenant, independent counter
    expect((await nextId(s.base, "REQ", "known-secret")).body).to.deep.equal({
      id: "REQ-001",
    });
  });

  it("isolates counters per tenant", async () => {
    const s = await startServer({ tokens: { acme: "a", beta: "b" } });
    expect((await nextId(s.base, "REQ", "a")).body).to.deep.equal({
      id: "REQ-001",
    });
    expect((await nextId(s.base, "REQ", "b")).body).to.deep.equal({
      id: "REQ-001",
    });
    expect((await nextId(s.base, "REQ", "a")).body).to.deep.equal({
      id: "REQ-002",
    });
  });

  it("pads to the default width and honors configured width as a minimum", async () => {
    const s = await startServer({ prefixes: { ARC: 4 } });
    for (let i = 0; i < 6; i++) await nextId(s.base, "REQ");
    expect((await nextId(s.base, "REQ")).body).to.deep.equal({ id: "REQ-007" });
    for (let i = 0; i < 6; i++) await nextId(s.base, "ARC");
    expect((await nextId(s.base, "ARC")).body).to.deep.equal({
      id: "ARC-0007",
    });
  });

  it("grows past the configured width rather than truncating", async () => {
    const s = await startServer({ prefixes: { REQ: 1 } });
    for (let i = 0; i < 9; i++) await nextId(s.base, "REQ");
    expect((await nextId(s.base, "REQ")).body).to.deep.equal({ id: "REQ-10" });
  });

  it("honors a configured start value and increments from it", async () => {
    const s = await startServer({ starts: { REQ: 55 } });
    expect((await nextId(s.base, "REQ")).body).to.deep.equal({ id: "REQ-055" });
    expect((await nextId(s.base, "REQ")).body).to.deep.equal({ id: "REQ-056" });
  });

  it("does not allocate an ID on error responses", async () => {
    const s = await startServer({ tokens: { acme: "k" } });
    expect((await nextId(s.base, "REQ", "bad")).status).to.equal(401);
    expect((await nextId(s.base, "REQ", "k")).body).to.deep.equal({
      id: "REQ-001",
    });
  });

  it("hands out distinct IDs under concurrent requests", async () => {
    const s = await startServer({});
    const ids = await Promise.all(
      Array.from({ length: 20 }, () =>
        nextId(s.base, "REQ").then((r) => r.body.id),
      ),
    );
    const expected = Array.from(
      { length: 20 },
      (_, i) => `REQ-${String(i + 1).padStart(3, "0")}`,
    );
    expect(ids.sort()).to.deep.equal(expected);
  });

  it("reopens an existing database without resetting counters", async () => {
    const dir = mkdtempSync(join(tmpdir(), "id-server-"));
    const store = new SqliteStore(join(dir, "ids.sqlite"));
    await store.nextId("default", "REQ");
    await store.nextId("default", "REQ");
    store.close();

    const s = await startServer({
      store: new SqliteStore(join(dir, "ids.sqlite")),
    });
    // A fresh connection to the same file must continue from 3.
    expect((await nextId(s.base, "REQ")).body).to.deep.equal({ id: "REQ-003" });
    s.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("parses nested prefix config with width and start", () => {
    const dir = mkdtempSync(join(tmpdir(), "id-server-"));
    const configPath = join(dir, "config.yml");
    writeFileSync(
      configPath,
      [
        "tokens:",
        '  "s": "acme"',
        "prefixes:",
        "  REQ:",
        "    width: 4",
        "    start: 55",
        "  ARC: 3",
      ].join("\n"),
    );
    try {
      const config = loadConfig(configPath);
      expect(config.prefixes.get("REQ")).to.deep.equal({ width: 4, start: 55 });
      expect(config.prefixes.get("ARC")).to.deep.equal({ width: 3 });
      expect(config.tokens.get("s")).to.equal("acme");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("reads the adminToken key", () => {
    const dir = mkdtempSync(join(tmpdir(), "id-server-"));
    const configPath = join(dir, "config.yml");
    writeFileSync(configPath, ["adminToken: 'admin-secret'"].join("\n"));
    try {
      const config = loadConfig(configPath);
      expect(config.adminToken).to.equal("admin-secret");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("admin", () => {
  async function request(
    base: string,
    method: string,
    path: string,
    token?: string,
    body?: unknown,
  ): Promise<{ status: number; body: unknown }> {
    const headers: Record<string, string> = {};
    if (token !== undefined) headers.authorization = `Bearer ${token}`;
    if (body !== undefined) headers["content-type"] = "application/json";
    const res = await fetch(`${base}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    let parsed: unknown = null;
    try {
      parsed = await res.json();
    } catch {
      // non-JSON response
    }
    return { status: res.status, body: parsed };
  }

  it("returns 404 for admin routes when no admin token is configured", async () => {
    const s = await startServer({});
    expect((await request(s.base, "GET", "/admin/projects")).status).to.equal(
      404,
    );
    expect(
      (
        await request(s.base, "POST", "/admin/projects", undefined, {
          tenant: "acme",
          token: "a",
        })
      ).status,
    ).to.equal(404);
  });

  it("rejects missing, wrong, and project tokens for admin", async () => {
    const s = await startServer({
      tokens: { acme: "acme-token" },
      adminToken: "admin-secret",
    });
    expect((await request(s.base, "GET", "/admin/projects")).status).to.equal(
      401,
    );
    expect(
      (await request(s.base, "GET", "/admin/projects", "wrong")).status,
    ).to.equal(401);
    expect(
      (await request(s.base, "GET", "/admin/projects", "acme-token")).status,
    ).to.equal(401);
    expect(
      (await request(s.base, "GET", "/admin/projects", "admin-secret")).status,
    ).to.equal(200);
  });

  it("lists, adds, updates, and removes projects", async () => {
    const s = await startServer({ adminToken: "admin-secret" });
    const t = "admin-secret";
    expect(
      (await request(s.base, "GET", "/admin/projects", t)).body,
    ).to.deep.equal([]);
    expect(
      (
        await request(s.base, "POST", "/admin/projects", t, {
          tenant: "acme",
          token: "a",
        })
      ).status,
    ).to.equal(201);
    expect(
      (await request(s.base, "GET", "/admin/projects", t)).body,
    ).to.deep.equal(["acme"]);
    expect(
      (
        await request(s.base, "POST", "/admin/projects", t, {
          tenant: "acme",
          token: "b",
        })
      ).status,
    ).to.equal(409);
    expect(
      (await request(s.base, "PUT", "/admin/projects/acme", t, { token: "a2" }))
        .status,
    ).to.equal(200);
    expect(
      (await request(s.base, "DELETE", "/admin/projects/acme", t)).status,
    ).to.equal(200);
    expect(
      (
        await request(s.base, "PUT", "/admin/projects/missing", t, {
          token: "x",
        })
      ).status,
    ).to.equal(404);
    expect(
      (await request(s.base, "DELETE", "/admin/projects/missing", t)).status,
    ).to.equal(404);
  });

  it("rejects malformed bodies", async () => {
    const s = await startServer({ adminToken: "admin-secret" });
    expect(
      (
        await request(s.base, "POST", "/admin/projects", "admin-secret", {
          tenant: "acme",
        })
      ).status,
    ).to.equal(400);
    expect(
      (await request(s.base, "PUT", "/admin/projects/acme", "admin-secret", {}))
        .status,
    ).to.equal(400);
  });

  it("makes an added project usable and a removed one rejected, immediately", async () => {
    const s = await startServer({ adminToken: "admin-secret" });
    await request(s.base, "POST", "/admin/projects", "admin-secret", {
      tenant: "acme",
      token: "acme-token",
    });
    expect((await nextId(s.base, "REQ", "acme-token")).body).to.deep.equal({
      id: "REQ-001",
    });
    await request(s.base, "DELETE", "/admin/projects/acme", "admin-secret");
    expect((await nextId(s.base, "REQ", "acme-token")).status).to.equal(401);
  });
});
