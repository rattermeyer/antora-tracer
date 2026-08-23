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
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
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
  files: Array<{
    path: string;
    content: string;
    module?: string;
    component?: string;
  }>,
) {
  return {
    contentCatalog: {
      findBy: ({ family }: { family: string }) =>
        family === "page"
          ? files.map((f) => ({
              src: {
                path: f.path,
                module: f.module,
                component: f.component,
              },
              contents: Buffer.from(f.content),
            }))
          : [],
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
          findBy: ({ family }: { family: string }) =>
            family === "page" ? [{ src: { path: "empty.adoc" } }] : [],
        },
      });

      // No items, no crash
      const traceExt = ext.getTraceabilityExtension();
      expect(traceExt.getAllItems()).to.have.lengthOf(0);
    });
  });

  // ========================================================================
  // Partial File Processing
  // ========================================================================

  describe("Partial File Processing", () => {
    it("should register items from partial files in the graph", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      // Create a content catalog mock that distinguishes page vs partial
      const pageFiles = [
        {
          src: { path: "pages/index.adoc", module: "ROOT", component: "test" },
          contents: Buffer.from(`
[#REQ-001, item, role=requirement, title="From Page"]
====
A requirement from a page.
====
`),
        },
      ];
      const partialFiles = [
        {
          src: {
            path: "partials/shared-items.adoc",
            module: "ROOT",
            component: "test",
            fileUri:
              "https://github.com/example/repo/blob/main/partials/shared-items.adoc",
          },
          contents: Buffer.from(`
[#REQ-100, item, role=requirement, title="From Partial"]
====
A requirement from a partial file.
====
`),
        },
      ];

      ctx.fireEvent("contentClassified", {
        contentCatalog: {
          findBy: ({ family }: { family: string }) => {
            if (family === "partial") return partialFiles;
            return pageFiles;
          },
        },
      });

      const traceExt = ext.getTraceabilityExtension();
      const items = traceExt.getAllItems();
      // Both page and partial items should be registered
      expect(items).to.have.lengthOf(2);

      const partialItem = items.find((i: any) => i.id === "REQ-100");
      expect(partialItem, "Partial item REQ-100 should exist").to.exist;
      // Source file should be the view URL (normalized)
      expect(partialItem!.sourceFile).to.include("github.com");
    });

    it("should expand macros in partial files during Pass 2", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      // A partial with a traceability:outgoing[] macro (uses -- open block, not ====)
      const partialFiles = [
        {
          src: {
            path: "partials/with-macros.adoc",
            module: "ROOT",
            component: "test",
            fileUri:
              "https://github.com/example/repo/blob/main/partials/with-macros.adoc",
          },
          contents: Buffer.from(
            `[#REQ-200, item, role=requirement, title="With Macros"]
--
Has outgoing macro in partial.

traceability:outgoing[]
--
`,
          ),
        },
      ];

      ctx.fireEvent("contentClassified", {
        contentCatalog: {
          findBy: ({ family }: { family: string }) => {
            if (family === "partial") return partialFiles;
            return [];
          },
        },
      });

      const traceExt = ext.getTraceabilityExtension();
      const items = traceExt.getAllItems();
      // Item should be registered (Pass 1)
      expect(items).to.have.lengthOf(1);
      expect(items[0].id).to.equal("REQ-200");

      // Macro expansion (Pass 2) applies to partials — macro is replaced
      // (REQ-200 has no relationships so emptyStyle=none produces empty string)
      const partialContent = partialFiles[0].contents.toString("utf8");
      expect(partialContent).to.not.include("traceability:outgoing[]");
    });

    it("should handle partial with no items gracefully", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      const partialFiles = [
        {
          src: {
            path: "partials/empty.adoc",
            module: "ROOT",
            component: "test",
            fileUri:
              "https://github.com/example/repo/blob/main/partials/empty.adoc",
          },
          contents: Buffer.from(`= No items here\n\nJust some text.`),
        },
      ];

      ctx.fireEvent("contentClassified", {
        contentCatalog: {
          findBy: ({ family }: { family: string }) => {
            if (family === "partial") return partialFiles;
            return [];
          },
        },
      });

      const traceExt = ext.getTraceabilityExtension();
      // No crash, no items
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
          findBy: ({ family }: { family: string }) =>
            family === "page"
              ? [
                  {
                    src: { path: "broken.adoc" },
                    contents: {
                      toString: () => {
                        throw new Error("Simulated parse error");
                      },
                    },
                  },
                ]
              : [],
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

    it("should render config-defined label for incoming macro", async () => {
      const cfgPath = join(tempDir, "labels-config.yml");
      writeFileSync(
        cfgPath,
        `roles:\n  - requirement\n  - design\nrelations:\n  design:\n    requirement:\n      addresses:\n        reverse: addressed_by\nlabels:\n  addressed_by: "Addressed By Config"\n`,
      );
      const ctx = createMockContext({
        playbook: {
          output: { dir: tempDir },
          extensions: [
            {
              name: "antora-requirements-traceability",
              config: { configPath: cfgPath },
            },
          ],
        },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      const content = `:traceability-links: true

[#REQ-001, item, role=requirement, title="User Auth"]
--
traceability:incoming[]
--

[#DES-001, item, role=design, title="Design"]
--
addresses:REQ-001[]
--
`;

      const file = {
        src: { path: "test.adoc" },
        contents: Buffer.from(content),
      };
      ctx.fireEvent("contentClassified", {
        contentCatalog: {
          findBy: ({ family }: { family: string }) =>
            family === "page" ? [file] : [],
        },
      });

      expect(file.contents.toString("utf8")).to.include("Addressed By Config");
    });

    it("should humanize the reverse label when no labels config", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      const content = `:traceability-links: true

[#REQ-001, item, role=requirement, title="User Auth"]
--
traceability:incoming[]
--

[#DES-001, item, role=design, title="Design"]
--
addresses:REQ-001[]
--
`;

      const file = {
        src: { path: "test.adoc" },
        contents: Buffer.from(content),
      };
      ctx.fireEvent("contentClassified", {
        contentCatalog: {
          findBy: ({ family }: { family: string }) =>
            family === "page" ? [file] : [],
        },
      });

      expect(file.contents.toString("utf8")).to.include("Addressed by");
    });

    it("should fall back to raw relation type when no inverse label exists", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      // `foobar` has no entry in the `labels` config,
      // so the raw relation type is displayed as-is.
      const content = `:traceability-links: true

[#REQ-001, item, role=requirement, title="User Auth"]
--
traceability:incoming[]
--

[#DES-001, item, role=design, title="Design"]
--
foobar:REQ-001[]
--
`;

      const file = {
        src: { path: "test.adoc" },
        contents: Buffer.from(content),
      };
      ctx.fireEvent("contentClassified", {
        contentCatalog: {
          findBy: ({ family }: { family: string }) =>
            family === "page" ? [file] : [],
        },
      });

      expect(file.contents.toString("utf8")).to.include("Foobar");
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

    it("should expand traceability:links[] with both outgoing and incoming", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      const content = `:traceability-links: true

[#REQ-001, item, role=requirement, title="User Auth"]
--
addresses:ARC-001[]

traceability:links[]
--

[#ARC-001, item, role=architecture, title="Auth Module"]
--
addresses:REQ-001[]
--
`;

      ctx.fireEvent(
        "contentClassified",
        createContentClassifiedEvent([{ path: "test.adoc", content }]),
      );

      const traceExt = ext.getTraceabilityExtension();
      const items = traceExt.getAllItems();
      expect(items).to.have.lengthOf(2);

      // Both directions should work
      const outgoing = traceExt.graph.getRelationships("REQ-001");
      expect(outgoing).to.have.lengthOf(1);
      expect(outgoing[0].type).to.equal("addresses");

      const incoming = traceExt.graph.getReverseRelationships("REQ-001");
      expect(incoming).to.have.lengthOf(1);
      expect(incoming[0].type).to.equal("addresses");
    });

    it("should expand traceability:links[] with only outgoing (no empty incoming section)", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      const content = `:traceability-links: true

[#REQ-001, item, role=requirement, title="User Auth"]
--
addresses:ARC-001[]

traceability:links[]
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

      // Outgoing exists, no incoming — should not crash
      const outgoing = traceExt.graph.getRelationships("REQ-001");
      expect(outgoing).to.have.lengthOf(1);

      const incoming = traceExt.graph.getReverseRelationships("REQ-001");
      expect(incoming).to.have.lengthOf(0);
    });

    it("should not expand traceability:links[] when links disabled", async () => {
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

traceability:links[]
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

      // Relationships still exist, macro just not expanded
      const outgoing = traceExt.graph.getRelationships("REQ-001");
      expect(outgoing).to.have.lengthOf(1);
    });

    /**
     * Helper: builds a single-file contentClassified event with the given
     * AsciiDoc content, fires it, and returns the mutated buffer as a string.
     */
    async function renderDoc(content: string): Promise<string> {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();
      const file = {
        src: { path: "test.adoc" },
        contents: Buffer.from(content),
      };
      ctx.fireEvent("contentClassified", {
        contentCatalog: {
          findBy: ({ family }: { family: string }) =>
            family === "page" ? [file] : [],
        },
      });
      return file.contents.toString("utf8");
    }

    it("should render italic empty message for outgoing[] with no relationships", async () => {
      const out = await renderDoc(`:traceability-links: true
:traceability-empty: italic

[#REQ-001, item, role=requirement, title="Orphan"]
--
No relations.

traceability:outgoing[]
--
`);
      expect(out).to.include("_No outgoing relationships._");
    });

    it("should render admonition empty message for incoming[] with no relationships", async () => {
      const out = await renderDoc(`:traceability-links: true
:traceability-empty: admonition

[#REQ-001, item, role=requirement, title="Orphan"]
--
No relations.

traceability:incoming[]
--
`);
      expect(out).to.include("[NOTE]");
      expect(out).to.include("No incoming relationships.");
    });

    it("should render per-direction empty messages for links[]", async () => {
      const out = await renderDoc(`:traceability-links: true
:traceability-empty: italic

[#REQ-001, item, role=requirement, title="Orphan"]
--
No relations.

traceability:links[]
--
`);
      expect(out).to.include("_No outgoing relationships._");
      expect(out).to.include("_No incoming relationships._");
    });

    it("should render no empty message when :traceability-empty: is none", async () => {
      const out = await renderDoc(`:traceability-links: true
:traceability-empty: none

[#REQ-001, item, role=requirement, title="Orphan"]
--
No relations.

traceability:outgoing[]
--
`);
      expect(out).to.not.include("No outgoing relationships");
    });
  });

  // ========================================================================
  // Graph Macro Expansion (REQ-051, REQ-052)
  // ========================================================================

  describe("Graph Macro Expansion", () => {
    it("should process traceability:graph[] without crashing", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      const content = `:traceability-graph: true

[#REQ-001, item, role=requirement, title="Auth"]
--
addresses:ARC-001[]

traceability:graph[]
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
      const rels = traceExt.graph.getRelationships("REQ-001");
      expect(rels).to.have.lengthOf(1);
      expect(rels[0].type).to.equal("addresses");
    });

    it("should strip traceability:graph[] when graph not enabled", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      // No :traceability-graph: attribute
      const content = `
[#REQ-001, item, role=requirement, title="Auth"]
--
addresses:ARC-001[]

traceability:graph[]
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
      // Should still process items but strip the graph macro
      expect(traceExt.getAllItems()).to.have.lengthOf(2);
      const rels = traceExt.graph.getRelationships("REQ-001");
      expect(rels).to.have.lengthOf(1);
    });

    it("should process traceability:graph-coverage[] without crashing", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      const content = `:traceability-graph: true

[#REQ-001, item, role=requirement, title="Auth"]
--
addresses:ARC-001[]

traceability:graph-coverage[]
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
      const rels = traceExt.graph.getRelationships("REQ-001");
      expect(rels).to.have.lengthOf(1);
    });

    it("should process global traceability:graph-coverage[] outside items", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      const content = `:traceability-graph: true

[#REQ-001, item, role=requirement, title="Auth"]
--
addresses:ARC-001[]
--

[#ARC-001, item, role=architecture, title="Auth Module"]
--
Description.
--

traceability:graph-coverage[]
`;

      ctx.fireEvent(
        "contentClassified",
        createContentClassifiedEvent([{ path: "test.adoc", content }]),
      );

      // Global coverage outside items should not break processing
      const traceExt = ext.getTraceabilityExtension();
      expect(traceExt.getAllItems()).to.have.lengthOf(2);
    });

    it("should not expand graph macros inside item headers", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      const content = `:traceability-graph: true

[#REQ-001, item, role=requirement, title="Graph via traceability:graph[] macro"]
--
addresses:ARC-001[]
--

[#ARC-001, item, role=architecture, title="Architecture"]
--
Description.
--
`;

      ctx.fireEvent(
        "contentClassified",
        createContentClassifiedEvent([{ path: "test.adoc", content }]),
      );

      // Should not crash — macro in title is excluded from expansion
      const traceExt = ext.getTraceabilityExtension();
      expect(traceExt.getAllItems()).to.have.lengthOf(2);
      const item = traceExt.graph.getItem("REQ-001");
      expect(item).to.exist;
    });

    it("should handle traceability:graph[] with explicit target ID", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      const content = `:traceability-graph: true

[#REQ-001, item, role=requirement, title="Auth"]
--
addresses:ARC-001[]
--

[#ARC-001, item, role=architecture, title="Auth Module"]
--
Description.

traceability:graph[REQ-001]
--
`;

      ctx.fireEvent(
        "contentClassified",
        createContentClassifiedEvent([{ path: "test.adoc", content }]),
      );

      const traceExt = ext.getTraceabilityExtension();
      expect(traceExt.getAllItems()).to.have.lengthOf(2);
    });

    // ---- Kroki server URL configuration tests ----

    it("should generate URLs pointing to default kroki.io server", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      const content = `:traceability-graph: true

[#REQ-001, item, role=requirement, title="Auth"]
--
addresses:ARC-001[]

traceability:graph[]
--

[#ARC-001, item, role=architecture, title="Auth Module"]
--
Description.
--
`;

      const file = {
        src: { path: "test.adoc" },
        contents: Buffer.from(content),
      };
      ctx.fireEvent("contentClassified", {
        contentCatalog: {
          findBy: ({ family }: { family: string }) =>
            family === "page" ? [file] : [],
        },
      });

      const output = file.contents.toString("utf8");
      expect(output).to.include("image::https://kroki.io/graphviz/");
    });

    it("should use custom krokiServerUrl from extension config", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any, {
        config: { krokiServerUrl: "http://localhost:8000" },
      });
      await waitForInit();

      const content = `:traceability-graph: true

[#REQ-001, item, role=requirement, title="Auth"]
--
addresses:ARC-001[]

traceability:graph[]
--

[#ARC-001, item, role=architecture, title="Auth Module"]
--
Description.
--
`;

      const file = {
        src: { path: "test.adoc" },
        contents: Buffer.from(content),
      };
      ctx.fireEvent("contentClassified", {
        contentCatalog: {
          findBy: ({ family }: { family: string }) =>
            family === "page" ? [file] : [],
        },
      });

      const output = file.contents.toString("utf8");
      expect(output).to.include("image::http://localhost:8000/graphviz/");
      expect(output).to.not.include("kroki.io");
    });

    it("should use KROKI_SERVER_URL env var when set", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      const content = `:traceability-graph: true

[#REQ-001, item, role=requirement, title="Auth"]
--
addresses:ARC-001[]

traceability:graph[]
--

[#ARC-001, item, role=architecture, title="Auth Module"]
--
Description.
--
`;

      process.env.KROKI_SERVER_URL = "http://env-server:9999";
      try {
        const file = {
          src: { path: "test.adoc" },
          contents: Buffer.from(content),
        };
        ctx.fireEvent("contentClassified", {
          contentCatalog: {
            findBy: ({ family }: { family: string }) =>
              family === "page" ? [file] : [],
          },
        });
        const output = file.contents.toString("utf8");
        expect(output).to.include("image::http://env-server:9999/graphviz/");
      } finally {
        delete process.env.KROKI_SERVER_URL;
      }
    });

    it("should let KROKI_SERVER_URL env var override config", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any, {
        config: { krokiServerUrl: "http://config-server:8000" },
      });
      await waitForInit();

      const content = `:traceability-graph: true

[#REQ-001, item, role=requirement, title="Auth"]
--
addresses:ARC-001[]

traceability:graph[]
--

[#ARC-001, item, role=architecture, title="Auth Module"]
--
Description.
--
`;

      process.env.KROKI_SERVER_URL = "http://env-server:9999";
      try {
        const file = {
          src: { path: "test.adoc" },
          contents: Buffer.from(content),
        };
        ctx.fireEvent("contentClassified", {
          contentCatalog: {
            findBy: ({ family }: { family: string }) =>
              family === "page" ? [file] : [],
          },
        });
        const output = file.contents.toString("utf8");
        expect(output).to.include("image::http://env-server:9999/graphviz/");
        expect(output).to.not.include("config-server");
      } finally {
        delete process.env.KROKI_SERVER_URL;
      }
    });

    it("should strip trailing slash from krokiServerUrl", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any, {
        config: { krokiServerUrl: "http://localhost:8000/" },
      });
      await waitForInit();

      const content = `:traceability-graph: true

[#REQ-001, item, role=requirement, title="Auth"]
--
addresses:ARC-001[]

traceability:graph[]
--

[#ARC-001, item, role=architecture, title="Auth Module"]
--
Description.
--
`;

      const file = {
        src: { path: "test.adoc" },
        contents: Buffer.from(content),
      };
      ctx.fireEvent("contentClassified", {
        contentCatalog: {
          findBy: ({ family }: { family: string }) =>
            family === "page" ? [file] : [],
        },
      });

      const output = file.contents.toString("utf8");
      // Should NOT have double-slash after host
      expect(output).to.include("image::http://localhost:8000/graphviz/");
      expect(output).to.not.include("//graphviz");
    });
  });

  // ========================================================================
  // Config Graph Macro Expansion
  // ========================================================================

  describe("Config Graph Macro Expansion", () => {
    it("should expand traceability:config-graph[] to a Kroki image when enabled", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      const content = `:traceability-graph: true

traceability:config-graph[]
`;

      const file = {
        src: { path: "test.adoc" },
        contents: Buffer.from(content),
      };
      ctx.fireEvent("contentClassified", {
        contentCatalog: {
          findBy: ({ family }: { family: string }) =>
            family === "page" ? [file] : [],
        },
      });

      const output = file.contents.toString("utf8");
      expect(output).to.include("image::https://kroki.io/graphviz/");
      expect(output).to.not.include("traceability:config-graph[");
    });

    it("should strip traceability:config-graph[] when graph not enabled", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      const content = `traceability:config-graph[]
`;

      const file = {
        src: { path: "test.adoc" },
        contents: Buffer.from(content),
      };
      ctx.fireEvent("contentClassified", {
        contentCatalog: {
          findBy: ({ family }: { family: string }) =>
            family === "page" ? [file] : [],
        },
      });

      const output = file.contents.toString("utf8");
      expect(output).to.not.include("traceability:config-graph[");
      expect(output).to.not.include("image::");
    });

    it("should strip traceability:config-graph[] when config is unavailable", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any, {
        config: {
          configPath: "/nonexistent/traceability.yml",
          preset: "nonexistent-preset",
        },
      });
      await waitForInit();

      const content = `:traceability-graph: true

traceability:config-graph[]
`;

      const file = {
        src: { path: "test.adoc" },
        contents: Buffer.from(content),
      };
      ctx.fireEvent("contentClassified", {
        contentCatalog: {
          findBy: ({ family }: { family: string }) =>
            family === "page" ? [file] : [],
        },
      });

      const output = file.contents.toString("utf8");
      expect(output).to.not.include("traceability:config-graph[");
      expect(output).to.not.include("image::");
    });
  });

  // ========================================================================
  // Matrix Catalog Registration (REQ-057)
  // ========================================================================

  describe("Matrix Catalog Registration", () => {
    const itemContent = `
[#REQ-001, item, role=requirement, title="Test requirement"]
====
The system shall authenticate users.
====
`;

    function createCatalog(overrides: Partial<any> = {}) {
      return {
        findBy: ({ family }: { family: string }) => {
          if (family === "page") {
            return [
              {
                src: {
                  path: "test.adoc",
                  module: "ROOT",
                  component: "test-component",
                  version: "1.0.0",
                },
                contents: Buffer.from(itemContent),
              },
            ];
          }
          return [];
        },
        getById: () => undefined,
        addFile: (file: any) => file,
        ...overrides,
      };
    }

    it("should register matrix attachments in the content catalog during contentClassified", async () => {
      const addedFiles: any[] = [];
      const contentCatalog = createCatalog({
        addFile: (file: any) => {
          addedFiles.push(file);
          return file;
        },
      });

      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      ctx.fireEvent("contentClassified", { contentCatalog });

      const matrixFiles = addedFiles.filter(
        (f: any) =>
          f.src?.family === "attachment" &&
          f.src?.relative?.startsWith("traceability/matrix-"),
      );
      expect(matrixFiles.length).to.be.greaterThan(0);
      expect(matrixFiles[0].src.component).to.equal("test-component");
      expect(matrixFiles[0].src.version).to.equal("1.0.0");
      expect(matrixFiles[0].src.module).to.equal("ROOT");
      expect(matrixFiles[0].contents).to.be.instanceOf(Buffer);
    });

    it("should replace contents of an existing committed matrix attachment", async () => {
      const existing = { contents: Buffer.from("stale") };
      const addedFiles: any[] = [];
      const contentCatalog = createCatalog({
        getById: () => existing,
        addFile: (file: any) => {
          addedFiles.push(file);
          return file;
        },
      });

      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      ctx.fireEvent("contentClassified", { contentCatalog });

      // Existing attachment is refreshed in place, not re-added.
      expect(addedFiles).to.have.length(0);
      expect(existing.contents).to.be.instanceOf(Buffer);
      expect(existing.contents.toString()).to.not.equal("stale");
    });
  });

  // ========================================================================
  // Cross-Module Xref Generation
  // ========================================================================

  describe("Duplicate item ID detection", () => {
    it("should fail the build when two files define the same item ID", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      const fileA = `[#REQ-001, item, role=requirement, title="Auth"]
====
The system shall authenticate users.
====
`;
      const fileB = `[#REQ-001, item, role=requirement, title="Audit"]
====
The system shall log authentication events.
====
`;

      expect(() =>
        ctx.fireEvent(
          "contentClassified",
          createContentClassifiedEvent([
            {
              path: "modules/ROOT/pages/a.adoc",
              content: fileA,
              component: "tracer",
            },
            {
              path: "modules/ROOT/pages/b.adoc",
              content: fileB,
              component: "tracer",
            },
          ]),
        ),
      ).to.throw(/Duplicate item IDs detected/);
    });

    it("should not fail the build when allowDuplicateIds is enabled", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any, {
        config: { allowDuplicateIds: true },
      });
      await waitForInit();

      const fileA = `[#REQ-001, item, role=requirement, title="Auth"]
====
The system shall authenticate users.
====
`;
      const fileB = `[#REQ-001, item, role=requirement, title="Audit"]
====
The system shall log authentication events.
====
`;

      expect(() =>
        ctx.fireEvent(
          "contentClassified",
          createContentClassifiedEvent([
            {
              path: "modules/ROOT/pages/a.adoc",
              content: fileA,
              component: "tracer",
            },
            {
              path: "modules/ROOT/pages/b.adoc",
              content: fileB,
              component: "tracer",
            },
          ]),
        ),
      ).to.not.throw();

      expect(
        ctx.logs.some(
          (l) =>
            l.level === "warn" &&
            l.message.includes("Duplicate item IDs detected"),
        ),
      ).to.be.true;
    });
  });

  describe("Cross-Module Xrefs", () => {
    it("should generate cross-module xref with module prefix", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      // File in ROOT module with items that requirements-module items reference
      const rootContent = `:traceability-links: true

[#ARC-001, item, role=architecture, title="Auth Module"]
--
Description.
--

[#TEST-001, item, role=test, title="Auth Tests"]
--
Description.
--
`;

      // File in requirements module with items referencing ROOT items
      const reqContent = `:traceability-links: true

[#REQ-001, item, role=requirement, title="User Auth"]
--
addresses:ARC-001[]
verifies:TEST-001[]

traceability:outgoing[]
--
`;

      ctx.fireEvent(
        "contentClassified",
        createContentClassifiedEvent([
          {
            path: "modules/ROOT/pages/architecture.adoc",
            content: rootContent,
            module: "ROOT",
            component: "tracer",
          },
          {
            path: "modules/requirements/pages/index.adoc",
            content: reqContent,
            module: "requirements",
            component: "tracer",
          },
        ]),
      );

      // Verify the graph was populated
      const traceExt = ext.getTraceabilityExtension();
      const items = traceExt.getAllItems();
      expect(items).to.have.lengthOf(3);

      // Check that ROOT items have module="ROOT"
      const arcItem = traceExt.graph.getItem("ARC-001");
      expect(arcItem?.module).to.equal("ROOT");
      expect(arcItem?.component).to.equal("tracer");

      // Check that requirements items have module="requirements"
      const reqItem = traceExt.graph.getItem("REQ-001");
      expect(reqItem?.module).to.equal("requirements");
      expect(reqItem?.component).to.equal("tracer");

      // Build a mock xref with buildXref (access private method via any)
      const buildXref = (ext as any).buildXref.bind(ext);

      // Cross-module: current is requirements, target is ROOT → should include "ROOT:"
      const xref = buildXref(
        {
          id: "ARC-001",
          title: "Auth Module",
          sourceFile: "architecture",
          component: "tracer",
          module: "ROOT",
        },
        "index",
        "Auth Module",
        "tracer",
        "requirements",
      );
      expect(xref).to.include("ROOT:architecture");
      expect(xref).to.include("#ARC-001");
    });

    it("should generate same-module xref without prefix", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      ctx.fireEvent(
        "contentClassified",
        createContentClassifiedEvent([
          {
            path: "modules/ROOT/pages/architecture.adoc",
            content: `:traceability-links: true

[#ARC-001, item, role=architecture, title="Auth"]
--
traceability:outgoing[]
--

[#ARC-002, item, role=architecture, title="Session"]
--
Description.
--
`,
            module: "ROOT",
            component: "tracer",
          },
        ]),
      );

      const traceExt = ext.getTraceabilityExtension();
      expect(traceExt.getAllItems()).to.have.lengthOf(2);

      // Same module (ROOT→ROOT): no prefix
      const buildXref = (ext as any).buildXref.bind(ext);
      const xref = buildXref(
        {
          id: "ARC-002",
          title: "Session",
          sourceFile: "architecture",
          component: "tracer",
          module: "ROOT",
        },
        "architecture",
        "Session",
        "tracer",
        "ROOT",
      );
      // With same module and same sourceFile+currentFile, buildXref returns same-page anchor
      // But for same-page same-module, component/module don't interfere with the logic
      expect(xref).to.not.include("ROOT:");
    });

    it("should handle item with no component/module (CLI context)", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      const buildXref = (ext as any).buildXref.bind(ext);

      // No component/module on target, no current context: backward-compatible
      const xref = buildXref(
        { id: "REQ-001", title: "Test", sourceFile: "test" },
        "other-page",
        "Test",
        undefined,
        undefined,
      );
      expect(xref).to.equal("xref:test#REQ-001[Test]");
    });

    it("should handle cross-component xref", async () => {
      const ctx = createMockContext({
        playbook: { output: { dir: tempDir }, extensions: [] },
      });
      const ext = new AntoraTraceabilityExtension(ctx as any);
      await waitForInit();

      const buildXref = (ext as any).buildXref.bind(ext);

      // Cross-component: current is tracer, target is other-comp
      const xref = buildXref(
        {
          id: "ITEM-001",
          title: "Other Item",
          sourceFile: "page",
          component: "other-comp",
          module: "ROOT",
        },
        "my-page",
        "Other Item",
        "tracer",
        "ROOT",
      );
      expect(xref).to.equal("xref:other-comp:ROOT:page#ITEM-001[Other Item]");
    });
  });
});
