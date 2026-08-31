"use strict";

const assembler = require("@antora/assembler");
const converter = require("./antora-docx-converter.cjs");

module.exports.register = (context, extConfig) => {
  const files = extConfig?.config?.configFiles;
  if (!files) return;
  return assembler.configure(context, converter, { configFiles: files });
};
