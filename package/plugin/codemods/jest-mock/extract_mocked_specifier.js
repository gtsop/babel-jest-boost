const babelTypes = require("@babel/types");

function extract_mocked_specifier(path, specifier, callback) {
  // console.log(path.parent)
  const expression = path.parent;

  if (path.node.arguments[1].body.properties.length === 1) {
    callback?.(path.parent);
    return;
  }

  const clone = babelTypes.cloneNode(expression);
  clone.expression.arguments[1].body.properties =
    clone.expression.arguments[1].body.properties.filter((prop) => {
      return prop.key.name === specifier;
    });
  path.node.arguments[1].body.properties =
    path.node.arguments[1].body.properties.filter((prop) => {
      return prop.key.name !== specifier;
    });
  callback?.(clone);

  path.insertBefore(clone);
}

module.exports = { extract_mocked_specifier };
