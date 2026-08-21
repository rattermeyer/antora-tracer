/**
 * Tests for the deterministic grader encoding the mechanical subset of the
 * requirements-writing skill's rules.
 */

import { expect } from "chai";
import { gradeRequirement } from "./support/requirements-grader.js";

function req(body: string): string {
  return `[#REQ-001, item, role=requirement, title="Test"]
--
${body}
--
`;
}

function has(violations: { check: string }[], check: string): boolean {
  return violations.some((v) => v.check === check);
}

describe("requirements-grader", () => {
  it("passes a single ubiquitous SHALL", () => {
    expect(
      gradeRequirement(req("The system SHALL detect item declarations.")),
    ).to.deep.equal([]);
  });

  it("passes a single negative SHALL NOT", () => {
    expect(
      gradeRequirement(req("The system SHALL NOT expose internal file paths.")),
    ).to.deep.equal([]);
  });

  it("passes a correctly ordered complex EARS clause", () => {
    const body =
      "While in draft state, when a page is published, the system SHALL respond.";
    expect(gradeRequirement(req(body))).to.deep.equal([]);
  });

  it("flags multiple SHALL statements", () => {
    const violations = gradeRequirement(
      req("The system SHALL detect items and SHALL generate a matrix."),
    );
    expect(has(violations, "multiple_shall")).to.be.true;
  });

  it("flags mixed SHALL and SHALL NOT", () => {
    const violations = gradeRequirement(
      req("The system SHALL detect items and SHALL NOT skip them."),
    );
    expect(has(violations, "mixed_shall_not")).to.be.true;
  });

  it("flags a statement with no SHALL", () => {
    const violations = gradeRequirement(
      req("The system detects item declarations."),
    );
    expect(has(violations, "no_shall")).to.be.true;
  });

  it("flags When before While (clause order)", () => {
    const violations = gradeRequirement(
      req(
        "When a page is published, while in draft state, the system SHALL respond.",
      ),
    );
    expect(has(violations, "clause_order")).to.be.true;
  });

  it("flags a non-[item] block as invalid", () => {
    const violations = gradeRequirement("not an item block");
    expect(has(violations, "invalid_block")).to.be.true;
  });
});
