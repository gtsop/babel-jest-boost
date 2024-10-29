const babelJest = require("babel-jest").default;
const { jestConfig } = require("../config/index.js");
const babelJestBoost = require.resolve("../plugin/index.js");

function createTransformer(config = {}, pluginConfig = {}) {
  if (!config.plugins) {
    config.plugins = [];
  }

  const configContainsBoost = config.plugins.some(
    (p) => p[0] === babelJestBoost,
  );
  if (!configContainsBoost) {
    config.plugins.push([babelJestBoost, { jestConfig, ...pluginConfig }]);
  }

  const transformer = babelJest.createTransformer(config);

  return transformer;
}

module.exports = { createTransformer };
