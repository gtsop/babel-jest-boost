const { trace_export_default } = require('./trace_export_default');
const { babelParse } = require('../utils');
const babelTraverse = require('@babel/traverse').default;

let state = {};

function traverse(code, visitors) {
  const ast = babelParse(code);
  return babelTraverse(ast, visitors);
}

describe('trace/trace_export_default', function() {

  beforeEach(function() {
    state = new Object({ match: false, traces: new Array() });
  });

  it('does not return a visitor when the specifier is not "default"', function() {
    expect(trace_export_default(state, 'none', 'source.js')).toEqual({});
  });

  it('returns an "ExportDefaultDeclaration" visitor when specifier is "default"', function() {

    const visitor = trace_export_default(state, 'default', 'source.js')

    expect(visitor.ExportDefaultDeclaration).toBeInstanceOf(Function);
  });


  describe('export default specifier', () => {
    it('matches specifier when it exists', function() {

      const visitor = trace_export_default(state, 'default', 'source.js');

      traverse('export default specifier', { ...visitor });

      expect(state.match).toEqual({
        name: 'default',
        source: 'source.js',
        file: 'source.js'
      })
      expect(state.traces).toEqual([]);
    });

    it('does not match specifier when it does not exist', function() {
      const visitor = trace_export_default(state, 'none', 'source.js');

      traverse('export default specifier', { ...visitor });

      expect(state.match).toEqual(false)
      expect(state.traces).toEqual([]);
    });
  });
});
