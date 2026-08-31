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
// Plus two disconnected items (REQ-999 isolated, REQ-002 isolated),
// and supersession fixtures: REQ-010 (orphaned), REQ-020 (superseded but still referenced).
const SAMPLE = `= Test

[#REQ-001, item, role=requirement, title="Req 1"]
====
Requirement one.
====

[#DES-001, item, role=design, title="Design 1"]
====
Design one.

addresses:REQ-001[]
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

function runQuery(args: string[]): {
  stdout: string;
  stderr: string;
  status: number;
} {
  const res = spawnSync("node", [CLI, "query", ...args], {
    encoding: "utf8",
    cwd: PROJECT_ROOT,
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

describe("Query Command", () => {
  before(() => {
    fs.mkdirSync(TEST_DIR, { recursive: true });
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

  describe("query impact", () => {
    it("lists all transitively connected items", () => {
      const result = jsonOf(["impact", "REQ-001", "--json", ...input()]);
      const ids = (result as any[]).map((i) => i.id).sort();
      expect(ids).to.deep.equal(["DES-001", "IMP-001", "TST-001"]);
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
