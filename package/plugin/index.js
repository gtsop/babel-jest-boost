const nodepath = require("path");
const { resolve } = require("../resolve");
const { withCache } = require("../cache");
const { matchAnyRegex, removeItemsByIndexesInPlace } = require("./utils");
const { Tracer } = require("./traverse");
const {
  extract_mocked_specifier,
} = require("./codemods/jest-mock/extract_mocked_specifier");

let modulePaths = null;
let moduleNameMapper = null;
let ignoreNodeModules = false;
let importWhiteList = [];

const isPathWhitelisted = withCache(function actualIsPathWhitelisted(path) {
  return matchAnyRegex(importWhiteList, path);
});

const bjbResolve = withCache(function resolveWithWhitelist(path, basedir) {
  try {
    if (isPathWhitelisted(path)) {
      return path;
    }

    const result = resolve(path, basedir, moduleNameMapper, modulePaths);

    if (ignoreNodeModules && result.includes("/node_modules/")) {
      return path;
    }

    return result;
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
        ignoreNodeModules = state.opts.ignoreNodeModules || false;

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
          const resolved = bjbResolve(
            path.node.arguments[0].value,
            nodepath.dirname(state.file.opts.filename),
          );
          if (isPathWhitelisted(resolved)) {
            return;
          }

          path.node.arguments[0].value = resolved;

          const importedFrom = resolved;

          if (path.node.arguments.length > 1) {
            // jest.mock('./origin.js', () => ({ target: value }))
            // Figure out the mocked specifier, trace it and re-write the mock call;
            try {
              path.node.arguments?.[1]?.body?.properties?.forEach((objProp) => {
                const mockedIdentifier = objProp?.key?.name;

                const specifierOrigin = traceSpecifierOrigin(
                  mockedIdentifier,
                  importedFrom,
                );

                if (!specifierOrigin) {
                  return;
                }

                if (importedFrom === specifierOrigin.source) {
                  // specifier is imported from the already resolved place, skip
                  return;
                }

                extract_mocked_specifier(path, mockedIdentifier, (node) => {
                  node.expression.arguments[0].value = specifierOrigin.source;
                });
              });
            } catch (e) {
              console.log("failed to parse mock statement: ", e);
            }
          }
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
            } else {
              path.node.source = babel.types.stringLiteral(importedFrom);
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
