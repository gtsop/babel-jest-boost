const nodepath = require("path");
const { resolve } = require("../resolve");
const { withCache } = require("../cache");
const { matchAnyRegex, removeItemsByIndexesInPlace } = require("./utils");
const { Tracer } = require("./traverse");

let modulePaths = null;
let moduleNameMapper = null;

let importWhiteList = [];

const isPathWhitelisted = withCache(function actualIsPathWhitelisted(path) {
  return matchAnyRegex(importWhiteList, path);
});

const bjbResolve = withCache(function resolveWithWhitelist(path, basedir) {
  try {
    if (isPathWhitelisted(path)) {
      return path;
    }
    return resolve(path, basedir, moduleNameMapper, modulePaths);
  } catch (e) {
    console.log("failed to resolve", e.message);
    return null;
  }
});

const tracer = new Tracer(bjbResolve);

const traceSpecifierOrigin = withCache(
  function actualTraceSpecifierOrigin(specifierName, codeFilePath) {
    return tracer.traceOriginalExport(specifierName, codeFilePath);
  },
);

module.exports = function babelPlugin(babel) {
  return {
    visitor: {
      Program(path, state) {
        // setup config
        moduleNameMapper = state.opts.jestConfig?.moduleNameMapper || {};
        modulePaths = state.opts.jestConfig?.modulePaths || [];
        importWhiteList = state.opts.importIgnorePatterns || [];

        const comments = path.parent.comments || [];
        const skipProgramComment = comments.find((comment) =>
          comment.value.trim().includes("@babel-jest-boost no-boost"),
        );

        state.skipParsing = Boolean(skipProgramComment);
      },
      CallExpression(path, state) {
        if (state.skipParsing) {
          // Skip parsing of ImportDeclaration if flag is true
          return;
        }
        if (path.node.callee?.property?.name === "mock") {
          const mockedPath = path.node.arguments[0].value;
          const resolved = bjbResolve(
            mockedPath,
            nodepath.dirname(state.file.opts.filename),
          );
          if (isPathWhitelisted(resolved)) {
            return;
          }
          path.node.arguments[0].value = resolved;
        }
      },
      ImportDeclaration(path, state) {
        if (state.skipParsing) {
          // Skip parsing of ImportDeclaration if flag is true
          return;
        }
        const toRemove = [];
        if (isPathWhitelisted(path.node.source.value)) {
          return;
        }
        // import 'some-raw-file.css'
        if (path.node.specifiers.length === 0) {
          const resolved = bjbResolve(
            path.node.source.value,
            nodepath.dirname(state.file.opts.filename),
          );
          if (resolved !== path.node.source.value) {
            path.replaceWith(
              babel.types.importDeclaration(
                [],
                babel.types.stringLiteral(resolved),
              ),
            );
          }
          return;
        }
        path?.node?.specifiers?.forEach((specifier, index) => {
          // import * as Something from './somewhere';
          if (babel.types.isImportNamespaceSpecifier(specifier)) {
            const resolved = bjbResolve(
              path.node.source.value,
              nodepath.dirname(state.file.opts.filename),
            );
            if (resolved !== path.node.source.value) {
              path.insertBefore(
                babel.types.importDeclaration(
                  [babel.types.importNamespaceSpecifier(specifier.local)],
                  babel.types.stringLiteral(resolved),
                ),
              );
              if (path.node.specifiers.length === 1) {
                path.remove();
                return;
              } else if (path.node.specifiers.length > 1) {
                toRemove.push(index);
                return;
              }
            }
            return;
          }

          const importedFrom = bjbResolve(
            path.node.source.value,
            nodepath.dirname(state.file.opts.filename),
          );

          if (importedFrom) {
            const isDefaultImport =
              babel.types.isImportDefaultSpecifier(specifier);

            let specifierOrigin = null;

            try {
              specifierOrigin = traceSpecifierOrigin(
                isDefaultImport ? "default" : specifier.imported.name,
                importedFrom,
              );
            } catch (e) {
              console.log(
                "failed to trace",
                path.node.source.value,
                importedFrom,
                e.message,
              );
              return;
            }

            if (specifierOrigin) {
              // Transform the import statement
              // If this is a single specifier, as
              // import { foo } from './foo.js'
              // then just replace the source
              if (path.node.specifiers.length === 1) {
                if (specifier.local.name === specifierOrigin.name) {
                  // just replace the import path;
                  path.node.source = babel.types.stringLiteral(
                    specifierOrigin.source,
                  );
                  return;
                }
                const newImport = babel.types.importDeclaration(
                  [
                    babel.types.importSpecifier(
                      babel.types.identifier(specifier.local.name),
                      babel.types.identifier(specifierOrigin.name),
                    ),
                  ],
                  babel.types.stringLiteral(specifierOrigin.source),
                );
                path.replaceWith(newImport);
                path.skip();
                return;
              }
              // If this is a multiple specifier, as
              // import { foo, bar } from './foo.js'
              // then remove the current specifier and create a new import
              if (path.node.specifiers.length > 1) {
                path.insertBefore([
                  babel.types.importDeclaration(
                    [
                      babel.types.importSpecifier(
                        babel.types.identifier(specifier.local.name),
                        babel.types.identifier(specifierOrigin.name),
                      ),
                    ],
                    babel.types.stringLiteral(specifierOrigin.source),
                  ),
                ]);
                toRemove.push(index);
              }
            }
          }
        });
        if (
          toRemove.length > 1 &&
          toRemove.length === path.node.specifiers.length
        ) {
          path.remove();
        } else if (toRemove.length > 0) {
          removeItemsByIndexesInPlace(toRemove, path.node.specifiers);
        }
        // } catch (e) {
        //   console.log('===============================  failed to process ');
        //   console.log('===============================  failed to process ');
        //   console.log('===============================  failed to process ');
        //   console.log('===============================  failed to process ');
        //   console.log('===============================  failed to process ');
        //   console.log('===============================  failed to process ');
        //   console.log('===============================  failed to process ');
        //   console.log('===============================  failed to process ', e);
        // }
      },
    },
  };
};
