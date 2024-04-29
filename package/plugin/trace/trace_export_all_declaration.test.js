const { trace_export_all_declaration } = require('./trace_export_all_declaration');
const { babelParse } = require('../utils');
const babelTraverse = require('@babel/traverse').default;

let state = {};

function traverse(code, visitors) {
  const ast = babelParse(code);
  return babelTraverse(ast, visitors);
}

describe('trace/trace_export_all_declaration', function() {

  beforeEach(function() {
    state = new Object({ match: false, traces: new Array() });
  });

  it('does not return a visitor when the specifier is "default"', function() {
    expect(trace_export_all_declaration(state, 'default', 'source.js')).toEqual({});
  });

  it('returns an "ExportAllDeclaration" visitor when specifier is not "default"', function() {

    const visitor = trace_export_all_declaration(state, 'specifier', 'source.js')

    expect(visitor.ExportAllDeclaration).toBeInstanceOf(Function);
  });


  describe('export * from "./original"', () => {
    it('traces specifier to glob exports', function() {

      const visitor = trace_export_all_declaration(state, 'specifier', 'source.js', (p) => p.source.value);

      traverse('export * from "./original"', { ...visitor });

      expect(state.match).toEqual(false);
      expect(state.traces).toEqual([{
        name: 'specifier',
        source: './original',
        file: 'source.js'
      }])
    });
  });
});
