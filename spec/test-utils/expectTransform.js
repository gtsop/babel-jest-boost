const { removeTransformBlobs } = require("./removeTransformBlobs.js");
const { multilineTrim } = require("./timmers.js");
const babelJest = require("babel-jest").default;
const babelJestBoost = require.resolve("../../package/plugin/index.js");

function createTransform(options, babelConfig = {}) {
  return babelJest.createTransformer({
    ...babelConfig,
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

function createExpectTransform(filename, options, babelConfig) {
  const transformer = createTransform(options, babelConfig);

  function transform(source) {
    const output = transformer.process(source, filename, { config: {} });
    return multilineTrim(removeTransformBlobs(output.code));
  }

  return function expectTransform(input, expectedOutput) {
    if (Array.isArray(expectedOutput)) {
      for (let expected of expectedOutput) {
        expect(transform(input)).toContain(expected);
      }
    } else {
      expect(transform(input)).toBe(multilineTrim(expectedOutput));
    }
  };
}

function createExpectJestTransform(filename, options) {
  const transformer = createTransform(options);

  function transform(source) {
    const output = transformer.process(source, filename, { config: {} });
    return multilineTrim(output.code.replace(/\/\/# sourceMappingURL.*/, ""));
  }

  return function expectJestTransform(input, expectedOutput) {
    expectedOutput = multilineTrim(expectedOutput);
    const output = multilineTrim(removeTransformBlobs(transform(input)));

    expect(output).toBe(multilineTrim(expectedOutput));
  };
}

module.exports = {
  createExpectTransform,
  createExpectJestTransform,
  multilineTrim,
};
