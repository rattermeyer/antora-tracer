import type { Requirement } from './types.js';

export class RequirementParser {
  /** Parse an AsciiDoc string and return all requirements found within it. */
  parse(content: string, sourceFile: string): Requirement[] {
    const requirements: Requirement[] = [];
    const seen = new Set<string>();

    // First pass: requirements with explicit IDs
    const reqRegex = /\[req,[\s]*id=([A-Z0-9_-]+)/g;
    let match: RegExpExecArray | null;

    while ((match = reqRegex.exec(content)) !== null) {
      const id = match[1];

      if (seen.has(id)) {
        throw new Error(`Duplicate requirement ID: ${id}`);
      }
      seen.add(id);

      const block = this.extractBlock(content, match.index);
      if (!block) continue;

      const title = block.match(/title="([^"]+)"/)?.[1] ?? `Requirement ${id}`;
      const status = block.match(/status=([^,\s\]]+)/)?.[1] ?? 'draft';

      if (!/^[A-Z]{2,4}-[0-9]+$/.test(id)) {
        console.warn(`⚠️  Non-standard requirement ID format: ${id}`);
      }

      requirements.push({
        id,
        title,
        content: this.extractBody(block),
        status,
        attributes: { id, title, status },
        sourceFile,
        sourceLine: this.lineAt(content, match.index),
      });
    }

    // Second pass: requirements without IDs (auto-generate)
    const reqNoIdRegex = /\[req(?!.*id=)/g;
    while ((match = reqNoIdRegex.exec(content)) !== null) {
      const block = this.extractBlock(content, match.index);
      if (!block) continue;

      const autoId = this.generateAutoId();
      const title = block.match(/title="([^"]+)"/)?.[1] ?? `Requirement ${autoId}`;

      requirements.push({
        id: autoId,
        title,
        content: this.extractBody(block),
        status: 'draft',
        attributes: { id: autoId, title },
        sourceFile,
        sourceLine: this.lineAt(content, match.index),
      });
    }

    return requirements;
  }

  private extractBlock(content: string, startIndex: number): string | null {
    const blockStart = content.indexOf('====', startIndex + 1);
    if (blockStart === -1) return null;
    const blockEnd = content.indexOf('====', blockStart + 4);
    if (blockEnd === -1) return null;
    return content.substring(startIndex, blockEnd + 4);
  }

  private extractBody(block: string): string {
    const start = block.indexOf('====') + 4;
    const end = block.lastIndexOf('====');
    return block.substring(start, end).trim();
  }

  private lineAt(content: string, position: number): number {
    return (content.substring(0, position).match(/\n/g) ?? []).length + 1;
  }

  private generateAutoId(): string {
    return `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
}
