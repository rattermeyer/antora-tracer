/**
 * Tests for the shared `ItemBlockBounds` accessor (openspec change
 * `expose-item-block-bounds`).
 *
 * The accessor is the one block-locating scan: `DocumentParser`, the CLI's
 * `archive`/`remove`, and the Antora extension all delegate to it. These tests
 * pin the parser's block grammar (which the accessor now owns) and the bounds
 * arithmetic that consumers rely on.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect } from "chai";
import { DocumentParser } from "../src/DocumentParser.js";
import {
  findItemBlocks,
  itemBlockBoundsAtLine,
  itemBlockBoundsAtOffset,
} from "../src/ItemBlockBounds.js";

const FIXTURES = {
  plain: `[#REQ-001, item, role=requirement, title="Plain"]
--
Body text.
--
`,
  indentedHeader: `  [#REQ-009, item, role=requirement, title="Indented header"]
--
Body.
--
`,
  indentedDelimiter: `[#REQ-002, item, role=requirement, title="Indented"]
--
Body.
  --
`,
  eofClosed: `[#REQ-003, item, role=requirement, title="EOF"]
--
Body with no trailing newline.
--`,
  classPrefixed: `[.tracer#REQ-004, item, role=requirement, title="Classed"]
--
Body.
--
`,
  quotedBracketTitle: `[#REQ-006, item, role=requirement, title="A ] in title"]
--
Body.
--
`,
  insideListing: `----
[#REQ-005, item, role=requirement, title="In listing"]
--
Body.
--
----
`,
  noDelimiter: `[#REQ-007, item, role=requirement, title="No delim"]

Just prose, no block.
`,
  unterminated: `[#REQ-008, item, role=requirement, title="Unterminated"]
--
Body never closed.
`,
  equalsDelimiter: `[#REQ-011, item, role=requirement, title="Equals"]
====
Body.
====
`,
} as const;

describe("ItemBlockBounds accessor", () => {
  it("reports header, body, and closing-delimiter offsets and the item ID", () => {
    const content = FIXTURES.plain;
    const bounds = itemBlockBoundsAtLine(content, 1);
    expect(bounds).to.not.be.null;
    const b = bounds!;
    expect(b.itemId).to.equal("REQ-001");
    expect(b.delimiter).to.equal("--");
    expect(content.slice(b.headerStart, b.headerEnd)).to.equal(
      '[#REQ-001, item, role=requirement, title="Plain"]',
    );
    expect(b.bodyText).to.equal("Body text.");
    expect(b.blockText).to.equal(
      '[#REQ-001, item, role=requirement, title="Plain"]\n--\nBody text.\n--',
    );
    // blockText reconstructs the content slice exactly.
    expect(content.slice(b.headerStart, b.blockEnd)).to.equal(b.blockText);
    expect(b.startLine).to.equal(1);
    expect(b.endLine).to.equal(4);
  });

  it("gives the same bounds for a line and the equivalent offset", () => {
    const content = FIXTURES.plain;
    const byLine = itemBlockBoundsAtLine(content, 1);
    const byOffset = itemBlockBoundsAtOffset(content, 0);
    expect(byLine).to.deep.equal(byOffset);
  });

  it("reports the ==== delimiter form", () => {
    const bounds = itemBlockBoundsAtLine(FIXTURES.equalsDelimiter, 1);
    expect(bounds?.delimiter).to.equal("====");
    expect(bounds?.blockText.endsWith("====")).to.be.true;
  });

  it("accepts an EOF-closed block", () => {
    const bounds = itemBlockBoundsAtLine(FIXTURES.eofClosed, 1);
    expect(bounds).to.not.be.null;
    expect(bounds!.blockText).to.equal(
      '[#REQ-003, item, role=requirement, title="EOF"]\n--\nBody with no trailing newline.\n--',
    );
    expect(bounds!.bodyText).to.equal("Body with no trailing newline.");
  });

  it("accepts a class-prefixed header", () => {
    const bounds = itemBlockBoundsAtLine(FIXTURES.classPrefixed, 1);
    expect(bounds?.itemId).to.equal("REQ-004");
  });

  it("scans a quoted-] title to the real closing bracket", () => {
    const bounds = itemBlockBoundsAtLine(FIXTURES.quotedBracketTitle, 1);
    expect(bounds?.itemId).to.equal("REQ-006");
    expect(bounds?.headerEnd).to.equal(
      FIXTURES.quotedBracketTitle.indexOf("]\n") + 1,
    );
  });

  it("accepts an indented header", () => {
    const bounds = itemBlockBoundsAtLine(FIXTURES.indentedHeader, 1);
    expect(bounds?.itemId).to.equal("REQ-009");
    expect(bounds?.headerStart).to.equal(2);
  });

  it("returns no bounds for an item-shaped header inside a listing block", () => {
    expect(itemBlockBoundsAtLine(FIXTURES.insideListing, 2)).to.be.null;
    expect(findItemBlocks(FIXTURES.insideListing)).to.deep.equal([]);
  });

  it("returns no bounds for a header not followed by a delimiter", () => {
    expect(itemBlockBoundsAtLine(FIXTURES.noDelimiter, 1)).to.be.null;
  });

  it("returns no bounds for an unterminated block", () => {
    expect(itemBlockBoundsAtLine(FIXTURES.unterminated, 1)).to.be.null;
  });

  it("rejects an indented delimiter line, matching the parser", () => {
    expect(itemBlockBoundsAtLine(FIXTURES.indentedDelimiter, 1)).to.be.null;
    // The parser likewise registers no item for this fixture.
    const parsed = new DocumentParser().parse(
      FIXTURES.indentedDelimiter,
      "t.adoc",
    );
    expect(parsed.items).to.have.length(0);
  });

  it("enumerates every block in document order", () => {
    const content = `${FIXTURES.plain}\n${FIXTURES.classPrefixed}`;
    const blocks = findItemBlocks(content);
    expect(blocks.map((b) => b.itemId)).to.deep.equal(["REQ-001", "REQ-004"]);
  });

  it("agrees with the parser's Item for every example-site item", () => {
    const files: string[] = [];
    const collect = (dir: string): void => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, e.name);
        if (e.isDirectory()) collect(p);
        else if (e.name.endsWith(".adoc")) files.push(p);
      }
    };
    collect("examples/tracer");
    collect("examples/demo");
    collect("blog");
    let checked = 0;
    for (const file of files) {
      const content = readFileSync(file, "utf8");
      const parsed = new DocumentParser().parse(content, file);
      for (const item of parsed.items) {
        const b = itemBlockBoundsAtLine(content, item.sourceLine!);
        expect(b, `${item.id} in ${file}`).to.not.be.null;
        expect(b!.itemId).to.equal(item.id);
        // blockText is exactly the content slice it names.
        expect(content.slice(b!.headerStart, b!.blockEnd)).to.equal(
          b!.blockText,
        );
        // bodyText is byte-identical to the item's content.
        expect(b!.bodyText).to.equal(item.content ?? "");
        checked++;
      }
    }
    expect(checked).to.be.greaterThan(0);
  });
});
