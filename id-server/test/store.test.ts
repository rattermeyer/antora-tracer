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
