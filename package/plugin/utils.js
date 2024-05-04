const babelParser = require("@babel/parser");

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

module.exports = {
  matchAnyRegex,
  removeItemsByIndexesInPlace,
  babelParse,
};
