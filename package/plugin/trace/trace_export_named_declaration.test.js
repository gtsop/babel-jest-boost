const { trace_export_named_declaration } = require('./trace_export_named_declaration');
const { babelParse } = require('../utils');
const babelTraverse = require('@babel/traverse').default;

let state = {};

function traverse(code, visitors) {
  const ast = babelParse(code);
  return babelTraverse(ast, visitors);
}

describe('trace/trace_export_named_declaration', function() {

  beforeEach(function() {
    state = new Object({ match: false, traces: new Array() });
  });

  it('does not return a visitor when the specifier is "default"', function() {
    expect(trace_export_named_declaration(state, 'default', 'foo.js', () => { })).toEqual({});
  });

  it('returns an "ExportNamedDeclaration" visitor when specifier is not "default"', function() {

    const visitor = trace_export_named_declaration(state, 'specifier', 'source.js')

    expect(visitor.ExportNamedDeclaration).toBeInstanceOf(Function);
  });

  describe('export const specifier = 1', function() {
    it('matches specifier when it exists', function() {

      const visitor = trace_export_named_declaration(state, 'specifier', 'source.js', () => { });

      traverse('export const specifier = 1', { ...visitor });

      expect(state.match).toEqual({
        name: 'specifier',
        source: 'source.js',
        file: 'source.js'
      })
      expect(state.traces).toEqual([])
    });

    it('does not match specifier when it does not exist', function() {

      const visitor = trace_export_named_declaration(state, 'none', 'source.js', () => { });

      traverse('export const specifier = 1', { ...visitor });

      expect(state.match).toEqual(false)
      expect(state.traces).toEqual([])
    });
  })

  describe("export { specifier } from './original.js'", function() {
    it('traces specifier when it exists', function() {

      const visitor = trace_export_named_declaration(state, 'specifier', 'source.js', (p) => p);

      traverse('export { specifier } from "./original.js"', { ...visitor });

      expect(state.match).toEqual(false)
      expect(state.traces).toEqual([{ name: 'specifier', source: './original.js', file: 'source.js' }]);
    });

    it('does not trace specifiers that do not exist', function() {

      const visitor = trace_export_named_declaration(state, 'none', 'source.js', (p) => p);

      traverse('export { specifier } from "./original.js"', { ...visitor });

      expect(state.match).toEqual(false)
      expect(state.traces).toEqual([]);
    });
  })

  describe('export { specifier }', function() {

    it('matches specifier when it exists', function() {

      const visitor = trace_export_named_declaration(state, 'specifier', 'source.js', (p) => p);

      traverse('const specifier = () => {}; export { specifier };', { ...visitor });

      expect(state.match).toEqual({ name: 'specifier', source: 'source.js', file: 'source.js' })
      expect(state.traces).toEqual([]);
    });

    it('does not match specifier when it does not exist', function() {

      const visitor = trace_export_named_declaration(state, 'none', 'source.js', (p) => p);

      traverse('const specifier = () => {}; export { specifier };', { ...visitor });

      expect(state.match).toEqual(false)
      expect(state.traces).toEqual([]);
    });
  });

  describe('export const specifier = () => {}', function() {
    it('matches specifier when it exists', function() {

      const visitor = trace_export_named_declaration(state, 'specifier', 'source.js', (p) => p);

      traverse('export const specifier = () => {}', { ...visitor });

      expect(state.match).toEqual({ name: 'specifier', source: 'source.js', file: 'source.js' })
      expect(state.traces).toEqual([]);
    });

    it('does not match specifier when it does not exist', function() {

      const visitor = trace_export_named_declaration(state, 'none', 'source.js', (p) => p);

      traverse('export const specifier = () => {}', { ...visitor });

      expect(state.match).toEqual(false)
      expect(state.traces).toEqual([]);
    });
  });

  describe("export * as specifier from './original.js'", function() {
    it('matches specifier when it exists', function() {

      const visitor = trace_export_named_declaration(state, 'specifier', 'source.js', (p) => p);

      traverse("export * as specifier from './original.js'", { ...visitor });

      expect(state.match).toEqual({ name: 'specifier', source: 'source.js', file: 'source.js' })
      expect(state.traces).toEqual([]);
    });

    it('does not match specifier when it does not exist', function() {

      const visitor = trace_export_named_declaration(state, 'none', 'source.js', (p) => p);

      traverse("export * as specifier from './original.js'", { ...visitor });

      expect(state.match).toEqual(false)
      expect(state.traces).toEqual([]);
    });
  });

  describe("export { nestedSpecifier as specifier } from './original.js'", function () {

    it('matches specifier when it exists', function() {

      const visitor = trace_export_named_declaration(state, 'specifier', 'source.js', (p) => p);

      traverse("export { nestedSpecifier as specifier } from './original.js'", { ...visitor });

      expect(state.match).toEqual(false)
      expect(state.traces).toEqual([{ name: 'nestedSpecifier', source: './original.js', file: 'source.js' }]);
    });

    it('does not match specifier when it does not exist', function() {

      const visitor = trace_export_named_declaration(state, 'none', 'source.js', (p) => p);

      traverse("export { nestedSpecifier as specifier } from './original.js'", { ...visitor });

      expect(state.match).toEqual(false)
      expect(state.traces).toEqual([]);
    });
  })
});
