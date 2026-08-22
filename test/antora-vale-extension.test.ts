import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect } from "chai";
import { AntoraValeExtension, register } from "../src/antora-vale-extension.js";

// Fake `vale` executable that emits a configurable JSON finding.
const FAKE_VALE = `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args[0] === "--version") { console.log("vale 3.0.0"); process.exit(0); }
process.stdin.resume();
process.stdin.on("end", () => {
  if (process.env.FAKE_VALE_EMPTY === "1") { console.log("{}"); process.exit(0); }
  const pathIdx = args.indexOf("--path");
  const file = pathIdx >= 0 ? args[pathIdx + 1] : "stdin.adoc";
  const finding = {
    Line: Number(process.env.FAKE_VALE_LINE || 3),
    Severity: process.env.FAKE_VALE_SEVERITY || "error",
    Message: "Prose issue",
    Check: "antora-tracer.Test",
  };
  const result = {};
  result[file] = [finding];
  console.log(JSON.stringify(result));
  process.exit(0);
});
`;

const FAKE_ASCIIDOCTOR = `#!/usr/bin/env node
if (process.argv[2] === "--version") { console.log("Asciidoctor 2.0.26"); }
process.exit(0);
`;

interface LogEntry {
  level: string;
  message: string;
}

function createMockContext() {
  const logs: LogEntry[] = [];
  const handlers: Record<string, (event: any) => void> = {};
  return {
    getLogger: () => ({
      info: (m: string) => logs.push({ level: "info", message: m }),
      warn: (m: string) => logs.push({ level: "warn", message: m }),
      error: (m: string) => logs.push({ level: "error", message: m }),
    }),
    on: (event: string, handler: (e: any) => void) => {
      handlers[event] = handler;
    },
    playbook: { dir: process.cwd() },
    logs,
    fire: (event: string, payload: any) => handlers[event]?.(payload),
  };
}

function installFakeBinaries(): () => void {
  const dir = mkdtempSync(join(tmpdir(), "antora-vale-test-"));
  writeFileSync(join(dir, "vale"), FAKE_VALE);
  writeFileSync(join(dir, "asciidoctor"), FAKE_ASCIIDOCTOR);
  chmodSync(join(dir, "vale"), 0o755);
  chmodSync(join(dir, "asciidoctor"), 0o755);
  const previousPath = process.env.PATH;
  process.env.PATH = `${dir}:${previousPath}`;
  return () => {
    process.env.PATH = previousPath;
    rmSync(dir, { recursive: true, force: true });
  };
}

function emptyPath(): () => void {
  const dir = mkdtempSync(join(tmpdir(), "antora-vale-empty-"));
  const previousPath = process.env.PATH;
  process.env.PATH = dir;
  return () => {
    process.env.PATH = previousPath;
    rmSync(dir, { recursive: true, force: true });
  };
}

function createEvent(pages: string[], partials: string[]) {
  const makeFile = (path: string) => ({
    src: { path },
    contents: Buffer.from("The system shall do one thing. And another.\n"),
  });
  return {
    contentCatalog: {
      findBy: ({ family }: { family: string }) =>
        family === "page" ? pages.map(makeFile) : partials.map(makeFile),
    },
  };
}

