/**
 * Tests for the `query` CLI subcommand.
 *
 * These spawn the compiled CLI binary (lib/src/cli.js) against a temporary
 * fixture directory so the subcommand wiring, output formatting, JSON output,
 * and exit codes are exercised end-to-end.
 */

import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { expect } from "chai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, "..", "..");
const CLI = path.join(__dirname, "..", "src", "cli.js");
const TEST_DIR = path.join(__dirname, "temp-query");

// Chain: TST-001 ->tests-> IMP-001 ->implements-> DES-001 ->addresses-> REQ-001
// Plus two disconnected items, REQ-002 and REQ-999.
// REQ-003 branches from DES-001; DES-002 points inward to TST-001 only.
const SAMPLE = `= Test

[#REQ-001, item, role=requirement, title="Req 1"]
====
Requirement one.
====

[#DES-001, item, role=design, title="Design 1"]
====
Design one.

addresses:REQ-001[]
addresses:REQ-003[]
====

[#DES-002, item, role=design, title="Inbound Design"]
====
Referenced only by the test.

references:TST-001[]
====


[#IMP-001, item, role=implementation, title="Impl 1"]
====
Implementation one.

implements:DES-001[]
====

[#TST-001, item, role=test, title="Test 1"]
====
Test one.

tests:IMP-001[]
====

[#REQ-999, item, role=requirement, title="Orphan Req"]
====
Orphan requirement.
====

[#REQ-003, item, role=requirement, title="Req 3"]
====
Requirement three.
====

[#REQ-002, item, role=requirement, title="Req 2"]
====
Requirement two.
====

[#REQ-010, item, role=requirement, title="Superseded Req"]
====
Old requirement.
====

[#REQ-011, item, role=requirement, title="Successor Req"]
====
New requirement.

supersedes:REQ-010[]
====

[#REQ-020, item, role=requirement, title="Superseded Req In Use"]
====
Old requirement still referenced.
====

[#ARC-020, item, role=design, title="Design still referencing"]
====
Still addresses the old requirement.

addresses:REQ-020[]
====

[#REQ-021, item, role=requirement, title="Successor of REQ-020"]
====
New requirement.

supersedes:REQ-020[]
====
`;

function runQuery(
  args: string[],
  cwd = PROJECT_ROOT,
): { stdout: string; stderr: string; status: number } {
  const res = spawnSync("node", [CLI, "query", ...args], {
    encoding: "utf8",
    cwd,
  });
  return {
    stdout: res.stdout ?? "",
    stderr: res.stderr ?? "",
    status: res.status ?? -1,
  };
}

function jsonOf(args: string[]): unknown {
  const { stdout, stderr, status } = runQuery(args);
  expect(status, stderr).to.equal(0);
  return JSON.parse(stdout.trim());
}

const SNAPSHOT_PATH = path.join(TEST_DIR, "site-graph.json");

