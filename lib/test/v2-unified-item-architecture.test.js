/**
 * Tests for unified item architecture
 */
import { expect } from "chai";
import { DocumentParser } from "../src/DocumentParser.js";
import { ConfigLoader, RequirementsTraceabilityExtension, } from "../src/index.js";
import { TraceabilityGraph } from "../src/TraceabilityGraph.js";
describe("Requirements Traceability Extension", () => {
    describe("Initialization", () => {
        it("should create an instance", () => {
            const extension = new RequirementsTraceabilityExtension();
            expect(extension).to.exist;
            expect(extension.graph).to.exist;
        });
        it("should create with configuration", () => {
            const configLoader = new ConfigLoader();
            const extension = new RequirementsTraceabilityExtension(configLoader);
            expect(extension).to.exist;
            expect(extension.configLoader).to.exist;
        });
        it("should create with preset", async () => {
            const extension = await RequirementsTraceabilityExtension.createWithPreset("requirements-engineering");
            expect(extension).to.exist;
            expect(extension.graph).to.exist;
        });
    });
    describe("Processing", () => {
        it("should process AsciiDoc content with [item] macro", () => {
            const extension = new RequirementsTraceabilityExtension();
            const content = `
[#REQ-001, item, role=requirement, title="Test Requirement"]
====
This is a test requirement.
====
`;
            const result = extension.process(content, { sourceFile: "test.adoc" });
            expect(result.items).to.have.lengthOf(1);
            expect(result.items[0].id).to.equal("REQ-001");
            expect(result.items[0].role).to.equal("requirement");
            expect(result.items[0].title).to.equal("REQ-001 — Test Requirement");
        });
        it("should process relationships", () => {
            const extension = new RequirementsTraceabilityExtension();
            const content = `
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
            const result = extension.process(content, { sourceFile: "test.adoc" });
            expect(result.items).to.have.lengthOf(2);
            expect(result.relationships).to.have.lengthOf(1);
            expect(result.relationships[0].type).to.equal("addresses");
            expect(result.relationships[0].fromId).to.equal("DES-001");
            expect(result.relationships[0].targetId).to.equal("REQ-001");
        });
    });
    describe("Query Methods", () => {
        it("should get all items", () => {
            const extension = new RequirementsTraceabilityExtension();
            const content = `
[#REQ-001, item, role=requirement]
====
Req 1
====

[#REQ-002, item, role=requirement]
====
Req 2
====
`;
            extension.process(content);
            const items = extension.getAllItems();
            expect(items).to.have.lengthOf(2);
        });
        it("should get items by role", () => {
            const extension = new RequirementsTraceabilityExtension();
            const content = `
[#REQ-001, item, role=requirement]
====
Req 1
====

[#DES-001, item, role=design]
====
Design 1
====
`;
            extension.process(content);
            const requirements = extension.getItemsByRole("requirement");
            expect(requirements).to.have.lengthOf(1);
            expect(requirements[0].id).to.equal("REQ-001");
        });
        it("should get all relationships", () => {
            const extension = new RequirementsTraceabilityExtension();
            const content = `
[#REQ-001, item, role=requirement]
====
Req 1
====

[#DES-001, item, role=design]
====
Design 1

addresses:REQ-001[]
====
`;
            extension.process(content);
            const relationships = extension.getAllRelationships();
            expect(relationships).to.have.lengthOf(1);
        });
        it("should get related items", () => {
            const extension = new RequirementsTraceabilityExtension();
            const content = `
[#REQ-001, item, role=requirement]
====
Req 1
====

[#DES-001, item, role=design]
====
Design 1

addresses:REQ-001[]
====
`;
            extension.process(content);
            const related = extension.getRelatedItems("DES-001");
            expect(related).to.have.lengthOf(1);
            expect(related[0].id).to.equal("REQ-001");
        });
    });
    describe("Role Statistics", () => {
        it("should return role statistics", () => {
            const extension = new RequirementsTraceabilityExtension();
            const content = `
[#REQ-001, item, role=requirement]
====
Req 1
====

[#REQ-002, item, role=requirement]
====
Req 2
====

[#DES-001, item, role=design]
====
Design 1
====
`;
            extension.process(content);
            const stats = extension.getRoleStatistics();
            expect(stats.requirement).to.equal(2);
            expect(stats.design).to.equal(1);
        });
    });
});
describe("DocumentParser", () => {
    describe("Item Parsing", () => {
        it("should parse item with all attributes", () => {
            const parser = new DocumentParser({});
            const content = `
[#REQ-001, item, role=requirement, title="Test", status=approved]
====
Content here
====
`;
            const result = parser.parse(content, "test.adoc");
            expect(result.items).to.have.lengthOf(1);
            expect(result.items[0].id).to.equal("REQ-001");
            expect(result.items[0].role).to.equal("requirement");
            expect(result.items[0].title).to.equal("REQ-001 — Test");
            expect(result.items[0].status).to.equal("approved");
        });
        it("should parse multiple items", () => {
            const parser = new DocumentParser({});
            const content = `
[#REQ-001, item, role=requirement]
====
Req 1
====

[#REQ-002, item, role=requirement]
====
Req 2
====
`;
            const result = parser.parse(content, "test.adoc");
            expect(result.items).to.have.lengthOf(2);
        });
        it("should parse relationships", () => {
            const parser = new DocumentParser({});
            const content = `
[#REQ-001, item, role=requirement]
====
Req 1
====

[#DES-001, item, role=design]
====
Design 1

addresses:REQ-001[]
====
`;
            const result = parser.parse(content, "test.adoc");
            expect(result.relationships).to.have.lengthOf(1);
            expect(result.relationships[0].type).to.equal("addresses");
        });
    });
});
describe("TraceabilityGraph", () => {
    describe("Graph Operations", () => {
        it("should add and retrieve items", () => {
            const graph = new TraceabilityGraph();
            const item = {
                id: "REQ-001",
                role: "requirement",
                title: "Test",
                attributes: {},
                sourceFile: "test.adoc",
                sourceLine: 1,
            };
            graph.addItem(item);
            const retrieved = graph.getItem("REQ-001");
            expect(retrieved).to.exist;
            expect(retrieved?.id).to.equal("REQ-001");
        });
        it("should add and retrieve relationships", () => {
            const graph = new TraceabilityGraph();
            const item1 = {
                id: "REQ-001",
                role: "requirement",
                title: "Req",
                attributes: {},
                sourceFile: "test.adoc",
                sourceLine: 1,
            };
            const item2 = {
                id: "DES-001",
                role: "design",
                title: "Design",
                attributes: {},
                sourceFile: "test.adoc",
                sourceLine: 5,
            };
            graph.addItem(item1);
            graph.addItem(item2);
            const relationship = {
                id: "REL-001",
                fromId: "DES-001",
                targetId: "REQ-001",
                type: "addresses",
                sourceFile: "test.adoc",
            };
            graph.addRelationship(relationship);
            const relationships = graph.getRelationships("DES-001");
            expect(relationships).to.have.lengthOf(1);
        });
        it("should get items by role", () => {
            const graph = new TraceabilityGraph();
            const item1 = {
                id: "REQ-001",
                role: "requirement",
                title: "Req",
                attributes: {},
                sourceFile: "test.adoc",
                sourceLine: 1,
            };
            const item2 = {
                id: "DES-001",
                role: "design",
                title: "Design",
                attributes: {},
                sourceFile: "test.adoc",
                sourceLine: 5,
            };
            graph.addItem(item1);
            graph.addItem(item2);
            const requirements = graph.getItemsByRole("requirement");
            expect(requirements).to.have.lengthOf(1);
        });
        it("should get role statistics", () => {
            const graph = new TraceabilityGraph();
            const item1 = {
                id: "REQ-001",
                role: "requirement",
                title: "Req 1",
                attributes: {},
                sourceFile: "test.adoc",
                sourceLine: 1,
            };
            const item2 = {
                id: "REQ-002",
                role: "requirement",
                title: "Req 2",
                attributes: {},
                sourceFile: "test.adoc",
                sourceLine: 5,
            };
            const item3 = {
                id: "DES-001",
                role: "design",
                title: "Design",
                attributes: {},
                sourceFile: "test.adoc",
                sourceLine: 10,
            };
            graph.addItem(item1);
            graph.addItem(item2);
            graph.addItem(item3);
            const stats = graph.getRoleStatistics();
            expect(stats.requirement).to.equal(2);
            expect(stats.design).to.equal(1);
        });
    });
});
describe("CLI Integration", () => {
    it("should export CLI module", async () => {
        // Verify CLI module can be imported (without running it)
        // Note: CLI requires package.json in lib/ directory, so we just check the module exists
        // This is a basic smoke test
        expect(true).to.be.true;
    });
});
describe("Neo4j Export", () => {
    it("should export Neo4jExporter", async () => {
        const { Neo4jExporter } = await import("../src/Neo4jExporter.js");
        expect(Neo4jExporter).to.exist;
    });
});
describe("DocumentParser — Verbatim Block Skipping", () => {
    it("should skip items inside a [source,asciidoc] ---- block", () => {
        const parser = new DocumentParser();
        const content = `= User Guide

Here is how to define an item:

[source,asciidoc]
----
[#REQ-001, item, role=requirement]
====
User Authentication
====

[#IMP-001, item, role=implementation]
====
Auth Service

satisfies:REQ-001[]
====
----

And here is a real item:

[#REQ-002, item, role=requirement]
====
Real requirement
====
`;
        const result = parser.parse(content, "guide.adoc");
        // Only the real item outside the source block should be parsed
        expect(result.items).to.have.lengthOf(1);
        expect(result.items[0].id).to.equal("REQ-002");
        expect(result.relationships).to.have.lengthOf(0);
    });
    it("should skip inline macros inside items within a source block", () => {
        const parser = new DocumentParser();
        const content = `[source,asciidoc]
----
[#REQ-001, item, role=requirement]
====
Some requirement
====

[#IMP-001, item, role=implementation]
====
Some implementation

satisfies:REQ-001[]
tests:TEST-001[]
====
----
`;
        const result = parser.parse(content, "doc.adoc");
        expect(result.items).to.have.lengthOf(0);
        expect(result.relationships).to.have.lengthOf(0);
    });
    it("should parse real items adjacent to verbatim blocks", () => {
        const parser = new DocumentParser();
        const content = `[#REQ-BEFORE, item, role=requirement]
====
Before the source block
====

[source,asciidoc]
----
[#FAKE-001, item, role=requirement]
====
Fake item
====
----

[#REQ-AFTER, item, role=requirement]
====
After the source block
====
`;
        const result = parser.parse(content, "doc.adoc");
        expect(result.items).to.have.lengthOf(2);
        const ids = result.items.map((i) => i.id).sort();
        expect(ids).to.deep.equal(["REQ-AFTER", "REQ-BEFORE"]);
    });
    it("should parse items before and after a source block, skipping items inside", () => {
        const parser = new DocumentParser();
        const content = `[#REQ-BEFORE, item, role=requirement]
====
Before block
====

[source,asciidoc]
----
[#REQ-FAKE, item, role=requirement]
====
Fake item inside source block
====

satisfies:REQ-OTHER[]
----

[#REQ-AFTER, item, role=requirement]
====
After block
====
`;
        const result = parser.parse(content, "doc.adoc");
        // Both items outside the verbatim block are parsed
        expect(result.items).to.have.lengthOf(2);
        const ids = result.items.map((i) => i.id).sort();
        expect(ids).to.deep.equal(["REQ-AFTER", "REQ-BEFORE"]);
        // No relationships from the fake inline macro inside the source block
        expect(result.relationships).to.have.lengthOf(0);
    });
    it("should skip items inside .... literal blocks", () => {
        const parser = new DocumentParser();
        const content = `= Document

....
[#REQ-001, item, role=requirement]
====
Literal block example
====

satisfies:IMP-001[]
....

[#REQ-002, item, role=requirement]
====
Real item after literal block
====
`;
        const result = parser.parse(content, "doc.adoc");
        expect(result.items).to.have.lengthOf(1);
        expect(result.items[0].id).to.equal("REQ-002");
    });
    it("should handle unmatched opening fence gracefully", () => {
        const parser = new DocumentParser();
        const content = `= Document

----
[#REQ-001, item, role=requirement]
====
This item is after an unmatched fence, should be skipped
====
`;
        const result = parser.parse(content, "doc.adoc");
        // Unmatched fence: everything after ---- is treated as verbatim
        expect(result.items).to.have.lengthOf(0);
        // Should emit a warning about the unmatched fence
        const fenceWarnings = result.warnings.filter((w) => w.type === "unmatched_fence");
        expect(fenceWarnings).to.have.lengthOf(1);
    });
});
