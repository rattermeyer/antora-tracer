import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect } from "chai";
import { load as yamlLoad } from "js-yaml";
import { RequirementsTraceabilityExtension } from "../src/index.js";
import { harvestSiteFiles } from "../src/SiteGraph.js";

const __dirname = resolve(dirname(fileURLToPath(import.meta.url)));

const REQ_BLOCK = '[#REQ-054, item, role=requirement]\n--\nContent.\n--\n';

describe("getPrefixMaxima", () => {
  it("computes numeric max+1 per prefix with padding width", () => {
    const extension = new RequirementsTraceabilityExtension();
    extension.process(
      [
        REQ_BLOCK,
        '[#REQ-053, item, role=requirement]\n--\nContent.\n--\n',
        '[#ARC-012, item, role=architecture]\n--\nContent.\n--\n',
      ].join("\n"),
      { sourceFile: "test.adoc" },
    );
    const maxima = extension.getPrefixMaxima();
    expect(maxima.get("REQ")).to.deep.equal({ start: 55, width: 3 });
    expect(maxima.get("ARC")).to.deep.equal({ start: 13, width: 3 });
  });

  it("reports max+1, not the current max", () => {
    const extension = new RequirementsTraceabilityExtension();
    extension.process(REQ_BLOCK, { sourceFile: "test.adoc" });
    expect(extension.getPrefixMaxima().get("REQ")!.start).to.equal(55);
  });

  it("deduplicates the same ID across files", () => {
    const extension = new RequirementsTraceabilityExtension();
    extension.process(REQ_BLOCK, { sourceFile: "a.adoc" });
    extension.process(REQ_BLOCK, { sourceFile: "b.adoc" });
    expect(extension.getPrefixMaxima().get("REQ")).to.deep.equal({
      start: 55,
      width: 3,
    });
  });

  it("ignores IDs without a numeric suffix", () => {
    const extension = new RequirementsTraceabilityExtension();
    extension.process(
      '[#INTRO, item, role=requirement]\n--\nContent.\n--\n',
      { sourceFile: "test.adoc" },
    );
    expect(extension.getPrefixMaxima().size).to.equal(0);
  });
});

describe("seed command", () => {
  const cliPath = join(__dirname, "..", "src", "cli.js");

  it("emits a parseable prefixes map from a local directory", () => {
    const tmpDir = join(__dirname, "temp-seed");
    mkdirSync(tmpDir, { recursive: true });
    writeFileSync(
      join(tmpDir, "items.adoc"),
      [
        REQ_BLOCK,
        '[#ARC-012, item, role=architecture]\n--\nContent.\n--\n',
      ].join("\n"),
    );
    try {
      const out = execFileSync("node", [cliPath, "seed", "-i", tmpDir], {
        encoding: "utf8",
      });
      const parsed = yamlLoad(out) as {
        prefixes: Record<string, { start: number; width: number }>;
      };
      expect(parsed.prefixes.REQ).to.deep.equal({ start: 55, width: 3 });
      expect(parsed.prefixes.ARC).to.deep.equal({ start: 13, width: 3 });
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("errors when no input is provided", () => {
    const res = spawnSync("node", [cliPath, "seed"], { encoding: "utf8" });
    expect(res.status).to.equal(1);
  });
});

describe("seed playbook mode", () => {
  it("harvests a multi-component playbook and reports per-prefix maxima", async () => {
    const repoRoot = resolve(process.cwd());
    const playbook = [
      "site:",
      "  title: seed-test",
      "content:",
      "  sources:",
      `    - url: ${repoRoot}`,
      "      start_paths: [examples/tracer]",
      "      branches: HEAD",
      "ui:",
      "  bundle:",
      "    url: https://example.com/ui-bundle.zip",
    ].join("\n");
    const tmpDir = mkdtempSync(join(tmpdir(), "seed-playbook-"));
    const playbookPath = join(tmpDir, "playbook.yml");
    writeFileSync(playbookPath, playbook, "utf8");
    try {
      const files = await harvestSiteFiles(playbookPath);
      const extension = new RequirementsTraceabilityExtension();
      for (const file of files) {
        extension.process(file.content, {
          sourceFile: file.path,
          component: file.component,
          module: file.module,
          version: file.version,
        });
      }
      const maxima = extension.getPrefixMaxima();
      expect(maxima.has("REQ")).to.be.true;
      expect(maxima.get("REQ")!.start).to.be.a("number");
      expect(maxima.get("REQ")!.start).to.be.greaterThan(0);
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
