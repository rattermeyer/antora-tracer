#!/usr/bin/env node
// Generates blog/modules/ROOT/pages/index.adoc from *.adoc posts.
// Extracts :page-date: and titles, produces date-sorted listing.
// Usage: node scripts/generate-blog-index.js

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PAGES_DIR = join(ROOT, "blog", "modules", "ROOT", "pages");
const INDEX_FILE = join(PAGES_DIR, "index.adoc");

if (!existsSync(PAGES_DIR)) {
  console.log("No blog/modules/ROOT/pages/ directory, skipping.");
  process.exit(0);
}

const posts = readdirSync(PAGES_DIR)
  .filter((f) => f.endsWith(".adoc") && f !== "index.adoc")
  .map((f) => {
    const src = readFileSync(join(PAGES_DIR, f), "utf8");
    const date = (src.match(/^:page-date:\s*(.+)$/m) || [])[1] || "";
    const title =
      (src.match(/^=\s+(.+)$/m) || [])[1] || f.replace(/\.adoc$/, "");
    const tags = ((src.match(/^:page-tags:\s*(.+)$/m) || [])[1] || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    return { file: f, title, date, tags };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

const listing = posts
  .map((p) => {
    const tagStr = p.tags.length ? ` [${p.tags.join(", ")}]` : "";
    return `* ${p.date}: xref:${p.file}[${p.title}]${tagStr}`;
  })
  .join("\n");

const indexContent = `= Blog

Welcome to the Antora Tracer blog — release notes, updates, and articles.

${listing || "No posts yet."}
`;

writeFileSync(INDEX_FILE, indexContent);
console.log(`Generated blog/index.adoc (${posts.length} posts)`);
