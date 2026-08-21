#!/usr/bin/env node
/**
 * LLM rubric eval for the requirements-writing skill (Layer 2).
 *
 * Usage:
 *   EVAL_MODEL=gpt-4o-mini node evals/requirements-writing/run.mjs [--trials N]
 *
 * Env:
 *   EVAL_MODEL      (required) model id, e.g. gpt-4o-mini
 *   EVAL_API_KEY    (required) API key (falls back to OPENAI_API_KEY)
 *   EVAL_BASE_URL   (optional) OpenAI-compatible base URL, default https://api.openai.com/v1
 *
 * --trials N (default 1): run each case N times; a case passes if a strict
 * majority of its trials pass. Agent output is nondeterministic, so use 3–5
 * for a real signal.
 *
 * NOT part of `npm test` — it costs tokens and is non-deterministic.
 * Run it manually when you change the skill.
 */
import { readFileSync } from "node:fs";

const base = (process.env.EVAL_BASE_URL ?? "https://api.openai.com/v1").replace(
  /\/$/,
  "",
);
const model = process.env.EVAL_MODEL;
const key = process.env.EVAL_API_KEY ?? process.env.OPENAI_API_KEY;

if (!model) {
  console.error(
    "EVAL_MODEL is required. Example: EVAL_MODEL=gpt-4o-mini node evals/requirements-writing/run.mjs",
  );
  process.exit(2);
}
if (!key) {
  console.error("EVAL_API_KEY (or OPENAI_API_KEY) is required.");
  process.exit(2);
}

const trials = (() => {
  const eq = process.argv.find((a) => a.startsWith("--trials="));
  const v = eq
    ? Number(eq.slice("--trials=".length))
    : Number(process.argv[process.argv.indexOf("--trials") + 1] ?? 1);
  return Number.isInteger(v) && v > 0 ? v : 1;
})();

const skill = readFileSync(
  new URL("../../skills/requirements-writing/SKILL.md", import.meta.url),
  "utf8",
);
const schema = JSON.parse(
  readFileSync(new URL("rubric.schema.json", import.meta.url), "utf8"),
);
const cases = JSON.parse(
  readFileSync(new URL("cases.json", import.meta.url), "utf8"),
).cases;

const SYSTEM = `${skill}

You are reviewing a single requirement item pasted by the user. Apply the review checklist and guardrails above. Respond with one JSON object matching this schema:

${JSON.stringify(schema, null, 2)}`;

function parseVerdict(text) {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  return JSON.parse(cleaned);
}

function score(verdict, c) {
  const fails = [];
  if (c.expect_prescription === null) {
    if ((verdict.prescriptions ?? []).length > 0) {
      fails.push(
        `expected no prescription, got ${JSON.stringify(verdict.prescriptions)}`,
      );
    }
  } else if (c.expect_prescription) {
    const hit = (verdict.prescriptions ?? []).some(
      (p) => p.category === c.expect_prescription,
    );
    if (!hit)
      fails.push(
        `expected '${c.expect_prescription}', got ${JSON.stringify(verdict.prescriptions)}`,
      );
  }
  if (
    typeof c.expect_pass === "boolean" &&
    verdict.overall_pass !== c.expect_pass
  ) {
    fails.push(
      `expected overall_pass=${c.expect_pass}, got ${verdict.overall_pass}`,
    );
  }
  return fails;
}

async function runTrial(c) {
  const res = await fetch(`${base}/chat/completions`, {
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
          content: `Review this requirement and return the JSON verdict:\n\n${c.block}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    return { fails: [`HTTP ${res.status} ${await res.text()}`] };
  }

  const data = await res.json();
  let verdict;
  try {
    verdict = parseVerdict(data.choices[0].message.content);
  } catch {
    return {
      fails: [
        `could not parse model JSON: ${data.choices?.[0]?.message?.content}`,
      ],
    };
  }
  return { fails: score(verdict, c) };
}

let failures = 0;
for (const c of cases) {
  const results = [];
  for (let t = 0; t < trials; t++) {
    results.push(await runTrial(c));
  }
  const passed = results.filter((r) => r.fails.length === 0).length;
  const tally = trials > 1 ? ` (${passed}/${trials})` : "";
  if (passed * 2 > trials) {
    console.log(`✓ ${c.id}${tally}`);
  } else {
    const detail =
      results.find((r) => r.fails.length > 0)?.fails.join("; ") ?? "";
    console.log(`✗ ${c.id}${tally}: ${detail}`);
    failures += 1;
  }
}

console.log(`\n${cases.length - failures}/${cases.length} passed`);
process.exit(failures === 0 ? 0 : 1);
