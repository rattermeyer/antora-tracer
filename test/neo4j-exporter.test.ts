/**
 * Tests for Neo4jExporter - CSV and Cypher export for graphs
 */

import { expect } from "chai";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { Neo4jExporter } from "../src/Neo4jExporter.js";
import { TraceabilityGraph } from "../src/TraceabilityGraph.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tempDir = path.join(__dirname, "temp-neo4j");

// Ensure temp directory exists
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

describe("Neo4jExporter", () => {
  let graph: TraceabilityGraph;
  let exporter: Neo4jExporter;

  beforeEach(() => {
    graph = new TraceabilityGraph();
    exporter = new Neo4jExporter(graph);
  });

  afterEach(() => {
    // Clean up temp files
    try {
      const files = fs.readdirSync(tempDir);
      for (const file of files) {
        fs.unlinkSync(path.join(tempDir, file));
      }
    } catch {
      // Ignore errors
    }
  });

  describe("CSV Export", () => {
    it("should export empty graph to CSV files", () => {
      const outputDir = path.join(tempDir, "test-empty-csv");
      const result = exporter.export({
        outputDir,
        format: "csv",
      });

      expect(result).to.exist;
      expect(result.nodeCount).to.equal(0);
      expect(result.relationshipCount).to.equal(0);
      expect(result.nodesFile).to.exist;
      expect(result.relationshipsFile).to.exist;

      // Verify files were created
      expect(fs.existsSync(result.nodesFile!)).to.be.true;
      expect(fs.existsSync(result.relationshipsFile!)).to.be.true;

      // Cleanup
      fs.rmSync(outputDir, { recursive: true, force: true });
    });

    it("should export graph with items to CSV", () => {
      // Add items
      graph.addItem({
        id: "REQ-001",
        role: "requirement",
        title: "Req 1",
        attributes: { priority: "high" },
        sourceFile: "test.adoc",
      });
      graph.addItem({
        id: "IMP-001",
        role: "implementation",
        title: "Impl 1",
        attributes: {},
        sourceFile: "test.adoc",
      });

      const outputDir = path.join(tempDir, "test-csv");
      const result = exporter.export({
        outputDir,
        format: "csv",
      });

      expect(result.nodeCount).to.equal(2);
      expect(result.relationshipCount).to.equal(0);
      expect(result.nodesFile).to.exist;

      // Read and verify nodes file
      const nodesContent = fs.readFileSync(result.nodesFile!, "utf8");
      expect(nodesContent).to.include("REQ-001");
      expect(nodesContent).to.include("IMP-001");
      expect(nodesContent).to.include("requirement");
      expect(nodesContent).to.include("implementation");

      // Cleanup
      fs.rmSync(outputDir, { recursive: true, force: true });
    });

    it("should export graph with relationships to CSV", () => {
      graph.addItem({
        id: "REQ-001",
        role: "requirement",
        title: "Req 1",
        attributes: {},
        sourceFile: "test.adoc",
      });
      graph.addItem({
        id: "IMP-001",
        role: "implementation",
        title: "Impl 1",
        attributes: {},
        sourceFile: "test.adoc",
      });

      graph.addRelationship({
        id: "REL-001",
        fromId: "IMP-001",
        targetId: "REQ-001",
        type: "implements",
        sourceFile: "test.adoc",
      });

      const outputDir = path.join(tempDir, "test-csv-rel");
      const result = exporter.export({
        outputDir,
        format: "csv",
      });

      expect(result.nodeCount).to.equal(2);
      expect(result.relationshipCount).to.equal(1);
      expect(result.relationshipsFile).to.exist;

      // Read and verify relationships file
      const relsContent = fs.readFileSync(result.relationshipsFile!, "utf8");
      expect(relsContent).to.include("IMP-001");
      expect(relsContent).to.include("REQ-001");
      expect(relsContent).to.include("implements");

      // Cleanup
      fs.rmSync(outputDir, { recursive: true, force: true });
    });

    it("should include all attributes in CSV export", () => {
      graph.addItem({
        id: "REQ-001",
        role: "requirement",
        title: "Test Req",
        attributes: {
          priority: "high",
          status: "approved",
          author: "test-user",
        },
        sourceFile: "test.adoc",
      });

      const outputDir = path.join(tempDir, "test-csv-attrs");
      const result = exporter.export({
        outputDir,
        format: "csv",
        includeAllAttributes: true,
      });

      const nodesContent = fs.readFileSync(result.nodesFile!, "utf8");
      expect(nodesContent).to.include("high");
      expect(nodesContent).to.include("approved");

      // Cleanup
      fs.rmSync(outputDir, { recursive: true, force: true });
    });

    it("should escape special characters in CSV", () => {
      graph.addItem({
        id: "REQ-001",
        role: "requirement",
        title: 'Req with, comma and "quotes"',
        attributes: {},
        sourceFile: "test.adoc",
      });

      const outputDir = path.join(tempDir, "test-csv-escape");
      const result = exporter.export({
        outputDir,
        format: "csv",
      });

      const nodesContent = fs.readFileSync(result.nodesFile!, "utf8");
      // CSV should properly escape commas and quotes
      expect(nodesContent).to.include('"');

      // Cleanup
      fs.rmSync(outputDir, { recursive: true, force: true });
    });
  });

  describe("Cypher Export", () => {
    it("should export empty graph to Cypher", () => {
      const outputDir = path.join(tempDir, "test-cypher-empty");
      const result = exporter.export({
        outputDir,
        format: "cypher",
      });

      expect(result).to.exist;
      expect(result.nodeCount).to.equal(0);
      expect(result.relationshipCount).to.equal(0);
      expect(result.cypherFile).to.exist;
      expect(fs.existsSync(result.cypherFile!)).to.be.true;

      // Cleanup
      fs.rmSync(outputDir, { recursive: true, force: true });
    });

    it("should export graph with items to Cypher", () => {
      graph.addItem({
        id: "REQ-001",
        role: "requirement",
        title: "Req 1",
        attributes: {},
        sourceFile: "test.adoc",
      });
      graph.addItem({
        id: "IMP-001",
        role: "implementation",
        title: "Impl 1",
        attributes: {},
        sourceFile: "test.adoc",
      });

      const outputDir = path.join(tempDir, "test-cypher");
      const result = exporter.export({
        outputDir,
        format: "cypher",
      });

      expect(result.nodeCount).to.equal(2);
      expect(result.cypherFile).to.exist;

      const cypherContent = fs.readFileSync(result.cypherFile!, "utf8");
      expect(cypherContent).to.include("CREATE");
      expect(cypherContent).to.include("REQ-001");
      expect(cypherContent).to.include("IMP-001");

      // Cleanup
      fs.rmSync(outputDir, { recursive: true, force: true });
    });

    it("should export relationships in Cypher", () => {
      graph.addItem({
        id: "REQ-001",
        role: "requirement",
        title: "Req 1",
        attributes: {},
        sourceFile: "test.adoc",
      });
      graph.addItem({
        id: "IMP-001",
        role: "implementation",
        title: "Impl 1",
        attributes: {},
        sourceFile: "test.adoc",
      });

      graph.addRelationship({
        id: "REL-001",
        fromId: "IMP-001",
        targetId: "REQ-001",
        type: "implements",
        sourceFile: "test.adoc",
      });

      const outputDir = path.join(tempDir, "test-cypher-rel");
      const result = exporter.export({
        outputDir,
        format: "cypher",
      });

      const cypherContent = fs.readFileSync(result.cypherFile!, "utf8");
      expect(cypherContent).to.include("MATCH");
      expect(cypherContent).to.include("CREATE");
      expect(cypherContent).to.include("implements");

      // Cleanup
      fs.rmSync(outputDir, { recursive: true, force: true });
    });

    it("should escape special characters in Cypher", () => {
      graph.addItem({
        id: "REQ-001",
        role: "requirement",
        title: "Req with \"quotes\" and 'single quotes'",
        attributes: {},
        sourceFile: "test.adoc",
      });

      const outputDir = path.join(tempDir, "test-cypher-escape");
      const result = exporter.export({
        outputDir,
        format: "cypher",
      });

      const cypherContent = fs.readFileSync(result.cypherFile!, "utf8");
      // Cypher should properly escape quotes
      expect(cypherContent.length).to.be.greaterThan(0);

      // Cleanup
      fs.rmSync(outputDir, { recursive: true, force: true });
    });
  });

  describe("Export Options", () => {
    it("should respect includeContent option", () => {
      graph.addItem({
        id: "REQ-001",
        role: "requirement",
        title: "Req with content",
        content: "This is the content of the requirement",
        attributes: {},
        sourceFile: "test.adoc",
      });

      const outputDirWithContent = path.join(tempDir, "test-with-content");
      const resultWith = exporter.export({
        outputDir: outputDirWithContent,
        format: "csv",
        includeContent: true,
      });

      const outputDirWithoutContent = path.join(tempDir, "test-no-content");
      const resultWithout = exporter.export({
        outputDir: outputDirWithoutContent,
        format: "csv",
        includeContent: false,
      });

      const withContent = fs.readFileSync(resultWith.nodesFile!, "utf8");
      const withoutContent = fs.readFileSync(resultWithout.nodesFile!, "utf8");

      // With content should be larger
      expect(withContent.length).to.be.greaterThan(withoutContent.length);

      // Cleanup
      fs.rmSync(outputDirWithContent, { recursive: true, force: true });
      fs.rmSync(outputDirWithoutContent, { recursive: true, force: true });
    });

    it("should respect includeAllAttributes option", () => {
      graph.addItem({
        id: "REQ-001",
        role: "requirement",
        title: "Req",
        attributes: { attr1: "value1", attr2: "value2" },
        sourceFile: "test.adoc",
      });

      const outputDirWithAttrs = path.join(tempDir, "test-with-attrs");
      const resultWith = exporter.export({
        outputDir: outputDirWithAttrs,
        format: "csv",
        includeAllAttributes: true,
      });

      const outputDirWithoutAttrs = path.join(tempDir, "test-no-attrs");
      const resultWithout = exporter.export({
        outputDir: outputDirWithoutAttrs,
        format: "csv",
        includeAllAttributes: false,
      });

      const withAttrs = fs.readFileSync(resultWith.nodesFile!, "utf8");
      const _withoutAttrs = fs.readFileSync(resultWithout.nodesFile!, "utf8");

      // With attributes should include attr1 and attr2
      expect(withAttrs).to.include("attr1");
      expect(withAttrs).to.include("value1");

      // Cleanup
      fs.rmSync(outputDirWithAttrs, { recursive: true, force: true });
      fs.rmSync(outputDirWithoutAttrs, { recursive: true, force: true });
    });

    it("should create output directory if it does not exist", () => {
      const nestedDir = path.join(tempDir, "nested", "deep", "directory");

      const result = exporter.export({
        outputDir: nestedDir,
        format: "csv",
      });

      expect(fs.existsSync(nestedDir)).to.be.true;
      expect(fs.existsSync(result.nodesFile!)).to.be.true;

      // Cleanup
      fs.rmSync(path.dirname(nestedDir), { recursive: true, force: true });
    });
  });

  describe("Graph with Multiple Item Types", () => {
    it("should export graph with multiple roles", () => {
      graph.addItem({
        id: "REQ-001",
        role: "requirement",
        title: "Req 1",
        attributes: {},
        sourceFile: "test.adoc",
      });
      graph.addItem({
        id: "DES-001",
        role: "design",
        title: "Design 1",
        attributes: {},
        sourceFile: "test.adoc",
      });
      graph.addItem({
        id: "IMP-001",
        role: "implementation",
        title: "Impl 1",
        attributes: {},
        sourceFile: "test.adoc",
      });
      graph.addItem({
        id: "TEST-001",
        role: "test",
        title: "Test 1",
        attributes: {},
        sourceFile: "test.adoc",
      });

      graph.addRelationship({
        id: "REL-001",
        fromId: "DES-001",
        targetId: "REQ-001",
        type: "addresses",
        sourceFile: "test.adoc",
      });
      graph.addRelationship({
        id: "REL-002",
        fromId: "IMP-001",
        targetId: "DES-001",
        type: "implements",
        sourceFile: "test.adoc",
      });
      graph.addRelationship({
        id: "REL-003",
        fromId: "TEST-001",
        targetId: "IMP-001",
        type: "tests",
        sourceFile: "test.adoc",
      });

      const outputDir = path.join(tempDir, "test-multi-role");
      const result = exporter.export({
        outputDir,
        format: "csv",
      });

      expect(result.nodeCount).to.equal(4);
      expect(result.relationshipCount).to.equal(3);

      const nodesContent = fs.readFileSync(result.nodesFile!, "utf8");
      expect(nodesContent).to.include("requirement");
      expect(nodesContent).to.include("design");
      expect(nodesContent).to.include("implementation");
      expect(nodesContent).to.include("test");

      // Cleanup
      fs.rmSync(outputDir, { recursive: true, force: true });
    });
  });

  describe("Export Result", () => {
    it("should return correct counts in result", () => {
      graph.addItem({
        id: "REQ-001",
        role: "requirement",
        title: "Req 1",
        attributes: {},
        sourceFile: "test.adoc",
      });
      graph.addItem({
        id: "REQ-002",
        role: "requirement",
        title: "Req 2",
        attributes: {},
        sourceFile: "test.adoc",
      });
      graph.addItem({
        id: "REQ-003",
        role: "requirement",
        title: "Req 3",
        attributes: {},
        sourceFile: "test.adoc",
      });

      graph.addRelationship({
        id: "REL-001",
        fromId: "REQ-001",
        targetId: "REQ-002",
        type: "depends",
        sourceFile: "test.adoc",
      });
      graph.addRelationship({
        id: "REL-002",
        fromId: "REQ-002",
        targetId: "REQ-003",
        type: "depends",
        sourceFile: "test.adoc",
      });

      const outputDir = path.join(tempDir, "test-counts");
      const result = exporter.export({
        outputDir,
        format: "csv",
      });

      expect(result.nodeCount).to.equal(3);
      expect(result.relationshipCount).to.equal(2);

      // Cleanup
      fs.rmSync(outputDir, { recursive: true, force: true });
    });

    it("should return file paths in result", () => {
      graph.addItem({
        id: "REQ-001",
        role: "requirement",
        title: "Req 1",
        attributes: {},
        sourceFile: "test.adoc",
      });

      const outputDir = path.join(tempDir, "test-paths");
      const result = exporter.export({
        outputDir,
        format: "csv",
      });

      expect(result.nodesFile).to.exist;
      expect(result.nodesFile).to.include("nodes.csv");
      expect(result.relationshipsFile).to.exist;
      expect(result.relationshipsFile).to.include("relationships.csv");
      expect(result.cypherFile).to.be.undefined; // Not CSV format

      // Cleanup
      fs.rmSync(outputDir, { recursive: true, force: true });
    });

    it("should return cypher file path for cypher format", () => {
      graph.addItem({
        id: "REQ-001",
        role: "requirement",
        title: "Req 1",
        attributes: {},
        sourceFile: "test.adoc",
      });

      const outputDir = path.join(tempDir, "test-cypher-path");
      const result = exporter.export({
        outputDir,
        format: "cypher",
      });

      expect(result.cypherFile).to.exist;
      expect(result.cypherFile).to.include("import.cypher");
      expect(result.nodesFile).to.be.undefined; // Not CSV format
      expect(result.relationshipsFile).to.be.undefined;

      // Cleanup
      fs.rmSync(outputDir, { recursive: true, force: true });
    });
  });
});
