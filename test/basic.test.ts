import { expect } from 'chai';
import { RequirementsTraceabilityExtension } from '../src/index.js';

describe('Requirements Traceability Extension', function() {
  let extension: InstanceType<typeof RequirementsTraceabilityExtension>;

  beforeEach(function() {
    extension = new RequirementsTraceabilityExtension();
  });

  it('should create an instance', function() {
    expect(extension).to.be.an.instanceof(RequirementsTraceabilityExtension);
  });

  it('should expose the graph object', function() {
    expect(extension.graph).to.be.an('object');
  });

  it('should have a process method', function() {
    expect(extension.process).to.be.a('function');
  });

  it('should have a generateMatrix method', function() {
    expect(extension.generateMatrix).to.be.a('function');
  });
});

describe('CLI', function() {
  it('should have basic CLI structure', function(done) {
    // This is a placeholder test
    // Actual CLI testing would require more complex setup
    done();
  });
});