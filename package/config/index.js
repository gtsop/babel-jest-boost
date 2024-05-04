const { readConfig } = require("jest-config");
const { get: getRootDir } = require("app-root-dir");

const jestConfig = { moduleNameMapper: {}, modulePaths: [] };

readConfig(process.argv, getRootDir()).then(({ projectConfig }) => {
  jestConfig.modulePaths = projectConfig.modulePaths;
  const newModuleNameMapper = {};
  projectConfig.moduleNameMapper.forEach(([regex, item]) => {
    newModuleNameMapper[regex] = item;
  });
  jestConfig.moduleNameMapper = newModuleNameMapper;
  console.log("======= resolved config");
});

module.exports = { jestConfig };
