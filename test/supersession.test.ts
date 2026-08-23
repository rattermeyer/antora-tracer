/**
 * Tests for requirement supersession: supersedes relation, derived state,
 * split/merge, validation, and current-item filtering.
 */

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect } from "chai";
import { ConfigLoader } from "../src/config/TraceabilityConfig.js";
import { MatrixGenerator } from "../src/MatrixGenerator.js";
import { TraceabilityGraph } from "../src/TraceabilityGraph.js";

function setup(): { graph: TraceabilityGraph; loader: ConfigLoader } {
  const dir = mkdtempSync(join(tmpdir(), "supersession-"));
  const cfg = join(dir, "config.yml");
  writeFileSync(
    cfg,
    [
      "roles: [requirement, design]",
      "relations:",
      "  requirement:",
      "    requirement:",
      "      supersedes:",
      "        reverse: superseded_by",
      "  design:",
      "    requirement:",
      "      addresses:",
      "        reverse: addressed_by",
      "matrices:",
      "  - name: req-matrix",
      "    rows: requirement",
      "    columns: [design]",
      "    coverageRelations:",
      "      design: [addresses]",
    ].join("\n"),
  );
  const loader = new ConfigLoader();
  loader.load(cfg);
  rmSync(dir, { recursive: true, force: true });
  return { graph: new TraceabilityGraph(loader), loader };
}

function add(g: TraceabilityGraph, id: string, role: string): void {
  g.addItem({
    id,
    role,
    title: id,
    attributes: {},
    sourceFile: "test.adoc",
  });
}

describe("Supersession", () => {
  it("derives superseded state and successors from the supersedes relation", () => {
    const { graph } = setup();
    add(graph, "REQ-042", "requirement");
    add(graph, "REQ-043", "requirement");
    graph.addRelationship({
      id: "r1",
      fromId: "REQ-043",
      targetId: "REQ-042",
      type: "supersedes",
    });

    expect(graph.isSuperseded("REQ-042")).to.be.true;
    expect(graph.isSuperseded("REQ-043")).to.be.false;
    expect(graph.getSuccessors("REQ-042").map((s) => s.id)).to.deep.equal([
      "REQ-043",
    ]);
    expect(graph.isHistoryRelation("supersedes")).to.be.true;
    expect(graph.isHistoryRelation("superseded_by")).to.be.true;
    expect(graph.isHistoryRelation("addresses")).to.be.false;
  });

  it("derives orphaned state from supersession and incoming functional links", () => {
    const { graph } = setup();
    add(graph, "REQ-042", "requirement");
    add(graph, "REQ-043", "requirement");
    add(graph, "ARC-001", "design");
    graph.addRelationship({
      id: "r1",
      fromId: "REQ-043",
      targetId: "REQ-042",
      type: "supersedes",
    });

    // Only the history link targets REQ-042, so it is orphaned.
    expect(graph.isOrphaned("REQ-042")).to.be.true;

    // A functional link keeps it in use, so it is no longer orphaned.
    graph.addRelationship({
      id: "r2",
      fromId: "ARC-001",
      targetId: "REQ-042",
      type: "addresses",
    });
    expect(graph.isOrphaned("REQ-042")).to.be.false;

    // Non-superseded items are never orphaned.
    expect(graph.isOrphaned("REQ-043")).to.be.false;
  });

  it("supports splits and merges", () => {
    const { graph } = setup();
    for (const id of ["REQ-041", "REQ-042", "REQ-043", "REQ-044"]) {
      add(graph, id, "requirement");
    }
    // split: REQ-043 and REQ-044 supersede REQ-042
    graph.addRelationship({
      id: "r1",
      fromId: "REQ-043",
      targetId: "REQ-042",
      type: "supersedes",
    });
    graph.addRelationship({
      id: "r2",
      fromId: "REQ-044",
      targetId: "REQ-042",
      type: "supersedes",
    });
    expect(
      graph
        .getSuccessors("REQ-042")
        .map((s) => s.id)
        .sort(),
    ).to.deep.equal(["REQ-043", "REQ-044"]);

    // merge: REQ-043 also supersedes REQ-041
    graph.addRelationship({
      id: "r3",
      fromId: "REQ-043",
      targetId: "REQ-041",
      type: "supersedes",
    });
    expect(graph.getSuccessors("REQ-041").map((s) => s.id)).to.deep.equal([
      "REQ-043",
    ]);
  });

  it("flags self-supersession as a validation error", () => {
    const { graph } = setup();
    add(graph, "REQ-042", "requirement");
    graph.addRelationship({
      id: "r1",
      fromId: "REQ-042",
      targetId: "REQ-042",
      type: "supersedes",
    });
    expect(graph.validate().errors.some((e) => e.includes("Self-supersession")))
      .to.be.true;
  });

  it("flags supersession cycles as validation errors", () => {
    const { graph } = setup();
    add(graph, "A", "requirement");
    add(graph, "B", "requirement");
    graph.addRelationship({
      id: "r1",
      fromId: "A",
      targetId: "B",
      type: "supersedes",
    });
    graph.addRelationship({
      id: "r2",
      fromId: "B",
      targetId: "A",
      type: "supersedes",
    });
    expect(
      graph.validate().errors.some((e) => e.includes("Supersession cycle")),
    ).to.be.true;
  });

  it("warns (advisory) when a functional link targets a superseded item", () => {
    const { graph } = setup();
    add(graph, "REQ-042", "requirement");
    add(graph, "REQ-043", "requirement");
    add(graph, "DES-007", "design");
    graph.addRelationship({
      id: "r1",
      fromId: "REQ-043",
      targetId: "REQ-042",
      type: "supersedes",
    });
    graph.addRelationship({
      id: "r2",
      fromId: "DES-007",
      targetId: "REQ-042",
      type: "addresses",
    });

    const result = graph.validate();
    const stale = result.warnings.filter((w) => w.type === "stale_link");
    expect(stale).to.have.lengthOf(1);
    expect(stale[0].message).to.include("REQ-043");
    // supersedes itself is not flagged as stale
    expect(stale[0].message).to.not.include("supersedes");
  });

  it("excludes superseded items from current-item queries and matrices", () => {
    const { graph, loader } = setup();
    add(graph, "REQ-042", "requirement");
    add(graph, "REQ-043", "requirement");
    add(graph, "DES-007", "design");
    graph.addRelationship({
      id: "r1",
      fromId: "REQ-043",
      targetId: "REQ-042",
      type: "supersedes",
    });
    graph.addRelationship({
      id: "r2",
      fromId: "DES-007",
      targetId: "REQ-043",
      type: "addresses",
    });

    expect(
      graph.getCurrentItemsByRole("requirement").map((i) => i.id),
    ).to.deep.equal(["REQ-043"]);

    const matrix = new MatrixGenerator(graph, loader).generateMatrix(
      "req-matrix",
    );
    expect(matrix.rows.map((r) => r.rowId)).to.deep.equal(["REQ-043"]);
  });
});
