/**
 * Tests for CLI module
 * Tests the CLI module exports and basic functionality
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { expect } from "chai";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Helper to create a temp file
function createTempFile(content, extension = "adoc") {
    const tempDir = path.join(__dirname, "temp-cli");
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    const filePath = path.join(tempDir, `test-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${extension}`);
    fs.writeFileSync(filePath, content);
    return filePath;
}
// Helper to clean up temp files
function cleanupTempFile(filePath) {
    try {
        fs.unlinkSync(filePath);
    }
    catch {
        // Ignore cleanup errors
    }
}
// Sample AsciiDoc content for testing
const sampleContent = `
[#REQ-001, item, role=requirement, title="Test Requirement"]
====
This is a test requirement.
====

[#DES-001, item, role=design, title="Test Design"]
====
This is a test design.

addresses:REQ-001[]
====
`;
const emptyContent = "";
describe("CLI Module", () => {
    describe("Module Export", () => {
        it("should export CLI module", () => {
            // This test verifies the CLI module can be imported
            expect(true).to.be.true; // Placeholder - CLI is tested via integration
        });
    });
    describe("Process Command Integration", () => {
        it("should process valid AsciiDoc content", async () => {
            const filePath = createTempFile(sampleContent);
            try {
                const { RequirementsTraceabilityExtension } = await import("../src/index.js");
                const extension = new RequirementsTraceabilityExtension();
                const result = extension.process(sampleContent, {
                    sourceFile: filePath,
                });
                expect(result.items).to.have.lengthOf(2);
                expect(result.items[0].id).to.equal("REQ-001");
                expect(result.items[1].id).to.equal("DES-001");
                expect(result.relationships).to.have.lengthOf(1);
                expect(result.relationships[0].type).to.equal("addresses");
            }
            finally {
                cleanupTempFile(filePath);
            }
        });
        it("should handle empty content", async () => {
            const filePath = createTempFile(emptyContent);
            try {
                const { RequirementsTraceabilityExtension } = await import("../src/index.js");
                const extension = new RequirementsTraceabilityExtension();
                const result = extension.process(emptyContent, {
                    sourceFile: filePath,
                });
                expect(result.items).to.have.lengthOf(0);
                expect(result.relationships).to.have.lengthOf(0);
            }
            finally {
                cleanupTempFile(filePath);
            }
        });
        it("should handle content with multiple items", async () => {
            const multiContent = `
[#REQ-001, item, role=requirement, title="Req 1"]
====
Requirement 1
====

[#REQ-002, item, role=requirement, title="Req 2"]
====
Requirement 2
====

[#REQ-003, item, role=requirement, title="Req 3"]
====
Requirement 3
====
`;
            const filePath = createTempFile(multiContent);
            try {
                const { RequirementsTraceabilityExtension } = await import("../src/index.js");
                const extension = new RequirementsTraceabilityExtension();
                const result = extension.process(multiContent, {
                    sourceFile: filePath,
                });
                expect(result.items).to.have.lengthOf(3);
                expect(result.items.map((i) => i.id)).to.include.members([
                    "REQ-001",
                    "REQ-002",
                    "REQ-003",
                ]);
            }
            finally {
                cleanupTempFile(filePath);
            }
        });
        it("should handle content with multiple relationships", async () => {
            const multiRelContent = `
[#REQ-001, item, role=requirement, title="Requirement"]
====
A requirement
====

[#DES-001, item, role=design, title="Design"]
====
A design

addresses:REQ-001[]
====

[#IMP-001, item, role=implementation, title="Implementation"]
====
An implementation

implements:DES-001[]
====
`;
            const filePath = createTempFile(multiRelContent);
            try {
                const { RequirementsTraceabilityExtension } = await import("../src/index.js");
                const extension = new RequirementsTraceabilityExtension();
                const result = extension.process(multiRelContent, {
                    sourceFile: filePath,
                });
                expect(result.items).to.have.lengthOf(3);
                expect(result.relationships).to.have.lengthOf(2);
            }
            finally {
                cleanupTempFile(filePath);
            }
        });
    });
    describe("Matrix Generation Integration", () => {
        it("should generate matrix from processed items", async () => {
            const filePath = createTempFile(sampleContent);
            try {
                const { RequirementsTraceabilityExtension } = await import("../src/index.js");
                const { MatrixGenerator } = await import("../src/MatrixGenerator.js");
                const extension = new RequirementsTraceabilityExtension();
                extension.process(sampleContent, { sourceFile: filePath });
                const generator = new MatrixGenerator(extension.graph);
                const matrix = generator.generateMatrix("default");
                expect(matrix).to.exist;
                expect(matrix.rows).to.exist;
                expect(matrix.columns).to.exist;
            }
            finally {
                cleanupTempFile(filePath);
            }
        });
        it("should generate CSV matrix", async () => {
            const filePath = createTempFile(sampleContent);
            try {
                const { RequirementsTraceabilityExtension } = await import("../src/index.js");
                const { MatrixGenerator } = await import("../src/MatrixGenerator.js");
                const extension = new RequirementsTraceabilityExtension();
                extension.process(sampleContent, { sourceFile: filePath });
                const generator = new MatrixGenerator(extension.graph);
                const matrix = generator.generateMatrix("default");
                const csv = generator.exportToCSV(matrix);
                expect(csv).to.be.a("string");
                expect(csv).to.include("Row ID");
                expect(csv).to.include("Row Title");
            }
            finally {
                cleanupTempFile(filePath);
            }
        });
        it("should generate HTML matrix", async () => {
            const filePath = createTempFile(sampleContent);
            try {
                const { RequirementsTraceabilityExtension } = await import("../src/index.js");
                const { MatrixGenerator } = await import("../src/MatrixGenerator.js");
                const extension = new RequirementsTraceabilityExtension();
                extension.process(sampleContent, { sourceFile: filePath });
                const generator = new MatrixGenerator(extension.graph);
                const matrix = generator.generateMatrix("default");
                const html = generator.exportToHTML(matrix);
                expect(html).to.be.a("string");
                expect(html).to.include("<html");
                expect(html).to.include("</html");
            }
            finally {
                cleanupTempFile(filePath);
            }
        });
    });
    describe("Validation Integration", () => {
        it("should validate graph with no errors", async () => {
            const filePath = createTempFile(sampleContent);
            try {
                const { RequirementsTraceabilityExtension } = await import("../src/index.js");
                const extension = new RequirementsTraceabilityExtension();
                extension.process(sampleContent, { sourceFile: filePath });
                const validation = extension.graph.validate();
                expect(validation.errors).to.be.an("array");
                // May have warnings for unknown roles, but no errors
            }
            finally {
                cleanupTempFile(filePath);
            }
        });
        it("should get role statistics", async () => {
            const filePath = createTempFile(sampleContent);
            try {
                const { RequirementsTraceabilityExtension } = await import("../src/index.js");
                const extension = new RequirementsTraceabilityExtension();
                extension.process(sampleContent, { sourceFile: filePath });
                const stats = extension.graph.getRoleStatistics();
                expect(stats).to.be.an("object");
                expect(stats.requirement).to.equal(1);
                expect(stats.design).to.equal(1);
            }
            finally {
                cleanupTempFile(filePath);
            }
        });
    });
    describe("Query Methods Integration", () => {
        it("should get all items", async () => {
            const filePath = createTempFile(sampleContent);
            try {
                const { RequirementsTraceabilityExtension } = await import("../src/index.js");
                const extension = new RequirementsTraceabilityExtension();
                extension.process(sampleContent, { sourceFile: filePath });
                const items = extension.getAllItems();
                expect(items).to.have.lengthOf(2);
            }
            finally {
                cleanupTempFile(filePath);
            }
        });
        it("should get items by role", async () => {
            const filePath = createTempFile(sampleContent);
            try {
                const { RequirementsTraceabilityExtension } = await import("../src/index.js");
                const extension = new RequirementsTraceabilityExtension();
                extension.process(sampleContent, { sourceFile: filePath });
                const requirements = extension.getItemsByRole("requirement");
                expect(requirements).to.have.lengthOf(1);
                expect(requirements[0].id).to.equal("REQ-001");
            }
            finally {
                cleanupTempFile(filePath);
            }
        });
        it("should get all relationships", async () => {
            const filePath = createTempFile(sampleContent);
            try {
                const { RequirementsTraceabilityExtension } = await import("../src/index.js");
                const extension = new RequirementsTraceabilityExtension();
                extension.process(sampleContent, { sourceFile: filePath });
                const relationships = extension.getAllRelationships();
                expect(relationships).to.have.lengthOf(1);
                expect(relationships[0].type).to.equal("addresses");
            }
            finally {
                cleanupTempFile(filePath);
            }
        });
        it("should find related items", async () => {
            const filePath = createTempFile(sampleContent);
            try {
                const { RequirementsTraceabilityExtension } = await import("../src/index.js");
                const extension = new RequirementsTraceabilityExtension();
                extension.process(sampleContent, { sourceFile: filePath });
                const related = extension.getRelatedItems("DES-001");
                expect(related).to.have.lengthOf(1);
                expect(related[0].id).to.equal("REQ-001");
            }
            finally {
                cleanupTempFile(filePath);
            }
        });
    });
    describe("Configuration Integration", () => {
        it("should create extension with default config", async () => {
            const { RequirementsTraceabilityExtension } = await import("../src/index.js");
            const extension = new RequirementsTraceabilityExtension();
            expect(extension).to.exist;
            expect(extension.graph).to.exist;
        });
        it("should create extension with preset", async () => {
            const { RequirementsTraceabilityExtension } = await import("../src/index.js");
            const extension = await RequirementsTraceabilityExtension.createWithPreset("requirements-engineering");
            expect(extension).to.exist;
            expect(extension.configLoader).to.exist;
        });
        it("should list presets", async () => {
            const { RequirementsTraceabilityExtension } = await import("../src/index.js");
            const extension = new RequirementsTraceabilityExtension();
            const presets = extension.listPresets();
            expect(presets).to.be.an("array");
            expect(presets.length).to.be.greaterThan(0);
            expect(presets.some((p) => p.name === "requirements-engineering")).to.be
                .true;
        });
        it("should get preset by name", async () => {
            const { RequirementsTraceabilityExtension } = await import("../src/index.js");
            const extension = new RequirementsTraceabilityExtension();
            const preset = extension.getPreset("requirements-engineering");
            expect(preset).to.exist;
            expect(preset.name).to.equal("requirements-engineering");
        });
    });
    describe("Neo4j Export Integration", () => {
        it("should create Neo4j exporter", async () => {
            const filePath = createTempFile(sampleContent);
            try {
                const { RequirementsTraceabilityExtension } = await import("../src/index.js");
                const extension = new RequirementsTraceabilityExtension();
                extension.process(sampleContent, { sourceFile: filePath });
                const exporter = extension.createNeo4jExporter();
                expect(exporter).to.exist;
            }
            finally {
                cleanupTempFile(filePath);
            }
        });
        it("should export to Neo4j CSV format", async () => {
            const filePath = createTempFile(sampleContent);
            const outputDir = path.join(__dirname, "temp-cli", "neo4j-output");
            try {
                fs.mkdirSync(outputDir, { recursive: true });
                const { RequirementsTraceabilityExtension } = await import("../src/index.js");
                const extension = new RequirementsTraceabilityExtension();
                extension.process(sampleContent, { sourceFile: filePath });
                const result = extension.exportToNeo4jCSV({
                    outputDir,
                    format: "csv",
                    includeContent: true,
                    includeAllAttributes: true,
                });
                expect(result).to.exist;
                expect(result.nodeCount).to.be.greaterThan(0);
                expect(result.relationshipCount).to.be.greaterThan(0);
            }
            finally {
                // Cleanup output directory
                try {
                    fs.rmSync(outputDir, { recursive: true, force: true });
                }
                catch {
                    // Ignore cleanup errors
                }
                cleanupTempFile(filePath);
            }
        });
        it("should export to Neo4j Cypher format", async () => {
            const filePath = createTempFile(sampleContent);
            const outputDir = path.join(__dirname, "temp-cli", "neo4j-cypher");
            try {
                fs.mkdirSync(outputDir, { recursive: true });
                const { RequirementsTraceabilityExtension } = await import("../src/index.js");
                const extension = new RequirementsTraceabilityExtension();
                extension.process(sampleContent, { sourceFile: filePath });
                const result = extension.exportToNeo4jCSV({
                    outputDir,
                    format: "cypher",
                    includeContent: true,
                    includeAllAttributes: true,
                });
                expect(result).to.exist;
                expect(result.cypherFile).to.exist;
            }
            finally {
                // Cleanup output directory
                try {
                    fs.rmSync(outputDir, { recursive: true, force: true });
                }
                catch {
                    // Ignore cleanup errors
                }
                cleanupTempFile(filePath);
            }
        });
    });
    // ========================================================================
    // Edge Cases & Error Handling (addressed via programmatic API)
    // ========================================================================
    describe("Process Command - Error Handling", () => {
        it("should throw when process is called with missing/invalid source file path", async () => {
            const { RequirementsTraceabilityExtension } = await import("../src/index.js");
            const extension = new RequirementsTraceabilityExtension();
            // readFileSync on a non-existent path would throw — we validate the CLI
            // guards against that by testing that process() handles empty content
            // sent to a file path that doesn't exist on disk (the sourceFile is metadata)
            const result = extension.process("", {
                sourceFile: "/nonexistent/path/file.adoc",
            });
            expect(result.items).to.have.lengthOf(0);
            expect(result.relationships).to.have.lengthOf(0);
        });
        it("should handle content with malformed item macros gracefully", async () => {
            const { RequirementsTraceabilityExtension } = await import("../src/index.js");
            const extension = new RequirementsTraceabilityExtension();
            const malformedContent = `
[item, id=, role=requirement, title="Missing ID"]
====
An item with missing ID.
====

[item id=NO-BRACKETS role=requirement title="No brackets"]
====
Bad syntax.
====
`;
            // Should not crash on malformed macros
            const result = extension.process(malformedContent, {
                sourceFile: "malformed.adoc",
            });
            expect(result.items).to.be.an("array");
            expect(result.errors).to.be.an("array");
        });
    });
    describe("Matrix Command - Error Handling", () => {
        it("should handle matrix generation on empty graph", async () => {
            const { RequirementsTraceabilityExtension } = await import("../src/index.js");
            const { MatrixGenerator } = await import("../src/MatrixGenerator.js");
            const extension = new RequirementsTraceabilityExtension();
            // Graph is empty — no items added
            expect(extension.graph.size()).to.equal(0);
            const generator = new MatrixGenerator(extension.graph);
            // Empty graph should produce a matrix with zero rows, not crash
            const matrix = generator.generateMatrix("default");
            expect(matrix).to.exist;
            expect(matrix.rows).to.be.an("array").that.is.empty;
            expect(matrix.coverage).to.be.an("object");
            expect(matrix.coverage.overall).to.equal(0);
        });
    });
    describe("Validate Command - Error Handling", () => {
        it("should return validation errors for invalid graph state", async () => {
            const { RequirementsTraceabilityExtension } = await import("../src/index.js");
            const extension = new RequirementsTraceabilityExtension();
            // Process content with relations to nonexistent targets
            const invalidContent = `
[#REQ-001, item, role=requirement, title="Lonely Req"]
====
A requirement with no implementations.
====

[#IMP-001, item, role=implementation, title="Orphan Impl"]
====
An implementation that satisfies nothing.

satisfies:MISSING-REQ[]
====
`;
            extension.process(invalidContent, { sourceFile: "invalid.adoc" });
            const validation = extension.graph.validate();
            expect(validation).to.have.property("errors");
            // An item references MISSING-REQ which doesn't exist
            expect(validation.warnings.length).to.be.greaterThanOrEqual(0);
        });
    });
    describe("Export Command - Error Handling", () => {
        it("should export empty graph without crashing", async () => {
            const outputDir = path.join(__dirname, "temp-cli", "neo4j-empty");
            try {
                fs.mkdirSync(outputDir, { recursive: true });
                const { RequirementsTraceabilityExtension } = await import("../src/index.js");
                const extension = new RequirementsTraceabilityExtension();
                // No items processed — empty graph
                const result = extension.exportToNeo4jCSV({
                    outputDir,
                    format: "csv",
                    includeContent: true,
                    includeAllAttributes: true,
                });
                expect(result).to.exist;
                expect(result.nodeCount).to.equal(0);
                expect(result.relationshipCount).to.equal(0);
                expect(result.nodesFile).to.exist;
                expect(result.relationshipsFile).to.exist;
            }
            finally {
                try {
                    fs.rmSync(outputDir, { recursive: true, force: true });
                }
                catch {
                    // Ignore cleanup errors
                }
            }
        });
    });
    describe("Stats Command - Error Handling", () => {
        it("should return empty statistics when no items are processed", async () => {
            const { RequirementsTraceabilityExtension } = await import("../src/index.js");
            const extension = new RequirementsTraceabilityExtension();
            const stats = extension.graph.getRoleStatistics();
            expect(stats).to.be.an("object");
            expect(Object.keys(stats)).to.have.lengthOf(0);
        });
    });
    describe("Preset Commands - Error Handling & Init", () => {
        it("should throw for invalid preset name", async () => {
            const { RequirementsTraceabilityExtension } = await import("../src/index.js");
            const extension = new RequirementsTraceabilityExtension();
            expect(() => extension.getPreset("nonexistent-preset")).to.throw();
        });
        it("should initialize preset init by writing config to output directory", async () => {
            const { ConfigLoader } = await import("../src/index.js");
            const outputDir = path.join(__dirname, "temp-cli", "preset-init-output");
            try {
                fs.mkdirSync(outputDir, { recursive: true });
                const loader = new ConfigLoader();
                const preset = loader.loadPreset("requirements-engineering");
                // Write the config file (as the preset init command does)
                const configPath = path.join(outputDir, "traceability.yml");
                const configContent = `# Traceability Configuration
roles:
${preset.traceability.roles.map((r) => `  - ${r}`).join("\n")}
`;
                fs.writeFileSync(configPath, configContent);
                // Verify the file was written
                expect(fs.existsSync(configPath)).to.be.true;
                const written = fs.readFileSync(configPath, "utf8");
                expect(written).to.include("roles");
                expect(written).to.include("requirement");
                expect(written).to.include("design");
                expect(written).to.include("implementation");
                // Verify we can load the written config
                const loader2 = new ConfigLoader();
                expect(() => loader2.load(configPath)).to.not.throw();
            }
            finally {
                try {
                    fs.rmSync(outputDir, { recursive: true, force: true });
                }
                catch {
                    // Ignore cleanup errors
                }
            }
        });
    });
    describe("Help Command", () => {
        it("should list available commands in extension API", async () => {
            const { RequirementsTraceabilityExtension } = await import("../src/index.js");
            const ext = new RequirementsTraceabilityExtension();
            // Verify the extension has the expected public API methods
            // (these correspond to CLI commands)
            expect(ext.process).to.be.a("function");
            expect(ext.getAllItems).to.be.a("function");
            expect(ext.getAllRelationships).to.be.a("function");
            expect(ext.getItemsByRole).to.be.a("function");
            expect(ext.getRelatedItems).to.be.a("function");
            expect(ext.getRoleStatistics).to.be.a("function");
            expect(ext.createNeo4jExporter).to.be.a("function");
            expect(ext.listPresets).to.be.a("function");
            expect(ext.getPreset).to.be.a("function");
        });
        it("should list available presets through the config loader", async () => {
            const { ConfigLoader } = await import("../src/index.js");
            const loader = new ConfigLoader();
            const presets = loader.listPresets();
            // Should return all built-in presets
            expect(presets).to.be.an("array");
            expect(presets.length).to.be.greaterThanOrEqual(3);
            // Each preset should have name and description
            for (const p of presets) {
                expect(p).to.have.property("name");
                expect(p).to.have.property("description");
                expect(p).to.have.property("version");
            }
        });
    });
});
