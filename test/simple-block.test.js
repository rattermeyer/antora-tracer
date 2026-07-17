const { expect } = require('chai');
const Asciidoctor = require('@asciidoctor/core');

describe('Asciidoctor Block Processor Basics', function() {
  it('should create and register a simple block processor', function() {
    const registry = Asciidoctor.Extensions.create();
    
    // Create block processor using factory method
    const MyBlockProcessor = Asciidoctor.Extensions.createBlockProcessor(function() {
      this.name = 'myblock';
      this.contentModel = 'compound';
      
      this.process = function(parent, reader, attributes) {
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
    
    expect(result).to.contain('MyBlock:');
  });
});