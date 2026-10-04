import { spawnSync } from "node:child_process";
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
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { expect } from "chai";
import {
  harnessDestination,
  installSkills,
  parseHarnessNames,
  parseHarnessSelection,
  selectHarnesses,
} from "../src/SkillsInstaller.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(__dirname, "..", "src", "cli.js");
const PROJECT_ROOT = path.join(__dirname, "..", "..");

function runSkills(args: string[], home: string, interactive = false) {
  const input = interactive ? "2, 3\n" : undefined;
  const result = spawnSync("node", [CLI, "skills", "install", ...args], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    input,
    env: { ...process.env, HOME: home },
  });
  return {
    status: result.status ?? -1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

describe("agent skill installation", () => {
  let root: string;
  let source: string;
  let home: string;

  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), "antora-tracer-skills-"));
    source = path.join(root, "source");
    home = path.join(root, "home");
    for (const [name, body] of [
      ["skill-one", "one"],
      ["skill-two", "two"],
    ]) {
      const dir = path.join(source, name);
      mkdirSync(dir, { recursive: true });
      writeFileSync(path.join(dir, "SKILL.md"), body);
    }
  });

  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it("accepts only known harness names and de-duplicates selections", () => {
    expect(parseHarnessNames(["claude", "pi", "claude"])).to.deep.equal([
      "claude",
      "pi",
    ]);
    expect(() => parseHarnessNames(["claude", "unknown"])).to.throw(
      /Supported harnesses: pi, claude, codex/,
    );
  });

  it("parses numbered and all multi-select input; blank cancels", () => {
    const harnesses = ["pi", "claude", "codex"] as const;
    expect(parseHarnessSelection("1, 3", harnesses)).to.deep.equal([
      "pi",
      "codex",
    ]);
    expect(parseHarnessSelection("all", harnesses)).to.deep.equal([
      ...harnesses,
    ]);
    expect(parseHarnessSelection("", harnesses)).to.deep.equal([]);
    expect(() => parseHarnessSelection("0, 2", harnesses)).to.throw(
      /Choose numbers/,
    );
  });

  it("shows detected destinations but selects none until explicit input", async () => {
    let promptText = "";
    const selected = await selectHarnesses(
      async (text) => {
        promptText = text;
        return "";
      },
      true,
      (harness) => harness === "claude",
    );
    expect(selected).to.deep.equal([]);
    expect(promptText).to.include("Harnesses: ");
  });

  it("requires explicit harnesses without an interactive terminal", async () => {
    try {
      await selectHarnesses(
        async () => "all",
        false,
        () => false,
      );
      expect.fail("expected noninteractive selection to reject");
    } catch (error) {
      expect(error instanceof Error).to.be.true;
      expect((error as Error).message).to.contain(
        "Specify one or more harnesses",
      );
    }
  });

  it("uses each harness's documented per-user destination", () => {
    expect(harnessDestination("pi", home)).to.equal(
      path.join(home, ".agents", "skills"),
    );
    expect(harnessDestination("claude", home)).to.equal(
      path.join(home, ".claude", "skills"),
    );
    expect(harnessDestination("codex", home)).to.equal(
      path.join(home, ".codex", "skills"),
    );
  });

  it("copies all bundled skill directories to each selected harness", async () => {
    const results = await installSkills({
      source,
      home,
      harnesses: ["pi", "codex"],
    });
    expect(results.map((result) => result.harness)).to.deep.equal([
      "pi",
      "codex",
    ]);
    for (const harness of ["pi", "codex"] as const) {
      const destination = harnessDestination(harness, home);
      expect(
        readFileSync(path.join(destination, "skill-one", "SKILL.md"), "utf8"),
      ).to.equal("one");
      expect(
        readFileSync(path.join(destination, "skill-two", "SKILL.md"), "utf8"),
      ).to.equal("two");
      expect(
        results
          .find((result) => result.harness === harness)
          ?.skills.map((skill) => skill.status),
      ).to.deep.equal(["installed", "installed"]);
    }
  });

  it("does not overwrite existing skills without approval, but installs non-conflicting skills", async () => {
    const destination = harnessDestination("claude", home);
    const existing = path.join(destination, "skill-one");
    mkdirSync(existing, { recursive: true });
    writeFileSync(path.join(existing, "SKILL.md"), "user version");

    const results = await installSkills({
      source,
      home,
      harnesses: ["claude"],
    });

    expect(readFileSync(path.join(existing, "SKILL.md"), "utf8")).to.equal(
      "user version",
    );
    expect(
      readFileSync(path.join(destination, "skill-two", "SKILL.md"), "utf8"),
    ).to.equal("two");
    expect(results[0].skills.map((skill) => skill.status)).to.deep.equal([
      "skipped",
      "installed",
    ]);
  });

  it("replaces only after explicit approval", async () => {
    const destination = harnessDestination("codex", home);
    const existing = path.join(destination, "skill-one");
    mkdirSync(existing, { recursive: true });
    writeFileSync(path.join(existing, "SKILL.md"), "old version");

    const results = await installSkills({
      source,
      home,
      harnesses: ["codex"],
      interactive: true,
      confirmOverwrite: () => true,
    });

    expect(readFileSync(path.join(existing, "SKILL.md"), "utf8")).to.equal(
      "one",
    );
    expect(results[0].skills[0].status).to.equal("replaced");
  });

  it("waits for asynchronous overwrite approval", async () => {
    const destination = harnessDestination("claude", home);
    const existing = path.join(destination, "skill-one");
    mkdirSync(existing, { recursive: true });
    writeFileSync(path.join(existing, "SKILL.md"), "old version");

    const results = await installSkills({
      source,
      home,
      harnesses: ["claude"],
      interactive: true,
      confirmOverwrite: async () => true,
    });

    expect(readFileSync(path.join(existing, "SKILL.md"), "utf8")).to.equal(
      "one",
    );
    expect(results[0].skills[0].status).to.equal("replaced");
  });

  it("dry-run reports actions without creating destination directories", async () => {
    const results = await installSkills({
      source,
      home,
      harnesses: ["pi", "claude"],
      dryRun: true,
    });

    expect(
      results.flatMap((result) => result.skills.map((skill) => skill.status)),
    ).to.deep.equal([
      "would-install",
      "would-install",
      "would-install",
      "would-install",
    ]);
    expect(() => readFileSync(harnessDestination("pi", home))).to.throw();
  });

  it("reports one harness failure without hiding another harness's success", async () => {
    mkdirSync(home, { recursive: true });
    writeFileSync(path.join(home, ".codex"), "blocks destination directory");

    const results = await installSkills({
      source,
      home,
      harnesses: ["claude", "codex"],
    });

    expect(
      readFileSync(
        path.join(harnessDestination("claude", home), "skill-one", "SKILL.md"),
        "utf8",
      ),
    ).to.equal("one");
    expect(
      results.find((result) => result.harness === "claude")?.skills[0].status,
    ).to.equal("installed");
    expect(results.find((result) => result.harness === "codex")?.error).to.be.a(
      "string",
    );
  });
});

