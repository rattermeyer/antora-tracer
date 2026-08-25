---
name: write-item
description: Create a traceable item block of any role, guided by the role's authoring guidance from the project's traceability config. Use when the user asks to "write an item", "add a requirement", "add a design item", "add a test", "add a use case", or any role-specific item.
---

# Write Item

Create a traceable `[item]` block for a role, guided by the role's authoring
guidance from the project's traceability config. The config is the single
source of truth; do not invent roles, relation types, or ID prefixes.

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

## 4. Write the item block

Follow the guidance page's item template. The generic skeleton is:

```asciidoc
[#<PREFIX>-NNN, item, role=<role>, title="<short title>"]
--
<body per the role's template>

traceability:links[]
--
```

Use the `--` open-block delimiter. One sentence per line.

## 5. Self-check against the guidance checklist

Apply the guidance page's quality checklist before finishing. If the role has
no checklist, at minimum verify: the title is short, the body states observable
behaviour, and `traceability:links[]` is present.

## Related

- `antora-tracer role-guidance <role>` — resolve a role's guidance
- `antora-tracer next-id --prefix <PREFIX>` — next available ID
