"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const index_1 = require("../src/index");
describe('Requirements Traceability Extension', function () {
    let extension;
    beforeEach(function () {
        extension = new index_1.RequirementsTraceabilityExtension();
    });
    it('should create an instance', function () {
        (0, chai_1.expect)(extension).to.be.an.instanceof(index_1.RequirementsTraceabilityExtension);
    });
    it('should expose the graph object', function () {
        (0, chai_1.expect)(extension.graph).to.be.an('object');
    });
    it('should have a process method', function () {
        (0, chai_1.expect)(extension.process).to.be.a('function');
    });
    it('should have a generateMatrix method', function () {
        (0, chai_1.expect)(extension.generateMatrix).to.be.a('function');
    });
});
describe('CLI', function () {
    it('should have basic CLI structure', function (done) {
        // This is a placeholder test
        // Actual CLI testing would require more complex setup
        done();
    });
});
