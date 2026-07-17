// Shared types and interfaces for requirements traceability

export interface TraceableNode {
  id: string;
  title: string;
  content?: string;
  status?: string;
  attributes?: Record<string, string>;
  sourceFile?: string;
  sourceLine?: number;
}

export interface Requirement extends TraceableNode {
  content: string;
  status: string;
  attributes: Record<string, string>;
  sourceFile: string;
  sourceLine: number;
}

export interface Implementation extends TraceableNode {}
export interface Test extends TraceableNode {}
export interface Document extends TraceableNode {}

export type AnyNode = Requirement | Implementation | Test | Document;

export type RelationshipType =
  | 'implements'
  | 'satisfies'
  | 'tests'
  | 'verifies'
  | 'documents'
  | 'depends'
  | 'requires';

export interface Relationship {
  fromId: string;
  targetId: string;
  type: RelationshipType;
}

export interface CoverageReport {
  totalRequirements: number;
  requirementsWithImplementation: number;
  requirementsWithTests: number;
  implementationCoverage: number;
  testCoverage: number;
}

export interface RequirementRow {
  id: string;
  title: string;
  implementations: string[];
  tests: string[];
}

export interface RequirementDetail {
  id: string;
  title: string;
  status: string;
  satisfiedBy: string[];
  implementedBy: string[];
  testedBy: string[];
  verifiedBy: string[];
  documentedBy: string[];
}

export interface ImplementationDetail {
  id: string;
  title: string;
  satisfies: string[];
  testedBy: string[];
}

export interface TestDetail {
  id: string;
  title: string;
  verifies: string[];
  tests: string[];
}

export interface TraceabilityMatrix {
  type: string;
  coverage: CoverageReport;
  requirements: RequirementRow[];
  generatedAt: string;
}

export interface DetailedTraceabilityMatrix {
  type: string;
  coverage: CoverageReport;
  uncoveredRequirements: string[];
  requirements: RequirementDetail[];
  implementations: ImplementationDetail[];
  tests: TestDetail[];
  generatedAt: string;
}

export interface ProcessOptions {
  sourceFile?: string;
}
