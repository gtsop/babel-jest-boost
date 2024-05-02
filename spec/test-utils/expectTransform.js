const babelJest = require('babel-jest').default;
const babelJestBoost = require.resolve('../../package/plugin/index.js');

function createTransform(options) {
  return babelJest.createTransformer({
    plugins: [
      [
        babelJestBoost,
        {
          ...options,
          jestConfig: { modulePaths: ['<rootDir>/spec/test_tree']}
        }
      ]
    ],
  })
}

function expectTransform(input, expectedOutput, transform = defaultTransform) {
  expect(transform(input)).toBe(expectedOutput);
}

function createExpectTransform(filename, options) {
  const transformer = createTransform(options);

  function transform(source) {
    const output = transformer.process(source, filename, { config: {} });
    return output.code.replace(/\/\/# sourceMappingURL.*/, "").trim();
  }

  return function expectTransform(input, expectedOutput) {
    expect(transform(input)).toBe(expectedOutput);
  }
}

module.exports = { createExpectTransform };
