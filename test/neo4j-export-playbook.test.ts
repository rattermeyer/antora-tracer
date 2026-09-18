import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect } from "chai";

const __dirname = resolve(dirname(fileURLToPath(import.meta.url)));

describe("export neo4j", () => {
  const cliPath = join(__dirname, "..", "src", "cli.js");

  it("errors when no input is provided", () => {
    const res = spawnSync("node", [cliPath, "export", "neo4j"], {
      encoding: "utf8",
    });
    expect(res.status).to.equal(1);
  });

  it("exports a playbook's complete graph to Neo4j CSV", () => {
    const repoRoot = resolve(process.cwd());
    const playbook = [
      "site:",
      "  title: export-test",
      "content:",
      "  sources:",
      `    - url: ${repoRoot}`,
      "      start_paths: [examples/tracer]",
      "      branches: HEAD",
      "ui:",
      "  bundle:",
      "    url: https://example.com/ui-bundle.zip",
    ].join("\n");
    const playbookPath = join(__dirname, "temp-export-playbook.yml");
    const outDir = join(__dirname, "temp-export-out");
    writeFileSync(playbookPath, playbook, "utf8");
    try {
      execFileSync(
        "node",
        [cliPath, "export", "neo4j", playbookPath, "-o", outDir],
        { encoding: "utf8" },
      );
      expect(existsSync(join(outDir, "nodes.csv"))).to.be.true;
      expect(existsSync(join(outDir, "relationships.csv"))).to.be.true;
    } finally {
      rmSync(playbookPath, { force: true });
      rmSync(outDir, { recursive: true, force: true });
    }
  });
});
