/**
 * Tests for relationship link substitution in AntoraTraceabilityExtension
 */
import { expect } from "chai";
import { TraceabilityGraph } from "../src/TraceabilityGraph.js";
// Extract the substitution logic for testing — the method is private on
// AntoraTraceabilityExtension, so we test the regex and logic directly.
// The method signature is:
//   substituteRelationshipLinks(content: string, currentFile: string): string
function substituteRelationshipLinks(content, currentFile, graph) {
    const relRegex = /\b(\w+):([\w][-.\w]*)\[\]/g;
    return content.replace(relRegex, (_match, _relType, targetId) => {
        const relType = _relType;
        const target = graph.getItem(targetId);
        if (!target) {
            return _match;
        }
        if (target.sourceFile === currentFile) {
            return `${relType}: xref:#${targetId}[${targetId}]`;
        }
        else if (target.sourceFile) {
            const targetPage = target.sourceFile.split("/").pop();
            return `${relType}: xref:${targetPage}#${targetId}[${targetId}]`;
        }
        return `${relType}: xref:#${targetId}[${targetId}]`;
    });
}
function createItem(id, role, title, sourceFile) {
    return {
        id,
        role,
        title: title || id,
        attributes: {},
        sourceFile,
        sourceLine: 1,
    };
}
describe("Relationship Link Substitution", () => {
    describe("Regex matching", () => {
        it("should match addresses:REQ-001[] pattern", () => {
            const graph = new TraceabilityGraph();
            graph.addItem(createItem("REQ-001", "requirement", "Req 1", "requirements.adoc"));
            const content = "addresses:REQ-001[]";
            const result = substituteRelationshipLinks(content, "architecture.adoc", graph);
            expect(result).to.equal("addresses: xref:requirements.adoc#REQ-001[REQ-001]");
        });
        it("should match verifies:TEST-001[] pattern", () => {
            const graph = new TraceabilityGraph();
            graph.addItem(createItem("TEST-001", "test", "Test 1", "test-plan.adoc"));
            const content = "verifies:TEST-001[]";
            const result = substituteRelationshipLinks(content, "requirements.adoc", graph);
            expect(result).to.equal("verifies: xref:test-plan.adoc#TEST-001[TEST-001]");
        });
        it("should match multiple relationship macros in one line", () => {
            const graph = new TraceabilityGraph();
            graph.addItem(createItem("REQ-001", "requirement", "Req 1", "requirements.adoc"));
            graph.addItem(createItem("REQ-002", "requirement", "Req 2", "requirements.adoc"));
            const content = "satisfies:REQ-001[] and satisfies:REQ-002[]";
            const result = substituteRelationshipLinks(content, "implementation.adoc", graph);
            expect(result).to.include("xref:requirements.adoc#REQ-001");
            expect(result).to.include("xref:requirements.adoc#REQ-002");
        });
    });
    describe("Same-page references", () => {
        it("should generate fragment-only xref when target is on same page", () => {
            const graph = new TraceabilityGraph();
            graph.addItem(createItem("REQ-001", "requirement", "Req 1", "requirements.adoc"));
            graph.addItem(createItem("REQ-002", "requirement", "Req 2", "requirements.adoc"));
            // REQ-002 depends on REQ-001, both on same page
            const content = "depends_on:REQ-001[]";
            const result = substituteRelationshipLinks(content, "requirements.adoc", graph);
            expect(result).to.equal("depends_on: xref:#REQ-001[REQ-001]");
        });
    });
    describe("Cross-page references", () => {
        it("should generate page-qualified xref when target is on different page", () => {
            const graph = new TraceabilityGraph();
            graph.addItem(createItem("REQ-001", "requirement", "Req 1", "requirements.adoc"));
            const content = "addresses:REQ-001[]";
            const result = substituteRelationshipLinks(content, "architecture.adoc", graph);
            expect(result).to.equal("addresses: xref:requirements.adoc#REQ-001[REQ-001]");
        });
    });
    describe("Orphan references", () => {
        it("should leave text unchanged when target not in graph", () => {
            const graph = new TraceabilityGraph();
            // No items added — MISSING-001 doesn't exist
            const content = "addresses:MISSING-001[]";
            const result = substituteRelationshipLinks(content, "architecture.adoc", graph);
            expect(result).to.equal("addresses:MISSING-001[]");
        });
    });
    describe("Non-relationship text", () => {
        it("should not modify text without bracket pattern", () => {
            const graph = new TraceabilityGraph();
            graph.addItem(createItem("REQ-001", "requirement", "Req 1", "requirements.adoc"));
            const content = "This is plain text about REQ-001 without a macro.";
            const result = substituteRelationshipLinks(content, "architecture.adoc", graph);
            expect(result).to.equal(content);
        });
        it("should not modify item block delimiters", () => {
            const graph = new TraceabilityGraph();
            const content = "[#ARC-001, item, role=architecture]\n====\nSome content\n====";
            const result = substituteRelationshipLinks(content, "architecture.adoc", graph);
            expect(result).to.equal(content);
        });
    });
    describe("Edge cases", () => {
        it("should handle IDs with hyphens and dots", () => {
            const graph = new TraceabilityGraph();
            graph.addItem(createItem("SYS.SEC-001", "requirement", "System Security", "requirements.adoc"));
            const content = "addresses:SYS.SEC-001[]";
            const result = substituteRelationshipLinks(content, "architecture.adoc", graph);
            expect(result).to.equal("addresses: xref:requirements.adoc#SYS.SEC-001[SYS.SEC-001]");
        });
        it("should handle target with no sourceFile", () => {
            const graph = new TraceabilityGraph();
            graph.addItem(createItem("REQ-001", "requirement", "Req 1", undefined));
            const content = "addresses:REQ-001[]";
            const result = substituteRelationshipLinks(content, "architecture.adoc", graph);
            expect(result).to.equal("addresses: xref:#REQ-001[REQ-001]");
        });
        it("should preserve surrounding text", () => {
            const graph = new TraceabilityGraph();
            graph.addItem(createItem("REQ-001", "requirement", "Req 1", "requirements.adoc"));
            const content = "Auth service that addresses:REQ-001[] and satisfies:REQ-001[].";
            const result = substituteRelationshipLinks(content, "architecture.adoc", graph);
            expect(result).to.include("addresses: xref:requirements.adoc#REQ-001[REQ-001]");
            expect(result).to.include("satisfies: xref:requirements.adoc#REQ-001[REQ-001]");
            expect(result).to.equal("Auth service that addresses: xref:requirements.adoc#REQ-001[REQ-001] and satisfies: xref:requirements.adoc#REQ-001[REQ-001].");
        });
    });
    describe("Verbatim block preservation", () => {
        /**
         * Simulates the verbatim-aware substituteRelationshipLinks using
         * the same findVerbatimRanges + segment-based approach as the
         * production code, adapted for the xref-generating test helper.
         */
        function findVerbatimRanges(content) {
            const ranges = [];
            const fenceRegex = /(?:^|\n)(----|\.\.\.\.)[ \t]*\r?\n/g;
            let match;
            while ((match = fenceRegex.exec(content)) !== null) {
                const fence = match[1];
                const openEnd = match.index + match[0].length;
                const closePattern = fence === "----"
                    ? "\\r?\\n----[ \\t]*(?:\\r?\\n|$)"
                    : "\\r?\\n\\.\\.\\.\\.[ \\t]*(?:\\r?\\n|$)";
                const closeRegex = new RegExp(closePattern, "g");
                closeRegex.lastIndex = openEnd;
                const closeMatch = closeRegex.exec(content);
                if (closeMatch) {
                    ranges.push({
                        start: match.index,
                        end: closeMatch.index + closeMatch[0].length,
                    });
                    fenceRegex.lastIndex = closeMatch.index + closeMatch[0].length;
                }
                else {
                    ranges.push({ start: match.index, end: content.length });
                    break;
                }
            }
            return ranges;
        }
        function substitutePreservingVerbatim(content, currentFile, graph) {
            const relRegex = /\b(\w+):([\w][-.\w]*)\[\]/g;
            const ranges = findVerbatimRanges(content);
            const processSegment = (segment) => segment.replace(relRegex, (_match, _relType, targetId) => {
                const relType = _relType;
                const target = graph.getItem(targetId);
                if (!target)
                    return _match;
                if (target.sourceFile === currentFile) {
                    return `${relType}: xref:#${targetId}[${targetId}]`;
                }
                else if (target.sourceFile) {
                    const targetPage = target.sourceFile.split("/").pop();
                    return `${relType}: xref:${targetPage}#${targetId}[${targetId}]`;
                }
                return `${relType}: xref:#${targetId}[${targetId}]`;
            });
            if (ranges.length === 0)
                return processSegment(content);
            let result = "";
            let pos = 0;
            for (const range of ranges) {
                result += processSegment(content.slice(pos, range.start));
                result += content.slice(range.start, range.end);
                pos = range.end;
            }
            result += processSegment(content.slice(pos));
            return result;
        }
        it("should preserve inline macros inside [source,asciidoc] block", () => {
            const graph = new TraceabilityGraph();
            graph.addItem(createItem("REQ-001", "requirement", "Req 1", "requirements.adoc"));
            const content = `[source,asciidoc]\n----\nsatisfies:REQ-001[]\n----\n`;
            const result = substitutePreservingVerbatim(content, "architecture.adoc", graph);
            // The inline macro inside the source block should be preserved
            expect(result).to.include("satisfies:REQ-001[]");
        });
        it("should still strip inline macros outside verbatim blocks", () => {
            const graph = new TraceabilityGraph();
            graph.addItem(createItem("REQ-001", "requirement", "Req 1", "requirements.adoc"));
            const content = `satisfies:REQ-001[]\n`;
            const result = substitutePreservingVerbatim(content, "architecture.adoc", graph);
            // Outside verbatim block, macro should be substituted (not raw)
            expect(result).to.not.include("satisfies:REQ-001[]");
            expect(result).to.include("xref");
        });
        it("should handle mixed content with macros inside and outside verbatim", () => {
            const graph = new TraceabilityGraph();
            graph.addItem(createItem("REQ-001", "requirement", "Req 1", "requirements.adoc"));
            const content = `Before block: satisfies:REQ-001[]\n\n[source,asciidoc]\n----\nExample: satisfies:REQ-001[]\n----\n\nAfter block: satisfies:REQ-001[]\n`;
            const result = substitutePreservingVerbatim(content, "architecture.adoc", graph);
            // Outside macros are substituted
            expect(result).to.include("Before block: satisfies:");
            expect(result).to.include("After block: satisfies:");
            // Inside the source block, the macro text is preserved
            expect(result).to.include("Example: satisfies:REQ-001[]");
        });
    });
});
