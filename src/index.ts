// Main entry point for the requirements traceability extension
import Asciidoctor from '@asciidoctor/core';

interface Requirement {
  id: string;
  title: string;
  content: string;
  status: string;
  attributes: Record<string, string>;
  sourceFile: string;
  sourceLine: number;
  relationships: Relationship[];
}

interface Implementation {
  id: string;
  title: string;
  content?: string;
  status?: string;
  attributes?: Record<string, string>;
  sourceFile?: string;
  sourceLine?: number;
  relationships?: Relationship[];
}

interface Test {
  id: string;
  title: string;
  content?: string;
  status?: string;
  attributes?: Record<string, string>;
  sourceFile?: string;
  sourceLine?: number;
  relationships?: Relationship[];
}

interface Document {
  id: string;
  title: string;
  content?: string;
  status?: string;
  attributes?: Record<string, string>;
  sourceFile?: string;
  sourceLine?: number;
  relationships?: Relationship[];
}

interface Relationship {
  fromId: string;
  targetId: string;
  type: string;
}

interface CoverageReport {
  totalRequirements: number;
  requirementsWithImplementation: number;
  requirementsWithTests: number;
  implementationCoverage: number;
  testCoverage: number;
}

interface TraceabilityGraph {
  requirements: Map<string, Requirement>;
  implementations: Map<string, Implementation>;
  tests: Map<string, Test>;
  documents: Map<string, Document>;
  relationships: Map<string, Relationship>;
  
  addRequirement: (req: Requirement) => void;
  addImplementation: (imp: Implementation) => void;
  addTest: (test: Test) => void;
  addDocument: (doc: Document) => void;
  addRelationship: (fromId: string, relationship: Relationship) => void;
  getRequirement: (id: string) => Requirement | undefined;
  getImplementation: (id: string) => Implementation | undefined;
  getTest: (id: string) => Test | undefined;
  getDocument: (id: string) => Document | undefined;
  getNodeById: (id: string) => Requirement | Implementation | Test | Document | undefined;
  getRelationships: (id: string, type?: string) => Relationship[];
  getReverseRelationships: (id: string, type?: string) => Relationship[];
  getCoverage: () => CoverageReport;
  getRequirementsWithImplementations: () => Set<string>;
  getRequirementsWithTests: () => Set<string>;
  getUncoveredRequirements: () => Requirement[];
  findPath: (fromId: string, toId: string, maxDepth?: number) => string[] | null;
  findPathRecursive: (currentId: string, targetId: string, visited: string[], maxDepth: number) => string[] | null;
  getImpactAnalysis: (id: string) => string[];
}

class RequirementsTraceabilityExtension {
  private asciidoctor: any;
  public requirements: Map<string, Requirement>;
  public implementations: Map<string, Implementation>;
  public tests: Map<string, Test>;
  public documents: Map<string, Document>;
  public relationships: Map<string, Relationship>;
  public currentFile: string | null;
  public graph: TraceabilityGraph;

  constructor() {
    this.asciidoctor = Asciidoctor;
    this.requirements = new Map();
    this.implementations = new Map();
    this.tests = new Map();
    this.documents = new Map();
    this.relationships = new Map();
    this.currentFile = null;
    this.graph = this.createTraceabilityGraph();
  }

  // Register the extension with Asciidoctor
  register(): any {
    try {
      const registry = this.asciidoctor.Extensions.create();
      
      // Register the custom block processor for [req] macro
      const ReqBlockProcessor = this.createReqBlockProcessor();
      registry.block(ReqBlockProcessor);
      
      // Register the extension
      this.asciidoctor.Extensions.register(registry);
      console.log('✅ RequirementsTraceabilityExtension registered');
      return registry;
    } catch (error) {
      console.log('⚠️  Block processor registration using new API');
      // Fallback: register using alternative method for compatibility
      this.registerFallback();
      return null;
    }
  }

  // Fallback registration method for compatibility
  registerFallback(): void {
    console.log('✅ RequirementsTraceabilityExtension registered (fallback mode)');
    // In fallback mode, we'll process requirements manually
  }

