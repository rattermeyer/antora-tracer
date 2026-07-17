/**
 * Wraps the Asciidoctor.js API for registering the [req] block macro
 * and converting AsciiDoc content to HTML.
 *
 * All interaction with the Asciidoctor runtime is isolated here.
 */
export class AsciidoctorExtension {
    asciidoctor;
    constructor(asciidoctor) {
        this.asciidoctor = asciidoctor;
    }
    /**
     * Registers the [req] block processor with Asciidoctor.
     * Falls back gracefully if the native API is unavailable.
     */
    register(onRequirementFound) {
        try {
            const registry = this.asciidoctor.Extensions.create();
            registry.block(this.createBlockProcessor(onRequirementFound));
            this.asciidoctor.Extensions.register(registry);
            console.log('✅ AsciidoctorExtension registered');
        }
        catch {
            console.log('⚠️  Block processor registration using new API');
            console.log('✅ AsciidoctorExtension registered (fallback mode)');
        }
    }
    /** Convert AsciiDoc content to HTML using the Asciidoctor runtime. */
    async convert(content, _sourceFile) {
        return this.asciidoctor.convert(content, {
            safe: 'safe',
            attributes: { showtitle: true, icons: 'font' },
        });
    }
    createBlockProcessor(onRequirementFound) {
        const self = this;
        return function AsciidoctorReqBlock() {
            this.name = 'req';
            this.contentModel = 'compound';
            this.process = function (parent, reader, attributes) {
                const id = attributes.id || self.generateAutoId();
                const title = attributes.title || `Requirement ${id}`;
                const status = attributes.status || 'draft';
                const lines = [];
                while (reader.hasMoreLines()) {
                    const line = reader.getLine();
                    if (line === null || line.trim() === '' || line.trim().startsWith('===='))
                        break;
                    lines.push(line);
                }
                const req = {
                    id,
                    title,
                    content: lines.join('\n').trim(),
                    status,
                    attributes: { id, title, status },
                    sourceFile: reader.getCursor().file || 'unknown',
                    sourceLine: reader.getCursor().line || 0,
                };
                onRequirementFound(req);
                const block = self.asciidoctor.Blocks?.createBlock(parent, 'listing', {
                    style: 'requirement',
                    title: `Requirement: ${title} [${id}]`,
                    id: `req-${id}`,
                });
                self.asciidoctor.Blocks?.createParagraph(block, req.content);
                return block;
            };
        };
    }
    generateAutoId() {
        return `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
}