describe("AntoraValeExtension", () => {
  afterEach(() => {
    delete process.env.FAKE_VALE_SEVERITY;
    delete process.env.FAKE_VALE_LINE;
    delete process.env.FAKE_VALE_EMPTY;
  });

  it("reports page findings with source path and line", () => {
    const cleanup = installFakeBinaries();
    try {
      process.env.FAKE_VALE_SEVERITY = "error";
      process.env.FAKE_VALE_LINE = "7";
      const ctx = createMockContext();
      new AntoraValeExtension(ctx as any);
      expect(() =>
        ctx.fire(
          "contentClassified",
          createEvent(["modules/ROOT/pages/index.adoc"], []),
        ),
      ).to.throw(/modules\/ROOT\/pages\/index\.adoc:7/);
    } finally {
      cleanup();
    }
  });

  it("reports partial findings with source path and line", () => {
    const cleanup = installFakeBinaries();
    try {
      process.env.FAKE_VALE_SEVERITY = "error";
      const ctx = createMockContext();
      new AntoraValeExtension(ctx as any);
      expect(() =>
        ctx.fire(
          "contentClassified",
          createEvent([], ["modules/ROOT/partials/shared.adoc"]),
        ),
      ).to.throw(/modules\/ROOT\/partials\/shared\.adoc:3/);
    } finally {
      cleanup();
    }
  });

  it("fails on findings at or above minLevel and logs findings below", () => {
    const cleanup = installFakeBinaries();
    try {
      // default minLevel is "warning"; a suggestion must not fail the build
      process.env.FAKE_VALE_SEVERITY = "suggestion";
      const ctx = createMockContext();
      new AntoraValeExtension(ctx as any);
      expect(() =>
        ctx.fire(
          "contentClassified",
          createEvent(["modules/ROOT/pages/index.adoc"], []),
        ),
      ).to.not.throw();
      expect(ctx.logs.some((l) => l.level === "warn")).to.be.true;

      // minLevel "suggestion" must fail on a suggestion
      process.env.FAKE_VALE_SEVERITY = "suggestion";
      const ctx2 = createMockContext();
      new AntoraValeExtension(ctx2 as any, { minLevel: "suggestion" });
      expect(() =>
        ctx2.fire(
          "contentClassified",
          createEvent(["modules/ROOT/pages/index.adoc"], []),
        ),
      ).to.throw(/level 'suggestion'/);
    } finally {
      cleanup();
    }
  });

  it("does not run when no .adoc files are present", () => {
    const cleanup = installFakeBinaries();
    try {
      const ctx = createMockContext();
      new AntoraValeExtension(ctx as any);
      expect(() =>
        ctx.fire("contentClassified", createEvent([], [])),
      ).to.not.throw();
    } finally {
      cleanup();
    }
  });

  it("fails with an actionable message when executables are missing", () => {
    const cleanup = emptyPath();
    try {
      const ctx = createMockContext();
      new AntoraValeExtension(ctx as any);
      expect(() =>
        ctx.fire(
          "contentClassified",
          createEvent(["modules/ROOT/pages/index.adoc"], []),
        ),
      ).to.throw(/required by the antora-vale-extension/);
    } finally {
      cleanup();
    }
  });

  it("does not flag a multi-sentence source line when vale reports nothing", () => {
    const cleanup = installFakeBinaries();
    try {
      process.env.FAKE_VALE_EMPTY = "1";
      const ctx = createMockContext();
      new AntoraValeExtension(ctx as any);
      expect(() =>
        ctx.fire(
          "contentClassified",
          createEvent(["modules/ROOT/pages/index.adoc"], []),
        ),
      ).to.not.throw();
    } finally {
      cleanup();
    }
  });

  it("register() constructs the extension from playbook config", () => {
    const cleanup = installFakeBinaries();
    try {
      const ctx = createMockContext();
      register(ctx as any, {
        config: { minLevel: "error", valeConfig: ".vale.ini" },
      });
      expect(() =>
        ctx.fire(
          "contentClassified",
          createEvent(["modules/ROOT/pages/index.adoc"], []),
        ),
      ).to.throw(/Prose issue/);
    } finally {
      cleanup();
    }
  });

  it("reads lowercase config keys from Antora normalization", () => {
    const cleanup = installFakeBinaries();
    try {
      process.env.FAKE_VALE_SEVERITY = "suggestion";
      const ctx = createMockContext();
      // Antora lowercases YAML keys, so the playbook's minLevel arrives as
      // minlevel. The extension must still honor it.
      new AntoraValeExtension(
        ctx as any,
        {
          minlevel: "suggestion",
          valeconfig: ".vale.ini",
        } as any,
      );
      expect(() =>
        ctx.fire(
          "contentClassified",
          createEvent(["modules/ROOT/pages/index.adoc"], []),
        ),
      ).to.throw(/level 'suggestion'/);
    } finally {
      cleanup();
    }
  });

  it("skips files matching an exclude pattern", () => {
    const cleanup = installFakeBinaries();
    try {
      const ctx = createMockContext();
      new AntoraValeExtension(ctx as any, {
        exclude: ["documentation-style-guide.adoc"],
      });
      expect(() =>
        ctx.fire(
          "contentClassified",
          createEvent(
            ["modules/ROOT/pages/reference/documentation-style-guide.adoc"],
            [],
          ),
        ),
      ).to.not.throw();
    } finally {
      cleanup();
    }
  });
});
