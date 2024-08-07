const babelParser = require("@babel/parser");
const babelTypes = require("@babel/types");

function matchAnyRegex(regexArray, haystack) {
  for (let i = 0; i < regexArray.length; i++) {
    const regexString = regexArray[i];
    const regex = new RegExp(regexString);
    if (regex.test(haystack)) {
      return true;
    }
  }
  return false;
}

function removeItemsByIndexesInPlace(indexes, array) {
  return indexes.sort((a, b) => b - a).forEach((i) => array.splice(i, 1));
}

const parserConfig = {
  sourceType: "module",
  plugins: ["jsx", "tsx", "typescript", "decorators-legacy"],
};

function babelParse(code) {
  return babelParser.parse(code, parserConfig);
}

function getNewImport(specifierOrigin, specifier) {
  return specifierOrigin.name !== "*"
    ? babelTypes.importDeclaration(
        [
          babelTypes.importSpecifier(
            babelTypes.identifier(specifier.local.name),
            babelTypes.identifier(specifierOrigin.name),
          ),
        ],
        babelTypes.stringLiteral(specifierOrigin.source),
      )
    : babelTypes.importDeclaration(
        [
          babelTypes.importNamespaceSpecifier(
            babelTypes.identifier(specifier.local.name),
          ),
        ],
        babelTypes.stringLiteral(specifierOrigin.source),
      );
}

module.exports = {
  matchAnyRegex,
  removeItemsByIndexesInPlace,
  babelParse,
  getNewImport,
};
