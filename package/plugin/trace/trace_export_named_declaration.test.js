const { trace_export_named_declaration } = require('./trace_export_named_declaration');
const { babelParse } = require('../utils');
const traverse = require('@babel/traverse').default;

let state = {};
describe('trace/trace_export_named_declaration', function() {

  beforeEach(function() {
    state = new Object({ match: false, traces: new Array() });
  });

  it('does not return a visitor when the specifier is "default"', function() {
    expect(trace_export_named_declaration(state, 'default', 'foo.js', () => { })).toEqual({});
  });

  it('returns an "ExportNamedDeclaration" visitor when specifier is not "default"', function() {

    const visitor = trace_export_named_declaration(state, 'foo', 'foo.js')

    expect(visitor.ExportNamedDeclaration).toBeInstanceOf(Function);
  });

  describe('export const foo = bar', function() {
    it('matches specifier when it exists', function() {

      const code = 'export const foo = bar';
      const codeFile = 'foo.js'

      const ast = babelParse(code);

      const visitor = trace_export_named_declaration(state, 'foo', codeFile, () => { });

      traverse(ast, { ...visitor });

      expect(state.match).toEqual({
        name: 'foo',
        source: 'foo.js',
        file: 'foo.js'
      })
      expect(state.traces).toEqual([])
    });

    it('does not match specifier when it does not exist', function() {

      const code = 'export const foo = bar';
      const codeFile = 'foo.js'

      const ast = babelParse(code);

      const visitor = trace_export_named_declaration(state, 'bar', codeFile, () => { });

      traverse(ast, { ...visitor });

      expect(state.match).toEqual(false)
      expect(state.traces).toEqual([])
    });
  })

  describe("export { foo } from './foo.js'", function() {
    it('traces specifier when it exists', function() {

      const code = 'export { foo } from "./foo.js"';
      const codeFile = 'bar.js';

      const ast = babelParse(code);

      const visitor = trace_export_named_declaration(state, 'foo', codeFile, (p) => p.source.value);

      traverse(ast, { ...visitor });

      expect(state.match).toEqual(false)
      expect(state.traces).toEqual([{ name: 'foo', source: './foo.js', file: 'bar.js' }]);
    });

    it('does not trace specifiers that do not exist', function() {
      const code = 'export { foo } from "./foo.js"';
      const codeFile = 'bar.js';

      const ast = babelParse(code);

      const visitor = trace_export_named_declaration(state, 'bar', codeFile, (p) => p.source.value);

      traverse(ast, { ...visitor });

      expect(state.match).toEqual(false)
      expect(state.traces).toEqual([]);
    });
  })

  describe('export { foo }', function() {

    it('matches specifier when it exists', function() {
      const code = 'const foo = () => {}; export { foo };';
      const codeFile = 'bar.js';

      const ast = babelParse(code);

      const visitor = trace_export_named_declaration(state, 'foo', codeFile, (p) => p.source.value);

      traverse(ast, { ...visitor });

      expect(state.match).toEqual({ name: 'foo', source: 'bar.js', file: 'bar.js' })
      expect(state.traces).toEqual([]);
    });
  });


});
