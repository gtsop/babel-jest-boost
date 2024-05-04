/*
 * List of syntaxes to be tested are sourced from MDN
 *
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export#syntax
 */
const { trace_export_all_declaration } = require('./trace_export_all_declaration');
const { babelParse } = require('../utils');
const babelTraverse = require('@babel/traverse').default;

function traverse(code, visitors) {
  const ast = babelParse(code);
  return babelTraverse(ast, visitors);
}

function expectState(code, specifier, expectedState) {
  const state = { match: false, traces: [] };
  const visitor = trace_export_all_declaration(state, specifier, './source.js', (p) => p)
  traverse(code, { ...visitor });
  expect(state.match).toEqual(expectedState.match);
  expect(state.traces).toEqual(expectedState.traces);
}

function expectTrace(code, specifier, traceName = specifier) {
  expectState(code, specifier, {
    match: false,
    traces: [{
      name: traceName,
      source: './origin.js',
      file: './source.js'
    }],
  })
}

describe('trace/trace_export_all_declaration', function() {

  it("traces namespace exports", () => {
    expectTrace("export * from './origin.js';", "specifier")
  })
});
