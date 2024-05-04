const path = require("path");
const { get: getRootDir } = require("app-root-dir");

const rootDir = getRootDir();

function getMapModuleName(matches) {
  return matches
    ? (moduleName) =>
        moduleName.replaceAll(
          /\$(\d+)/g,
          (_, index) => matches[Number.parseInt(index, 10)] || "",
        )
    : (moduleName) => moduleName;
}

function replaceRootDirInObject(config) {
  const newConfig = {};
  for (const configKey in config) {
    newConfig[configKey] =
      configKey === "rootDir"
        ? config[configKey]
        : replaceRootDirTags(rootDir, config[configKey]);
  }
  return newConfig;
}

function replaceRootDirInPath(filePath) {
  if (!filePath.startsWith("<rootDir>")) {
    return filePath;
  }

  return path.resolve(
    rootDir,
    path.normalize(`./${filePath.slice("<rootDir>".length)}`),
  );
}

function replaceRootDirTags(config) {
  if (config == null) {
    return config;
  }
  switch (typeof config) {
    case "object":
      if (Array.isArray(config)) {
        /// can be string[] or {}[]
        return config.map((item) => replaceRootDirTags(item));
      }
      if (config instanceof RegExp) {
        return config;
      }

      return replaceRootDirInObject(config);
    case "string":
      return replaceRootDirInPath(config);
    default:
      break;
  }
  return config;
}

function getModuleNameFromMap(pathToResolve, moduleNameMapper) {
  const map = Object.keys(moduleNameMapper).map((regex) => {
    const item = moduleNameMapper && moduleNameMapper[regex];
    return (
      item && {
        regex: new RegExp(regex),
        moduleName: replaceRootDirTags(item),
      }
    );
  });
  for (const { moduleName: mappedModuleName, regex } of map) {
    if (regex.test(pathToResolve)) {
      // Note: once a moduleNameMapper matches the name, it must result
      // in a module, or else an error is thrown.
      const matches = pathToResolve.match(regex);
      const mapModuleName = getMapModuleName(matches);

      const possibleModuleNames = Array.isArray(mappedModuleName)
        ? mappedModuleName
        : [mappedModuleName];
      for (const possibleModuleName of possibleModuleNames) {
        const updatedName = mapModuleName(possibleModuleName);
        return updatedName;
      }
    }
  }
  return pathToResolve;
}

module.exports = { replaceRootDirInPath, getModuleNameFromMap };
