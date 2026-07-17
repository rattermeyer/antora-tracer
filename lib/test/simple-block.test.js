"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const core_1 = __importDefault(require("@asciidoctor/core"));
const Asciidoctor = core_1.default;
describe('Asciidoctor Block Processor Basics', function () {
    it('should create and register a simple block processor', function () {
        const registry = Asciidoctor.Extensions.create();
        // Create block processor using factory method
        const MyBlockProcessor = Asciidoctor.Extensions.createBlockProcessor(function () {
            this.name = 'myblock';
            this.contentModel = 'compound';
            this.process = function (parent, reader, attributes) {
                const lines = [];
                while (reader.hasMoreLines()) {
                    const line = reader.getLine();
                    if (line === null || line.trim() === '') {
                        break;
                    }
                    lines.push(line);
                }
                const content = lines.join('\n');
                const block = this.createBlock(parent, 'paragraph', {});
                const paragraph = this.createParagraph(block, `MyBlock: ${content}`);
                return block;
            };
        });
        // Register the processor
        registry.block(MyBlockProcessor);
        // Test it
        const content = `
[myblock]
====
This is my custom block content.
====
`;
        const result = Asciidoctor.convert(content, {
            extension_registry: registry,
            safe: 'safe'
        });
        (0, chai_1.expect)(result).to.contain('MyBlock:');
    });
});
