function traverse_export_default(state, specifierName, codeFilePath) {
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

module.exports = { traverse_export_default };
