/**
 * Tests for graph snapshot serialization, JSON-snapshot diffing, and the
 * site-graph harvest (multi-source-diff).
 */

import { expect } from "chai";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { diffGraphs, diffSnapshots } from "../src/GraphDiff.js";
import {
  deserializeSnapshot,
  serializeSnapshot,
} from "../src/GraphSnapshot.js";
import { harvestSiteFiles } from "../src/SiteGraph.js";
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
      expect(tracerPage!.version).to.equal("main");
      expect(tracerPage!.module).to.be.a("string");
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
