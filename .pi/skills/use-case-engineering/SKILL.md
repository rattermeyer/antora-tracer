---
name: use-case-engineering
description: Create or review use case descriptions in Karl Wiegers tabular format for requirements engineering in AsciiDoc/Antora Tracer. Use when writing new use cases, reviewing existing ones for testable pre/post conditions, or checking traceability to requirements. For writing or reviewing functional requirements (REQ items), use the requirements-writing skill instead.
location: /home/richard/devel/git/antora-tracer/.pi/skills/use-case-engineering/SKILL.md
---

# Use Case Engineering Skill

Help the user create or review use case descriptions following the Karl Wiegers template, stored as Antora Tracer `[item]` blocks with `role=use_case`.

## When to Use

- User asks to "write a use case" or "create a use case"
- User says "review my use cases" for completeness or testability
- User mentions "Karl Wiegers template" or "use case template"
- User wants to verify that actors have persona definitions
- User checks whether pre/post conditions are testable

**For functional requirement quality (REQ items), solution prescription, or "what not how" reviews — use the `requirements-writing` skill instead.**

## Guardrails

**Do not guess.** When information is missing or ambiguous, ask the user:

- Actor name unclear or too generic → Challenge over-generalization. "Author", "User", or "Developer" are not specific enough. Ask: "Which specific role performs this — a Product Owner, Business Analyst, Requirements Engineer, Feature Owner, Technical Writer, QA Engineer? Does this person have a persona defined somewhere?" If no persona exists, offer to draft one before continuing.
- Missing preconditions → "What must be true before this use case can start?"
- Vague trigger → "What specific event starts this? A user action? A system event? A time?"
- Incomplete alternate flows → "Are there error cases or edge conditions I should cover?"
- Unclear priority → "Is this High (core workflow), Medium (important), or Low (nice-to-have)?"
- Postcondition seems untestable → "What would a tester verify after this completes successfully?"
- Steps contain implementation details (syntax, button names, field types) → Push back. "This reads like a design specification, not a use case. Would a Business Analyst describe it this way? Can we describe the goal rather than the mechanism?" Requirements own the details; use cases describe the interaction.

Never fabricate actors, steps, conditions, or priorities. If the user cannot answer, mark the section with `TBD` and a note.

## Creating a Use Case

### Step 1: Get the Next ID

```bash
antora-tracer next-id --prefix UC -i docs/
```

### Step 2: Define the Actor (Persona)

**Before writing the use case, identify the actor.** Vague names like "Author", "User", or "Developer" are not acceptable — they hide assumptions about who performs the action and what context they work in.

Ask the user: "Which specific role performs this — a Product Owner prioritizing features, a Business Analyst specifying requirements, a Requirements Engineer defining traceability, a Technical Writer documenting architecture? Is there an existing persona?"

If no persona exists, offer to draft one with:
- **Role name** (specific, e.g., "Requirements Engineer", not "Writer")
- **Goals** (what they need to accomplish)
- **Context** (what tools, constraints, and environment they work in)

Only proceed to write the use case after the actor is precisely identified.

### Step 3: Write the Use Case

Use the Karl Wiegers tabular template. The `[item]` block body contains a table with all sections:

```asciidoc
[#UC-NNN, item, role=use_case, title="<Actor> <action verb> <observable outcome>"]

.Use Case: <title>
[width=100%, cols="25h,75a"]
|===
| ID | UC-NNN
| Title | <actor> <action> <outcome>
| Goal | <actor> does <action> so that <stakeholder benefit>
| Primary Actor | <role from persona definition>
| Preconditions | <past-tense testable statement>
| Trigger | <event that initiates the use case>
| Basic Flow |
. <step 1>
. <step 2>
. <step 3>
| Alternate Flows |
. <condition>: <alternate step sequence>
. <condition>: <alternate step sequence>
| Postconditions | <past-tense testable statement of system state after success>
| Priority | High / Medium / Low
| Frequency | <how often: once per session, daily, weekly>
| Notes | <open issues, assumptions, references>
|===

leads_to:REQ-XXX[]

traceability:outgoing[]
traceability:incoming[]
--
```

### Naming Conventions

- **ID**: `UC-NNN` with 3-digit padding
- **Title format**: `<Actor> <present-tense action verb> <observable outcome>`
  - Good: "Author writes traceable items in AsciiDoc"
  - Bad: "Writing items", "Item writing by author"
- **Actor**: Matches a persona name. If the persona is "Documentation Author", use exactly that.

### Preconditions and Postconditions

Must be written as **testable statements in past tense**:

