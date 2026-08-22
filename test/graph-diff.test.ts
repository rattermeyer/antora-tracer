/**
 * Tests for graph-diff: diffing two snapshots into added/removed/modified
 * items and relationship deltas.
 */

import { expect } from "chai";
import { diffGraphs } from "../src/GraphDiff.js";
import { TraceabilityGraph } from "../src/TraceabilityGraph.js";
import type { Item, ItemRelationship } from "../src/types.js";

function item(id: string, role: string, overrides: Partial<Item> = {}): Item {
  return { id, role, title: id, attributes: {}, ...overrides };
}

function rel(
  id: string,
  fromId: string,
  targetId: string,
  type: string,
): ItemRelationship {
  return { id, fromId, targetId, type };
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

describe("diffGraphs", () => {
  it("classifies added, removed, and unmodified survivors", () => {
    const prev = build([
      item("REQ-041", "requirement"),
      item("REQ-042", "requirement"),
    ]);
    const next = build([
      item("REQ-042", "requirement"),
      item("REQ-043", "requirement"),
    ]);

    const delta = diffGraphs(prev, next);
    const byId = new Map(delta.items.map((d) => [d.id, d]));

    expect(byId.get("REQ-041")?.kind).to.equal("removed");
    expect(byId.get("REQ-043")?.kind).to.equal("added");
    expect(byId.has("REQ-042")).to.be.false; // unchanged survivor
  });

  it("reports modified items with changed field names", () => {
    const prev = build([item("REQ-042", "requirement", { content: "old" })]);
    const next = build([item("REQ-042", "requirement", { content: "new" })]);

    const delta = diffGraphs(prev, next);
    const modified = delta.items.find((d) => d.id === "REQ-042");

    expect(modified?.kind).to.equal("modified");
    expect(modified?.changedFields).to.include("content");
  });

  it("reports title, role, status, and attributes changes", () => {
    const prev = build([
      item("REQ-042", "requirement", {
        title: "Old",
        status: "draft",
        attributes: { a: "1" },
      }),
    ]);
    const next = build([
      item("REQ-042", "design", {
        title: "New",
        status: "active",
        attributes: { a: "2" },
      }),
    ]);

    const delta = diffGraphs(prev, next);
    const modified = delta.items.find((d) => d.id === "REQ-042");

    expect(modified?.kind).to.equal("modified");
    expect(modified?.changedFields).to.include.members([
      "title",
      "role",
      "status",
      "attributes",
    ]);
  });

  it("does not report relationships of a removed item", () => {
    const prev = build(
      [item("REQ-041", "requirement"), item("DES-001", "design")],
      [rel("r1", "DES-001", "REQ-041", "addresses")],
    );
    const next = build([item("DES-001", "design")]);

    const delta = diffGraphs(prev, next);
    expect(delta.relationships).to.have.lengthOf(0);
  });

  it("reports changed relationships on surviving items", () => {
    const prev = build(
      [item("REQ-041", "requirement"), item("DES-001", "design")],
      [rel("r1", "DES-001", "REQ-041", "addresses")],
    );
    const next = build(
      [
        item("REQ-041", "requirement"),
        item("REQ-042", "requirement"),
        item("DES-001", "design"),
      ],
      [rel("r2", "DES-001", "REQ-042", "addresses")],
    );

    const delta = diffGraphs(prev, next);

    expect(
      delta.relationships.some(
        (r) =>
          r.kind === "added" &&
          r.rel.type === "addresses" &&
          r.rel.targetId === "REQ-042",
      ),
    ).to.be.true;
    expect(
      delta.relationships.some(
        (r) =>
          r.kind === "removed" &&
          r.rel.type === "addresses" &&
          r.rel.targetId === "REQ-041",
      ),
    ).to.be.true;
  });

  it("reports a superseded pair as removed + added with the supersedes link", () => {
    const prev = build([item("REQ-042", "requirement")]);
    const next = build(
      [item("REQ-043", "requirement")],
      [rel("r1", "REQ-043", "REQ-042", "supersedes")],
    );

    const delta = diffGraphs(prev, next);
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
