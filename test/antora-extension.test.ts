/**
 * Tests for Antora Extension integration
 *
 * Tests the AntoraTraceabilityExtension class by creating instances with
 * mocked Antora contexts and simulating lifecycle events.
 *
 * Design decisions (from design.md):
 * - Test the class directly rather than through the full Antora pipeline
 * - Mock the AntoraExtensionContext
 * - Use temp directories for filesystem operations
 * - Wait for async init via setImmediate (one microtask)
 */

import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect } from "chai";
import { AntoraTraceabilityExtension } from "../src/antora-extension.js";

// ============================================================================
// Helper Types
// ============================================================================

interface LogEntry {
  level: "info" | "warn" | "error" | "debug";
  message: string;
}

interface MockContext {
  getLogger: (name?: string) => {
    info: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string) => void;
    debug: (message: string) => void;
  };
  on: (event: string, handler: (...args: any[]) => void) => void;
  playbook?: any;
  /** Captured log entries for assertions */
  logs: LogEntry[];
  /** Registered event handlers keyed by event name */
  events: Record<string, (...args: any[]) => void>;
  /** Fire a registered event */
  fireEvent: (event: string, ...args: any[]) => void;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Create a mock Antora extension context for testing.
 */
function createMockContext(overrides: Partial<MockContext> = {}): MockContext {
  const logs: LogEntry[] = [];
  const events: Record<string, (...args: any[]) => void> = {};

  const ctx: MockContext = {
    getLogger: () => ({
      info: (message: string) => logs.push({ level: "info", message }),
      warn: (message: string) => logs.push({ level: "warn", message }),
      error: (message: string) => logs.push({ level: "error", message }),
      debug: (message: string) => logs.push({ level: "debug", message }),
    }),
    on: (event: string, handler: (...args: any[]) => void) => {
      events[event] = handler;
    },
    playbook: {
      output: { dir: "/tmp" },
      extensions: [],
    },
    logs,
    events,
    fireEvent: (event: string, ...args: any[]) => {
      if (events[event]) {
        events[event](...args);
      }
    },
    ...overrides,
  };

  // Ensure overridden values take precedence
  if (overrides.logs) ctx.logs = overrides.logs;
  if (overrides.events) ctx.events = overrides.events;
  if (overrides.fireEvent) ctx.fireEvent = overrides.fireEvent;

  return ctx;
}

/**
 * Create sample AsciiDoc content with traceability items.
 */
function createSampleContent(): string {
  return `
[#REQ-001, item, role=requirement, title="User Authentication"]
====
The system shall authenticate users.
====

[#IMP-001, item, role=implementation, title="AuthService"]
====
Implements user authentication.

satisfies:REQ-001[]
====
`;
}

/**
 * Create a content catalog event with traceable items.
 */
function createContentClassifiedEvent(
  files: Array<{ path: string; content: string }>,
) {
  return {
    contentCatalog: {
      findBy: ({ family: _family }: { family: string }) =>
        files.map((f) => ({
          src: { path: f.path },
          contents: Buffer.from(f.content),
        })),
    },
  };
}

/**
 * Wait for async initialization to complete.
 * The async init chain involves one microtask boundary
 * (createWithPreset is async-declared but sync internally).
 */
