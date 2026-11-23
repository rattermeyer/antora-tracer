/**
 * The single authoritative locator for an item block's position and extent.
 *
 * The parser is the definition of what an item block is, so this module owns
 * the one scan every consumer uses: the quote-aware header scan, the
 * line-anchored delimiter scan, and the verbatim-fence skip. `DocumentParser`
 * and the Antora extension both delegate here, so a block's bounds cannot
 * diverge between the parser, the CLI, and the extension.
 *
 * Offsets are absolute character offsets, the primitive; 1-based lines are
 * derived. `blockText` reconstructs `content[startLine..endLine]` exactly, and
 * `bodyText` is the item's `content` (the trimmed body).
 */
/**
 * Header start pattern: line-anchored, optional leading whitespace, optional
 * role classes, then `#<id>, item`. Mirrors the parser's scan so the grammar
 * has one home.
 */
const ITEM_HEADER_RE = /^[ \t]*\[(?:\.[A-Za-z0-9_-]+)*#([^,\]]+),\s*item,?/gm;
/** 1-based line number of an absolute offset. */
function lineAt(content, position) {
    let line = 1;
    for (let i = 0; i < position && i < content.length; i++) {
        if (content[i] === "\n")
            line++;
    }
    return line;
}
/** Absolute offset of the start of a 1-based line, or content.length past the end. */
function offsetOfLine(content, line) {
    if (line <= 1)
        return 0;
    let idx = 0;
    for (let n = 1; n < line; n++) {
        const nl = content.indexOf("\n", idx);
        if (nl === -1)
            return content.length;
        idx = nl + 1;
    }
    return idx;
}
/**
 * Verbatim block ranges (`----` and `....` fences) — example code whose
 * content is not traceability data. A header inside one of these is not an
 * item, so its bounds are not reported.
 */
export function findVerbatimRanges(content) {
    const ranges = [];
    const fenceRegex = /(?:^|\n)(----|\.\.\.\.)[ \t]*\r?\n/g;
    let match;
    while ((match = fenceRegex.exec(content)) !== null) {
        const fence = match[1];
        const openEnd = match.index + match[0].length;
        const closePattern = fence === "----"
            ? "\\r?\\n----[ \\t]*(?:\\r?\\n|$)"
            : "\\r?\\n\\.\\.\\.\\.[ \\t]*(?:\\r?\\n|$)";
        const closeRegex = new RegExp(closePattern, "g");
        closeRegex.lastIndex = openEnd;
        const closeMatch = closeRegex.exec(content);
        if (closeMatch) {
            const rangeEnd = closeMatch.index + closeMatch[0].length;
            ranges.push({ start: match.index, end: rangeEnd });
            fenceRegex.lastIndex = rangeEnd;
        }
        else {
            // Unmatched fence — treat the rest of the file as verbatim.
            ranges.push({ start: match.index, end: content.length });
            break;
        }
    }
    return ranges;
}
/**
 * Scan an item header forward to its real closing `]`, respecting quoted
 * strings so a `]` inside a `title` does not end the header. Returns the index
 * of the closing `]`, or -1 when there is none.
 */
function findHeaderEnd(content, attrStart) {
    let inQuotes = false;
    let quoteChar = "";
    for (let i = attrStart; i < content.length; i++) {
        const ch = content[i];
        if ((ch === '"' || ch === "'") && (i === 0 || content[i - 1] !== "\\")) {
            if (!inQuotes) {
                inQuotes = true;
                quoteChar = ch;
            }
            else if (ch === quoteChar) {
                inQuotes = false;
                quoteChar = "";
            }
        }
        else if (ch === "]" && !inQuotes) {
            return i;
        }
    }
    return -1;
}
/**
 * Build bounds from a header's opening `[` offset. Returns null when the offset
 * is not an item header, when the header has no closing `]`, when the header is
 * inside a verbatim fence, or when no opening/closing delimiter follows.
 */
function boundsAtHeaderOffset(content, headerStart, verbatimRanges) {
    // A header inside a `----`/`....` fence is example code, not an item.
    if (verbatimRanges.some((r) => headerStart >= r.start && headerStart < r.end))
        return null;
    // Re-anchor the global regex at the header line's start. Accept either the
    // line start or the header's `[` as the input offset, then work from `[`.
    const lineStart = content.lastIndexOf("\n", headerStart - 1) + 1;
    ITEM_HEADER_RE.lastIndex = lineStart;
    const headerMatch = ITEM_HEADER_RE.exec(content);
    if (!headerMatch || headerMatch.index !== lineStart)
        return null;
    const bracketOffset = lineStart + headerMatch[0].indexOf("[");
    if (headerStart !== lineStart && headerStart !== bracketOffset)
        return null;
    headerStart = bracketOffset;
    const itemId = headerMatch[1].trim();
    if (!itemId)
        return null;
    const attrStart = bracketOffset + headerMatch[0].length;
    const macroEnd = findHeaderEnd(content, attrStart);
    if (macroEnd === -1)
        return null;
    // Opening delimiter: the parser's rule — `====` or `--` alone on its line.
    const openMatch = /\n(====|--)\n/.exec(content.slice(macroEnd + 1));
    if (!openMatch)
        return null;
    const openDelimiter = openMatch[1];
    const bodyStart = macroEnd + 1 + openMatch.index + openMatch[0].length;
    // Closing delimiter: same delimiter alone on a line, terminated by a newline
    // or end-of-file (an EOF-closed block is valid AsciiDoc).
    const closeRegex = new RegExp(`\\n${openDelimiter}(?:\\n|$)`, "g");
    closeRegex.lastIndex = bodyStart;
    const closeMatch = closeRegex.exec(content);
    if (!closeMatch)
        return null;
    const bodyEnd = closeMatch.index;
    // Block end is just past the closing delimiter itself — not the newline that
    // terminates its line — so `blockText` matches the parser's and the CLI's
    // notion of "the block" (header line through closing delimiter line).
    const closingDelimiterStart = closeMatch.index + 1;
    const blockEnd = closingDelimiterStart + openDelimiter.length;
    const rawBody = content.slice(bodyStart, bodyEnd);
    const leadingWhitespace = rawBody.length - rawBody.trimStart().length;
    return {
        itemId,
        headerStart,
        headerEnd: macroEnd + 1,
        bodyStart,
        bodyEnd,
        bodyTextStart: bodyStart + leadingWhitespace,
        blockEnd,
        delimiter: openDelimiter,
        startLine: lineAt(content, headerStart),
        endLine: lineAt(content, closingDelimiterStart),
        blockText: content.slice(headerStart, blockEnd),
        bodyText: rawBody.trim(),
    };
}
/**
 * Locate the item block whose header begins at `headerOffset` (the absolute
 * offset of the header's `[`). Returns null when no block is there.
 */
export function itemBlockBoundsAtOffset(content, headerOffset) {
    return boundsAtHeaderOffset(content, headerOffset, findVerbatimRanges(content));
}
/**
 * Locate the item block whose header is on the given 1-based source line.
 * Equivalent to `itemBlockBoundsAtOffset` at that line's start.
 */
export function itemBlockBoundsAtLine(content, sourceLine) {
    if (!Number.isFinite(sourceLine) || sourceLine < 1)
        return null;
    return itemBlockBoundsAtOffset(content, offsetOfLine(content, sourceLine));
}
/**
 * Locate every item block in the content, in document order. Headers inside
 * verbatim fences are skipped, matching the parser.
 */
export function findItemBlocks(content) {
    const verbatimRanges = findVerbatimRanges(content);
    const bounds = [];
    let match;
    ITEM_HEADER_RE.lastIndex = 0;
    const seen = new Set();
    while ((match = ITEM_HEADER_RE.exec(content)) !== null) {
        const bracketOffset = match.index + match[0].indexOf("[");
        if (seen.has(bracketOffset))
            continue;
        seen.add(bracketOffset);
        const block = boundsAtHeaderOffset(content, bracketOffset, verbatimRanges);
        if (block)
            bounds.push(block);
    }
    return bounds;
}