| Wrong | Right |
|-------|-------|
| "Log in" | "User has authenticated with valid credentials" |
| "Data available" | "At least one requirement item exists in the traceability graph" |
| "System ready" | "The extension is loaded and Antora build has emitted contentClassified" |

Multiple conditions use **"And"** or **"Or"** as conjunctive/disjunctive separators:

- "User has authenticated with valid credentials And the project traceability.yml is loaded"
- "The input path points to an existing directory Or a single .adoc file"

### Basic Flow

Numbered steps in present tense, active voice. Each step should describe **one observable action or system response**.

**Keep steps at the right abstraction level.** Detailed specifications — particularly design elements like syntax, button names, or field types — should not be in use cases unless there is a compelling reason. Requirements own the details; use cases describe the interaction.

| Wrong (over-specified) | Right (business-level) |
|---|---|
| "Author writes `[#ID, item, role=XXX, title=\"...\"]` on its own line, followed by `--`" | "Author identifies a concept that needs to be traceable" |
| "Author closes the item block with `--` on its own line" | "Author writes a description of the concept" |
| "The `contentClassified` event fires" | "The extension registers the item" |

Ask: "Would a Business Analyst or Product Owner describe it this way, or am I writing the implementation?"

The same principle applies to functional requirements (REQ items) — see the `requirements-writing` skill for the full checklist.

### Alternate Flows

Each entry starts with a **condition** followed by the alternate steps:

- *. No existing items match the prefix: Extension defaults to 3-digit padding And outputs `REQ-001`.
- *. Input path does not exist: Extension exits with error message And code 1.

### Postconditions

Describe the **state of the system after successful completion**, in past tense:

- "The next sequential ID for the prefix is displayed on stdout" And "Exit code is 0"
- "Extension traceability graph is unchanged" And "No files are modified on disk"

## Reviewing a Use Case

**When reviewing, if a section has vague or untestable content, do not silently accept it.** Flag it with a specific question and a suggestion. Do not rewrite the use case without asking.

When asked to review a use case, check the following. Do NOT stop at formatting — verify the **substance** of each section.

### Structure
- [ ] Uses `role=use_case` with padded UC-NNN ID
- [ ] Title follows `<Actor> <action> <outcome>` pattern
- [ ] Table has all required sections (ID, Title, Goal, Actor, Preconditions, Trigger, Basic Flow, Alternate Flows, Postconditions, Priority, Frequency)

### Actor
- [ ] Actor name matches a defined persona (ask if personas exist)
- [ ] **Actor is not over-generalized** — "Author", "User", "Developer" are too vague. Push for specificity: Product Owner, Business Analyst, Requirements Engineer, Technical Writer, QA Engineer
- [ ] If no personas exist, suggest creating one before the use case
- [ ] Actor name is consistent across all use cases

### Preconditions
- [ ] Written in **past tense** as testable statements ("User has logged in", not "Log in")
- [ ] Each condition is independently verifiable
- [ ] Multiple conditions use "And" or "Or" explicitly
- [ ] Conditions are true BEFORE the trigger fires

### Trigger
- [ ] Describes the **event** that starts the use case (not a state)
- [ ] Uses present tense
- [ ] Is specific ("Author runs `antora-tracer next-id`", not "User wants ID")

### Basic Flow
- [ ] Each step is **one observable action or system response**
- [ ] Steps are numbered and in logical order
- [ ] No implementation details (no "click button", "call API")
- [ ] Covers the successful path from trigger to goal

### Alternate Flows
- [ ] Each starts with a clear **condition**
- [ ] Covers error cases, edge cases, and optional variations
- [ ] Alternate flows that end the use case restore preconditions or reach postconditions
- [ ] "Nothing happens" is not an alternate flow — describe the result

### Postconditions
- [ ] Written in **past tense** as testable statements
- [ ] Describe system state AFTER successful completion
- [ ] Distinguish from preconditions — what CHANGED?
- [ ] Multiple conditions use "And" or "Or"

### Traceability
- [ ] At least one `leads_to:REQ-XXX[]` relationship
- [ ] All referenced REQ IDs exist in the requirements document
- [ ] `traceability:outgoing[]` is present

### Consistency
- [ ] Title style matches other use cases in the project
- [ ] Same actor name across use cases
- [ ] Priority and frequency are realistic

## Config Requirements

The use case role and relations must be defined in `traceability.yml`:

```yaml
extends: requirements-engineering

roles:
  - use_case

relations:
  use_case:
    requirement: [leads_to]

inverseLabels:
  leads_to: "is-derived-from"
```

## Related Commands

```bash
antora-tracer next-id --prefix UC -i docs/
antora-tracer validate -i docs/
```
