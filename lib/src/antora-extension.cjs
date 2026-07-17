// CommonJS wrapper for the ESM antora-extension
// This allows Antora to load the extension using require()

module.exports = async function (context) {
  // Dynamically import the ESM module
  const { default: extension } = await import('./antora-extension.js');

  // If extension is a function, call it with context
  if (typeof extension === 'function') {
    return extension.call(this, context);
  }

  // If extension is an object with register method, call it
  if (extension && typeof extension.register === 'function') {
    return extension.register.call(this, context);
  }

  return extension;
};
