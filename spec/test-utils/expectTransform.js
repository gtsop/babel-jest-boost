const babelJest = require("babel-jest").default;
const babelJestBoost = require.resolve("../../package/plugin/index.js");

function createTransform(options) {
  return babelJest.createTransformer({
    plugins: [
      [
        babelJestBoost,
        {
          ...options,
          jestConfig: { modulePaths: ["<rootDir>/spec/test_tree"] },
        },
      ],
    ],
  });
}

function multilineTrim(string) {
  return string
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line, index, arr) =>
        !(index === 0 || index === arr.length - 1) || line.length,
    )
    .join("\n");
}

function createExpectTransform(filename, options) {
  const transformer = createTransform(options);

  function transform(source) {
    const output = transformer.process(source, filename, { config: {} });
    return multilineTrim(output.code.replace(/\/\/# sourceMappingURL.*/, ""));
  }

  return function expectTransform(input, expectedOutput) {
    expect(transform(input)).toBe(multilineTrim(expectedOutput));
  };
}

module.exports = { createExpectTransform };
