const babelJest = require("babel-jest").default;

const babelJestBoost = require.resolve("../package/plugin/index.js");

describe("babel-jest-boost plugin", () => {
  test("babel-jest transformer runs", () => {
    const transformer = babelJest.createTransformer({});

    transformer.process("", "", { config: {} });
  });

  test("transformer runs with babel-jest-boost plugin", () => {
    const transformer = babelJest.createTransformer({
      plugins: [[babelJestBoost]],
    });

    transformer.process("", "", { config: {} });
  });
});