const MULTI_SOURCE_SNAPSHOT = {
  format: 1,
  items: [
    {
      id: "CHG-001",
      title: "Change",
      role: "change",
      attributes: {},
      component: "app",
      module: "ROOT",
      version: "1.0",
    },
    {
      id: "UC-001",
      title: "Use case",
      role: "use_case",
      attributes: {},
      component: "app",
      module: "ROOT",
      version: "1.0",
    },
    {
      id: "REQ-101",
      title: "Requirement A",
      role: "requirement",
      attributes: {},
      component: "core",
      module: "requirements",
      version: "2.0",
    },
    {
      id: "REQ-102",
      title: "Requirement B",
      role: "requirement",
      attributes: {},
      component: "docs",
      module: "ROOT",
      version: "main",
    },
    {
      id: "REQ-103",
      title: "Inbound only",
      role: "requirement",
      attributes: {},
      component: "other",
      module: "ROOT",
      version: "1.0",
    },
  ],
  relationships: [
    { id: "R1", fromId: "CHG-001", targetId: "UC-001", type: "links" },
    { id: "R2", fromId: "UC-001", targetId: "REQ-101", type: "links" },
    { id: "R3", fromId: "UC-001", targetId: "REQ-102", type: "links" },
    { id: "R4", fromId: "REQ-103", targetId: "CHG-001", type: "links" },
  ],
};
describe("Query Command", () => {
  before(() => {
    fs.mkdirSync(TEST_DIR, { recursive: true });
    fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(MULTI_SOURCE_SNAPSHOT));
    fs.writeFileSync(path.join(TEST_DIR, "sample.adoc"), SAMPLE);
  });

  after(() => {
    try {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  const input = (): string[] => ["-i", TEST_DIR];

  describe("query reverse", () => {
    it("lists items with inbound relationships as a table", () => {
      const { stdout, status } = runQuery(["reverse", "REQ-001", ...input()]);
      expect(status).to.equal(0);
      expect(stdout).to.include("DES-001");
      expect(stdout).to.include("addresses");
    });

    it("returns an empty result for an item with no inbound relationships", () => {
      const result = jsonOf(["reverse", "REQ-999", "--json", ...input()]);
      expect(result).to.deep.equal([]);
    });

    it("exits 1 with a warning for an unknown item ID", () => {
      const { status, stderr } = runQuery([
        "reverse",
        "UNKNOWN-001",
        ...input(),
      ]);
      expect(status).to.equal(1);
      expect(stderr).to.include("Item not found: UNKNOWN-001");
    });

    it("emits JSON containing full item and relationship objects", () => {
      const result = jsonOf(["reverse", "REQ-001", "--json", ...input()]);
      expect(result).to.be.an("array").with.lengthOf(1);
      const entry = (result as any[])[0];
      expect(entry.item.id).to.equal("DES-001");
      expect(entry.item.role).to.equal("design");
      expect(entry.relationship.type).to.equal("addresses");
      expect(entry.relationship.targetId).to.equal("REQ-001");
    });
  });

  describe("query linked", () => {
    it("returns forward reachable matching-role items at any distance", () => {
      const result = jsonOf([
        "linked",
        "TST-001",
        "requirement",
        "--json",
        ...input(),
      ]);
      expect((result as any[]).map((item) => item.id).sort()).to.deep.equal([
        "REQ-001",
        "REQ-003",
      ]);
    });

    it("prints matching items in the standard table", () => {
      const { stdout, status } = runQuery([
        "linked",
        "TST-001",
        "requirement",
        ...input(),
      ]);
      expect(status).to.equal(0);
      expect(stdout).to.include("ID");
      expect(stdout).to.include("REQ-001");
    });

    it("returns an empty result for an unmatched role", () => {
      expect(
        jsonOf(["linked", "TST-001", "unknown", "--json", ...input()]),
      ).to.deep.equal([]);
    });

    it("does not include items linked only toward the start", () => {
      const result = jsonOf([
        "linked",
        "TST-001",
        "design",
        "--json",
        ...input(),
      ]);
      expect((result as any[]).map((item) => item.id)).to.not.include(
        "DES-002",
      );
      expect((result as any[]).map((item) => item.id)).to.include("DES-001");
    });

    it("scans the current directory when no source option is given", () => {
      const { stdout, status } = runQuery(
        ["linked", "TST-001", "requirement", "--json"],
        TEST_DIR,
      );
      expect(status).to.equal(0);
      expect(
        (JSON.parse(stdout) as any[]).map((item) => item.id).sort(),
      ).to.deep.equal(["REQ-001", "REQ-003"]);
    });

    it("reports an unknown starting ID", () => {
      const { status, stderr } = runQuery([
        "linked",
        "UNKNOWN-001",
        "requirement",
        ...input(),
      ]);
      expect(status).to.equal(1);
      expect(stderr).to.include("Item not found: UNKNOWN-001");
    });

    it("queries linked items from a multi-source snapshot", () => {
      const result = jsonOf([
        "linked",
        "CHG-001",
        "requirement",
        "--snapshot",
        SNAPSHOT_PATH,
        "--json",
      ]);
      expect((result as any[]).map((item) => item.id).sort()).to.deep.equal([
        "REQ-101",
        "REQ-102",
      ]);
      expect(
        (result as any[]).map((item) => item.component).sort(),
      ).to.deep.equal(["core", "docs"]);
    });

    it("rejects snapshot and explicit local input together", () => {
      const { status, stderr } = runQuery([
        "linked",
        "CHG-001",
        "requirement",
        "--snapshot",
        SNAPSHOT_PATH,
        ...input(),
      ]);
      expect(status).to.equal(1);
      expect(stderr).to.include("Use either --input or --snapshot");
    });

    it("rejects an unsupported snapshot format", () => {
      const invalidPath = path.join(TEST_DIR, "invalid-snapshot.json");
      fs.writeFileSync(
        invalidPath,
        JSON.stringify({ format: 2, items: [], relationships: [] }),
      );
      const { status, stderr } = runQuery([
        "linked",
        "CHG-001",
        "requirement",
        "--snapshot",
        invalidPath,
      ]);
      expect(status).to.equal(1);
      expect(stderr).to.include("Unsupported snapshot format '2'");
    });
  });

  describe("query impact", () => {
    it("lists all transitively connected items", () => {
      const result = jsonOf(["impact", "REQ-001", "--json", ...input()]);
      const ids = (result as any[]).map((i) => i.id).sort();
      expect(ids).to.deep.equal([
        "DES-001",
        "DES-002",
        "IMP-001",
        "REQ-003",
        "TST-001",
      ]);
    });

    it("returns an empty result for a disconnected item", () => {
      const result = jsonOf(["impact", "REQ-999", "--json", ...input()]);
      expect(result).to.deep.equal([]);
    });
  });

  describe("query isolated", () => {
    it("lists items with no relationships", () => {
      const result = jsonOf(["isolated", "--json", ...input()]);
      const ids = (result as any[]).map((i) => i.id).sort();
      expect(ids).to.deep.equal(["REQ-002", "REQ-999"]);
    });

    it("filters isolated items by role", () => {
      const result = jsonOf([
        "isolated",
        "--role",
        "requirement",
        "--json",
        ...input(),
      ]);
      const ids = (result as any[]).map((i) => i.id).sort();
      expect(ids).to.deep.equal(["REQ-002", "REQ-999"]);
    });
  });

  describe("query orphaned", () => {
    it("lists superseded items with no incoming functional links", () => {
      const result = jsonOf(["orphaned", "--json", ...input()]);
      const ids = (result as any[]).map((i) => i.id).sort();
      expect(ids).to.deep.equal(["REQ-010"]);
    });

    it("excludes superseded items that are still referenced", () => {
      const result = jsonOf(["orphaned", "--json", ...input()]);
      const ids = (result as any[]).map((i) => i.id).sort();
      expect(ids).to.not.include("REQ-020");
    });

    it("filters orphaned items by role", () => {
      const result = jsonOf([
        "orphaned",
        "--role",
        "requirement",
        "--json",
        ...input(),
      ]);
      const ids = (result as any[]).map((i) => i.id).sort();
      expect(ids).to.deep.equal(["REQ-010"]);
    });
  });

  describe("query path", () => {
    it("prints the relationship chain between two items", () => {
      const { stdout, status } = runQuery([
        "path",
        "TST-001",
        "REQ-001",
        ...input(),
      ]);
      expect(status).to.equal(0);
      expect(stdout).to.include("TST-001");
      expect(stdout).to.include("--tests-->");
      expect(stdout).to.include("--implements-->");
      expect(stdout).to.include("--addresses-->");
      expect(stdout).to.include("REQ-001");
    });

    it("exits 1 with a message when no path exists", () => {
      const { status, stderr } = runQuery([
        "path",
        "REQ-001",
        "TST-001",
        ...input(),
      ]);
      expect(status).to.equal(1);
      expect(stderr).to.include("No path found");
    });

    it("exits 1 for an unknown item ID", () => {
      const { status, stderr } = runQuery([
        "path",
        "REQ-001",
        "UNKNOWN-001",
        ...input(),
      ]);
      expect(status).to.equal(1);
      expect(stderr).to.include("Item not found: UNKNOWN-001");
    });
  });

  describe("query --json flag", () => {
    it("produces valid JSON for a non-empty result", () => {
      const result = jsonOf(["reverse", "REQ-001", "--json", ...input()]);
      expect(Array.isArray(result)).to.be.true;
    });

    it("produces an empty array for no results", () => {
      const result = jsonOf(["reverse", "REQ-999", "--json", ...input()]);
      expect(result).to.deep.equal([]);
    });
  });
});
