---
name: write-item
description: Create a traceable item block of any role, guided by the role's authoring guidance from the project's traceability config. Use when the user asks to "write an item", "add a requirement", "add a design item", "add a test", "add a use case", or any role-specific item.
---

# Write Item

Create a traceable `[item]` block for a role, guided by the role's authoring
guidance from the project's traceability config. The config is the single
source of truth; do not invent roles, relation types, or ID prefixes.
The task is not about drafting an implementation.

> **Write nothing without explicit user confirmation.**
> The steps below gather information and produce a *draft*.
> Mandatory flow: draft → subagent review → present → confirm → write.
> Skip no step. Present the draft and wait for the user to say to write it.
> Re-sending the request, re-attaching the skill, or silence is **not**
> confirmation — treat it as "keep asking", not "go ahead".

## 1. Determine the role

Identify the target role from the request. If ambiguous, ask. The role must
come from the project config (`roles:` in `traceability.yml` or a preset).

## 2. Resolve the role's guidance

```bash
antora-tracer role-guidance <role> --content
```

- If it prints `page:` and `idPrefix:` — the role has guidance. Read the page
  content (or the `--content` output) for the description, item template,
  writing rules, and quality checklist. Follow them.
- If it reports no guidance — write a generic item block (skeleton below).

## 3. Get the ID

```bash
antora-tracer next-id --prefix <PREFIX> --input <dir>
```

The prefix is the role's `idPrefix` when reported. But the project's existing
items win: if items of this role already use a different prefix, follow that.
If neither the guidance nor the existing items establish a prefix, ask.

## 4. Ask for upper-level item

Try to find an upper-level item where this item is derived from.
If this is not possible or is ambiguous, ask.

## 5. Follow the guidance page's workflow

Follow the guidance page's workflow for writing the item.

## 6. Review the draft with another agent

Do not self-review — delegate. Send the draft to a **read-only reviewer
subagent** along with the role's quality checklist (resolved in step 2).
The reviewer reports findings only; it must not edit files. Apply the findings
that matter before moving on. This is mandatory, not optional. If the role has
no checklist, at minimum have the reviewer verify: the title is short, the body
states observable behaviour, and `traceability:links[]` is present.

## 7. Get explicit confirmation before writing

Everything above produces a **draft**, not a file edit. Show the draft to the
user and wait for an explicit go-ahead (for example, "yes", "write it",
"looks good"). Write the block to the file **only after** that confirmation.
If anything is still TBD or ambiguous, present it as a question and wait for
the answer — do not fill in the blanks yourself.

Name the guidance page the draft followed (the `page:` value from step 2).

## Guardrails

**Do not guess.** When information is missing or ambiguous, ask the user.

**Do not self-review the draft.** Hand it to a read-only reviewer subagent and
apply its findings before presenting to the user.

**Never write without explicit confirmation.** The user re-sending the request,
re-attaching the skill, or staying silent is **not** confirmation. Treat it as
"keep asking", not "go ahead".

* Upper Level item this item is derived from (use terms defined in traceability config)
* Present findings where user decision or guidance is needed.

## Related

- `antora-tracer role-guidance <role>` — resolve a role's guidance
- `antora-tracer next-id --prefix <PREFIX>` — next available ID
- `antora-tracer validate -i <docs-dir>` : validate the traceability graph for dangling references
