const babelTypes = require("@babel/types");

function getMockedModuleProperties(node) {
  const props = node.arguments?.[1]?.body?.properties;
  if (props) return props;
  return node.arguments?.[1]?.body.body?.[0]?.argument?.properties;
}

function setMockedModuleProperties(node, props) {
  const isDirectReturn = node.arguments?.[1]?.body?.properties != null;

  if (isDirectReturn) {
    node.arguments[1].body.properties = props;
  } else {
    node.arguments[1].body.body[0].argument.properties = props;
  }
}

function setDefaultReturn(node, returnNode) {
  const isDirectReturn = node.arguments?.[1]?.body?.properties != null;

  if (isDirectReturn) node.arguments[1].body = returnNode;
  else node.arguments[1].body.body[0].argument = returnNode;
}

function extractMockedSpecifier(path, specifier, specifierOrigin, callback) {
  const expression = path.parent;

  const clone = babelTypes.cloneNode(expression);

  let defaultOverride;

  setMockedModuleProperties(
    clone.expression,
    getMockedModuleProperties(clone.expression).reduce((acc, prop) => {
      if (!prop.key) return acc;
      if (prop.key.name === specifier) {
        if (specifierOrigin.name === "*") {
          return [...acc, babelTypes.spreadElement(prop.value)];
        }
        if (specifierOrigin.name === "default") {
          defaultOverride = prop.value;
          prop.key.name = "default";
        }
        return [...acc, prop];
      }

      return acc;
    }, []),
  );

  if (defaultOverride) setDefaultReturn(clone.expression, defaultOverride);

  setMockedModuleProperties(
    path.node,
    getMockedModuleProperties(path.node).filter((prop) => {
      if (!prop.key) return true;

      return prop.key.name !== specifier;
    }),
  );

  const newNode = babelTypes.callExpression(
    path.node.callee,
    clone.expression.arguments,
  );

  callback?.(newNode);

  return newNode;
}

module.exports = {
  extractMockedSpecifier,
  getMockedModuleProperties,
};
