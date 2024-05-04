/*
 * List of syntaxes to be tested are sourced from MDN
 *
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export#syntax
 */

const {
  trace_export_named_declaration,
} = require("./trace_export_named_declaration");
const { babelParse } = require("../utils");
const babelTraverse = require("@babel/traverse").default;

function traverse(code, visitors) {
  const ast = babelParse(code);
  return babelTraverse(ast, visitors);
}

function expectState(code, specifier, expectedState) {
  const state = { match: false, traces: [] };
  const visitor = trace_export_named_declaration(
    state,
    specifier,
    "./source.js",
    (p) => p,
  );
  traverse(code, { ...visitor });
  expect(state.match).toEqual(expectedState.match);
  expect(state.traces).toEqual(expectedState.traces);
}

function expectMatch(code, specifier) {
  expectState(code, specifier, {
    match: {
      name: specifier,
      source: "./source.js",
      file: "./source.js",
    },
    traces: [],
  });
}

function expectTrace(code, specifier, traceName = specifier) {
  expectState(code, specifier, {
    match: false,
    traces: [
      {
        name: traceName,
        source: "./origin.js",
        file: "./source.js",
      },
    ],
  });
}

describe("trace/trace_export_named_declaration", function () {
  it("matches named declaration exports", () => {
    expectMatch("export let specifier", "specifier");
    expectMatch("export const specifier = 1;", "specifier");
    expectMatch("export function specifier() {}", "specifier");
    expectMatch("export class specifier {}", "specifier");
    expectMatch("export function* specifier() {}", "specifier");
    expectMatch("export const { specifier } = o;", "specifier");
    expectMatch("export const { one: specifier } = o;", "specifier");
    expectMatch("export const [ specifier ] = array;", "specifier");
  });

  it("matches export lists", () => {
    expectMatch("const specifier = 1; export { specifier };", "specifier");
    expectMatch(
      "const one = 1;       export { one as specifier }",
      "specifier",
    );
    expectMatch(
      "const one = 1;       export { one as 'specifier' }",
      "specifier",
    );
    expectMatch("const one = 1;       export { one as default }", "default");
  });

  it("traces module aggregations (aka re-exports, aka barels)", () => {
    expectState("export * as specifier from './origin.js'", "specifier", {
      match: { name: "*", source: "./origin.js", file: "./source.js" },
      traces: [],
    });
    expectTrace("export { specifier } from './origin.js';", "specifier");
    expectTrace(
      "export { one as specifier } from './origin.js';",
      "specifier",
      "one",
    );
    expectTrace("export { default } from './origin.js';", "default");
    expectTrace(
      "export { default as specifier } from './origin.js';",
      "specifier",
      "default",
    );
  });
});
