/**
 * Tests for role-based authoring guidance: config parsing, preset defaults,
 * project override, and extends-chain merging.
 */

import { expect } from "chai";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ConfigLoader } from "../src/config/TraceabilityConfig.js";

describe("role-guidance", () => {
  it("resolves default guidance from a preset", () => {
    const loader = new ConfigLoader();
    const preset = loader.loadPreset("requirements-engineering");

    expect(preset.traceability.roleGuidance).to.exist;
    const requirement = preset.traceability.roleGuidance!.requirement;
    expect(requirement).to.exist;
    expect(requirement.idPrefix).to.equal("REQ");
    expect(requirement.page).to.match(/guidance\/requirement\.adoc$/);
  });

  it("project roleGuidance overrides the preset per role", () => {
    const dir = mkdtempSync(join(tmpdir(), "role-guidance-"));
    const cfg = join(dir, "traceability.yml");
    writeFileSync(
      cfg,
      [
        "extends: requirements-engineering",
        "roles: [requirement]",
        "roleGuidance:",
        "  requirement:",
        "    page: my-req.adoc",
        "    idPrefix: FR",
      ].join("\n"),
    );
    writeFileSync(join(dir, "my-req.adoc"), "= Custom\n");

    const loader = new ConfigLoader();
    const config = loader.load(cfg);

    expect(config.roleGuidance!.requirement.idPrefix).to.equal("FR");
    expect(config.roleGuidance!.requirement.page).to.match(/my-req\.adoc$/);
    // Preset guidance for other roles is still present after the merge.
    expect(config.roleGuidance!.design.idPrefix).to.equal("ARC");

    rmSync(dir, { recursive: true, force: true });
  });

  it("merges guidance across the extends chain", () => {
    const loader = new ConfigLoader();
    const config = loader.loadPreset("requirements-engineering").traceability;

    expect(config.roleGuidance!.requirement).to.exist;
    expect(config.roleGuidance!.design).to.exist;
    expect(config.roleGuidance!.test).to.exist;
  });

  it("reports no guidance for a role without an entry", () => {
    const loader = new ConfigLoader();
    const config = loader.loadPreset("requirements-engineering").traceability;
    expect(config.roleGuidance!.epic).to.be.undefined;
  });
});
