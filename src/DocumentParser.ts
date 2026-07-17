import type { Requirement, Implementation, Test, Document, Relationship, RelationshipType } from './types.js';

/**
 * Parses AsciiDoc content for all traceability elements:
 * - [req] block macros for requirements
 * - [imp] block macros for implementations
 * - [test] block macros for tests
 * - [doc] block macros for documents
 * - Inline relationship macros (satisfies:, implements:, tests:, verifies:, documents:)
 */
export class DocumentParser {
  /**
   * Parse an AsciiDoc string and return all traceability elements found within it.
   * Returns requirements, implementations, tests, documents, and relationships.
   */
  parse(content: string, sourceFile: string): {
    requirements: Requirement[];
    implementations: Implementation[];
    tests: Test[];
    documents: Document[];
    relationships: Relationship[];
  } {
    const result = {
      requirements: [] as Requirement[],
      implementations: [] as Implementation[],
      tests: [] as Test[],
      documents: [] as Document[],
      relationships: [] as Relationship[],
    };

    const seen = new Set<string>();

    // First pass: Parse all block macros to get nodes
    this.parseBlockMacros(content, sourceFile, seen, result);

    // Second pass: Parse inline relationship macros from node content
    // We need to associate each inline macro with its containing node
    this.parseInlineMacrosFromNodes(content, sourceFile, result);

    return result;
  }

  /** Parse [req], [imp], [test], [doc] block macros */
  private parseBlockMacros(
    content: string,
    sourceFile: string,
    seen: Set<string>,
    result: {
      requirements: Requirement[];
      implementations: Implementation[];
      tests: Test[];
      documents: Document[];
    },
  ): void {
    // Parse requirements: [req, id=REQ-001]
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

      const requirement = this.parseRequirement(block, id, sourceFile, match.index);
      result.requirements.push(requirement);
    }

