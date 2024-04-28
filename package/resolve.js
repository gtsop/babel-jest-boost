const sresolve = require('resolve');
const { cache } = require('./cache');

const { replaceRootDirInPath, getModuleNameFromMap } = require('./jest-utils/moduleNameMapper');

function resolve(pathToResolve, basedir, moduleNameMapper = null, modulePaths = []) {
  let mappedPath = pathToResolve;

  if (moduleNameMapper) {
    mappedPath = getModuleNameFromMap(pathToResolve, moduleNameMapper);
  }

  return sresolve.sync(mappedPath, {
    basedir,
    paths: modulePaths.map(replaceRootDirInPath),
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  });
}

function resolveWithCache(...params) {
  return cache(resolve, ...params);
}

module.exports = { resolve: resolveWithCache };
