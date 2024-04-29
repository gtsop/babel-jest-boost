const nodepath = require('path');

function trace_export_all_declaration(state, specifierName, codeFilePath, resolve) {
  if (specifierName === 'default') return {};
  return {
    ExportAllDeclaration(path) {
      // export * from './original.js'
      state.traces.push({
        name: specifierName,
        source: resolve(path.node, nodepath.dirname(codeFilePath)),
        file: codeFilePath,
      })
    }
  }
}

module.exports = { trace_export_all_declaration };
