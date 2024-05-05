const babelJestBoostTransformer = require("../package/transformer/index.js");

describe("babel-jest-boost/transformer", () => {
  test("babel-jest-boost transformer runs with plugin within", () => {
    const transformer = babelJestBoostTransformer.createTransformer();

    const result = transformer.process(
      "import { target } from './spec/test_tree/library'",
      __dirname,
      { config: {} },
    );
    expect(result.code).toContain(
      "/babel-jest-boost/spec/test_tree/library/library.js",
    );
  });
});
