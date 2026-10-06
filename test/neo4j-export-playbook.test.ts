import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { expect } from "chai";

const __dirname = resolve(dirname(fileURLToPath(import.meta.url)));

function initializeFixtureRepository(root: string): void {
  execFileSync("git", ["init", "-b", "main"], { cwd: root, stdio: "ignore" });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: root });
  execFileSync("git", ["config", "user.email", "test@example.invalid"], { cwd: root });
  execFileSync("git", ["add", "."], { cwd: root });
  execFileSync("git", ["commit", "-m", "test: fixture"], { cwd: root, stdio: "ignore" });
}

describe("export neo4j", () => {
  const cliPath = join(__dirname, "..", "src", "cli.js");

  it("errors when no input is provided", () => {
    const res = spawnSync("node", [cliPath, "export", "neo4j"], {
      encoding: "utf8",
    });
    expect(res.status).to.equal(1);
  });

  it("exports a playbook's complete graph to Neo4j CSV", () => {
    const root = mkdtempSync(join(tmpdir(), "temp-playbook-export-"));
    const pages = join(root, "example", "modules/ROOT/pages");
    mkdirSync(pages, { recursive: true });
    writeFileSync(join(root, "example", "antora.yml"), "name: example\nversion: 1.0\n");
    writeFileSync(join(pages, "index.adoc"), "[#REQ-001, item, role=requirement]\n--\nA requirement.\n--\n");
    initializeFixtureRepository(root);
    const playbookPath = join(root, "playbook.yml");
    writeFileSync(playbookPath, [
      "site:",
      "  title: export-test",
      "content:",
      "  sources:",
      `    - url: ${root}`,
      "      start_paths: [example]",
      "      branches: HEAD",
      "ui:",
      "  bundle:",
      "    url: https://example.com/ui-bundle.zip",
    ].join("\n"));
    const outDir = join(root, "out");
    try {
      execFileSync("node", [cliPath, "export", "neo4j", playbookPath, "-o", "./neo4j-test-out"], { encoding: "utf8" });
      expect(existsSync(join(process.cwd(), "neo4j-test-out", "nodes.csv"))).to.be.true;
      expect(existsSync(join(process.cwd(), "neo4j-test-out", "relationships.csv"))).to.be.true;
    } finally {
      rmSync(join(process.cwd(), "neo4j-test-out"), { recursive: true, force: true });
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("exports repeated IDs from separate playbook components with scoped endpoints", () => {
    const root = mkdtempSync(join(tmpdir(), "temp-scoped-playbook-"));
    const outDir = "./neo4j-scoped-test-out";
    const components = ["alpha", "beta"];
    for (const component of components) {
      const pages = join(root, component, "modules/ROOT/pages");
      mkdirSync(pages, { recursive: true });
      writeFileSync(join(root, component, "antora.yml"), `name: ${component}\nversion: 1.0\n`);
      writeFileSync(join(pages, "index.adoc"), [
        `[#TEST-001, item, role=test]`,
        "--",
        "addresses:REQ-001[]",
        "--",
        "",
        `[#REQ-001, item, role=requirement]`,
        "--",
        `${component} requirement`,
        "--",
      ].join("\n"));
    }
    const playbook = join(root, "playbook.yml");
    writeFileSync(playbook, [
      "site:",
      "  title: scoped-export-test",
      "content:",
      "  sources:",
      `    - url: ${root}`,
      "      start_paths: [alpha, beta]",
      "      branches: HEAD",
      "ui:",
      "  bundle:",
      "    url: https://example.com/ui-bundle.zip",
    ].join("\n"));
    const preload = join(root, "duplicate-warning-probe.mjs");
    const graphModule = pathToFileURL(join(__dirname, "..", "src", "TraceabilityGraph.js")).href;
    writeFileSync(preload, `import { TraceabilityGraph } from ${JSON.stringify(graphModule)};
const addRelationship = TraceabilityGraph.prototype.addRelationship;
TraceabilityGraph.prototype.addRelationship = function (relationship) {
  addRelationship.call(this, relationship);
  if (this.getDuplicateWarnings().some((warning) => warning.message.startsWith("Duplicate relationship:"))) console.log("DUPLICATE_RELATIONSHIP_WARNING");
};
`);
    initializeFixtureRepository(root);
    try {
      const output = execFileSync("node", ["--import", preload, cliPath, "export", "neo4j", playbook, "-o", outDir], { encoding: "utf8" });
      expect(output).to.not.include("DUPLICATE_RELATIONSHIP_WARNING");
      const nodes = readFileSync(join(process.cwd(), outDir, "nodes.csv"), "utf8");
      const relationships = readFileSync(join(process.cwd(), outDir, "relationships.csv"), "utf8");
      const nodeRows = nodes.trimEnd().split("\n");
      const relationshipRows = relationships.trimEnd().split("\n");
      expect(nodeRows).to.have.length(5);
      expect(nodeRows.filter((row) => row.includes(",alpha,1,")).length).to.equal(2);
      expect(nodeRows.filter((row) => row.includes(",beta,1,")).length).to.equal(2);
      expect(relationshipRows).to.have.length(3);
      expect(relationshipRows[1]).to.include(`alpha\u00001\u0000TEST-001,alpha\u00001\u0000REQ-001,TEST-001,REQ-001`);
      expect(relationshipRows[2]).to.include(`beta\u00001\u0000TEST-001,beta\u00001\u0000REQ-001,TEST-001,REQ-001`);
    } finally {
      rmSync(join(process.cwd(), outDir), { recursive: true, force: true });
      rmSync(root, { recursive: true, force: true });
    }
  });
});
