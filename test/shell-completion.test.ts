import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect } from "chai";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const CLI = join(__dirname, "..", "src", "cli.js");
const shells = ["bash", "zsh", "fish"] as const;

describe("shell completion command", () => {
  it("generates shell scripts from registered CLI commands and options", () => {
    for (const shell of shells) {
      const result = spawnSync("node", [CLI, "completion", shell], {
        encoding: "utf8",
      });
      expect(result.status, result.stderr).to.equal(0);
      expect(result.stdout).to.include("process");
      expect(result.stdout).to.include("--help");
      if (shell === "bash") expect(result.stdout).to.include("complete -F");
      if (shell === "zsh")
        expect(result.stdout).to.include("#compdef antora-tracer");
      if (shell === "fish")
        expect(result.stdout).to.include("complete -c antora-tracer");
    }
  });

  it("rejects unsupported shells", () => {
    const result = spawnSync("node", [CLI, "completion", "powershell"], {
      encoding: "utf8",
    });
    expect(result.status).to.not.equal(0);
    expect(result.stderr).to.include("bash, zsh, fish");
  });

  it("installs the generated script and prints activation without editing startup files", () => {
    const home = mkdtempSync(join(tmpdir(), "antora-tracer-completion-"));
    const bashrc = join(home, ".bashrc");
    writeFileSync(bashrc, "# existing bash config\n");
    const relativePaths = {
      bash: ".local/share/bash-completion/completions/antora-tracer",
      zsh: ".zfunc/_antora-tracer",
      fish: ".config/fish/completions/antora-tracer.fish",
    };
    try {
      for (const shell of shells) {
        const generated = spawnSync("node", [CLI, "completion", shell], {
          encoding: "utf8",
        });
        const installed = spawnSync(
          "node",
          [CLI, "completion", "install", shell],
          { encoding: "utf8", env: { ...process.env, HOME: home } },
        );
        expect(generated.status, generated.stderr).to.equal(0);
        expect(installed.status, installed.stderr).to.equal(0);
        const destination = join(home, relativePaths[shell]);
        expect(readFileSync(destination, "utf8")).to.equal(generated.stdout);
        expect(installed.stdout).to.include(destination);
        if (shell === "bash") expect(installed.stdout).to.include("source ");
        if (shell === "zsh")
          expect(installed.stdout).to.include("fpath=(~/.zfunc $fpath)");
        if (shell === "fish")
          expect(installed.stdout).to.include("automatically");
      }
      expect(readFileSync(bashrc, "utf8")).to.equal("# existing bash config\n");
    } finally {
      rmSync(home, { recursive: true, force: true });
    }
  });

  it("fails cleanly when the completion destination cannot be created", () => {
    const home = mkdtempSync(join(tmpdir(), "antora-tracer-completion-error-"));
    const blocked = join(home, ".local");
    writeFileSync(blocked, "not a directory");
    try {
      const result = spawnSync("node", [CLI, "completion", "install", "bash"], {
        encoding: "utf8",
        env: { ...process.env, HOME: home },
      });
      expect(result.status).to.not.equal(0);
      expect(result.stderr).to.include("Could not install shell completion");
      expect(result.stdout).to.not.include("Installed bash completion");
    } finally {
      rmSync(home, { recursive: true, force: true });
    }
  });
});
