const traverse = require('@babel/traverse').default;

const { trace_export_default } = require('./trace/trace_export_default');
const { trace_export_named_declaration } = require('./trace/trace_export_named_declaration');
const { trace_export_all_declaration } = require('./trace/trace_export_all_declaration');

class Tracer {
  construct(resolve, codeToAst) {
    this.resolve = resolve;
    this.codeToAst = codeToAst;
  }

  traceOriginalExport(specifierName, codeFilePath) {
    const ast = this.codeToAst(codeFilePath);

    if (!ast) {
      return false;
    }

    const state = {
      match: false,
      traces: []
    }

    traverse(ast, {
      ...trace_export_default(state, specifierName, codeFilePath),
      ...trace_export_named_declaration(state, specifierName, codeFilePath, this.resolve),
      ...trace_export_all_declaration(state, specifierName, codeFilePath, this.resolve),
    });

    if (state.traces.length) {
      return state.traces.find((trace) => this.traceOriginalExport(trace.name, trace.source));
    } else if (state.match) {
      return state.match;
    } else {
      return false;
    }
  }
}

module.exports = { Tracer };