  // Create the custom block processor for [req] macro
  createReqBlockProcessor(): any {
    const self = this;
    
    return function ReqBlockProcessor(this: any) {
      this.name = 'req';
      this.contentModel = 'compound';
      
      this.process = function(parent: any, reader: any, attributes: any) {
        // Extract requirement attributes
        const id = attributes.id || self.generateAutoId();
        const title = attributes.title || `Requirement ${id}`;
        const status = attributes.status || 'draft';
        const sourceFile = self.getSourceFile(reader);
        const sourceLine = self.getSourceLine(reader);

        // Parse the requirement content
        const lines: string[] = [];
        while (reader.hasMoreLines()) {
          const line = reader.getLine();
          if (line === null || self.isTerminator(line)) {
            break;
          }
          lines.push(line);
        }
        const content = lines.join('\n').trim();

        // Store the requirement
        const requirement: Requirement = {
          id,
          title,
          content,
          status,
          attributes: { id, title, status },
          sourceFile,
          sourceLine,
          relationships: []
        };

        self.requirements.set(id, requirement);
        console.log(`📝 Requirement registered: ${id} - ${title}`);

        // Create the block element
        const block = self.createBlock(parent, 'listing', {
          style: 'requirement',
          title: `Requirement: ${title} [${id}]`,
          id: `req-${id}`
        });
        
        // Add content to the block
        self.createParagraph(block, content);
        
        return block;
      };
    };
  }

  // Process AsciiDoc content
  async process(content: string, options: { sourceFile?: string } = {}): Promise<string> {
    this.currentFile = options.sourceFile || 'input';
    console.log(`🔄 Processing: ${this.currentFile}`);
    
    try {
      // First, parse requirements manually
      this.parseRequirementsFromContent(content);
      
      // Then convert the content using Asciidoctor
      const result = await this.asciidoctor.convert(content, {
        safe: 'safe',
        attributes: {
          'showtitle': true,
          'icons': 'font'
        }
      });
      
      console.log(`✅ Processing complete: ${this.requirements.size} requirements found`);
      return result;
    } catch (error: any) {
      console.error('❌ Processing error:', error.message);
      throw error;
    }
  }

  // Process AsciiDoc content synchronously (for testing)
  processSync(content: string, options: { sourceFile?: string } = {}): string {
    this.currentFile = options.sourceFile || 'input';
    console.log(`🔄 Processing: ${this.currentFile}`);
    
    try {
      // First, parse requirements manually
      this.parseRequirementsFromContent(content);
      
      // Then convert the content using Asciidoctor
      const result = this.asciidoctor.convert(content, {
        safe: 'safe',
        attributes: {
          'showtitle': true,
          'icons': 'font'
        }
      });
      
      console.log(`✅ Processing complete: ${this.requirements.size} requirements found`);
      return result;
    } catch (error: any) {
      console.error('❌ Processing error:', error.message);
      throw error;
    }
  }

  // Parse requirements from content manually
  parseRequirementsFromContent(content: string): void {
    // First pass: find requirements with explicit IDs
    const reqRegex = /\[req,[\s]*id=([A-Z0-9_-]+)/g;
    let match: RegExpExecArray | null;
    
    while ((match = reqRegex.exec(content)) !== null) {
      const id = match[1];
      const startIndex = match.index;
      
      // Check for duplicate IDs
      if (this.requirements.has(id)) {
        throw new Error(`Duplicate requirement ID: ${id}`);
      }
      
      // Find the end of the block (next ====)
      const blockEnd = content.indexOf('====', startIndex + 1);
      if (blockEnd === -1) continue;
      
      const blockEnd2 = content.indexOf('====', blockEnd + 4);
      if (blockEnd2 === -1) continue;
      
      const blockContent = content.substring(startIndex, blockEnd2 + 4);
      
      // Extract title and other attributes
      const titleMatch = blockContent.match(/title="([^"]+)"/);
      const title = titleMatch ? titleMatch[1] : `Requirement ${id}`;
      
      const statusMatch = blockContent.match(/status=([^,\s\]]+)/);
      const status = statusMatch ? statusMatch[1] : 'draft';
      
      // Validate ID format
      if (!/^[A-Z]{2,4}-[0-9]+$/.test(id)) {
        console.warn(`⚠️  Non-standard requirement ID format: ${id}`);
      }
      
      // Extract content between ====
      const contentStart = blockContent.indexOf('====', 0) + 4;
      const contentEnd = blockContent.lastIndexOf('====');
      const reqContent = blockContent.substring(contentStart, contentEnd).trim();
      
      // Store the requirement
      const requirement: Requirement = {
        id,
        title,
        content: reqContent,
        status,
        attributes: { id, title, status },
        sourceFile: this.currentFile || 'unknown',
        sourceLine: this.estimateLineNumber(content, match.index),
        relationships: []
      };
      
      this.requirements.set(id, requirement);
      console.log(`📝 Requirement registered: ${id} - ${title}`);
    }
    
