const babelJest = require("babel-jest").default;
const { jestConfig } = require("../config/index.js");
const babelJestBoost = require.resolve("../plugin/index.js");

function createTransformer(config = {}, pluginConfig = {}) {
  if (!config.plugins) {
    config.plugins = [];
  }
  config.plugins.push([babelJestBoost, { jestConfig, config: pluginConfig }]);

  const transformer = babelJest.createTransformer(config);

  return transformer;
}

module.exports = { createTransformer };
