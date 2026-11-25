/**
 * Tests for graph snapshot serialization, JSON-snapshot diffing, and the
 * site-graph harvest (multi-source-diff).
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { expect } from "chai";
import { ConfigLoader } from "../src/config/TraceabilityConfig.js";
import { diffGraphs, diffSnapshots } from "../src/GraphDiff.js";
import {
  deserializeSnapshot,
  serializeSnapshot,
} from "../src/GraphSnapshot.js";
import { RequirementsTraceabilityExtension } from "../src/index.js";
import { harvestIntoGraph, harvestSiteFiles } from "../src/SiteGraph.js";
import { resolveSourceFilePath } from "../src/SourcePath.js";
import { TraceabilityGraph } from "../src/TraceabilityGraph.js";
import type { Item, ItemRelationship } from "../src/types.js";

function item(id: string, role: string, overrides: Partial<Item> = {}): Item {
  return { id, role, title: id, attributes: {}, ...overrides };
}

function rel(
  fromId: string,
  targetId: string,
  type: string,
  overrides: Partial<ItemRelationship> = {},
): ItemRelationship {
  return {
    id: `${fromId}-${type}-${targetId}`,
    fromId,
    targetId,
    type,
    ...overrides,
  };
}

function build(
  items: Item[],
  rels: ItemRelationship[] = [],
): TraceabilityGraph {
  const graph = new TraceabilityGraph();
  for (const i of items) graph.addItem(i);
  for (const r of rels) graph.addRelationship(r);
  return graph;
}

function snapshotFrom(items: Item[], rels: ItemRelationship[] = []) {
  return deserializeSnapshot(serializeSnapshot(build(items, rels)));
}

describe("serializeSnapshot", () => {
  it("round-trips items and relationships with scope, dropping pubUrl", () => {
    const graph = build(
      [
        item("REQ-001", "requirement", {
          component: "tracer",
          module: "ROOT",
          version: "main",
          pubUrl: "/tracer/main/index.html#REQ-001",
          content: "body",
        }),
      ],
      [rel("REQ-001", "REQ-002", "addresses")],
    );

    const snapshot = deserializeSnapshot(serializeSnapshot(graph));

    expect(snapshot.format).to.equal(1);
    expect(snapshot.items).to.have.length(1);
    expect(snapshot.relationships).to.have.length(1);
    const it = snapshot.items[0];
    expect(it.component).to.equal("tracer");
    expect(it.module).to.equal("ROOT");
    expect(it.version).to.equal("main");
    expect(it).to.not.have.property("pubUrl");
  });

  it("drops a recorded source root from the serialized snapshot", () => {
    const root = mkdtempSync(join(tmpdir(), "snapshot-root-"));
    try {
      const graph = build([
        item("REQ-001", "requirement", {
          component: "foo",
          module: "ROOT",
          version: "main",
          sourceFile: "modules/ROOT/pages/index.adoc",
          sourceRoot: root,
        }),
      ]);
      const json = serializeSnapshot(graph);
      expect(json).to.not.contain(root);
      const snapshot = deserializeSnapshot(json);
      expect(snapshot.items[0]).to.not.have.property("sourceRoot");
      expect(snapshot.items[0].sourceFile).to.equal(
        "modules/ROOT/pages/index.adoc",
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("round-trips component, module, and version while the root stays absent", () => {
    const graph = build([
      item("REQ-001", "requirement", {
        component: "foo",
        module: "ROOT",
        version: "main",
        sourceRoot: "/build/machine/foo",
      }),
    ]);
    const snapshot = deserializeSnapshot(serializeSnapshot(graph));
    const restored = snapshot.items[0];
    expect(restored.component).to.equal("foo");
    expect(restored.module).to.equal("ROOT");
    expect(restored.version).to.equal("main");
    expect(restored).to.not.have.property("sourceRoot");
  });

  it("rejects an unknown format value", () => {
    expect(() =>
      deserializeSnapshot(
        JSON.stringify({ format: 2, items: [], relationships: [] }),
      ),
    ).to.throw(/Unsupported snapshot format '2'/);
  });

  it("rejects a snapshot missing the item/relationship arrays", () => {
    expect(() => deserializeSnapshot(JSON.stringify({ format: 1 }))).to.throw(
      /expected 'items' and 'relationships' arrays/,
    );
  });

  it("rejects non-JSON input", () => {
    expect(() => deserializeSnapshot("not json")).to.throw(/not valid JSON/);
  });
});

describe("diffSnapshots", () => {
  it("does not conflate the same ID in different components", () => {
    const prev = snapshotFrom([
      item("REQ-001", "requirement", { component: "foo" }),
    ]);
    const next = snapshotFrom([
      item("REQ-001", "requirement", { component: "bar" }),
    ]);

    const delta = diffSnapshots(prev, next);

    expect(delta.items).to.have.length(2);
    expect(
      delta.items.some(
        (d) =>
          d.kind === "removed" &&
          d.new === undefined &&
          d.old?.component === "foo",
      ),
    ).to.be.true;
    expect(
      delta.items.some((d) => d.kind === "added" && d.new?.component === "bar"),
    ).to.be.true;
    expect(delta.items.some((d) => d.kind === "modified")).to.be.false;
  });

  it("reports cross-component added, removed, and superseded items", () => {
    const prev = snapshotFrom([
      item("REQ-042", "requirement", { component: "foo" }),
    ]);
    const next = snapshotFrom(
      [item("REQ-043", "requirement", { component: "foo" })],
      [rel("REQ-043", "REQ-042", "supersedes")],
    );

    const delta = diffSnapshots(prev, next);

    const byId = new Map(delta.items.map((d) => [d.id, d]));
    expect(byId.get("REQ-042")?.kind).to.equal("removed");
    expect(byId.get("REQ-043")?.kind).to.equal("added");
    expect(
      delta.relationships.some(
        (r) => r.kind === "added" && r.rel.type === "supersedes",
      ),
    ).to.be.true;
  });
});

describe("diffGraphs component-qualified identity", () => {
  it("falls back to bare ID when items have no component", () => {
    const prev = build([item("REQ-041", "requirement")]);
    const next = build([
      item("REQ-041", "requirement", { content: "changed" }),
    ]);

    const delta = diffGraphs(prev, next);

    expect(delta.items).to.have.length(1);
    expect(delta.items[0].kind).to.equal("modified");
  });

  it("treats the same ID in different components as distinct", () => {
    const prev = build([item("REQ-001", "requirement", { component: "foo" })]);
    const next = build([item("REQ-001", "requirement", { component: "bar" })]);

    const delta = diffGraphs(prev, next);

    expect(delta.items).to.have.length(2);
    expect(delta.items.filter((d) => d.kind === "modified")).to.have.length(0);
  });
});

describe("harvestSiteFiles", () => {
  it("harvests a multi-component playbook with component, module, and version scope", async () => {
    const repoRoot = resolve(process.cwd());
    const playbook = `
site:
  title: harvest-test
content:
  sources:
    - url: ${repoRoot}
      start_paths: [examples/tracer, examples/demo]
      branches: HEAD
ui:
  bundle:
    url: https://example.com/ui-bundle.zip
`;
    const tmpDir = mkdtempSync(join(tmpdir(), "site-graph-test-"));
    const playbookPath = join(tmpDir, "playbook.yml");
    writeFileSync(playbookPath, playbook, "utf8");

    try {
      const files = await harvestSiteFiles(playbookPath);
      const components = new Set(
        files.map((f) => f.component).filter((c) => c !== undefined),
      );
      expect(components.has("tracer")).to.be.true;
      expect(components.has("demo")).to.be.true;

      const tracerPage = files.find(
        (f) => f.component === "tracer" && f.path.includes("index.adoc"),
      );
      expect(tracerPage).to.exist;
      expect(tracerPage!.version).to.be.a("string").and.not.be.empty;
      expect(tracerPage!.module).to.be.a("string");
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("records a distinct source root for each source sharing a relative path", async () => {
    const repoRoot = resolve(process.cwd());
    const playbook = `
site:
  title: harvest-root-test
content:
  sources:
    - url: ${repoRoot}
      start_paths: [examples/tracer, examples/demo]
      branches: HEAD
ui:
  bundle:
    url: https://example.com/ui-bundle.zip
`;
    const tmpDir = mkdtempSync(join(tmpdir(), "site-graph-root-test-"));
    const playbookPath = join(tmpDir, "playbook.yml");
    writeFileSync(playbookPath, playbook, "utf8");

    try {
      const files = await harvestSiteFiles(playbookPath);
      const rel = "modules/ROOT/pages/index.adoc";
      const tracerPage = files.find(
        (f) => f.component === "tracer" && f.path === rel,
      );
      const demoPage = files.find(
        (f) => f.component === "demo" && f.path === rel,
      );
      expect(tracerPage).to.exist;
      expect(demoPage).to.exist;
      expect(tracerPage!.sourceRoot).to.be.a("string").and.not.be.empty;
      expect(demoPage!.sourceRoot).to.be.a("string").and.not.be.empty;
      expect(tracerPage!.sourceRoot).to.not.equal(demoPage!.sourceRoot);
      expect(existsSync(join(tracerPage!.sourceRoot!, rel))).to.be.true;
      expect(existsSync(join(demoPage!.sourceRoot!, rel))).to.be.true;
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("omits excluded components from a harvested playbook", async () => {
    const repoRoot = resolve(process.cwd());
    const playbook = `
site:
  title: harvest-test
content:
  sources:
    - url: ${repoRoot}
      start_paths: [examples/tracer, examples/demo]
      branches: HEAD
antora:
  extensions:
    - require: ./lib/src/antora-extension.js
      excludeComponents: [demo]
ui:
  bundle:
    url: https://example.com/ui-bundle.zip
`;
    const tmpDir = mkdtempSync(join(tmpdir(), "site-graph-test-"));
    const playbookPath = join(tmpDir, "playbook.yml");
    writeFileSync(playbookPath, playbook, "utf8");

    try {
      const files = await harvestSiteFiles(playbookPath);
      const components = new Set(
        files.map((f) => f.component).filter((c) => c !== undefined),
      );
      expect(components.has("tracer")).to.be.true;
      expect(components.has("demo")).to.be.false;
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

describe("resolveSourceFilePath", () => {
  it("prefers a recorded source root over the provided input directory", () => {
    const rootA = mkdtempSync(join(tmpdir(), "resolve-root-a-"));
    const rootB = mkdtempSync(join(tmpdir(), "resolve-root-b-"));
    try {
      const rel = "modules/ROOT/pages/index.adoc";
      expect(resolveSourceFilePath(rootB, rel, rootA)).to.equal(
        join(rootA, rel),
      );
    } finally {
      rmSync(rootA, { recursive: true, force: true });
      rmSync(rootB, { recursive: true, force: true });
    }
  });

  it("falls back to the input directory when no root is recorded", () => {
    const rel = "modules/ROOT/pages/index.adoc";
    expect(resolveSourceFilePath("example", rel)).to.equal(
      resolve(process.cwd(), "example", rel),
    );
  });

  it("rejects a source path that escapes the recorded root", () => {
    expect(() =>
      resolveSourceFilePath("/elsewhere", "../../etc/passwd", "/build/root"),
    ).to.throw(/escapes input directory/);
  });

  it("rejects an item with no recorded source file", () => {
    expect(() => resolveSourceFilePath(".", undefined)).to.throw(
      /no source file recorded/,
    );
  });
});

describe("recorded roots resolve on the real playbook", () => {
  it("every item harvested from antora-playbook.yml resolves to one existing file", async function () {
    this.timeout(60000);
    const playbook = resolve(process.cwd(), "antora-playbook.yml");
    if (!existsSync(playbook)) this.skip();

    const files = await harvestSiteFiles(playbook);
    const rooted = files.filter((f) => f.sourceRoot);
    expect(rooted.length).to.be.greaterThan(0);

    for (const file of rooted) {
      const resolved = resolveSourceFilePath(".", file.path, file.sourceRoot);
      expect(
        existsSync(resolved),
        `${file.path} under ${file.sourceRoot} must exist`,
      ).to.be.true;
    }
  });

  it("carries the root onto items built through the extension", async function () {
    this.timeout(60000);
    const playbook = resolve(process.cwd(), "antora-playbook.yml");
    if (!existsSync(playbook)) this.skip();

    const extension = new RequirementsTraceabilityExtension();
    const files = await harvestSiteFiles(playbook);
    for (const file of files) {
      extension.process(file.content, {
        sourceFile: file.path,
        component: file.component,
        module: file.module,
        version: file.version,
        sourceRoot: file.sourceRoot,
      });
    }

    const items = extension.graph.getAllItems();
    expect(items.length).to.be.greaterThan(0);

    // Every item that came from a source with a root carries that root, and
    // the root joined with its sourceFile names exactly one existing file.
    let rootedItems = 0;
    for (const it of items) {
      const file = files.find(
        (f) =>
          f.path === it.sourceFile &&
          f.component === it.component &&
          f.module === it.module,
      );
      if (!file?.sourceRoot) continue;
      rootedItems += 1;
      expect(it.sourceRoot).to.equal(file.sourceRoot);
      const resolved = resolveSourceFilePath(".", it.sourceFile, it.sourceRoot);
      expect(
        existsSync(resolved),
        `${it.id} (${it.sourceFile}) must resolve under ${it.sourceRoot}`,
      ).to.be.true;
    }
    expect(rootedItems).to.be.greaterThan(0);
  });
});

describe("reverse-authored relations canonicalize regardless of harvest order", () => {
  /**
   * Build a git-backed fixture whose requirement authors the REVERSE form
   * (`verified_by:TST-001[]`) while the test page defines the endpoint. Which
   * endpoint's file is ingested first decides whether `addRelationship` can
   * flip the edge, so this only holds if the harvest canonicalizes.
   */
  function makeFixture(): { playbook: string; dir: string } {
    const dir = mkdtempSync(join(tmpdir(), "reverse-canon-"));
    const pages = join(dir, "content", "modules", "ROOT", "pages");
    mkdirSync(pages, { recursive: true });
    writeFileSync(
      join(dir, "content", "antora.yml"),
      "name: fx\ntitle: Fixture\nversion: '1.0'\nstart_page: index.adoc\n",
      "utf8",
    );
    writeFileSync(
      join(pages, "index.adoc"),
      '[#REQ-001, item, role=requirement, title="A requirement"]\n--\nBody.\nverified_by:TST-001[]\n--\n',
      "utf8",
    );
    writeFileSync(
      join(pages, "test.adoc"),
      '[#TST-001, item, role=test, title="A test"]\n--\nBody.\n--\n',
      "utf8",
    );
    writeFileSync(
      join(dir, "traceability.yml"),
      "roles: [requirement, design, test]\nrelations:\n  test:\n    requirement:\n      verifies:\n        reverse: verified_by\n",
      "utf8",
    );
    const playbook = join(dir, "playbook.yml");
    writeFileSync(
      playbook,
      "site:\n  title: Fixture\ncontent:\n  sources:\n    - url: .\n      start_path: content\n      branches: HEAD\nui:\n  bundle:\n    url: https://example.com/ui-bundle.zip\n",
      "utf8",
    );
    execFileSync("git", ["init", "-q"], { cwd: dir });
    execFileSync("git", ["add", "-A"], { cwd: dir });
    execFileSync(
      "git",
      ["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", "init"],
      { cwd: dir },
    );
    return { playbook, dir };
  }

  it("stores the primary direction no matter which endpoint is read first", async function () {
    this.timeout(30000);
    const { playbook, dir } = makeFixture();
    try {
      // Exercise the production path: the harvest ingests in its own order and
      // canonicalizes at the boundary. The requirement page (which authors the
      // reverse form) is named to sort *after* the test page, so the endpoint
      // is unknown when the edge is first added — the failing case.
      const loader = new ConfigLoader();
      loader.load(join(dir, "traceability.yml"));
      const extension = new RequirementsTraceabilityExtension(loader);
      await harvestIntoGraph(extension, playbook);

      const rels = extension.graph
        .getAllRelationships()
        .map((r) => `${r.fromId}--${r.type}-->${r.targetId}`);
      expect(rels).to.deep.equal(["TST-001--verifies-->REQ-001"]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("harvests the real multi-source playbook in a stable order", async function () {
    this.timeout(120000);
    // A two-file fixture happens to be stable; the real playbook (500+ files
    // across sources) is where `findBy` order actually varies run to run.
    const playbook = resolve(process.cwd(), "antora-playbook.yml");
    const orders = new Set<string>();
    for (let i = 0; i < 3; i += 1) {
      const files = await harvestSiteFiles(playbook);
      expect(files.length).to.be.greaterThan(50);
      orders.add(files.map((f) => `${f.component}/${f.version}/${f.path}`).join("\n"));
    }
    expect(orders.size).to.equal(1);
  });
});
