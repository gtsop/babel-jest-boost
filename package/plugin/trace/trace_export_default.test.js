/*
 * List of syntaxes to be tested are sourced from MDN
 *
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export#syntax
 */
const { trace_export_default } = require('./trace_export_default');
const { babelParse } = require('../utils');
const babelTraverse = require('@babel/traverse').default;

function traverse(code, visitors) {
  const ast = babelParse(code);
  return babelTraverse(ast, visitors);
}

function expectState(code, specifier, expectedState) {
  const state = { match: false, traces: [] };
  const visitor = trace_export_default(state, specifier, './source.js', (p) => p)
  traverse(code, { ...visitor });
  expect(state.match).toEqual(expectedState.match);
  expect(state.traces).toEqual(expectedState.traces);
}

function expectMatch(code, specifier = "default") {
  expectState(code, specifier, {
    match: {
      name: specifier,
      source: './source.js',
      file: './source.js'
    },
    traces: []
  })
}

describe('trace/trace_export_default', function() {

  it("matches default exports", () => {
    expectMatch("export default 1;")
    expectMatch("export default function specifier () {}")
    expectMatch("export default class Specifier {}")
    expectMatch("export default function* specifier() {}")
    expectMatch("export default function () {}")
    expectMatch("export default class {}")
    expectMatch("export default function* () {}")
  })
});
