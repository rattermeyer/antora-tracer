/**
 * Tests for the release-consistency checker: the pure validation logic that
 * decides whether a release state is internally consistent.
 */

import { expect } from "chai";
import { checkConsistency, type ReleaseState } from "../src/release-check.js";

function state(overrides: Partial<ReleaseState> = {}): ReleaseState {
  return {
    version: "0.20.0",
    branches: ["main", "v0.20.x"],
    tags: ["v0.20.0"],
    playbookRefs: ["main", "v0.20.x"],
    changelog: "# Changelog\n\n## [0.20.0] — 2026-08-19\n\n### Added\n- x\n",
    ...overrides,
  };
}

describe("release-check", () => {
  it("passes a consistent release", () => {
    expect(checkConsistency(state())).to.be.empty;
  });

  it("reports a missing git tag", () => {
    const findings = checkConsistency(state({ tags: [] }));
    expect(findings.some((f) => f.includes("missing git tag v0.20.0"))).to.be
      .true;
  });

  it("reports a missing maintenance branch", () => {
    const findings = checkConsistency(state({ branches: ["main"] }));
    expect(findings.some((f) => f.includes("maintenance branch v0.20.x"))).to.be
      .true;
  });

  it("reports a missing changelog entry", () => {
    const findings = checkConsistency(state({ changelog: "# Changelog\n" }));
    expect(findings.some((f) => f.includes("[0.20.0]"))).to.be.true;
  });

  it("reports a playbook ref that does not exist", () => {
    const findings = checkConsistency(
      state({ playbookRefs: ["main", "v0.99.x"] }),
    );
    expect(findings.some((f) => f.includes("v0.99.x"))).to.be.true;
  });
});
