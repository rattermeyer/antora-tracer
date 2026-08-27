# `write-item` evaluation

This is a Layer 2 evaluation for the `write-item` skill.

The skill runner is intentionally separate from the judge because Pi owns the skill transcript and filesystem sandbox.
A runner should produce one file per case at `runs/<case-id>.json`:

```json
{
  "transcript": "user and assistant messages, tool calls, and reviewer output",
  "changedBeforeConfirmation": false,
  "changedAfterConfirmation": true
}
```

`changedBeforeConfirmation` and `changedAfterConfirmation` are harness facts, not LLM judgments.
The evaluator checks the former deterministically and asks the LLM to assess workflow and draft quality.

Run after producing transcripts:

```bash
EVAL_MODEL=gpt-4o-mini npm run eval:write-item -- --runs evals/write-item/runs --trials 3
```

Required environment variables are `EVAL_MODEL` and `EVAL_API_KEY` (or `OPENAI_API_KEY`).
An OpenAI-compatible endpoint can be selected with `EVAL_BASE_URL`.
