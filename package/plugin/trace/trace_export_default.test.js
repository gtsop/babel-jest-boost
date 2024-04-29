const { trace_export_default } = require('./trace_export_default');
const { babelParse } = require('../utils');
const traverse = require('@babel/traverse').default;

let state = {};
describe('trace/trace_export_default', function() {

  beforeEach(function() {
    state = new Object();
  });

  it('does not return a visitor when the specifier is not "default"', function() {
    expect(trace_export_default(state, 'foo', 'foo.js')).toEqual({});
  });

  it('returns an "ExportDefaultDeclaration" visitor when specifier is "default"', function() {

    const visitor = trace_export_default(state, 'default', 'foo.js')

    expect(visitor.ExportDefaultDeclaration).toBeInstanceOf(Function);
  });


  it('sets "match" on the state object when used as an AST visitor', function() {

    const code = 'export default foo';

    const ast = babelParse(code);

    const visitor = trace_export_default(state, 'default', 'foo.js');

    traverse(ast, { ...visitor });

    expect(state.match).toEqual({
      name: 'default',
      source: 'foo.js',
      file: 'foo.js'
    })
  });
});
