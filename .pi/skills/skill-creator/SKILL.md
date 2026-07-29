---
name: skill-creator
description: Create new skills, modify and improve existing skills. Use when users want to create a skill from scratch, edit or optimize an existing skill, or need guidance on skill design patterns.
location: /home/richard/.agents/skills/skill-creator/SKILL.md
---

# Skill Creator

A skill for creating and improving pi skills.

## Pi Skill System

Pi skills live in `.pi/skills/<name>/SKILL.md`. Each skill is a single markdown file with YAML frontmatter:

```yaml
---
name: skill-name
description: When to trigger and what it does. Be specific about contexts.
location: /path/to/skill/SKILL.md
---
```

- **name**: Short kebab-case identifier
- **description**: What the skill does AND when to use it. This is the primary triggering mechanism — include specific contexts and keywords. Be slightly pushy to avoid undertriggering.
- **location**: Resolved path to the SKILL.md file

The markdown body contains instructions for the AI. Keep it under 500 lines. Use clear headings, code examples, and step-by-step workflows.

## Process

### 1. Capture Intent

Ask the user:
1. What should this skill enable the AI to do?
2. When should it trigger? (user phrases, contexts, keywords)
3. What's the expected output or workflow?
4. Are there specific tools, files, or commands involved?

If the current conversation already contains a workflow the user wants to capture, extract it from the conversation history.

### 2. Write the SKILL.md

Based on the interview, create `.pi/skills/<name>/SKILL.md` with:

```yaml
---
name: <kebab-case-name>
description: <trigger description — what and when>
---
```

The body should contain:
- Clear, step-by-step instructions
- Examples of usage
- Guardrails (what NOT to do)
- File paths and commands where relevant

### 3. Register the Skill

Update `.pi/skills/README.md` or the project's skill registry if one exists.

### 4. Iterate

Ask the user to test the skill. Refine based on feedback — adjust the description for better triggering, fix instructions, add missing edge cases.

## Patterns

### Good Descriptions

```
Create new OpenSpec changes with proposals, designs, specs, and tasks.
Use when the user wants to start a new feature, fix, or refactor.

Update the self-traceability example site to reflect the current
as-is state of the project. Run after archiving a change.
```

### Bad Descriptions

```
Helps with stuff.
A skill for things.
```

### Skill Structure

```
.pi/skills/<name>/
└── SKILL.md    (required — instructions + frontmatter)
```

Pi skills are single-file. For complex skills, use clear section headings and keep the file focused.
