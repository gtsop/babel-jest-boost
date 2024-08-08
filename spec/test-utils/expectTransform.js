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

function createPresetTransform(options) {
  return babelJest.createTransformer({
    presets: [
      [
        "@babel/preset-env",
        {
          useBuiltIns: "usage",
          corejs: "3.21",
        },
      ],
    ],
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

function multilineRemove(mainString, stringToRemove) {
  return mainString.replace(
    new RegExp(stringToRemove.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
    "",
  );
}

function removeJestBlob(input) {
  const jestBlob =
    "\n" +
    multilineTrim(`
    function _getJestObj() {
      const {
      jest
      } = require("@jest/globals");
      _getJestObj = () => jest;
      return jest;
    }
  `);

  return multilineRemove(input, jestBlob);
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

function createExpectPresetTransform(filename, options) {
  const transformer = createPresetTransform(options);

  function transform(source) {
    const output = transformer.process(source, filename, { config: {} });
    return multilineTrim(output.code.replace(/\/\/# sourceMappingURL.*/, ""));
  }

  return function expectTransform(input, expectedOutput) {
    if (Array.isArray(expectedOutput)) {
      for (let expected of expectedOutput) {
        expect(transform(input)).toContain(expected);
      }
    } else {
      expect(transform(input)).toContain(expectedOutput);
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
    const output = removeJestBlob(transform(input));

    expect(output).toBe(multilineTrim(expectedOutput));
  };
}

module.exports = {
  createExpectTransform,
  createExpectJestTransform,
  createExpectPresetTransform,
  multilineTrim,
};
