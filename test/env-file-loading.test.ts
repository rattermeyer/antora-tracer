import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect } from "chai";
import { config } from "dotenv";

const __dirname = resolve(dirname(fileURLToPath(import.meta.url)));
const cliPath = join(__dirname, "..", "src", "cli.js");

describe("env-file-loading", () => {
  it("resolves .env values in environment-variable interpolation", () => {
    const dir = mkdtempSync(join(tmpdir(), "env-load-"));
    writeFileSync(join(dir, ".env"), "DOTENV_TEST_TOKEN=secret\n");
    writeFileSync(
      join(dir, "config.yml"),
      [
        "roles: [requirement]",
        "idAllocation:",
        "  endpoint: https://ids.example.com",
        `  token: \${DOTENV_TEST_TOKEN}`,
      ].join("\n"),
    );
    try {
      const res = spawnSync(
        "node",
        [cliPath, "config", "validate", "-c", join(dir, "config.yml")],
        { encoding: "utf8", cwd: dir },
      );
      expect(res.status).to.equal(0);
      expect(res.stdout).to.contain("Configuration is valid");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("does not override an existing process env var", () => {
    const dir = mkdtempSync(join(tmpdir(), "env-load-"));
    writeFileSync(join(dir, ".env"), "DOTENV_TEST_OVERRIDE=dotenv-value\n");
    process.env.DOTENV_TEST_OVERRIDE = "process-value";
    try {
      config({ path: join(dir, ".env"), quiet: true });
      expect(process.env.DOTENV_TEST_OVERRIDE).to.equal("process-value");
    } finally {
      delete process.env.DOTENV_TEST_OVERRIDE;
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("keeps next-id stdout a bare ID", () => {
    const dir = mkdtempSync(join(tmpdir(), "env-load-"));
    writeFileSync(join(dir, ".env"), "SOME_VAR=value\n");
    writeFileSync(
      join(dir, "items.adoc"),
      "[#REQ-001, item, role=requirement]\n--\nContent.\n--\n",
    );
    try {
      const res = spawnSync(
        "node",
        [cliPath, "next-id", "-p", "REQ", "-i", "."],
        { encoding: "utf8", cwd: dir },
      );
      expect(res.stdout.trim()).to.equal("REQ-002");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