    // Parse requirements without explicit IDs
    const reqNoIdRegex = /\[req(?!.*id=)/g;
    while ((match = reqNoIdRegex.exec(content)) !== null) {
      const block = this.extractBlock(content, match.index);
      if (!block) continue;

      const autoId = this.generateId('REQ');
      const requirement = this.parseRequirement(block, autoId, sourceFile, match.index);
      result.requirements.push(requirement);
    }

    // Parse implementations: [imp, id=IMP-001]
    const impRegex = /\[imp,[\s]*id=([A-Z0-9_-]+)/g;
    while ((match = impRegex.exec(content)) !== null) {
      const id = match[1];

      if (seen.has(id)) {
        throw new Error(`Duplicate implementation ID: ${id}`);
      }
      seen.add(id);

      const block = this.extractBlock(content, match.index);
      if (!block) continue;

      const implementation = this.parseImplementation(block, id, sourceFile, match.index);
      result.implementations.push(implementation);
    }

    // Parse implementations without explicit IDs
    const impNoIdRegex = /\[imp(?!.*id=)/g;
    while ((match = impNoIdRegex.exec(content)) !== null) {
      const block = this.extractBlock(content, match.index);
      if (!block) continue;

      const autoId = this.generateId('IMP');
      const implementation = this.parseImplementation(block, autoId, sourceFile, match.index);
      result.implementations.push(implementation);
    }

    // Parse tests: [test, id=TEST-001]
    const testRegex = /\[test,[\s]*id=([A-Z0-9_-]+)/g;
    while ((match = testRegex.exec(content)) !== null) {
      const id = match[1];

      if (seen.has(id)) {
        throw new Error(`Duplicate test ID: ${id}`);
      }
      seen.add(id);

      const block = this.extractBlock(content, match.index);
      if (!block) continue;

      const test = this.parseTest(block, id, sourceFile, match.index);
      result.tests.push(test);
    }

    // Parse tests without explicit IDs
    const testNoIdRegex = /\[test(?!.*id=)/g;
    while ((match = testNoIdRegex.exec(content)) !== null) {
      const block = this.extractBlock(content, match.index);
      if (!block) continue;

      const autoId = this.generateId('TEST');
      const test = this.parseTest(block, autoId, sourceFile, match.index);
      result.tests.push(test);
    }

    // Parse documents: [doc, id=DOC-001]
    const docRegex = /\[doc,[\s]*id=([A-Z0-9_-]+)/g;
    while ((match = docRegex.exec(content)) !== null) {
      const id = match[1];

      if (seen.has(id)) {
        throw new Error(`Duplicate document ID: ${id}`);
      }
      seen.add(id);

      const block = this.extractBlock(content, match.index);
      if (!block) continue;

      const document = this.parseDocument(block, id, sourceFile, match.index);
      result.documents.push(document);
    }

    // Parse documents without explicit IDs
    const docNoIdRegex = /\[doc(?!.*id=)/g;
    while ((match = docNoIdRegex.exec(content)) !== null) {
      const block = this.extractBlock(content, match.index);
      if (!block) continue;

      const autoId = this.generateId('DOC');
      const document = this.parseDocument(block, autoId, sourceFile, match.index);
      result.documents.push(document);
    }
  }

  /**
   * Parse inline relationship macros from the content of each node.
   * This associates each inline macro with its containing node.
   */
  private parseInlineMacrosFromNodes(
    _content: string,
    _sourceFile: string,
    result: {
      requirements: Requirement[];
      implementations: Implementation[];
      tests: Test[];
      documents: Document[];
      relationships: Relationship[];
    },
  ): void {
    // Build a map of node IDs to their content for efficient lookup
    const nodes = [
      ...result.requirements.map(n => ({ type: 'requirement' as const, node: n })),
      ...result.implementations.map(n => ({ type: 'implementation' as const, node: n })),
      ...result.tests.map(n => ({ type: 'test' as const, node: n })),
      ...result.documents.map(n => ({ type: 'document' as const, node: n })),
    ];

    // For each node, parse its content for inline macros
    for (const { node } of nodes) {
      const content = node.content ?? '';
      const inlineMacroRegex = /(\w+):([A-Z0-9_-]+)\[/g;
      let match: RegExpExecArray | null;

      while ((match = inlineMacroRegex.exec(content)) !== null) {
        const macroType = match[1];
        const targetId = match[2];

        // Determine relationship type based on macro name
        const relType = this.mapMacroToRelationshipType(macroType);
        if (!relType) continue;

        // Create relationship: source is the current node, target is the referenced ID
        const relationship: Relationship = {
          fromId: node.id,
          targetId,
          type: relType,
        };
        result.relationships.push(relationship);
        console.log(`🔗 Inline relationship found: ${node.id} ${relType} ${targetId}`);
      }
    }
  }

  private mapMacroToRelationshipType(macro: string): RelationshipType | null {
    const mapping: Record<string, RelationshipType> = {
      satisfies: 'satisfies',
      satisfy: 'satisfies',
      implement: 'implements',
      implements: 'implements',
      test: 'tests',
      tests: 'tests',
      verify: 'verifies',
      verifies: 'verifies',
      document: 'documents',
      documents: 'documents',
      depend: 'depends',
      depends: 'depends',
      require: 'requires',
      requires: 'requires',
    };
    // Try exact match first, then lowercase
    return mapping[macro] ?? mapping[macro.toLowerCase()] ?? null;
  }

  private parseRequirement(
    block: string,
    id: string,
    sourceFile: string,
    position: number,
  ): Requirement {
    const title = block.match(/title="([^"]+)"/)?.[1] ?? `Requirement ${id}`;
    const status = block.match(/status=([^,\s\]]+)/)?.[1] ?? 'draft';

    if (!/^[A-Z]{2,4}-[0-9]+$/.test(id)) {
      console.warn(`⚠️  Non-standard requirement ID format: ${id}`);
    }

    return {
      id,
      title,
      content: this.extractBody(block),
      status,
      attributes: { id, title, status },
      sourceFile,
      sourceLine: this.lineAt(block, position),
    };
  }

  private parseImplementation(
    block: string,
    id: string,
    sourceFile: string,
    position: number,
  ): Implementation {
    const title = block.match(/title="([^"]+)"/)?.[1] ?? `Implementation ${id}`;
    const status = block.match(/status=([^,\s\]]+)/)?.[1] ?? 'draft';

    if (!/^[A-Z]{2,4}-[0-9]+$/.test(id)) {
      console.warn(`⚠️  Non-standard implementation ID format: ${id}`);
    }

    return {
      id,
      title,
      content: this.extractBody(block),
      status,
      attributes: { id, title, status },
      sourceFile,
      sourceLine: this.lineAt(block, position),
    };
  }

  private parseTest(
    block: string,
    id: string,
    sourceFile: string,
    position: number,
  ): Test {
    const title = block.match(/title="([^"]+)"/)?.[1] ?? `Test ${id}`;
    const status = block.match(/status=([^,\s\]]+)/)?.[1] ?? 'draft';

    if (!/^[A-Z]{2,4}-[0-9]+$/.test(id)) {
      console.warn(`⚠️  Non-standard test ID format: ${id}`);
    }

    return {
      id,
      title,
      content: this.extractBody(block),
      status,
      attributes: { id, title, status },
      sourceFile,
      sourceLine: this.lineAt(block, position),
    };
  }

  private parseDocument(
    block: string,
    id: string,
    sourceFile: string,
    position: number,
  ): Document {
    const title = block.match(/title="([^"]+)"/)?.[1] ?? `Document ${id}`;
    const status = block.match(/status=([^,\s\]]+)/)?.[1] ?? 'draft';

    if (!/^[A-Z]{2,4}-[0-9]+$/.test(id)) {
      console.warn(`⚠️  Non-standard document ID format: ${id}`);
    }

    return {
      id,
      title,
      content: this.extractBody(block),
      status,
      attributes: { id, title, status },
      sourceFile,
      sourceLine: this.lineAt(block, position),
    };
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

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
}