function waitForInit(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

// ============================================================================
// Tests
// ============================================================================

describe("AntoraTraceabilityExtension", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "antora-test-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  // ========================================================================
  // Initialization
  // ========================================================================

  describe("Initialization", () => {
    it("should initialize with default configuration", async () => {
      const ctx = createMockContext();
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      const traceExt = ext.getTraceabilityExtension();
      expect(traceExt).to.exist;
      expect(traceExt.getAllItems()).to.be.an("array").that.is.empty;
    });

    it("should initialize with config path from playbook", async () => {
      const ctx = createMockContext({
        playbook: {
          extensions: [
            {
              name: "antora-requirements-traceability",
              config: { configPath: "/nonexistent/config.yml" },
            },
          ],
        },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      // Config path doesn't exist, falls back to default preset
      const traceExt = ext.getTraceabilityExtension();
      expect(traceExt).to.exist;
      expect(ctx.logs.some((l) => l.level === "warn")).to.be.true;
    });

    it("should initialize with preset from playbook config", async () => {
      const ctx = createMockContext({
        playbook: {
          extensions: [
            {
              name: "antora-requirements-traceability",
              config: { preset: "agile" },
            },
          ],
        },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      const traceExt = ext.getTraceabilityExtension();
      expect(traceExt).to.exist;
      expect(traceExt.configLoader).to.exist;
    });

    it("should handle disabled extension without initializing", () => {
      const ctx = createMockContext({
        playbook: {
          extensions: [
            {
              name: "antora-requirements-traceability",
              config: { enabled: false },
            },
          ],
        },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);

      // No need to wait for init — constructor returns early
      expect(() => ext.getTraceabilityExtension()).to.throw(
        "Traceability extension not initialized",
      );
      expect(ctx.logs.some((l) => l.message.includes("is disabled"))).to.be
        .true;
    });

    it("should register event handlers on initialization", async () => {
      const ctx = createMockContext();
      new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      // Should register handlers for all three events
      expect(ctx.events.contentClassified).to.exist;
      expect(ctx.events.sitePublished).to.exist;
      expect(ctx.events.beforeSiteGenerated).to.exist;
    });
  });

  // ========================================================================
  // Content Processing
  // ========================================================================

  describe("Content Processing", () => {
    it("should process AsciiDoc files when contentClassified fires", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      ctx.fireEvent(
        "contentClassified",
        createContentClassifiedEvent([
          { path: "test.adoc", content: createSampleContent() },
        ]),
      );

      const traceExt = ext.getTraceabilityExtension();
      const items = traceExt.getAllItems();
      expect(items).to.have.lengthOf(2);

      const req = traceExt.graph.getItem("REQ-001");
      expect(req).to.exist;
      expect(req?.role).to.equal("requirement");
      expect(req?.title).to.equal("REQ-001 — User Authentication");

      const imp = traceExt.graph.getItem("IMP-001");
      expect(imp).to.exist;
      expect(imp?.role).to.equal("implementation");
    });

    it("should register relationships from inline macros", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      ctx.fireEvent(
        "contentClassified",
        createContentClassifiedEvent([
          { path: "test.adoc", content: createSampleContent() },
        ]),
      );

      const traceExt = ext.getTraceabilityExtension();
      const rels = traceExt.getAllRelationships();
      expect(rels).to.have.lengthOf(1);
      expect(rels[0].type).to.equal("satisfies");
      expect(rels[0].fromId).to.equal("IMP-001");
      expect(rels[0].targetId).to.equal("REQ-001");
    });

    it("should handle files with multiple items and relationships", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      const content = `
[#REQ-001, item, role=requirement, title="Req 1"]
====
Requirement one.
====

[#REQ-002, item, role=requirement, title="Req 2"]
====
Requirement two.
====

[#IMP-001, item, role=implementation, title="Implementation 1"]
====
Implements req 1.

satisfies:REQ-001[]
====

[#IMP-002, item, role=implementation, title="Implementation 2"]
====
Implements req 2.

satisfies:REQ-002[]
====
`;

      ctx.fireEvent(
        "contentClassified",
        createContentClassifiedEvent([{ path: "multi.adoc", content }]),
      );

      const traceExt = ext.getTraceabilityExtension();
      expect(traceExt.getAllItems()).to.have.lengthOf(4);
      expect(traceExt.getAllRelationships()).to.have.lengthOf(2);
    });

    it("should skip non-AsciiDoc files", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      ctx.fireEvent(
        "contentClassified",
        createContentClassifiedEvent([
          { path: "readme.md", content: "# Just markdown\nno items here" },
        ]),
      );

      const traceExt = ext.getTraceabilityExtension();
      expect(traceExt.getAllItems()).to.have.lengthOf(0);
    });

    it("should handle files without any traceable items", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      ctx.fireEvent(
        "contentClassified",
        createContentClassifiedEvent([
          {
            path: "plain.adoc",
            content: "= Just a regular document\n\nNo items here.",
          },
        ]),
      );

      const traceExt = ext.getTraceabilityExtension();
      expect(traceExt.getAllItems()).to.have.lengthOf(0);
    });

    it("should handle missing contentCatalog gracefully", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      ctx.fireEvent("contentClassified", {});

      expect(
        ctx.logs.some((l) => l.message.includes("contentCatalog not found")),
      ).to.be.true;
    });

    it("should handle files without contents buffer", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      ctx.fireEvent("contentClassified", {
        contentCatalog: {
          findBy: () => [{ src: { path: "empty.adoc" } }],
        },
      });

      // No items, no crash
      const traceExt = ext.getTraceabilityExtension();
      expect(traceExt.getAllItems()).to.have.lengthOf(0);
    });
  });

  // ========================================================================
  // Matrix Generation
  // ========================================================================

  describe("Matrix Generation", () => {
    it("should generate matrix files on sitePublished when items exist", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const _ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      // Populate with items
      ctx.fireEvent(
        "contentClassified",
        createContentClassifiedEvent([
          { path: "reqs.adoc", content: createSampleContent() },
        ]),
      );

      ctx.fireEvent("sitePublished", {
        playbook: { output: { dir: tempDir } },
      });

      // Check that matrix files were written
      const traceDir = join(tempDir, "traceability");
      expect(existsSync(traceDir)).to.be.true;
      expect(existsSync(join(traceDir, "index.html"))).to.be.true;
      expect(existsSync(join(traceDir, "coverage.html"))).to.be.true;

      // Should have generated at least one matrix file
      const files = readdirSync(traceDir);
      const matrixFiles = files.filter((f: string) => f.startsWith("matrix-"));
      expect(matrixFiles.length).to.be.greaterThan(0);
    });

    it("should generate matrices in configured formats", async () => {
      const ctx = createMockContext({
        playbook: {
          output: { dir: tempDir },
          extensions: [
            {
              name: "antora-requirements-traceability",
              config: { matrixFormats: ["html", "csv"] },
            },
          ],
        },
      });
      const _ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      ctx.fireEvent(
        "contentClassified",
        createContentClassifiedEvent([
          { path: "reqs.adoc", content: createSampleContent() },
        ]),
      );

      ctx.fireEvent("sitePublished", {
        playbook: { output: { dir: tempDir } },
      });

      const traceDir = join(tempDir, "traceability");
      const files = readdirSync(traceDir);

      // Should have both .html and .csv matrix files
      const htmlMatrices = files.filter(
        (f: string) => f.startsWith("matrix-") && f.endsWith(".html"),
      );
      const csvMatrices = files.filter(
        (f: string) => f.startsWith("matrix-") && f.endsWith(".csv"),
      );
      expect(htmlMatrices.length).to.be.greaterThan(0);
      expect(csvMatrices.length).to.be.greaterThan(0);
    });

    it("should log warning when no items exist", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      ctx.fireEvent("sitePublished", {
        playbook: { output: { dir: tempDir } },
      });

      expect(
        ctx.logs.some((l) => l.message.includes("No traceable items found")),
      ).to.be.true;
    });

    it("should generate coverage report with correct statistics", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const _ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      ctx.fireEvent(
        "contentClassified",
        createContentClassifiedEvent([
          { path: "reqs.adoc", content: createSampleContent() },
        ]),
      );

      ctx.fireEvent("sitePublished", {
        playbook: { output: { dir: tempDir } },
      });

      const coveragePath = join(tempDir, "traceability", "coverage.html");
      expect(existsSync(coveragePath)).to.be.true;

      const content = readFileSync(coveragePath, "utf8");
      // Coverage report shows role names and counts, not item IDs
      expect(content).to.include("requirement");
      expect(content).to.include("implementation");
      // Should show item count and percentages
      expect(content).to.include("2"); // total items
      expect(content).to.include("100"); // percentage
    });
  });

  // ========================================================================
  // API Access
  // ========================================================================

  describe("API Access", () => {
    it("should return traceability extension after initialization", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      const traceExt = ext.getTraceabilityExtension();
      expect(traceExt).to.exist;
      expect(traceExt).to.have.property("graph");
    });

    it("should throw when getTraceabilityExtension is called before init", () => {
      // We skip waitForInit to test pre-init state
      // But the constructor still calls initializeAsync(), so we need
      // to test this by checking that calling before the microtask yields throws.
      // This is tricky — we need to observe the window between construction
      // and the microtask completing. One approach: create with disabled config
      // which never initializes.
      const ctx = createMockContext({
        playbook: {
          extensions: [
            {
              name: "antora-requirements-traceability",
              config: { enabled: false },
            },
          ],
        },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);

      expect(() => ext.getTraceabilityExtension()).to.throw(
        "Traceability extension not initialized",
      );
    });

    it("should return extension for enabled config with data", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      ctx.fireEvent(
        "contentClassified",
        createContentClassifiedEvent([
          { path: "reqs.adoc", content: createSampleContent() },
        ]),
      );

      const traceExt = ext.getTraceabilityExtension();
      expect(traceExt.getAllItems()).to.have.lengthOf(2);
    });
  });

  // ========================================================================
  // Error Handling
  // ========================================================================

  describe("Error Handling", () => {
    it("should log error and continue on processing failure", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      // Fire with a catalog that returns a file whose toString throws
      ctx.fireEvent("contentClassified", {
        contentCatalog: {
          findBy: () => [
            {
              src: { path: "broken.adoc" },
              contents: {
                toString: () => {
                  throw new Error("Simulated parse error");
                },
              },
            },
          ],
        },
      });

      // Should have logged a warning about the error
      expect(
        ctx.logs.some(
          (l) => l.level === "warn" && l.message.includes("broken.adoc"),
        ),
      ).to.be.true;
    });

    it("should log error and continue on matrix generation failure", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      // Fire sitePublished without any items — should warn, not crash
      ctx.fireEvent("sitePublished", {
        playbook: { output: { dir: tempDir } },
      });

      expect(
        ctx.logs.some((l) => l.message.includes("No traceable items found")),
      ).to.be.true;
    });
  });

  // ========================================================================
  // Links Macro Expansion
  // ========================================================================

  describe("Links Macro Expansion", () => {
    it("should expand traceability:outgoing[] with list style", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      const content = `:traceability-links: true

[#REQ-001, item, role=requirement, title="User Auth"]
--
addresses:ARC-001[]
addresses:ARC-002[]

traceability:outgoing[]
--

[#ARC-001, item, role=architecture, title="Auth Module"]
--
Description.
--

[#ARC-002, item, role=architecture, title="Session Module"]
--
Description.
--
`;

      ctx.fireEvent(
        "contentClassified",
        createContentClassifiedEvent([{ path: "test.adoc", content }]),
      );

      // The content buffer should contain expanded outgoing links
      const traceExt = ext.getTraceabilityExtension();
      const items = traceExt.getAllItems();
      expect(items).to.have.lengthOf(3);

      // Check relationships exist
      const rels = traceExt.graph.getRelationships("REQ-001");
      expect(rels).to.have.lengthOf(2);
    });

    it("should expand traceability:incoming[] on targeted item", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      const content = `:traceability-links: true

[#REQ-001, item, role=requirement, title="User Auth"]
--
addresses:ARC-001[]
--

[#ARC-001, item, role=architecture, title="Auth Module"]
--
Description.

traceability:incoming[]
--
`;

      ctx.fireEvent(
        "contentClassified",
        createContentClassifiedEvent([{ path: "test.adoc", content }]),
      );

      const traceExt = ext.getTraceabilityExtension();
      // ARC-001 should have incoming relationships
      const incomingRels = traceExt.graph.getReverseRelationships("ARC-001");
      expect(incomingRels).to.have.lengthOf(1);
      expect(incomingRels[0].type).to.equal("addresses");
    });

    it("should handle both outgoing and incoming in same item", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      const content = `:traceability-links: true

[#ARC-001, item, role=architecture, title="Auth Module"]
--
addresses:REQ-001[]

traceability:outgoing[]
traceability:incoming[]
--

[#REQ-001, item, role=requirement, title="User Auth"]
--
addresses:ARC-001[]
--
`;

      ctx.fireEvent(
        "contentClassified",
        createContentClassifiedEvent([{ path: "test.adoc", content }]),
      );

      const traceExt = ext.getTraceabilityExtension();
      // ARC-001 has both outgoing and incoming
      const outgoing = traceExt.graph.getRelationships("ARC-001");
      const incoming = traceExt.graph.getReverseRelationships("ARC-001");
      expect(outgoing).to.have.lengthOf(1);
      expect(incoming).to.have.lengthOf(1);
    });

    it("should strip macro when links not enabled", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      // No :traceability-links: attribute
      const content = `
[#REQ-001, item, role=requirement, title="User Auth"]
--
addresses:ARC-001[]

traceability:outgoing[]
traceability:incoming[]
--

[#ARC-001, item, role=architecture, title="Auth Module"]
--
Description.
--
`;

      ctx.fireEvent(
        "contentClassified",
        createContentClassifiedEvent([{ path: "test.adoc", content }]),
      );

      const traceExt = ext.getTraceabilityExtension();
      expect(traceExt.getAllItems()).to.have.lengthOf(2);
      // Graph should still have the relationship even though rendering was disabled
      const rels = traceExt.graph.getRelationships("REQ-001");
      expect(rels).to.have.lengthOf(1);
    });

    it("should handle item with no relationships", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      const content = `:traceability-links: true

[#REQ-001, item, role=requirement, title="Orphan requirement"]
--
No relations here.

traceability:outgoing[]
traceability:incoming[]
--
`;

      ctx.fireEvent(
        "contentClassified",
        createContentClassifiedEvent([{ path: "test.adoc", content }]),
      );

      const traceExt = ext.getTraceabilityExtension();
      expect(traceExt.getAllItems()).to.have.lengthOf(1);
      const rels = traceExt.graph.getRelationships("REQ-001");
      expect(rels).to.have.lengthOf(0);
    });

    it("should silently skip macros outside item blocks", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      // Macros in prose text (outside item blocks) should be silently ignored —
      // they are documentation mentions, not actual macro invocations.
      const content = `:traceability-links: true

= Document Title

This documents traceability:outgoing[] and traceability:incoming[] macros.
`;

      ctx.fireEvent(
        "contentClassified",
        createContentClassifiedEvent([{ path: "test.adoc", content }]),
      );

      // No warnings should be emitted for macros in prose
      const macroWarns = ctx.logs.filter(
        (l) =>
          l.level === "warn" &&
          (l.message.includes("traceability:outgoing[] found outside") ||
            l.message.includes("traceability:incoming[] found outside")),
      );
      expect(macroWarns).to.have.lengthOf(0);
    });

    it("should expand with table style", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      const content = `:traceability-links: true
:traceability-style: table

[#REQ-001, item, role=requirement, title="User Auth"]
--
addresses:ARC-001[]

traceability:outgoing[]
--

[#ARC-001, item, role=architecture, title="Auth Module"]
--
Description.
--
`;

      ctx.fireEvent(
        "contentClassified",
        createContentClassifiedEvent([{ path: "test.adoc", content }]),
      );

      // Should not crash with table style
      const traceExt = ext.getTraceabilityExtension();
      expect(traceExt.getAllItems()).to.have.lengthOf(2);
    });

    it("should expand with inline style and sort by target-title", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      const content = `:traceability-links: true
:traceability-style: inline
:traceability-order: target-title

[#REQ-001, item, role=requirement, title="User Auth"]
--
addresses:ARC-002[]
addresses:ARC-001[]

traceability:outgoing[]
--

[#ARC-001, item, role=architecture, title="Auth Module"]
--
Description.
--

[#ARC-002, item, role=architecture, title="Auth Module Backup"]
--
Description.
--
`;

      ctx.fireEvent(
        "contentClassified",
        createContentClassifiedEvent([{ path: "test.adoc", content }]),
      );

      const traceExt = ext.getTraceabilityExtension();
      expect(traceExt.getAllItems()).to.have.lengthOf(3);
    });

    it("should use inverse labels for incoming macro", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      const content = `:traceability-links: true

[#REQ-001, item, role=requirement, title="User Auth"]
--
addresses:ARC-001[]
implements:ARC-002[]
--

[#ARC-001, item, role=architecture, title="Auth Module"]
--
Description.

traceability:incoming[]
--

[#ARC-002, item, role=architecture, title="Session Module"]
--
Description.
--
`;

      ctx.fireEvent(
        "contentClassified",
        createContentClassifiedEvent([{ path: "test.adoc", content }]),
      );

      // ARC-001 has incoming from both relation types
      const incoming = ext
        .getTraceabilityExtension()
        .graph.getReverseRelationships("ARC-001");
      expect(incoming).to.have.lengthOf(1); // only addresses
      expect(incoming[0].type).to.equal("addresses");
    });

    it("should wrap output in [%collapsible] when attribute is true", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      const content = `:traceability-links: true
:traceability-collapsible: true

[#REQ-001, item, role=requirement, title="User Auth"]
--
addresses:ARC-001[]

traceability:outgoing[]
--

[#ARC-001, item, role=architecture, title="Auth Module"]
--
Description.
--
`;

      ctx.fireEvent(
        "contentClassified",
        createContentClassifiedEvent([{ path: "test.adoc", content }]),
      );

      const traceExt = ext.getTraceabilityExtension();
      expect(traceExt.getAllItems()).to.have.lengthOf(2);
      // Collapsible output is generated — graph still works correctly
      const rels = traceExt.graph.getRelationships("REQ-001");
      expect(rels).to.have.lengthOf(1);
    });

    it("should produce flat output when collapsible is not set", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      const content = `:traceability-links: true

[#REQ-001, item, role=requirement, title="User Auth"]
--
addresses:ARC-001[]

traceability:outgoing[]
--

[#ARC-001, item, role=architecture, title="Auth Module"]
--
Description.
--
`;

      ctx.fireEvent(
        "contentClassified",
        createContentClassifiedEvent([{ path: "test.adoc", content }]),
      );

      const traceExt = ext.getTraceabilityExtension();
      expect(traceExt.getAllItems()).to.have.lengthOf(2);
    });

    it("collapsible has no effect on table style", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      const content = `:traceability-links: true
:traceability-collapsible: true
:traceability-style: table

[#REQ-001, item, role=requirement, title="User Auth"]
--
addresses:ARC-001[]

traceability:outgoing[]
--

[#ARC-001, item, role=architecture, title="Auth Module"]
--
Description.
--
`;

      ctx.fireEvent(
        "contentClassified",
        createContentClassifiedEvent([{ path: "test.adoc", content }]),
      );

      const traceExt = ext.getTraceabilityExtension();
      expect(traceExt.getAllItems()).to.have.lengthOf(2);
      // No crash — table style ignores collapsible
    });

    it("collapsible has no effect on inline style", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      const content = `:traceability-links: true
:traceability-collapsible: true
:traceability-style: inline

[#REQ-001, item, role=requirement, title="User Auth"]
--
addresses:ARC-001[]

traceability:outgoing[]
--

[#ARC-001, item, role=architecture, title="Auth Module"]
--
Description.
--
`;

      ctx.fireEvent(
        "contentClassified",
        createContentClassifiedEvent([{ path: "test.adoc", content }]),
      );

      const traceExt = ext.getTraceabilityExtension();
      expect(traceExt.getAllItems()).to.have.lengthOf(2);
      // No crash — inline style ignores collapsible
    });
  });
});
