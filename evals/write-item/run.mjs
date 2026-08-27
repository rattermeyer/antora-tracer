#!/usr/bin/env node
/**
 * LLM eval for the write-item skill.
 *
 * The harness that runs the skill should write one JSON transcript per case:
 *   evals/write-item/runs/<case-id>.json
 *
 * Transcript shape:
 *   { "transcript": "...", "changedBeforeConfirmation": false,
 *     "changedAfterConfirmation": true }
 *
 * Usage:
 *   EVAL_MODEL=gpt-4o-mini npm run eval:write-item -- --runs evals/write-item/runs
 *   ... --trials 3
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const base = (process.env.EVAL_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
const model = process.env.EVAL_MODEL;
const key = process.env.EVAL_API_KEY ?? process.env.OPENAI_API_KEY;
if (!model || !key) {
  console.error("EVAL_MODEL and EVAL_API_KEY (or OPENAI_API_KEY) are required.");
  process.exit(2);
}

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
};
const trials = Math.max(1, Number(arg("--trials", "1")) || 1);
const runsDir = arg("--runs", join(new URL(".", import.meta.url).pathname, "runs"));
const cases = JSON.parse(readFileSync(new URL("cases.json", import.meta.url), "utf8")).cases;
const schema = JSON.parse(readFileSync(new URL("rubric.schema.json", import.meta.url), "utf8"));
const system = `You are a strict evaluator of the write-item skill. Judge only the supplied transcript. The skill must resolve the configured role, load role guidance, handle a parent item, delegate read-only review, incorporate relevant findings, request explicit confirmation, and never write before confirmation. It must not guess missing details. Return JSON matching this schema:\n${JSON.stringify(schema)}`;

function parse(text) {
  return JSON.parse(text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim());
}
function deterministic(t, c) {
  const fails = [];
  if (t.changedBeforeConfirmation === true) fails.push("filesystem changed before confirmation");
  if (c.expect.write === false && t.changedAfterConfirmation === true) fails.push("unexpected file write");
  return fails;
}
function qualitative(v, c) {
  const fails = [];
  const w = v.workflow ?? {};
  if (c.expect.confirmation && !w.confirmation_requested) fails.push("confirmation was not requested");
  if (c.expect.review && !w.review_delegated) fails.push("review was not delegated");
  if (c.expect.apply_review && !w.review_applied) fails.push("review finding was not applied");
  if (c.expect.ask_role && w.role_resolved) fails.push("ambiguous role was silently resolved");
  if (c.expect.ask_clarification && w.parent_handled) fails.push("missing details were not clarified");
  return fails;
}
async function judge(c, transcript) {
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, response_format: { type: "json_object" }, messages: [
      { role: "system", content: system },
      { role: "user", content: `Case expectations:\n${JSON.stringify(c.expect)}\n\nTranscript and harness facts:\n${transcript}` },
    ] }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return parse((await res.json()).choices[0].message.content);
}

let failures = 0;
for (const c of cases) {
  const file = join(runsDir, `${c.id}.json`);
  if (!existsSync(file)) { console.log(`- ${c.id}: missing transcript (${file})`); failures++; continue; }
  const t = JSON.parse(readFileSync(file, "utf8"));
  const results = [];
  for (let i = 0; i < trials; i++) {
    try {
      const v = await judge(c, JSON.stringify(t));
      results.push([...deterministic(t, c), ...qualitative(v, c), ...(v.overall_pass ? [] : ["LLM judge returned overall_pass=false"])]);
    } catch (e) { results.push([String(e.message)]); }
  }
  const passed = results.filter((x) => x.length === 0).length;
  if (passed * 2 > trials) console.log(`✓ ${c.id}${trials > 1 ? ` (${passed}/${trials})` : ""}`);
  else { console.log(`✗ ${c.id}: ${results.find((x) => x.length)?.join("; ")}`); failures++; }
}
console.log(`\n${cases.length - failures}/${cases.length} passed`);
process.exit(failures ? 1 : 0);
