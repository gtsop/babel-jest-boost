const { babelParse } = require("../../utils");
const traverse = require("@babel/traverse").default;
const babelGenerate = require("@babel/generator").default;
const { extract_mocked_specifier } = require("./extract_mocked_specifier");
const {
  multilineTrim,
} = require("../../../../spec/test-utils/expectTransform");

function parse(code, callback) {
  const ast = babelParse(code);

  traverse(ast, {
    CallExpression(path) {
      if (path.node.callee?.property?.name === "mock") {
        if (path.node.arguments.length > 1) {
          callback(path);
        }
      }
    },
  });

  return ast;
}

function expectCodemod(code, codemod, expectedOutput) {
  const ast = parse(code, (path) => {
    return codemod(path);
  });

  const output = multilineTrim(babelGenerate(ast).code);
  console.log(output);
  expect(output).toBe(multilineTrim(expectedOutput));
}

describe("codemods/jest-mock/extract_mocked_specifier", () => {
  it("leaves code as is if there is only one key", () => {
    expectCodemod(
      `
      jest.mock('./origin.js', () => ({
        a: 'a'
      }));
      `,
      (path) => extract_mocked_specifier(path, "a", { name: "a" }),
      `
      jest.mock('./origin.js', () => ({
        a: 'a'
      }));
      `,
    );
  });

  it("extracts a separate jest.mock statement for a given specifier", () => {
    expectCodemod(
      `
      jest.mock('./origin.js', () => ({
        a: 'a',
        b: 'b'
      }));
      `,
      (path) => extract_mocked_specifier(path, "b", { name: "b" }),
      `
      jest.mock('./origin.js', () => ({
        b: 'b'
      }));
      jest.mock('./origin.js', () => ({
        a: 'a'
      }));
      `,
    );
  });

  it("can extract multiple specifiers", () => {
    expectCodemod(
      `
      jest.mock('./origin.js', () => ({
        a: 'a',
        b: 'b',
        c: 'c'
      }));
      `,
      (path) => {
        extract_mocked_specifier(path, "b", { name: "b" });
        extract_mocked_specifier(path, "c", { name: "c" });
      },
      `
      jest.mock('./origin.js', () => ({
        b: 'b'
      }));
      jest.mock('./origin.js', () => ({
        c: 'c'
      }));
      jest.mock('./origin.js', () => ({
        a: 'a'
      }));
      `,
    );
  });

  it("returns the created node for further processing", () => {
    expectCodemod(
      `
      jest.mock('./origin.js', () => ({
        a: 'a',
        b: 'b'
      }));
      `,
      (path) => {
        extract_mocked_specifier(path, "b", (node) => {
          node.expression.arguments[1].body.properties[0].key.name = "bar";
        });
      },
      `
      jest.mock('./origin.js', () => ({
        bar: 'b'
      }));
      jest.mock('./origin.js', () => ({
        a: 'a'
      }));
      `,
    );
  });
});
