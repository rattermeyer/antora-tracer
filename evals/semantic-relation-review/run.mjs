#!/usr/bin/env node
/**
 * LLM eval for document-scoped semantic relation review.
 *
 * Env: EVAL_MODEL, LITELLM_API_KEY (or EVAL_API_KEY/OPENAI_API_KEY), optional LITELLM_BASE_URL (or EVAL_BASE_URL).
 * Usage: EVAL_MODEL=gpt-4o-mini node evals/semantic-relation-review/run.mjs [--trials N]
 * Not part of `pnpm test`; it makes external model calls.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const base = (
  process.env.LITELLM_BASE_URL ??
  process.env.EVAL_BASE_URL ??
  "https://api.openai.com/v1"
).replace(/\/$/, "");
const model = process.env.EVAL_MODEL;
const key =
  process.env.LITELLM_API_KEY ??
  process.env.EVAL_API_KEY ??
  process.env.OPENAI_API_KEY;
const cli = join(root, "lib/src/cli.js");
const skill = readFileSync(
  join(root, "skills/semantic-relation-review/SKILL.md"),
  "utf8",
);
const rubric = JSON.parse(
  readFileSync(new URL("rubric.schema.json", import.meta.url), "utf8"),
);
const cases = JSON.parse(
  readFileSync(new URL("cases.json", import.meta.url), "utf8"),
).cases;

const extractOnly = process.argv.includes("--extract-only");

if (!extractOnly && !model) {
  console.error(
    "EVAL_MODEL is required. Example: EVAL_MODEL=gpt-4o-mini node evals/semantic-relation-review/run.mjs",
  );
  process.exit(2);
}
if (!extractOnly && !key) {
  console.error(
    "LITELLM_API_KEY (or EVAL_API_KEY/OPENAI_API_KEY) is required.",
  );
  process.exit(2);
}

const trialArg = process.argv.find((arg) => arg.startsWith("--trials="));
const trialIndex = process.argv.indexOf("--trials");
const parsedTrials = Number(
  trialArg?.slice("--trials=".length) ?? process.argv[trialIndex + 1] ?? 3,
);
const trials =
  Number.isInteger(parsedTrials) && parsedTrials > 0 ? parsedTrials : 3;

function extractDocument(c) {
  if (
    ["declined", "needs_path", "warn", "create"].includes(
      c.expected_report_decision,
    )
  ) {
    return {
      document: c.document,
      roles: [],
      itemCount: 0,
      relationCount: 0,
      structuralIssues: [],
      relations: [],
    };
  }
  const outputDir = mkdtempSync(join(root, ".semantic-relation-review-eval-"));
  try {
    const configArgs = c.config ? ["--config", resolve(root, c.config)] : [];
    const result = spawnSync(
      process.execPath,
      [
        cli,
        ...configArgs,
        "process",
        "--input",
        resolve(root, c.input),
        "--output",
        outputDir,
        "--format",
        "json",
      ],
      {
        cwd: root,
        encoding: "utf8",
      },
    );
    if (result.status !== 0)
      throw new Error(
        `graph extraction failed: ${result.stderr || result.stdout}`,
      );
    const graph = JSON.parse(
      readFileSync(join(outputDir, "traceability.json"), "utf8"),
    );
    const normalize = (path) =>
      path
        .replaceAll("\\", "/")
        .replace(/^\.\//, "")
        .replace(/\.adoc$/i, "");
    const document = normalize(c.document);
    const sourceItems = graph.items.filter((item) => {
      const sourceFile = normalize(item.sourceFile ?? "");
      return sourceFile === document || sourceFile.endsWith(`/${document}`);
    });
    const itemById = new Map(graph.items.map((item) => [item.id, item]));
    const superseded = new Set(
      graph.relationships
        .filter((edge) => edge.type === "supersedes")
        .map((edge) => edge.targetId),
    );
    const sources = sourceItems.filter((item) => !superseded.has(item.id));
    const sourceIds = new Set(sources.map((item) => item.id));
    const relations = graph.relationships
      .filter((edge) => sourceIds.has(edge.fromId))
      .map((edge) => ({
        source: itemById.get(edge.fromId) ?? null,
        relation: edge.type,
        target: itemById.get(edge.targetId) ?? null,
      }));
    const structuralIssues = relations.filter(
      (edge) => !edge.source || !edge.target,
    );
    return {
      document: c.document,
      roles: [...new Set(sources.map((item) => item.role))],
      itemCount: sources.length,
      relationCount: relations.length,
      structuralIssues: structuralIssues.map((edge) => ({
        source_id: edge.source?.id ?? null,
        relation: edge.relation,
        target_id: edge.target?.id ?? null,
      })),
      relations: relations.filter((edge) => edge.source && edge.target),
    };
  } finally {
    rmSync(outputDir, { recursive: true, force: true });
  }
}

function evidenceFailures(evidence, c) {
  const failures = [];
  const keys = evidence.relations.map(
    (edge) => `${edge.source?.id} ${edge.relation} ${edge.target?.id}`,
  );
  for (const key of c.expected_relation_keys ?? [])
    if (!keys.includes(key))
      failures.push(`extracted relation missing: ${key}`);
  if (!c.smoke && keys.length !== (c.expected_relation_keys ?? []).length)
    failures.push(
      `expected ${(c.expected_relation_keys ?? []).length} direct outgoing relations, extracted ${keys.length}`,
    );
  if (evidence.relations.some((edge) => edge.source && edge.target === null))
    failures.push("extracted edge has no direct target item");
  return failures;
}

function parseJson(text) {
  return JSON.parse(
    text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/, "")
      .trim(),
  );
}

function score(output, c) {
  const failures = [];
  if (
    !output ||
    typeof output.summary !== "string" ||
    !Array.isArray(output.findings) ||
    !output.report
  ) {
    return ["output does not match the review contract"];
  }
  const keyOf = (finding) =>
    `${finding.source_id} ${finding.relation} ${finding.target_id}`;
  const expected = new Map(
    (c.expected_findings ?? []).map((finding) => [keyOf(finding), finding]),
  );
  const actual = new Map(
    output.findings.map((finding) => [keyOf(finding), finding]),
  );
  for (const [key, wanted] of expected) {
    const finding = actual.get(key);
    if (!finding) {
      failures.push(`missing expected finding ${key}`);
      continue;
    }
    const allowedSeverities = Array.isArray(wanted.severity)
      ? wanted.severity
      : [wanted.severity];
    if (!allowedSeverities.includes(finding.severity))
      failures.push(
        `${key}: expected severity in [${allowedSeverities.join(", ")}], got ${finding.severity}`,
      );
    if (!new Set(["high", "medium", "low"]).has(finding.confidence))
      failures.push(
        `${key}: confidence must be reported separately from severity`,
      );
    if (!finding.problem?.trim())
      failures.push(`${key}: missing problem statement`);
    if (!finding.suggestion?.trim())
      failures.push(`${key}: missing suggested action`);
  }
  if (!c.smoke && !c.prior_findings) {
    for (const key of actual.keys())
      if (!expected.has(key))
        failures.push(`unexpected actionable finding ${key}`);
  }
  if (c.prior_findings && output.findings.length > 0)
    failures.push("report follow-up repeated already presented findings");
  for (const omitted of c.omitted_relations ?? [])
    if (actual.has(omitted))
      failures.push(
        `supported relation was reported as actionable: ${omitted}`,
      );
  const report = output.report;
  const expectedReportDecision =
    c.expected_report_decision === "from_findings"
      ? actual.size > 0
        ? "offer"
        : "none"
      : c.expected_report_decision;
  if (report.decision !== expectedReportDecision)
    failures.push(
      `expected report decision ${expectedReportDecision}, got ${report.decision}`,
    );
  if (c.expected_report_path && report.path !== c.expected_report_path)
    failures.push(
      `expected report path ${c.expected_report_path}, got ${report.path}`,
    );
  if (
    report.decision !== "create" &&
    report.decision !== "warn" &&
    (report.path !== null || report.content !== null)
  )
    failures.push("report content/path present without confirmed creation");
  if (report.decision === "warn" && (!report.path || report.content !== null))
    failures.push(
      "Antora warning must identify the proposed path without drafting the report",
    );
  if (report.decision === "create") {
    if (!report.content?.trim())
      failures.push("confirmed report has no AsciiDoc content");
    if (
      /\[#?[^\]]*,\s*item\b|(?:^|\n)[a-z][a-z0-9_-]*:[A-Z0-9_-]+\[\]/m.test(
        report.content ?? "",
      )
    )
      failures.push("report contains item or relationship macro syntax");
  }
  return failures;
}

const SYSTEM = `${skill}

Eval response contract:
- Return exactly one JSON object matching this schema: ${JSON.stringify(rubric)}
- On an initial review, include only actionable findings and omit supported links. Severity is impact; confidence is evidence strength. Use the supplied relation_criteria when provided.
- Severity is a triage judgment, not a calibrated scale: choose HIGH for materially misleading links, MEDIUM for indirect or incomplete support, LOW for minor improvements. Do not downgrade impact merely because confidence is uncertain.
- For report follow-ups, use priorFindings as the findings already presented. Return no new findings; do not re-review the document.
- For create, provide the approved path and plain AsciiDoc content. Never claim the file was actually written.
- Never write files or modify source content.
`;
async function judge(c, evidence) {
  const response = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: JSON.stringify({
            task: c.interaction,
            evidence,
            priorFindings: c.prior_findings ?? [],
            expectedReportPath: c.expected_report_path ?? null,
          }),
        },
      ],
    }),
  });
  if (!response.ok)
    throw new Error(`HTTP ${response.status} ${await response.text()}`);
  return parseJson((await response.json()).choices[0].message.content);
}

async function runTrial(c) {
  let evidence;
  try {
    evidence = extractDocument(c);
  } catch (error) {
    return { fails: [String(error.message ?? error)] };
  }
  const failures = evidenceFailures(evidence, c);
  if (failures.length > 0) return { fails: failures };
  try {
    return { fails: score(await judge(c, evidence), c) };
  } catch (error) {
    return { fails: [`model eval failed: ${String(error.message ?? error)}`] };
  }
}

let failedCases = 0;
for (const c of cases) {
  if (extractOnly) {
    try {
      const evidence = extractDocument(c);
      const failures = evidenceFailures(evidence, c);
      if (failures.length === 0)
        console.log(
          `✓ ${c.id} (${evidence.itemCount} items, ${evidence.relationCount} direct outgoing relations)`,
        );
      else {
        console.log(`✗ ${c.id}: ${failures.join("; ")}`);
        failedCases += 1;
      }
    } catch (error) {
      console.log(`✗ ${c.id}: ${String(error.message ?? error)}`);
      failedCases += 1;
    }
    continue;
  }
  const results = [];
  for (let attempt = 0; attempt < trials; attempt++)
    results.push(await runTrial(c));
  const passed = results.filter((result) => result.fails.length === 0).length;
  const tally = trials > 1 ? ` (${passed}/${trials})` : "";
  if (passed * 2 > trials) {
    console.log(`✓ ${c.id}${tally}`);
  } else {
    const detail =
      results.find((result) => result.fails.length > 0)?.fails.join("; ") ?? "";
    console.log(`✗ ${c.id}${tally}: ${detail}`);
    failedCases += 1;
  }
}
console.log(`\n${cases.length - failedCases}/${cases.length} cases passed`);
process.exit(failedCases === 0 ? 0 : 1);