    // Second pass: find requirements without IDs and generate auto IDs
    const reqNoIdRegex = /\[req(?!.*id=)/g;
    while ((match = reqNoIdRegex.exec(content)) !== null) {
      const startIndex = match.index;
      
      // Find the end of the block (next ====)
      const blockEnd = content.indexOf('====', startIndex + 1);
      if (blockEnd === -1) continue;
      
      const blockEnd2 = content.indexOf('====', blockEnd + 4);
      if (blockEnd2 === -1) continue;
      
      const blockContent = content.substring(startIndex, blockEnd2 + 4);
      
      // Generate auto ID
      const autoId = this.generateAutoId();
      
      // Extract title
      const titleMatch = blockContent.match(/title="([^"]+)"/);
      const title = titleMatch ? titleMatch[1] : `Requirement ${autoId}`;
      
      // Extract content between ====
      const contentStart = blockContent.indexOf('====', 0) + 4;
      const contentEnd = blockContent.lastIndexOf('====');
      const reqContent = blockContent.substring(contentStart, contentEnd).trim();
      
      // Store the requirement
      const requirement: Requirement = {
        id: autoId,
        title,
        content: reqContent,
        status: 'draft',
        attributes: { id: autoId, title },
        sourceFile: this.currentFile || 'unknown',
        sourceLine: this.estimateLineNumber(content, match.index),
        relationships: []
      };
      
      this.requirements.set(autoId, requirement);
      console.log(`📝 Requirement registered: ${autoId} - ${title} (auto ID)`);
    }
  }

  // Create traceability graph
  createTraceabilityGraph(): TraceabilityGraph {
    const self = this;
    const graph: any = {
      requirements: self.requirements,
      implementations: self.implementations,
      tests: self.tests,
      documents: self.documents,
      relationships: self.relationships,
      
      // Graph methods
      addRequirement: (req: Requirement) => {
        self.requirements.set(req.id, req);
      },
      
      addImplementation: (imp: Implementation) => {
        self.implementations.set(imp.id, imp);
      },
      
      addTest: (test: Test) => {
        self.tests.set(test.id, test);
      },
      
      addDocument: (doc: Document) => {
        self.documents.set(doc.id, doc);
      },
      
      addRelationship: (fromId: string, relationship: Relationship) => {
        const key = `${fromId}-${relationship.targetId}-${relationship.type}`;
        self.relationships.set(key, relationship);
        
        // Add to source node's relationships
        const sourceNode = self.requirements.get(fromId) || 
                          self.implementations.get(fromId) || 
                          self.tests.get(fromId) || 
                          self.documents.get(fromId);
        if (sourceNode) {
          if (!sourceNode.relationships) {
            sourceNode.relationships = [];
          }
          sourceNode.relationships.push(relationship);
        }
      },
      
      getRequirement: (id: string): Requirement | undefined => {
        return self.requirements.get(id);
      },
      
      getImplementation: (id: string): Implementation | undefined => {
        return self.implementations.get(id);
      },
      
      getTest: (id: string): Test | undefined => {
        return self.tests.get(id);
      },
      
      getDocument: (id: string): Document | undefined => {
        return self.documents.get(id);
      },
      
      getNodeById: (id: string): Requirement | Implementation | Test | Document | undefined => {
        return self.requirements.get(id) || 
               self.implementations.get(id) || 
               self.tests.get(id) || 
               self.documents.get(id);
      },
      
      getRelationships: (id: string, type?: string): Relationship[] => {
        const relationships: Relationship[] = [];
        for (const [_key, rel] of self.relationships) {
          if (rel.fromId === id && (!type || rel.type === type)) {
            relationships.push(rel);
          }
        }
        return relationships;
      },
      
      getReverseRelationships: (id: string, type?: string): Relationship[] => {
        const relationships: Relationship[] = [];
        for (const [_key, rel] of self.relationships) {
          if (rel.targetId === id && (!type || rel.type === type)) {
            relationships.push(rel);
          }
        }
        return relationships;
      },
      
      getCoverage: (): CoverageReport => {
        const totalRequirements = self.requirements.size;
        const requirementsWithImpl = graph.getRequirementsWithImplementations();
        const requirementsWithTests = graph.getRequirementsWithTests();
        
        return {
          totalRequirements,
          requirementsWithImplementation: requirementsWithImpl.size,
          requirementsWithTests: requirementsWithTests.size,
          implementationCoverage: totalRequirements > 0 ? (requirementsWithImpl.size / totalRequirements) * 100 : 0,
          testCoverage: totalRequirements > 0 ? (requirementsWithTests.size / totalRequirements) * 100 : 0
        };
      },
      
      getRequirementsWithImplementations: (): Set<string> => {
        const reqsWithImpl = new Set<string>();
        for (const [_key, rel] of self.relationships) {
          if (rel.type === 'implements' || rel.type === 'satisfies') {
            reqsWithImpl.add(rel.targetId);
          }
        }
        return reqsWithImpl;
      },
      
      getRequirementsWithTests: (): Set<string> => {
        const reqsWithTests = new Set<string>();
        for (const [_key, rel] of self.relationships) {
          if (rel.type === 'tests' || rel.type === 'verifies') {
            reqsWithTests.add(rel.targetId);
          }
        }
        return reqsWithTests;
      },
      
      getUncoveredRequirements: (): Requirement[] => {
        const covered = new Set<string>([
          ...graph.getRequirementsWithImplementations(),
          ...graph.getRequirementsWithTests()
        ]);
        
        const uncovered: Requirement[] = [];
        for (const [id, req] of self.requirements) {
          if (!covered.has(id)) {
            uncovered.push(req);
          }
        }
        return uncovered;
      },
      
      findPath: (fromId: string, toId: string, maxDepth: number = 5): string[] | null => {
        return graph.findPathRecursive(fromId, toId, [], maxDepth);
      },
      
      findPathRecursive: (currentId: string, targetId: string, visited: string[], maxDepth: number): string[] | null => {
        if (visited.length > maxDepth) return null;
        if (visited.includes(currentId)) return null;
        
        const newVisited = [...visited, currentId];
        
        if (currentId === targetId) {
          return newVisited;
        }
        
        const relationships = graph.getRelationships(currentId);
        for (const rel of relationships) {
          const path = graph.findPathRecursive(rel.targetId, targetId, newVisited, maxDepth);
          if (path) {
            return path;
          }
        }
        
        return null;
      },
      
      getImpactAnalysis: (id: string): string[] => {
        const impacted = new Set<string>();
        const queue = [id];
        
        while (queue.length > 0) {
          const currentId = queue.shift();
          
          // Find what this node impacts (forward relationships)
          const relationships = graph.getRelationships(currentId);
          for (const rel of relationships) {
            if (!impacted.has(rel.targetId)) {
              impacted.add(rel.targetId);
              queue.push(rel.targetId);
            }
          }
          
          // Find what impacts this node (reverse relationships)
          const reverseRels = graph.getReverseRelationships(currentId);
          for (const rel of reverseRels) {
            if (!impacted.has(rel.fromId)) {
              impacted.add(rel.fromId);
              queue.push(rel.fromId);
            }
          }
        }
        
        return Array.from(impacted).filter(itemId => itemId !== id);
      }
    };
    
    return graph as TraceabilityGraph;
  }

  // Add an implementation to the graph
  addImplementation(imp: Implementation): void {
    this.graph.addImplementation(imp);
    console.log(`📝 Implementation registered: ${imp.id} - ${imp.title}`);
  }

  // Add a test to the graph
  addTest(test: Test): void {
    this.graph.addTest(test);
    console.log(`📝 Test registered: ${test.id} - ${test.title}`);
  }

  // Add a document to the graph
  addDocument(doc: Document): void {
    this.graph.addDocument(doc);
    console.log(`📝 Document registered: ${doc.id} - ${doc.title}`);
  }

  // Add a relationship between requirements
  addRelationship(fromId: string, toId: string, type: string = 'satisfies'): void {
    const relationship: Relationship = { 
      fromId: fromId, 
      targetId: toId, 
      type: type 
    };
    this.graph.addRelationship(fromId, relationship);
    console.log(`🔗 Relationship added: ${fromId} ${type} ${toId}`);
  }

  // Generate traceability matrices
  generateMatrix(type: string = 'req-impl'): any {
    console.log(`📊 Generating ${type} matrix`);
    
    const coverage = this.graph.getCoverage();
    
    const matrix = {
      type,
      coverage,
      requirements: Array.from(this.requirements.values()).map(req => ({
        id: req.id,
        title: req.title,
        implementations: this.graph.getRelationships(req.id, 'implements').map(r => r.fromId),
        tests: this.graph.getRelationships(req.id, 'tests').map(r => r.fromId)
      })),
      generatedAt: new Date().toISOString()
    };
    
    return matrix;
  }

  // Enhanced matrix generation with more details
  generateDetailedMatrix(type: string = 'full'): any {
    console.log(`📊 Generating detailed ${type} matrix`);
    
    const coverage = this.graph.getCoverage();
    const uncovered = this.graph.getUncoveredRequirements();
    
    return {
      type,
      coverage,
      uncoveredRequirements: uncovered.map(req => req.id),
      requirements: this.getRequirementsWithDetails(),
      implementations: this.getImplementationsWithDetails(),
      tests: this.getTestsWithDetails(),
      generatedAt: new Date().toISOString()
    };
  }

  // Get requirements with relationship details
  getRequirementsWithDetails(): any[] {
    const details: any[] = [];
    for (const [id, req] of this.requirements) {
      details.push({
        id: req.id,
        title: req.title,
        status: req.status,
        satisfiedBy: this.graph.getRelationships(id, 'satisfies').map(r => r.fromId),
        implementedBy: this.graph.getRelationships(id, 'implements').map(r => r.fromId),
        testedBy: this.graph.getRelationships(id, 'tests').map(r => r.fromId),
        verifiedBy: this.graph.getRelationships(id, 'verifies').map(r => r.fromId),
        documentedBy: this.graph.getRelationships(id, 'documents').map(r => r.fromId)
      });
    }
    return details;
  }

  // Get implementations with relationship details
  getImplementationsWithDetails(): any[] {
    const details: any[] = [];
    for (const [id, imp] of this.implementations) {
      details.push({
        id: imp.id,
        title: imp.title,
        satisfies: this.graph.getRelationships(id, 'satisfies').map(r => r.targetId),
        testedBy: this.graph.getRelationships(id, 'tests').map(r => r.fromId)
      });
    }
    return details;
  }

  // Get tests with relationship details
  getTestsWithDetails(): any[] {
    const details: any[] = [];
    for (const [id, test] of this.tests) {
      details.push({
        id: test.id,
        title: test.title,
        verifies: this.graph.getRelationships(id, 'verifies').map(r => r.targetId),
        tests: this.graph.getRelationships(id, 'tests').map(r => r.targetId)
      });
    }
    return details;
  }

  // Get coverage report
  getCoverageReport(): CoverageReport {
    return this.graph.getCoverage();
  }

  // Find impact analysis for a requirement
  getImpactAnalysis(id: string): string[] {
    return this.graph.getImpactAnalysis(id);
  }

  // Find path between two nodes
  findPath(fromId: string, toId: string): string[] | null {
    return this.graph.findPath(fromId, toId);
  }

  // Get uncovered requirements
  getUncoveredRequirements(): Requirement[] {
    return this.graph.getUncoveredRequirements();
  }

  // Helper method to get source file from reader
  getSourceFile(reader: any): string {
    return reader.getCursor().file || 'unknown';
  }

  // Helper method to get source line from reader
  getSourceLine(reader: any): number {
    return reader.getCursor().line || 0;
  }

  // Helper method to generate auto IDs
  generateAutoId(): string {
    return `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  // Helper method to check if line is terminator
  isTerminator(line: string): boolean {
    return line.trim() === '' || line.trim().startsWith('====');
  }

  // Helper method to create blocks
  createBlock(parent: any, context: string, attributes: any): any {
    return this.asciidoctor.Blocks.createBlock(parent, context, attributes);
  }

  // Helper method to create paragraphs
  createParagraph(parent: any, text: string): any {
    return this.asciidoctor.Blocks.createParagraph(parent, text);
  }

  // Estimate line number from character position
  estimateLineNumber(content: string, position: number): number {
    const before = content.substring(0, position);
    return (before.match(/\n/g) || []).length + 1;
  }

  // Validate requirement IDs
  validateRequirementId(id: string): void {
    if (!id || typeof id !== 'string') {
      throw new Error(`Invalid requirement ID: ${id}`);
    }
    
    if (this.requirements.has(id)) {
      throw new Error(`Duplicate requirement ID: ${id}`);
    }
    
    // Basic ID format validation
    if (!/^[A-Z]{2,4}-[0-9]+$/.test(id)) {
      console.warn(`⚠️  Non-standard requirement ID format: ${id}`);
    }
  }

  // Clear all data
  clear(): void {
    this.requirements.clear();
    this.implementations.clear();
    this.tests.clear();
    this.documents.clear();
    this.relationships.clear();
    this.currentFile = null;
  }
}

export = RequirementsTraceabilityExtension;