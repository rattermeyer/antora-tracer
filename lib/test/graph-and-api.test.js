/**
 * Tests for Graph Query methods and API methods (Sections 4 & 5)
 *
 * Tests the TraceabilityGraph query methods (merge, findPath, impact analysis)
 * and RequirementsTraceabilityExtension API methods (processFiles, validate,
 * config access, lifecycle).
 */
import { expect } from "chai";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ConfigLoader, RequirementsTraceabilityExtension, } from "../src/index.js";
import { TraceabilityGraph } from "../src/TraceabilityGraph.js";
// ============================================================================
// Helpers
// ============================================================================
function createItem(id, role, title) {
    return {
        id,
        role,
        title: title || id,
        attributes: {},
        sourceFile: "test.adoc",
        sourceLine: 1,
    };
}
function createRel(id, fromId, targetId, type) {
    return { id, fromId, targetId, type, sourceFile: "test.adoc" };
}
function processContent(extension, content, file = "input.adoc") {
    extension.process(content, { sourceFile: file });
}
// ============================================================================
// Section 4: Graph Query Tests
// ============================================================================
describe("TraceabilityGraph - Extended Queries", () => {
    // 4.1
    describe("merge()", () => {
        it("should merge items from another graph", () => {
            const graphA = new TraceabilityGraph();
            graphA.addItem(createItem("REQ-001", "requirement", "Req 1"));
            graphA.addItem(createItem("DES-001", "design", "Design 1"));
            const graphB = new TraceabilityGraph();
            graphB.addItem(createItem("IMP-001", "implementation", "Impl 1"));
            graphA.merge(graphB);
            const items = graphA.getAllItems();
            expect(items).to.have.lengthOf(3);
            expect(graphA.getItem("IMP-001")).to.exist;
        });
        it("should merge relationships from another graph", () => {
            const graphA = new TraceabilityGraph();
            graphA.addItem(createItem("REQ-001", "requirement"));
            graphA.addItem(createItem("DES-001", "design"));
            const graphB = new TraceabilityGraph();
            graphB.addItem(createItem("DES-001", "design"));
            graphB.addItem(createItem("REQ-001", "requirement"));
            graphB.addRelationship(createRel("R1", "DES-001", "REQ-001", "addresses"));
            graphA.merge(graphB);
            expect(graphA.getAllItems()).to.have.lengthOf(2);
            expect(graphA.getAllRelationships()).to.have.lengthOf(1);
        });
        it("should not modify the source graph after merge", () => {
            const graphA = new TraceabilityGraph();
            graphA.addItem(createItem("REQ-001", "requirement"));
            const graphB = new TraceabilityGraph();
            graphB.addItem(createItem("DES-001", "design"));
            graphA.merge(graphB);
            expect(graphB.getItem("DES-001")).to.exist;
        });
    });
    // 4.2
    describe("getRelatedItems()", () => {
        it("should return items related via forward relationships", () => {
            const graph = new TraceabilityGraph();
            graph.addItem(createItem("DES-001", "design"));
            graph.addItem(createItem("REQ-001", "requirement"));
            graph.addItem(createItem("REQ-002", "requirement"));
            graph.addRelationship(createRel("R1", "DES-001", "REQ-001", "addresses"));
            graph.addRelationship(createRel("R2", "DES-001", "REQ-002", "addresses"));
            const related = graph.getRelatedItems("DES-001");
            expect(related).to.have.lengthOf(2);
            expect(related.map((r) => r.id)).to.include.members([
                "REQ-001",
                "REQ-002",
            ]);
        });
        it("should filter by relation type", () => {
            const graph = new TraceabilityGraph();
            graph.addItem(createItem("IMP-001", "implementation"));
            graph.addItem(createItem("DES-001", "design"));
            graph.addItem(createItem("REQ-001", "requirement"));
            graph.addRelationship(createRel("R1", "IMP-001", "DES-001", "implements"));
            graph.addRelationship(createRel("R2", "IMP-001", "REQ-001", "satisfies"));
            const rels = graph.getRelatedItems("IMP-001", "implements");
            expect(rels).to.have.lengthOf(1);
            expect(rels[0].id).to.equal("DES-001");
        });
        it("should return empty array for item without relationships", () => {
            const graph = new TraceabilityGraph();
            graph.addItem(createItem("REQ-001", "requirement"));
            const related = graph.getRelatedItems("REQ-001");
            expect(related).to.be.an("array").that.is.empty;
        });
    });
    // 4.3
    describe("getItemsWithRelationTo()", () => {
        it("should return items that have relationships pointing to the given item", () => {
            const graph = new TraceabilityGraph();
            graph.addItem(createItem("REQ-001", "requirement"));
            graph.addItem(createItem("DES-001", "design"));
            graph.addItem(createItem("IMP-001", "implementation"));
            graph.addRelationship(createRel("R1", "DES-001", "REQ-001", "addresses"));
            graph.addRelationship(createRel("R2", "IMP-001", "REQ-001", "satisfies"));
            const sources = graph.getItemsWithRelationTo("REQ-001");
            expect(sources).to.have.lengthOf(2);
            expect(sources.map((s) => s.id)).to.include.members([
                "DES-001",
                "IMP-001",
            ]);
        });
        it("should filter by relation type in reverse", () => {
            const graph = new TraceabilityGraph();
            graph.addItem(createItem("REQ-001", "requirement"));
            graph.addItem(createItem("DES-001", "design"));
            graph.addItem(createItem("IMP-001", "implementation"));
            graph.addRelationship(createRel("R1", "DES-001", "REQ-001", "addresses"));
            graph.addRelationship(createRel("R2", "IMP-001", "REQ-001", "satisfies"));
            const sources = graph.getItemsWithRelationTo("REQ-001", "addresses");
            expect(sources).to.have.lengthOf(1);
            expect(sources[0].id).to.equal("DES-001");
        });
    });
    // 4.4
    describe("getRelationshipsByRoles()", () => {
        it("should return relationships between two roles", () => {
            const graph = new TraceabilityGraph();
            graph.addItem(createItem("REQ-001", "requirement"));
            graph.addItem(createItem("REQ-002", "requirement"));
            graph.addItem(createItem("DES-001", "design"));
            graph.addItem(createItem("IMP-001", "implementation"));
            graph.addRelationship(createRel("R1", "DES-001", "REQ-001", "addresses"));
            graph.addRelationship(createRel("R2", "IMP-001", "REQ-002", "satisfies"));
            const fromDesign = graph.getRelationshipsByRoles("design", "requirement");
            expect(fromDesign).to.have.lengthOf(1);
            expect(fromDesign[0].fromId).to.equal("DES-001");
        });
        it("should return empty array when no relationships match roles", () => {
            const graph = new TraceabilityGraph();
            graph.addItem(createItem("REQ-001", "requirement"));
            graph.addItem(createItem("IMP-001", "implementation"));
            graph.addRelationship(createRel("R1", "IMP-001", "REQ-001", "satisfies"));
            const fromDesign = graph.getRelationshipsByRoles("design", "requirement");
            expect(fromDesign).to.be.an("array").that.is.empty;
        });
    });
    // 4.5-4.7
    describe("findPath()", () => {
        it("should find path between directly connected items", () => {
            const graph = new TraceabilityGraph();
            graph.addItem(createItem("REQ-001", "requirement"));
            graph.addItem(createItem("DES-001", "design"));
            graph.addRelationship(createRel("R1", "DES-001", "REQ-001", "addresses"));
            const path = graph.findPath("DES-001", "REQ-001");
            expect(path).to.not.be.null;
            expect(path).to.include.members(["DES-001", "REQ-001"]);
        });
        it("should find path through intermediate items", () => {
            const graph = new TraceabilityGraph();
            graph.addItem(createItem("REQ-001", "requirement"));
            graph.addItem(createItem("DES-001", "design"));
            graph.addItem(createItem("IMP-001", "implementation"));
            graph.addRelationship(createRel("R1", "DES-001", "REQ-001", "addresses"));
            graph.addRelationship(createRel("R2", "IMP-001", "DES-001", "implements"));
            const path = graph.findPath("IMP-001", "REQ-001");
            expect(path).to.not.be.null;
            expect(path?.length).to.be.greaterThanOrEqual(2);
        });
        // 4.6
        it("should return null for disconnected items", () => {
            const graph = new TraceabilityGraph();
            graph.addItem(createItem("REQ-001", "requirement"));
            graph.addItem(createItem("DES-001", "design"));
            const path = graph.findPath("REQ-001", "DES-001");
            expect(path).to.be.null;
        });
        // 4.7
        it("should respect maxDepth parameter", () => {
            const graph = new TraceabilityGraph();
            graph.addItem(createItem("REQ-001", "requirement"));
            graph.addItem(createItem("DES-001", "design"));
            graph.addItem(createItem("IMP-001", "implementation"));
            graph.addRelationship(createRel("R1", "DES-001", "REQ-001", "addresses"));
            graph.addRelationship(createRel("R2", "IMP-001", "DES-001", "implements"));
            // Depth 1 won't reach REQ-001 from IMP-001 (needs 2 steps)
            const path = graph.findPath("IMP-001", "REQ-001", 1);
            expect(path).to.be.null;
            // Depth 2 should work
            const path2 = graph.findPath("IMP-001", "REQ-001", 2);
            expect(path2).to.not.be.null;
        });
    });
    // 4.8
    describe("getImpactAnalysis()", () => {
        it("should return all reachable items in both directions", () => {
            const graph = new TraceabilityGraph();
            graph.addItem(createItem("REQ-001", "requirement"));
            graph.addItem(createItem("DES-001", "design"));
            graph.addItem(createItem("IMP-001", "implementation"));
            graph.addRelationship(createRel("R1", "DES-001", "REQ-001", "addresses"));
            graph.addRelationship(createRel("R2", "IMP-001", "DES-001", "implements"));
            const impacted = graph.getImpactAnalysis("REQ-001");
            expect(impacted).to.include.members(["DES-001", "IMP-001"]);
        });
        it("should handle items with no relationships", () => {
            const graph = new TraceabilityGraph();
            graph.addItem(createItem("REQ-001", "requirement"));
            const impacted = graph.getImpactAnalysis("REQ-001");
            expect(impacted).to.be.an("array").that.is.empty;
        });
        it("should exclude the source item from results", () => {
            const graph = new TraceabilityGraph();
            graph.addItem(createItem("REQ-001", "requirement"));
            graph.addItem(createItem("DES-001", "design"));
            graph.addRelationship(createRel("R1", "DES-001", "REQ-001", "addresses"));
            const impacted = graph.getImpactAnalysis("REQ-001");
            expect(impacted).to.not.include("REQ-001");
        });
    });
});
// ============================================================================
// Section 5: API Methods Tests (on RequirementsTraceabilityExtension)
// ============================================================================
describe("RequirementsTraceabilityExtension - API Methods", () => {
    let tempDir;
    beforeEach(() => {
        tempDir = mkdtempSync(join(tmpdir(), "api-test-"));
    });
    afterEach(() => {
        rmSync(tempDir, { recursive: true, force: true });
    });
    // 5.1
    describe("processFiles()", () => {
        it("should process multiple files", () => {
            const extension = new RequirementsTraceabilityExtension();
            const result = extension.processFiles([
                {
                    path: "reqs.adoc",
                    content: `\n[#REQ-001, item, role=requirement, title="Req 1"]\n====\nReq 1 content\n====\n`,
                },
                {
                    path: "design.adoc",
                    content: `\n[#DES-001, item, role=design, title="Design 1"]\n====\nDesign 1 content\n====\n`,
                },
            ]);
            expect(result.fileResults).to.have.lengthOf(2);
            expect(result.result.items).to.have.lengthOf(2);
            expect(extension.getAllItems()).to.have.lengthOf(2);
        });
        it("should track per-file item and relationship counts", () => {
            const extension = new RequirementsTraceabilityExtension();
            const result = extension.processFiles([
                {
                    path: "reqs.adoc",
                    content: `\n[#REQ-001, item, role=requirement]\n====\nReq 1\n====\n\n[#REQ-002, item, role=requirement]\n====\nReq 2\n====\n`,
                },
                {
                    path: "design.adoc",
                    content: `\n[#DES-001, item, role=design]\n====\nDesign 1\n\naddresses:REQ-001[]\n====\n`,
                },
            ]);
            expect(result.fileResults[0].items).to.equal(2);
            expect(result.fileResults[0].relationships).to.equal(0);
            expect(result.fileResults[1].items).to.equal(1);
            expect(result.fileResults[1].relationships).to.equal(1);
        });
        it("should handle empty files array", () => {
            const extension = new RequirementsTraceabilityExtension();
            const result = extension.processFiles([]);
            expect(result.fileResults).to.be.an("array").that.is.empty;
            expect(result.result.items).to.have.lengthOf(0);
        });
    });
    // 5.2
    describe("getAllItems()", () => {
        it("should return empty array when no items exist", () => {
            const extension = new RequirementsTraceabilityExtension();
            const items = extension.getAllItems();
            expect(items).to.be.an("array").that.is.empty;
        });
    });
    // 5.3
    describe("getAllRelationships()", () => {
        it("should return empty array when no relationships exist", () => {
            const extension = new RequirementsTraceabilityExtension();
            const rels = extension.getAllRelationships();
            expect(rels).to.be.an("array").that.is.empty;
        });
    });
    // 5.4
    describe("getItemsByRole()", () => {
        it("should return empty array for unknown role", () => {
            const extension = new RequirementsTraceabilityExtension();
            processContent(extension, `\n[#REQ-001, item, role=requirement]\n====\nReq 1\n====\n`);
            const items = extension.getItemsByRole("nonexistent");
            expect(items).to.be.an("array").that.is.empty;
        });
    });
    // 5.5
    describe("getRelationships() with type filter", () => {
        it("should filter relationships by type", () => {
            const extension = new RequirementsTraceabilityExtension();
            processContent(extension, `\n[#REQ-001, item, role=requirement]\n====\nReq 1\n====\n\n[#DES-001, item, role=design]\n====\nDesign 1\n\naddresses:REQ-001[]\n====\n\n[#IMP-001, item, role=implementation]\n====\nImpl 1\n\nimplements:DES-001[]\n====\n`);
            const implementsRels = extension.getRelationships("IMP-001", "implements");
            expect(implementsRels).to.have.lengthOf(1);
            const addressesRels = extension.getRelationships("IMP-001", "addresses");
            expect(addressesRels).to.have.lengthOf(0);
        });
        it("should return empty array for item without relationships", () => {
            const extension = new RequirementsTraceabilityExtension();
            processContent(extension, `\n[#REQ-001, item, role=requirement]\n====\nReq 1\n====\n`);
            const rels = extension.getRelationships("REQ-001");
            expect(rels).to.be.an("array").that.is.empty;
        });
    });
    // 5.6
    describe("getRelatedItems()", () => {
        it("should return empty array for item without outgoing relationships", () => {
            const extension = new RequirementsTraceabilityExtension();
            processContent(extension, `\n[#REQ-001, item, role=requirement]\n====\nReq 1\n====\n`);
            const related = extension.getRelatedItems("REQ-001");
            expect(related).to.be.an("array").that.is.empty;
        });
    });
    // 5.7
    describe("getRoleStatistics()", () => {
        it("should return empty object for empty graph", () => {
            const extension = new RequirementsTraceabilityExtension();
            const stats = extension.getRoleStatistics();
            expect(Object.keys(stats)).to.have.lengthOf(0);
        });
    });
    // 5.8
    describe("validate()", () => {
        it("should return validation result with no errors for empty graph", () => {
            const extension = new RequirementsTraceabilityExtension();
            const validation = extension.validate();
            expect(validation.errors).to.be.an("array").that.is.empty;
            expect(validation.warnings).to.be.an("array").that.is.empty;
        });
        it("should detect orphaned relationships via validate()", () => {
            const extension = new RequirementsTraceabilityExtension();
            // Add items and a relationship where both endpoints exist
            extension.graph.addItem(createItem("REQ-001", "requirement"));
            extension.graph.addItem(createItem("DES-001", "design"));
            extension.graph.addRelationship({
                id: "R1",
                fromId: "DES-001",
                targetId: "REQ-001",
                type: "addresses",
                sourceFile: "test.adoc",
            });
            // Now remove the target item to create an orphan
            // Access the internal map to bypass validation
            extension.graph._items.delete("REQ-001");
            const validation = extension.validate();
            expect(validation.errors.length).to.be.greaterThan(0);
            expect(validation.errors.some((e) => e.includes("does not exist"))).to.be.true;
        });
    });
    // 5.9
    describe("getConfigErrors()", () => {
        it("should return error when no configLoader is set", () => {
            const extension = new RequirementsTraceabilityExtension();
            const errors = extension.getConfigErrors();
            expect(errors).to.be.an("array");
            expect(errors.length).to.be.greaterThan(0);
            expect(errors[0]).to.include("No configuration loaded");
        });
        it("should return empty array when configLoader is set", async () => {
            const extension = await RequirementsTraceabilityExtension.createWithPreset("requirements-engineering");
            const errors = extension.getConfigErrors();
            expect(errors).to.be.an("array").that.is.empty;
        });
    });
    // 5.10
    describe("createNeo4jExporter()", () => {
        it("should create exporter instance", () => {
            const extension = new RequirementsTraceabilityExtension();
            const exporter = extension.createNeo4jExporter();
            expect(exporter).to.exist;
        });
    });
    // 5.11
    describe("exportToNeo4jCSV()", () => {
        it("should export graph with items and relationships", () => {
            const extension = new RequirementsTraceabilityExtension();
            processContent(extension, `\n[#REQ-001, item, role=requirement]\n====\nReq 1\n====\n\n[#DES-001, item, role=design]\n====\nDesign 1\n\naddresses:REQ-001[]\n====\n`);
            const result = extension.exportToNeo4jCSV({
                outputDir: tempDir,
                format: "csv",
                includeContent: true,
                includeAllAttributes: true,
            });
            expect(result).to.exist;
            expect(result.nodeCount).to.equal(2);
            expect(result.relationshipCount).to.equal(1);
        });
        it("should export empty graph without error", () => {
            const extension = new RequirementsTraceabilityExtension();
            const result = extension.exportToNeo4jCSV({
                outputDir: tempDir,
                format: "csv",
                includeContent: true,
                includeAllAttributes: true,
            });
            expect(result.nodeCount).to.equal(0);
            expect(result.relationshipCount).to.equal(0);
        });
    });
    // 5.12
    describe("getCoverageReport()", () => {
        it("should return role statistics when no configLoader is set", () => {
            const extension = new RequirementsTraceabilityExtension();
            processContent(extension, `\n[#REQ-001, item, role=requirement]\n====\nReq 1\n====\n\n[#DES-001, item, role=design]\n====\nDesign 1\n====\n`);
            const report = extension.getCoverageReport();
            expect(report.requirement).to.equal(1);
            expect(report.design).to.equal(1);
        });
        it("should include matrix-specific coverage when configLoader is set", async () => {
            const extension = await RequirementsTraceabilityExtension.createWithPreset("requirements-engineering");
            processContent(extension, `\n[#REQ-001, item, role=requirement]\n====\nReq 1\n====\n`);
            const report = extension.getCoverageReport();
            expect(report.requirement).to.equal(1);
        });
        it("should return empty stats for empty graph", () => {
            const extension = new RequirementsTraceabilityExtension();
            const report = extension.getCoverageReport();
            expect(report).to.be.an("object");
        });
    });
    // 5.13
    describe("getMatrixDefinitions()", () => {
        it("should return empty array when no configLoader is set", () => {
            const extension = new RequirementsTraceabilityExtension();
            const defs = extension.getMatrixDefinitions();
            expect(defs).to.be.an("array").that.is.empty;
        });
        it("should return matrix definitions when configLoader is set", async () => {
            const extension = await RequirementsTraceabilityExtension.createWithPreset("requirements-engineering");
            const defs = extension.getMatrixDefinitions();
            expect(defs.length).to.be.greaterThan(0);
            expect(defs[0]).to.have.property("name");
            expect(defs[0]).to.have.property("rows");
            expect(defs[0]).to.have.property("columns");
        });
    });
    // 5.14
    describe("isKnownRole()", () => {
        it("should return false when no configLoader is set", () => {
            const extension = new RequirementsTraceabilityExtension();
            expect(extension.isKnownRole("requirement")).to.be.false;
        });
        it("should return true for known roles when configLoader is set", async () => {
            const extension = await RequirementsTraceabilityExtension.createWithPreset("requirements-engineering");
            expect(extension.isKnownRole("requirement")).to.be.true;
            expect(extension.isKnownRole("design")).to.be.true;
        });
        it("should return false for unknown roles when configLoader is set", async () => {
            const extension = await RequirementsTraceabilityExtension.createWithPreset("requirements-engineering");
            expect(extension.isKnownRole("widget")).to.be.false;
        });
    });
    // 5.15
    describe("isRelationAllowed()", () => {
        it("should return true when no configLoader is set (default allow)", () => {
            const extension = new RequirementsTraceabilityExtension();
            expect(extension.isRelationAllowed("requirement", "design", "addresses"))
                .to.be.true;
        });
        it("should return true for allowed relations when configLoader is set", async () => {
            const extension = await RequirementsTraceabilityExtension.createWithPreset("requirements-engineering");
            expect(extension.isRelationAllowed("design", "requirement", "addresses"))
                .to.be.true;
        });
        it("should return false for disallowed relations when configLoader is set", async () => {
            const extension = await RequirementsTraceabilityExtension.createWithPreset("requirements-engineering");
            expect(extension.isRelationAllowed("design", "requirement", "addresses"))
                .to.be.true;
            expect(extension.isRelationAllowed("design", "requirement", "verified_by")).to.be.false;
        });
    });
    // 5.16
    describe("getAllowedRelations()", () => {
        it("should return empty array when no configLoader is set", () => {
            const extension = new RequirementsTraceabilityExtension();
            const allowed = extension.getAllowedRelations("design", "requirement");
            expect(allowed).to.be.an("array").that.is.empty;
        });
        it("should return allowed relation types when configLoader is set", async () => {
            const extension = await RequirementsTraceabilityExtension.createWithPreset("requirements-engineering");
            const allowed = extension.getAllowedRelations("design", "requirement");
            expect(allowed).to.include("addresses");
        });
    });
    // 5.17
    describe("listPresets()", () => {
        it("should list all available presets", () => {
            const extension = new RequirementsTraceabilityExtension();
            const presets = extension.listPresets();
            expect(presets).to.be.an("array");
            expect(presets.length).to.be.greaterThanOrEqual(3);
            const names = presets.map((p) => p.name);
            expect(names).to.include("requirements-engineering");
            expect(names).to.include("agile");
            expect(names).to.include("medical-iec62304");
        });
    });
    // 5.18
    describe("getPreset()", () => {
        it("should return preset details by name", () => {
            const extension = new RequirementsTraceabilityExtension();
            const preset = extension.getPreset("requirements-engineering");
            expect(preset).to.exist;
            expect(preset.name).to.equal("requirements-engineering");
            expect(preset).to.have.property("traceability");
            expect(preset.traceability).to.have.property("roles");
        });
    });
    // 5.19
    describe("clear()", () => {
        it("should clear all items and relationships", () => {
            const extension = new RequirementsTraceabilityExtension();
            processContent(extension, `\n[#REQ-001, item, role=requirement]\n====\nReq 1\n====\n\n[#DES-001, item, role=design]\n====\nDesign 1\n\naddresses:REQ-001[]\n====\n`);
            expect(extension.getAllItems()).to.have.lengthOf(2);
            expect(extension.getAllRelationships()).to.have.lengthOf(1);
            extension.clear();
            expect(extension.getAllItems()).to.have.lengthOf(0);
            expect(extension.getAllRelationships()).to.have.lengthOf(0);
        });
        it("should be idempotent on already empty graph", () => {
            const extension = new RequirementsTraceabilityExtension();
            extension.clear();
            expect(extension.getAllItems()).to.have.lengthOf(0);
        });
    });
    // 5.20
    describe("resetWithConfig()", () => {
        it("should set a new configLoader", () => {
            const extension = new RequirementsTraceabilityExtension();
            expect(extension.configLoader).to.be.undefined;
            const loader = new ConfigLoader();
            extension.resetWithConfig(loader);
            expect(extension.configLoader).to.exist;
        });
        it("should update the configLoader on the graph", () => {
            const extension = new RequirementsTraceabilityExtension();
            const loader = new ConfigLoader();
            extension.resetWithConfig(loader);
            // Graph should now have the configLoader
            expect(extension.graph.configLoader).to.equal(loader);
        });
    });
    // Additional: findPath and getImpactAnalysis on the extension
    describe("findPath() on extension", () => {
        it("should find path via extension method", () => {
            const extension = new RequirementsTraceabilityExtension();
            extension.graph.addItem(createItem("REQ-001", "requirement"));
            extension.graph.addItem(createItem("DES-001", "design"));
            extension.graph.addRelationship(createRel("R1", "DES-001", "REQ-001", "addresses"));
            const path = extension.findPath("DES-001", "REQ-001");
            expect(path).to.not.be.null;
            expect(path?.length).to.equal(2);
        });
    });
    describe("getImpactAnalysis() on extension", () => {
        it("should return impacted items via extension method", () => {
            const extension = new RequirementsTraceabilityExtension();
            extension.graph.addItem(createItem("REQ-001", "requirement"));
            extension.graph.addItem(createItem("DES-001", "design"));
            extension.graph.addRelationship(createRel("R1", "DES-001", "REQ-001", "addresses"));
            const impacted = extension.getImpactAnalysis("REQ-001");
            expect(impacted).to.include("DES-001");
        });
    });
    describe("getRelationshipsByRoles() on extension", () => {
        it("should return relationships between roles via extension method", () => {
            const extension = new RequirementsTraceabilityExtension();
            extension.graph.addItem(createItem("REQ-001", "requirement"));
            extension.graph.addItem(createItem("DES-001", "design"));
            extension.graph.addRelationship(createRel("R1", "DES-001", "REQ-001", "addresses"));
            const rels = extension.getRelationshipsByRoles("design", "requirement");
            expect(rels).to.have.lengthOf(1);
        });
    });
});
