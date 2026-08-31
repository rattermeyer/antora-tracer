/**
 * Tests for the `archive` and `remove` CLI commands — the item lifecycle.
 *
 * These spawn the compiled CLI binary against a temporary fixture directory,
 * exercising end-to-end block relocation/deletion and the confirmation prompts.
 */

import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { expect } from "chai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, "..", "..");
const CLI = path.join(__dirname, "..", "src", "cli.js");
const TEST_DIR = path.join(__dirname, "temp-lifecycle");

// REQ-042 is superseded by REQ-043 (and has no other incoming links → orphaned).
// REQ-100 has no relationships at all → isolated.
const SAMPLE = `= Test

[#REQ-042, item, role=requirement, title="Old"]
--
Old requirement.
--

[#REQ-043, item, role=requirement, title="New"]
--
New requirement.

supersedes:REQ-042[]
--

[#REQ-100, item, role=requirement, title="Isolated"]
--
Isolated requirement.
--
`;

function runCli(args: string[], input?: string) {
  return spawnSync("node", [CLI, ...args], {
    encoding: "utf8",
    cwd: PROJECT_ROOT,
    input,
  });
}

function resetFixture(): void {
  fs.mkdirSync(TEST_DIR, { recursive: true });
  fs.rmSync(path.join(TEST_DIR, "superseded.adoc"), { force: true });
  fs.writeFileSync(path.join(TEST_DIR, "index.adoc"), SAMPLE);
}

function readIndex(): string {
  return fs.readFileSync(path.join(TEST_DIR, "index.adoc"), "utf8");
}

describe("Item lifecycle (archive/remove)", () => {
  before(() => fs.mkdirSync(TEST_DIR, { recursive: true }));
  after(() => fs.rmSync(TEST_DIR, { recursive: true, force: true }));
  beforeEach(() => resetFixture());

  describe("archive", () => {
    it("moves a superseded block to superseded.adoc and preserves content", () => {
      const res = runCli(["archive", "REQ-042", "-i", TEST_DIR]);
      expect(res.status, res.stderr).to.equal(0);
      expect(readIndex()).to.not.include("[#REQ-042, item");
      expect(readIndex()).to.include("REQ-043");

      const superseded = fs.readFileSync(
        path.join(TEST_DIR, "superseded.adoc"),
        "utf8",
      );
      expect(superseded).to.include(
        '[#REQ-042, item, role=requirement, title="Old"]',
      );
      expect(superseded).to.include("Old requirement.");
    });

    it("rejects a non-superseded item with no file change", () => {
      const res = runCli(["archive", "REQ-100", "-i", TEST_DIR]);
      expect(res.status).to.equal(1);
      expect(res.stderr).to.include("not superseded");
      expect(fs.existsSync(path.join(TEST_DIR, "superseded.adoc"))).to.be.false;
    });

    it("rejects an unknown item", () => {
      const res = runCli(["archive", "UNKNOWN-001", "-i", TEST_DIR]);
      expect(res.status).to.equal(1);
      expect(res.stderr).to.include("not found");
    });
  });

  describe("remove", () => {
    it("removes an orphaned item after confirmation", () => {
      const res = runCli(["remove", "REQ-042", "-i", TEST_DIR], "y\n");
      expect(res.status, res.stderr).to.equal(0);
      expect(res.stdout).to.include("Remove REQ-042?");
      expect(readIndex()).to.not.include("[#REQ-042, item");
    });

    it("declines orphaned removal on a non-y answer", () => {
      const res = runCli(["remove", "REQ-042", "-i", TEST_DIR], "n\n");
      expect(res.stdout).to.include("No change made");
      expect(readIndex()).to.include("REQ-042");
    });

    it("removes an isolated item only after typing the ID", () => {
      const res = runCli(["remove", "REQ-100", "-i", TEST_DIR], "REQ-100\n");
      expect(res.status, res.stderr).to.equal(0);
      expect(res.stdout).to.include("Type the ID to confirm");
      expect(readIndex()).to.not.include("[#REQ-100, item");
    });

    it("declines isolated removal on an ID mismatch", () => {
      const res = runCli(["remove", "REQ-100", "-i", TEST_DIR], "WRONG\n");
      expect(res.stdout).to.include("did not match");
      expect(readIndex()).to.include("REQ-100");
    });

    it("rejects a non-orphaned, non-isolated item", () => {
      const res = runCli(["remove", "REQ-043", "-i", TEST_DIR]);
      expect(res.status).to.equal(1);
      expect(res.stderr).to.include("neither orphaned nor isolated");
    });
  });
});
