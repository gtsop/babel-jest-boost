const babel = require("@babel/core");
const nodepath = require("path");
const {
  isPathWhitelisted,
  resolve,
  tracer,
  traceSpecifierOrigin,
} = require("../../helpers");
const {
  getMockedModuleProperties,
  extractMockedSpecifier,
} = require("./extractMockedSpecifier");

function rewriteMocks(path, resolved) {
  if (path.node.callee?.property?.name === "mock") {
    if (!resolved || isPathWhitelisted(resolved)) {
      return;
    }

    path.node.arguments[0].value = resolved;

    const newCallExpressions = [];
    let replace = true;

    if (path.node.arguments.length > 1) {
      const props = getMockedModuleProperties(path.node);

      try {
        props?.forEach((objProp) => {
          const mockedIdentifier = objProp?.key?.name;

          const specifierOrigin = traceSpecifierOrigin(
            mockedIdentifier,
            resolved,
          );

          if (!specifierOrigin) {
            return;
          }

          if (resolved === specifierOrigin.source) {
            replace = false;
            // specifier is imported from the already resolved place, skip
            return;
          }

          const newCallExpression = extractMockedSpecifier(
            path,
            mockedIdentifier,
            specifierOrigin,
            (node) => {
              node.arguments[0].value = specifierOrigin.source;
            },
          );

          if (newCallExpression) newCallExpressions.push(newCallExpression);
        });
      } catch (e) {
        console.log("failed to parse mock statement: ", e);
      }
    } else {
      const ast = tracer.codeFileToAST(resolved);

      ast.program.body.forEach((node) => {
        if (
          node.source &&
          (babel.types.isExportNamedDeclaration(node) ||
            babel.types.isExportAllDeclaration(node))
        ) {
          let resolvedExport = resolve(
            node.source.value,
            nodepath.dirname(resolved),
          );

          node.specifiers?.forEach((specifier) => {
            if (specifier.local) {
              let specifierOrigin = traceSpecifierOrigin(
                specifier.local.name,
                resolved,
              );

              if (specifierOrigin) resolvedExport = specifierOrigin.source;
            }
          });

          if (resolvedExport === node.source.value) return;

          const newCallExpression = babel.types.callExpression(
            path.node.callee,
            [babel.types.stringLiteral(resolvedExport)],
          );
          newCallExpressions.push(newCallExpression);
        }
      });
    }
    if (newCallExpressions.length > 0) {
      if (replace) path.replaceWithMultiple(newCallExpressions);
      else path.insertAfter(newCallExpressions);
    }
  }
}

module.exports = { rewriteMocks };
