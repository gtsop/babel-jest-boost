const { resolve } = require("../resolve");
const { withCache } = require("../cache");
const { matchAnyRegex } = require("./utils");
const { Tracer } = require("./traverse");

const config = new Map();
config.set("modulePaths", []);
config.set("moduleNameMapper", {});
config.set("ignoreNodeModules", false);
config.set("importWhiteList", []);

function initializeHelpers({
  modulePaths,
  moduleNameMapper,
  ignoreNodeModules,
  importWhiteList,
}) {
  config.set("modulePaths", modulePaths);
  config.set("moduleNameMapper", moduleNameMapper);
  config.set("ignoreNodeModules", ignoreNodeModules);
  config.set("importWhiteList", importWhiteList);
}

function isPathWhitelisted(path) {
  return matchAnyRegex(config.get("importWhiteList"), path);
}

function resolveWithWhitelist(path, basedir) {
  try {
    if (cachedIsPathWhitelisted(path)) {
      return path;
    }

    const result = resolve(
      path,
      basedir,
      config.get("moduleNameMapper"),
      config.get("modulePaths"),
    );

    if (config.get("ignoreNodeModules") && result.includes("/node_modules/")) {
      return path;
    }

    return result;
  } catch (e) {
    console.log("failed to resolve", e.message);
    return null;
  }
}

const cachedIsPathWhitelisted = withCache(isPathWhitelisted);
const cachedResolve = withCache(resolveWithWhitelist);

const tracer = new Tracer(cachedResolve);

const cachedTraceSpecifierOrigin = withCache(
  function actualTraceSpecifierOrigin(specifierName, codeFilePath) {
    return tracer.traceOriginalExport(specifierName, codeFilePath);
  },
);

module.exports = {
  initializeHelpers,
  tracer,
  resolve: cachedResolve,
  isPathWhitelisted: cachedIsPathWhitelisted,
  traceSpecifierOrigin: cachedTraceSpecifierOrigin,
};
