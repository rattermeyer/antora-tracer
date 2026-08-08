---
name: blog-post-prep
description: Help write a new blog post for this project. Interview the user about the subject, help define and structure ideas, then prepare an AsciiDoc page with attributes, title, and structure. Use when the user wants to write a blog post, create an article, or draft content for the project website.
location: /home/richard/devel/git/antora-tracer/.pi/skills/blog-post-prep/SKILL.md
---

# Blog Post Preparation

Help the user write a blog post for the Antora Tracer project site. This skill covers the full process: exploring ideas, structuring the article, preparing the AsciiDoc scaffold, and reviewing drafts — without writing the user's content for them.

## When to Use

- User says "write a blog post", "create an article", "draft a blog", "new post"
- User wants to publish something on the project's example site or blog section
- User mentions "blog" in context of content creation

## Process

### Phase 1: Explore the Subject

Ask open-ended questions to understand what the user wants to write about. Keep digging until you share a common understanding:

1. **What's the topic?** — "What's the one thing you want readers to walk away with?"
2. **Who's the audience?** — "Who's this for? New users, power users, contributors?"
3. **What's the angle?** — "Is this a tutorial, an opinion piece, a release announcement, a case study?"
4. **What are the key points?** — "What 2-4 ideas must this post convey?"

Don't assume. If the user is vague, ask follow-ups until the core message is sharp.

### Phase 2: Identify Links to Project Documentation

Before structuring, scan the project's traceable items for relevant cross-references. Blog posts gain authority when they link to specific requirements, architecture decisions, or use cases that the post touches on.

**How to find relevant items:**

1. Search requirements:
   ```bash
   grep -n "^\[#REQ-" examples/tracer/modules/ROOT/pages/self-traceability/requirements.adoc
   ```

2. Search architecture items:
   ```bash
   grep -n "^\[#ARC-" examples/tracer/modules/ROOT/pages/explanation/architecture.adoc
   ```

3. Search ADRs:
   ```bash
   ls examples/tracer/modules/ROOT/pages/explanation/adr/
   ```

4. Search use cases:
   ```bash
   grep -n "^\[#UC-" examples/tracer/modules/ROOT/pages/self-traceability/use-cases.adoc
   ```

Present 2-5 relevant items to the user with cross-component xrefs (blog → docs uses `xref:../docs/...`). Example:

> Your post touches on the DFS circular reference algorithm. You could link to:
> - `xref:../docs/self-traceability/requirements.adoc#REQ-012[REQ-012: Circular reference detection]`
> - `xref:../docs/explanation/adr/0006-dfs-circular-reference-detection.adoc[ADR-0006: DFS circular reference detection]`
> - `xref:../docs/explanation/architecture.adoc#ARC-007[ARC-007: TraceabilityGraph validation engine]`

Only suggest links that genuinely relate to the post's subject. Don't force cross-references where they don't add value.

### Phase 3: Structure

Once the subject is clear, propose a structure:

- **Title** — working title, can be refined later
- **Lead** — one-paragraph hook that tells readers what they'll get
- **Sections** — 3-5 logical sections with working headings
- **Call to action / conclusion** — what should the reader do or remember?

Present the structure and ask the user to confirm or adjust before creating the file.

### Phase 4: Prepare the AsciiDoc Scaffold

Create the `.adoc` file in `blog/modules/ROOT/pages/`. Name it `YYYY-MM-DD-slug.adoc` to match the existing convention.

The file must include:

```asciidoc
= Working Title
:page-date: YYYY-MM-DD
:page-tags: tag1, tag2
:page-author: Author Name
:description: One-sentence description for SEO and social previews

== Section Heading

// Content goes here. Your notes below.
```

**Rules for the scaffold:**

- Filename: `YYYY-MM-DD-slug.adoc` (date-prefixed, matching the existing `2026-08-08-hello.adoc`)
- **Ask the user for the date** — never guess or use today's date without confirming
- Use `:page-date:` (not `:page-created:`) — the blog component uses this attribute
- Use `:page-tags:` as an active attribute, not commented out — it feeds the index listing
- Use `:page-author:`
- Use `:description:` for SEO and social previews
- **Add your observations as `//` comments** — questions, suggestions, things to consider

**Do NOT write content for sections unless the user explicitly asks.** The scaffold contains headings and comments — not prose.

After creating the post, remind the user to run `node scripts/generate-blog-index.js` to regenerate `blog/modules/ROOT/pages/index.adoc` with the new post listed.

### Phase 5: Review (Only When Asked)

When the user asks for a review, check:

1. **Length** — is the post scoped well? Flag sections that drift or feel padded.
2. **Tonality** — does it match the author's voice? The project's existing posts (ADRs, architecture docs) tend toward clear, direct, technical-but-approachable prose.
3. **Clarity** — flag sentences or paragraphs that are hard to follow. Say WHY they're unclear. Suggest a direction, not a rewrite.

**Review rules:**

- Present **max 3 improvements at a time**
- Never make changes yourself — point, explain, suggest direction
- Ask "Want more suggestions?" before continuing
- Never rewrite entire paragraphs — suggest direction, let the author find their words
- If a sentence is genuinely hard to parse, you may offer a **short** alternative phrasing as an illustration, not a replacement

**Style guide references** — when relevant, point the user to:
- https://stylepedia.net/style/ — comprehensive style guide collection
- The project's own ADR and architecture docs for tone reference

## File Locations

Blog posts live in the `blog` component at the project root:

```
blog/modules/ROOT/pages/
```

- Filenames use `YYYY-MM-DD-slug.adoc` convention
- The blog is a separate Antora component (`start_path: blog` in `antora-playbook.yml`)
- The main docs are in `examples/tracer/` — cross-component links use `xref:../docs/...`

After adding or editing a post, regenerate the index:

```bash
node scripts/generate-blog-index.js
```

This script extracts `:page-date:`, title, and `:page-tags:` from each post and writes `blog/modules/ROOT/pages/index.adoc` sorted by date.