describe("skills install CLI", () => {
  let root: string;
  let home: string;

  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), "antora-tracer-skill-cli-"));
    home = path.join(root, "home");
    mkdirSync(home, { recursive: true });
  });

  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it("installs explicit multiple harnesses without prompting", () => {
    const result = runSkills(["claude", "codex"], home);
    expect(result.status, result.stderr).to.equal(0);
    expect(result.stdout).to.contain("claude:");
    expect(result.stdout).to.contain("codex:");
    expect(
      readFileSync(
        path.join(
          home,
          ".claude",
          "skills",
          "semantic-relation-review",
          "SKILL.md",
        ),
        "utf8",
      ),
    ).to.contain("name: semantic-relation-review");
    expect(
      readFileSync(
        path.join(
          home,
          ".codex",
          "skills",
          "semantic-relation-review",
          "SKILL.md",
        ),
        "utf8",
      ),
    ).to.contain("name: semantic-relation-review");
  });

  it("rejects invalid names before writing any harness", () => {
    const result = runSkills(["claude", "unknown"], home);
    expect(result.status).to.not.equal(0);
    expect(result.stderr).to.contain("Supported harnesses: pi, claude, codex");
    expect(readdirSync(home)).to.deep.equal([]);
  });

  it("requires names when no terminal is available", () => {
    const result = runSkills([], home);
    expect(result.status).to.not.equal(0);
    expect(result.stderr).to.contain("Specify one or more harnesses");
    expect(readdirSync(home)).to.deep.equal([]);
  });

  it("uses the multi-select to choose harnesses by numbers", async () => {
    const selected = await selectHarnesses(
      async () => "2, 3",
      true,
      () => false,
    );
    expect(selected).to.deep.equal(["claude", "codex"]);
  });

  it("dry-run lists paths but writes nothing", () => {
    const result = runSkills(["pi", "--dry-run"], home);
    expect(result.status, result.stderr).to.equal(0);
    expect(result.stdout).to.contain("would-install");
    expect(existsSync(path.join(home, ".agents"))).to.equal(false);
  });

  it("skips conflicts in non-interactive mode and honors overwrite flag", () => {
    const skill = path.join(
      home,
      ".claude",
      "skills",
      "semantic-relation-review",
    );
    mkdirSync(skill, { recursive: true });
    writeFileSync(path.join(skill, "SKILL.md"), "local copy");

    const skipped = runSkills(["claude"], home);
    expect(skipped.status, skipped.stderr).to.equal(0);
    expect(skipped.stdout).to.contain("skipped: semantic-relation-review");
    expect(readFileSync(path.join(skill, "SKILL.md"), "utf8")).to.equal(
      "local copy",
    );

    const replaced = runSkills(["claude", "--overwrite"], home);
    expect(replaced.status, replaced.stderr).to.equal(0);
    expect(replaced.stdout).to.contain("replaced: semantic-relation-review");
    expect(readFileSync(path.join(skill, "SKILL.md"), "utf8")).to.contain(
      "name: semantic-relation-review",
    );
  });

  it("reports a blocked destination and successful sibling harness separately", () => {
    writeFileSync(path.join(home, ".codex"), "not a directory");
    const result = runSkills(["claude", "codex"], home);
    expect(result.status).to.not.equal(0);
    expect(result.stdout).to.contain("claude:");
    expect(result.stdout).to.contain("codex:");
    expect(result.stderr).to.contain("failed:");
    expect(
      existsSync(
        path.join(
          home,
          ".claude",
          "skills",
          "semantic-relation-review",
          "SKILL.md",
        ),
      ),
    ).to.equal(true);
  });

  it("reports missing bundled skills as a per-harness error", async () => {
    const results = await installSkills({
      source: path.join(root, "missing-skills"),
      home,
      harnesses: ["claude", "codex"],
    });
    expect(results.map((result) => result.harness)).to.deep.equal([
      "claude",
      "codex",
    ]);
    expect(
      results.every((result) =>
        result.error?.includes("Could not read bundled skills"),
      ),
    ).to.equal(true);
    expect(readdirSync(home)).to.deep.equal([]);
  });
});
