const pdfExt = require("@antora/pdf-extension");

module.exports.register = (context, extConfig) => {
  // Merge config_files from the playbook extension entry into context.config
  // so the assembler's configure.js can find configFiles.
  const files = extConfig?.config?.configFiles;
  if (files) {
    context.config = Object.assign(context.config || {}, { configFiles: files });
  }
  return pdfExt.register.call(context, context);
};
