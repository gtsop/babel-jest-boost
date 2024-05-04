const fs = require('fs');
const traverse = require('@babel/traverse').default;
const babelParser = require('@babel/parser');

const { trace_export_default } = require('./trace/trace_export_default');
const { trace_export_named_declaration } = require('./trace/trace_export_named_declaration');
const { trace_export_all_declaration } = require('./trace/trace_export_all_declaration');

const parserConfig = {
  sourceType: 'module',
  plugins: ['jsx', 'tsx', 'typescript', 'decorators-legacy'],
};

class Tracer {

  constructor(resolve) {
    this.resolve = resolve;
  }

  codeFileToAST(codeFilePath) {
    const resolvedPath = this.resolve(codeFilePath);

    const code = fs.readFileSync(resolvedPath, 'utf-8');

    return this.codeToAST(code);
  }

  codeToAST(code) {
    return babelParser.parse(code, parserConfig);
  }

  traceOriginalExport(specifierName, codeFilePath) {
    const ast = this.codeFileToAST(codeFilePath);

    if (!ast) {
      return false;
    }

    const state = {
      match: false,
      traces: []
    }

    traverse(ast, {
      ...trace_export_default(state, specifierName, codeFilePath, this.resolve),
      ...trace_export_named_declaration(state, specifierName, codeFilePath, this.resolve),
      ...trace_export_all_declaration(state, specifierName, codeFilePath, this.resolve),
    });

    if (state.match) {
      return state.match;
    } else if (state.traces.length) {
      let tracedMatch = null;
      state.traces.some((trace) => {
        const result = this.traceOriginalExport(trace.name, trace.source)
        if (result?.source) {
          tracedMatch = result;
          return true;
        }
        return false;
      })
      return tracedMatch
    } else {
      return false;
    }
  }
}

module.exports = { Tracer };
