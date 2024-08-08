const {
  createExpectTransform,
  createExpectJestTransform,
} = require("./test-utils/expectTransform.js");

const expectJestTransform = createExpectJestTransform(__filename);
const expectTransform = createExpectTransform(__filename);

describe("babel-jest-boost plugin jest.mock rewrites", () => {
  it("resolves modules mocked in jest.mock", () => {
    expectTransform(
      "import { a } from './test_tree/consts'",
      `import { a } from "${__dirname}/test_tree/consts/a.js";`,
    );
    expectJestTransform(
      "jest.mock('./test_tree/default');",
      `_getJestObj().mock("${__dirname}/test_tree/default/index.js");`,
    );

    expectJestTransform(
      `import target from './test_tree/default';
      jest.mock('./test_tree/default');`,
      `
      _getJestObj().mock("${__dirname}/test_tree/default/index.js");
      import { default as target } from "${__dirname}/test_tree/default/index.js";
      `,
    );

    // Make sure we mock all exports from a barrel file with their resolved paths
    expectJestTransform(
      `import { target } from './test_tree/global';
      jest.mock('./test_tree/global');`,
      `
      _getJestObj().mock("${__dirname}/test_tree/library/library.js");
      _getJestObj().mock("${__dirname}/test_tree/library/otherLibrary.js");
      import { target } from "${__dirname}/test_tree/library/library.js";
      `,
    );

    // Make sure we mock all exports from a barrel file with their resolved paths
    expectJestTransform(
      `import { libraryGlob } from './test_tree/global_as';
      jest.mock('./test_tree/global_as');`,
      `
      _getJestObj().mock("${__dirname}/test_tree/library/library.js");
      _getJestObj().mock("${__dirname}/test_tree/library/otherLibrary.js");
      import * as libraryGlob from "${__dirname}/test_tree/library/index.js";
      `,
    );

    expectJestTransform(
      `import { libraryGlob } from './test_tree/global_as';
      jest.mock('./test_tree/global_as', () => ({ libraryGlob: { library: jest.fn() } }));`,
      `
      _getJestObj().mock("${__dirname}/test_tree/library/index.js", () => ({
      ...{
        library: jest.fn()
      }
      }));
      import * as libraryGlob from "${__dirname}/test_tree/library/index.js";
      `,
    );

    expectJestTransform(
      "jest.mock('./test_tree/default', () => {});",
      `_getJestObj().mock("${__dirname}/test_tree/default/index.js", () => {});`,
    );

    expectJestTransform(
      `jest.mock('./test_tree/consts', () => ({ a: 1 }));`,
      `
        _getJestObj().mock("${__dirname}/test_tree/consts/a.js", () => ({
          a: 1
        }));
      `,
    );
    expectJestTransform(
      `jest.mock('./test_tree/consts', () => ({ a: 1, b: 2 }));`,
      `
        _getJestObj().mock("${__dirname}/test_tree/consts/a.js", () => ({
          a: 1
        }));
        _getJestObj().mock("${__dirname}/test_tree/consts/b.js", () => ({
          b: 2
        }));
      `,
    );

    expectJestTransform(
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
    );
  });
});
