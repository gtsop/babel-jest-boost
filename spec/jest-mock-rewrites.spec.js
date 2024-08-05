const {
  createExpectJestTransform,
} = require("./test-utils/expectTransform.js");

const expectJestTransform = createExpectJestTransform(__filename);

describe("babel-jest-boost plugin jest.mock rewrites", () => {
  it.each([
    [
      "import { a } from './test_tree/consts'",
      `import { a } from "${__dirname}/test_tree/consts/a.js";`,
    ],
    [
      "jest.mock('./test_tree/default');",
      `_getJestObj().mock("${__dirname}/test_tree/default/index.js");`,
    ],
    [
      "jest.mock('./test_tree/default', () => {});",
      `_getJestObj().mock("${__dirname}/test_tree/default/index.js", () => {});`,
    ],
    [
      `jest.mock('./test_tree/consts', () => ({ a: 1 }));`,
      `
          _getJestObj().mock("${__dirname}/test_tree/consts/a.js", () => ({
            a: 1
          }));
        `,
    ],
    [
      `jest.mock('./test_tree/consts', () => ({ a: 1, b: 2 }));`,
      `
            _getJestObj().mock("${__dirname}/test_tree/consts/a.js", () => ({
              a: 1
            }));
            _getJestObj().mock("${__dirname}/test_tree/consts/b.js", () => ({
              b: 2
            }));
          `,
    ],
    [
      `jest.mock("${__dirname}/test_tree/consts/consts.js", () => ({ a: 1, b: 2, c: 3, d: 4 }));`,
      `
              _getJestObj().mock("${__dirname}/test_tree/consts/consts.js", () => ({
                c: 3,
                d: 4
              }));
              _getJestObj().mock("${__dirname}/test_tree/consts/a.js", () => ({
                a: 1
              }));
              _getJestObj().mock("${__dirname}/test_tree/consts/b.js", () => ({
                b: 2
              }));
            `,
    ],
  ])("resolves modules mocked in jest.mock", (input, output) => {
    expectJestTransform(input, output);
  });
});
