// CommonJS wrapper for ESM antora-extension
// Antora uses require(), which returns the ESM namespace object
// Antora expects { register } object

const esm = require('./antora-extension.js');

// Export the register function (Antora API)
module.exports = esm.default || esm;
