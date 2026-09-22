import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect } from "chai";
import { SqliteStore } from "../src/store.js";

function makeStore(): { store: SqliteStore; dir: string } {
  const dir = mkdtempSync(join(tmpdir(), "id-server-store-"));
  return { store: new SqliteStore(join(dir, "ids.sqlite")), dir };
}

describe("SqliteStore projects", () => {
  it("lists, creates, updates, and removes projects", () => {
    const { store, dir } = makeStore();
    try {
      expect(store.listProjects()).to.deep.equal([]);
      expect(store.hasProjects()).to.equal(false);

      expect(store.createProject("acme", "a")).to.equal(true);
      expect(store.createProject("acme", "a2")).to.equal(false); // duplicate
      expect(store.hasProjects()).to.equal(true);
      expect(store.listProjects()).to.deep.equal(["acme"]);
      expect(store.resolveTenant("a")).to.equal("acme");
      expect(store.resolveTenant("a2")).to.equal(undefined);

      expect(store.updateProjectToken("acme", "b")).to.equal(true);
      expect(store.resolveTenant("a")).to.equal(undefined);
      expect(store.resolveTenant("b")).to.equal("acme");
      expect(store.updateProjectToken("missing", "b")).to.equal(false);

      expect(store.removeProject("acme")).to.equal(true);
      expect(store.removeProject("acme")).to.equal(false);
      expect(store.hasProjects()).to.equal(false);
    } finally {
      store.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("seeds projects from a token map only when empty", () => {
    const { store, dir } = makeStore();
    try {
      store.seedProjects(new Map([["acme", "a"]]));
      expect(store.listProjects()).to.deep.equal(["acme"]);
      expect(store.resolveTenant("a")).to.equal("acme");

      // idempotent: a later seed does not overwrite runtime state
      store.seedProjects(new Map([["beta", "b"]]));
      expect(store.listProjects()).to.deep.equal(["acme"]);
      expect(store.resolveTenant("b")).to.equal(undefined);
    } finally {
      store.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("SqliteStore counters", () => {
  it("resolves start per tenant with global fallback and independent counters", async () => {
    const dir = mkdtempSync(join(tmpdir(), "id-server-store-"));
    const globalStarts = new Map<string, number>([["REQ", 55]]);
    const tenantStarts = new Map<string, Map<string, number>>([
      ["beta", new Map([["REQ", 1000]])],
    ]);
    const store = new SqliteStore(
      join(dir, "ids.sqlite"),
      (tenant, prefix) =>
        tenantStarts.get(tenant)?.get(prefix) ?? globalStarts.get(prefix) ?? 1,
    );
    try {
      // tenant override
      expect(await store.nextId("beta", "REQ")).to.equal(1000);
      expect(await store.nextId("beta", "REQ")).to.equal(1001);
      // global fallback
      expect(await store.nextId("acme", "REQ")).to.equal(55);
      expect(await store.nextId("acme", "REQ")).to.equal(56);
      // independent counters for the same prefix
      expect(await store.nextId("beta", "REQ")).to.equal(1002);
      // unseeded prefix defaults to 1
      expect(await store.nextId("acme", "ARC")).to.equal(1);
    } finally {
      store.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
