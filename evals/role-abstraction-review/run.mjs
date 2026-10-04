#!/usr/bin/env node
/**
 * LLM judge eval for role abstraction review.
 *
 * Usage:
 *   EVAL_MODEL=gpt-4o-mini node evals/role-abstraction-review/run.mjs [--trials N]
 *
 * Env:
 *   EVAL_MODEL      (required) model id, e.g. gpt-4o-mini
 *   EVAL_API_KEY    (required) API key (falls back to OPENAI_API_KEY)
 *   EVAL_BASE_URL   (optional) OpenAI-compatible base URL, default https://api.openai.com/v1
 *
 * --trials N (default 3): run each case N times; a case passes if a strict
 * majority of its trials pass. Agent output is nondeterministic, so use 3–5
 * for a real signal.
 *
 * The judge consumes slices extracted by the real CLI:
 *   node lib/src/cli.js query by-role <role> --document <doc> --context --json
 * shelled out against the fixtures in cases.json (local scan mode).
 *
 * NOT part of `npm test` — it costs tokens and is non-deterministic.
 * Run it manually when you change the review model.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const base = (process.env.EVAL_BASE_URL ?? "https://api.openai.com/v1").replace(
  /\/$/,
  "",
);
const model = process.env.EVAL_MODEL;
const key = process.env.EVAL_API_KEY ?? process.env.OPENAI_API_KEY;

if (!model) {
  console.error(
    "EVAL_MODEL is required. Example: EVAL_MODEL=gpt-4o-mini node evals/role-abstraction-review/run.mjs",
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
    : Number(process.argv[process.argv.indexOf("--trials") + 1] ?? 3);
  return Number.isInteger(v) && v > 0 ? v : 3;
})();

const CLI = new URL("../../lib/src/cli.js", import.meta.url).pathname;
const cases = JSON.parse(
  readFileSync(new URL("cases.json", import.meta.url), "utf8"),
).cases;

const SYSTEM = `You are reviewing a slice of traceable items — all current items of one role in one document — for abstraction-level consistency.

Apply this three-verdict model. For each item that is NOT at the same abstraction level as its same-role siblings, classify it:

- "rewrite": the item sits in the right document and role, but its text is written at the wrong abstraction level (wrong vocabulary, wrong detail altitude). The fix is rewriting the item, not moving it.
- "move_within_document": the item belongs in a different section of the same document. Use the context skeleton (other-role items with their titles) to reason about where it belongs.
- "investigate_elsewhere": the item reads like a different role or belongs in a different document. Do NOT propose a destination — flag it for human follow-up.

Rules:
- Judge relative to the slice, not an absolute ideal: if all items sit at one consistent level, report no findings.
- Verdicts are per-item. Items consistent with their siblings get no finding.
- Respond with one JSON object: {"findings": [{"id": "<item id>", "verdict": "<rewrite|move_within_document|investigate_elsewhere>", "reason": "<one sentence>"}]}

The input is the JSON output of the extraction command: items (id, title, content, sourceLine) and optionally context (other-role items: id, title, role).`;

function parseVerdict(text) {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  return JSON.parse(cleaned);
}

/** Extract a slice with the real CLI; returns the parsed JSON object. */
function extractSlice(c) {
  const args = [
    CLI,
    "query",
    "by-role",
    c.role,
    "--document",
    c.document,
    "--context",
    "--json",
    "-i",
    c.input,
  ];
  const res = spawnSync(process.execPath, args, {
    encoding: "utf8",
    cwd: new URL("../..", import.meta.url).pathname,
  });
  if (res.status !== 0) {
    throw new Error(`extraction failed: ${res.stderr}`);
  }
  return JSON.parse(res.stdout);
}

function score(verdict, c) {
  const fails = [];
  const findings = verdict.findings ?? [];
  const valid = new Set([
    "rewrite",
    "move_within_document",
    "investigate_elsewhere",
  ]);
  for (const f of findings) {
    if (!valid.has(f.verdict)) {
      fails.push(
        `invalid verdict '${f.verdict}' for ${f.id} — vocabulary is closed`,
      );
    }
  }
  // Expected findings: each case names the items it expects flagged, with
  // the exact verdict. Missing or extra findings both fail the case.
  const expected = new Map(
    (c.expect ?? []).map((e) => [e.id, e.verdict]),
  );
  const got = new Map(findings.map((f) => [f.id, f.verdict]));
  for (const [id, verdictName] of expected) {
    if (!got.has(id)) {
      fails.push(`expected finding for ${id}, none given`);
    } else if (got.get(id) !== verdictName) {
      fails.push(
        `expected ${id} -> ${verdictName}, got ${got.get(id)}`,
      );
    }
  }
  for (const id of got.keys()) {
    if (!expected.has(id)) {
      fails.push(`unexpected finding for ${id}`);
    }
  }
  return fails;
}

async function runTrial(c) {
  let slice;
  try {
    slice = extractSlice(c);
  } catch (error) {
    return { fails: [String(error.message ?? error)] };
  }
  if (slice.items.length === 0) {
    return { fails: ["extraction returned no items"] };
  }

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
          content: `Review this role slice and return the JSON verdict:\n\n${JSON.stringify(slice)}`,
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
