/*
 * Returns a visitor which catches default export of the following manner:
 *
 * function foo () {}
 *
 * export default foo; <-- Catches this
 */
function trace_export_default(state, specifierName, codeFilePath) {
  if (specifierName !== 'default') {
    return {};
  }

  return {
    ExportDefaultDeclaration() {
      state.match = {
        name: 'default',
        source: codeFilePath,
        file: codeFilePath,
      };
    }
  }
}

module.exports = { trace_export_default };
