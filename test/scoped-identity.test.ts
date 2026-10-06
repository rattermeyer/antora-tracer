import * as fs from "node:fs";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect } from "chai";
import { Neo4jExporter } from "../src/Neo4jExporter.js";
import { RequirementsTraceabilityExtension } from "../src/index.js";
import { TraceabilityGraph } from "../src/TraceabilityGraph.js";
import { itemIdentity } from "../src/types.js";

function item(
  id: string,
  component?: string,
  version?: string,
  role = "requirement",
) {
  return {
    id,
    component,
    version,
    role,
    title: `${component ?? "local"} ${version ?? ""}`,
    attributes: {},
  };
}

function scopedRelationship(
  fromId: string,
  targetId: string,
  component: string,
  version: string,
) {
  return {
    id: `${fromId}-addresses-${targetId}`,
    fromId,
    targetId,
    type: "addresses",
    component,
    version,
  };
}

function fields(filePath: string): Map<string, string>[] {
  const [header, ...rows] = fs.readFileSync(filePath, "utf8").trimEnd().split("\n");
  const names = header.split(",");
  return rows.map((row) => new Map(row.split(",").map((value, index) => [names[index], value])));
}

describe("component-scoped graph identity", () => {
  it("uses component, version, and item ID while leaving unscoped IDs bare", () => {
    expect(itemIdentity(item("REQ-001", "foo", "1"))).to.equal("foo\u00001\u0000REQ-001");
    expect(itemIdentity(item("REQ-001"))).to.equal("REQ-001");
  });

  it("keeps IDs distinct across components and versions but deduplicates within one scope", () => {
    const graph = new TraceabilityGraph();
    graph.addItem(item("REQ-001", "foo", "1"));
    graph.addItem(item("REQ-001", "bar", "1"));
    graph.addItem(item("REQ-001", "foo", "2"));
    graph.addItem({ ...item("REQ-001", "foo", "1"), title: "duplicate" });

    expect(graph.getAllItems()).to.have.length(3);
    expect(graph.getItemsByRole("requirement")).to.have.length(3);
    expect(graph.getItem("REQ-001", "foo", "1")?.title).to.equal("foo 1");
    expect(graph.getItem("REQ-001")).to.equal(undefined);
    expect(graph.getDuplicateWarnings()).to.have.length(1);
  });

  it("carries source component and version on parsed relationships", () => {
    const extension = new RequirementsTraceabilityExtension();
    const parsed = extension.process(
      "[#TEST-001, item, role=test]\n====\naddresses:REQ-001[]\n====",
      { component: "foo", version: "1" },
    );

    expect(parsed.relationships[0]).to.include({
      fromId: "TEST-001",
      targetId: "REQ-001",
      component: "foo",
      version: "1",
    });
  });

  it("resolves duplicate endpoint IDs within each relationship's own scope", () => {
    const graph = new TraceabilityGraph();
    for (const component of ["foo", "bar"]) {
      graph.addItem(item("TEST-001", component, "1", "test"));
      graph.addItem(item("REQ-001", component, "1"));
      graph.addRelationship(scopedRelationship("TEST-001", "REQ-001", component, "1"));
    }
    graph.canonicalizeRelationships();

    expect(graph.getRelatedItems("TEST-001", undefined, "foo", "1").map((entry) => entry.component)).to.deep.equal(["foo"]);
    expect(graph.getRelatedItems("TEST-001", undefined, "bar", "1").map((entry) => entry.component)).to.deep.equal(["bar"]);
    expect(graph.getRelatedItems("TEST-001")).to.deep.equal([]);
  });

  it("uses scoped endpoints in graph traversal without merging duplicate IDs", () => {
    const graph = new TraceabilityGraph();
    for (const component of ["foo", "bar"]) {
      graph.addItem(item("TEST-001", component, "1", "test"));
      graph.addItem(item("REQ-001", component, "1"));
      graph.addRelationship(scopedRelationship("TEST-001", "REQ-001", component, "1"));
    }
    graph.canonicalizeRelationships();

    expect(graph.getRelationships("TEST-001", undefined, "foo", "1")).to.have.length(1);
    expect(graph.getReverseRelationships("REQ-001", undefined, "bar", "1")).to.have.length(1);
    expect(graph.getRelatedItems("TEST-001", undefined, "bar", "1").map((entry) => entry.component)).to.deep.equal(["bar"]);
    expect(graph.toDot("TEST-001", 1, "foo", "1")).to.include('"foo\u00001\u0000REQ-001"');
    expect(graph.toDot("TEST-001", 1, "bar", "1")).to.include('"bar\u00001\u0000REQ-001"');
  });

  it("leaves an ambiguous out-of-scope target unresolved and warns", () => {
    const graph = new TraceabilityGraph();
    graph.addItem(item("TEST-001", "foo", "1", "test"));
    graph.addItem(item("REQ-001", "bar", "1"));
    graph.addItem(item("REQ-001", "baz", "1"));
    graph.addRelationship(scopedRelationship("TEST-001", "REQ-001", "foo", "1"));
    graph.canonicalizeRelationships();

    expect(graph.getDanglingReferences()).to.have.length(1);
    expect(graph.validate().warnings.some((warning) => warning.message.includes("Ambiguous target item ID: REQ-001"))).to.equal(true);
  });

  it("exports scoped node and relationship identities to CSV", () => {
    const graph = new TraceabilityGraph();
    for (const component of ["foo", "bar"]) {
      graph.addItem(item("TEST-001", component, "1", "test"));
      graph.addItem(item("REQ-001", component, "1"));
      graph.addRelationship(scopedRelationship("TEST-001", "REQ-001", component, "1"));
    }
    graph.canonicalizeRelationships();
    const outputDir = mkdtempSync(join(tmpdir(), "scoped-identity-csv-"));
    try {
      const result = new Neo4jExporter(graph).export({ outputDir, format: "csv" });
      const nodes = fields(result.nodesFile!);
      const relationships = fields(result.relationshipsFile!);

      expect(nodes.map((row) => row.get("identity"))).to.deep.equal([
        "foo\u00001\u0000TEST-001",
        "foo\u00001\u0000REQ-001",
        "bar\u00001\u0000TEST-001",
        "bar\u00001\u0000REQ-001",
      ]);
      expect(nodes.map((row) => [row.get("component"), row.get("version")])).to.deep.equal([
        ["foo", "1"], ["foo", "1"], ["bar", "1"], ["bar", "1"],
      ]);
      expect(relationships.map((row) => [row.get("source"), row.get("target"), row.get("sourceId"), row.get("targetId")])).to.deep.equal([
        ["foo\u00001\u0000TEST-001", "foo\u00001\u0000REQ-001", "TEST-001", "REQ-001"],
        ["bar\u00001\u0000TEST-001", "bar\u00001\u0000REQ-001", "TEST-001", "REQ-001"],
      ]);
      const cypher = new Neo4jExporter(graph).export({ outputDir, format: "cypher" });
      const cypherText = fs.readFileSync(cypher.cypherFile!, "utf8");
      expect(cypherText.includes("\u0000")).to.equal(false);
      expect(cypherText).to.include("identity: 'foo\\u00001\\u0000TEST-001'");
      expect(cypherText).to.include("identity: 'bar\\u00001\\u0000TEST-001'");
      expect(cypherText).to.include("MATCH (source:Item {identity: 'foo\\u00001\\u0000TEST-001'}), (target:Item {identity: 'foo\\u00001\\u0000REQ-001'})");
      expect(cypherText).to.include("MATCH (source:Item {identity: 'bar\\u00001\\u0000TEST-001'}), (target:Item {identity: 'bar\\u00001\\u0000REQ-001'})");
    } finally {
      rmSync(outputDir, { recursive: true, force: true });
    }
  });

  it("matches scoped Cypher endpoints by identity and keeps local export identities bare", () => {
    const graph = new TraceabilityGraph();
    graph.addItem(item("TEST-001", undefined, undefined, "test"));
    graph.addItem(item("REQ-001"));
    graph.addRelationship({ id: "r1", fromId: "TEST-001", targetId: "REQ-001", type: "addresses" });
    const outputDir = mkdtempSync(join(tmpdir(), "scoped-identity-export-"));
    try {
      const exporter = new Neo4jExporter(graph);
      const csv = exporter.export({ outputDir, format: "csv" });
      expect(fields(csv.nodesFile!).map((row) => row.get("identity"))).to.deep.equal(["TEST-001", "REQ-001"]);
      expect(fields(csv.relationshipsFile!).map((row) => [row.get("source"), row.get("target")])).to.deep.equal([
        ["TEST-001", "REQ-001"],
      ]);

      const cypher = exporter.export({ outputDir, format: "cypher" });
      const output = fs.readFileSync(cypher.cypherFile!, "utf8");
      expect(output).to.include("identity: 'TEST-001'");
      expect(output).to.include("MATCH (source:Item {identity: 'TEST-001'}), (target:Item {identity: 'REQ-001'})");
    } finally {
      rmSync(outputDir, { recursive: true, force: true });
    }
  });
});
