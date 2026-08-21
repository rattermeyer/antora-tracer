import { DocumentParser } from "../../src/DocumentParser.js";

export type ViolationCheck =
  | "invalid_block"
  | "no_shall"
  | "multiple_shall"
  | "mixed_shall_not"
  | "clause_order";

export interface RequirementViolation {
  check: ViolationCheck;
  message: string;
}

/**
 * Deterministic subset of the requirements-writing skill's rules
 * (skills/requirements-writing/SKILL.md).
 *
 * Only the mechanical rules are encoded here: valid [item] block, exactly one
 * SHALL, no SHALL/SHALL NOT mix, EARS clause order. The semantic rules —
 * solution prescription (technology/algorithm/component/event/UI), testability,
 * unambiguity — are graded by the LLM rubric in evals/requirements-writing/.
 */
export function gradeRequirement(block: string): RequirementViolation[] {
  const violations: RequirementViolation[] = [];

  const parsed = new DocumentParser().parse(block);
  const item = parsed.items[0];
  if (!item || parsed.errors.length > 0) {
    violations.push({
      check: "invalid_block",
      message: parsed.errors[0]?.message ?? "not a valid [item] block",
    });
    return violations;
  }

  const body = item.content ?? "";

  const shallTotal = body.match(/\bshall\b/gi)?.length ?? 0;
  const shallNotCount = body.match(/\bshall\s+not\b/gi)?.length ?? 0;
  const shallPositive = shallTotal - shallNotCount;

  if (shallTotal === 0) {
    violations.push({
      check: "no_shall",
      message: "no SHALL statement — not a functional requirement",
    });
  } else if (shallPositive > 0 && shallNotCount > 0) {
    violations.push({
      check: "mixed_shall_not",
      message: "mixes SHALL and SHALL NOT — split into separate requirements",
    });
  } else if (shallTotal > 1) {
    violations.push({
      check: "multiple_shall",
      message: `${shallTotal} SHALL statements — one SHALL per requirement`,
    });
  }

  const whileIdx = body.search(/\bwhile\b/i);
  const whenIdx = body.search(/\bwhen\b/i);
  if (whileIdx !== -1 && whenIdx !== -1 && whenIdx < whileIdx) {
    violations.push({
      check: "clause_order",
      message:
        "`When` appears before `While` — EARS order is While … When … shall",
    });
  }

  return violations;
}
